import { supabase } from './supabase';

const SATISFACTION_SCORE = {
  'Very Satisfied': 5,
  Satisfied: 4,
  Neutral: 3,
  Dissatisfied: 2,
  'Very Dissatisfied': 1,
};

const RATING_SCORE = {
  excellent: 5,
  veryGood: 4,
  good: 3,
  fair: 2,
  poor: 1,
  na: null,
};

const PART2_KEYS = [
  'cleanliness_safety',
  'child_comfort',
  'toys_materials',
  'staff_attentiveness',
  'accessibility_convenience',
  'maintenance_upkeep',
  'staff_responsiveness',
];
const PART3_KEYS = ['staff_eval_attentiveness', 'staff_eval_friendliness', 'staff_eval_responsiveness'];

/** Fetch form_parts and questions from DB for dynamic Evaluations page. Returns [] when no supabase or on error. */
export async function fetchFormStructure() {
  if (!supabase) return [];
  try {
    const [partsRes, questionsRes] = await Promise.all([
      supabase.from('form_parts').select('key, sort_order, label').order('sort_order'),
      supabase.from('questions').select('part, sort_order, key, label, answer_type').order('part').order('sort_order'),
    ]);
    const partRows = partsRes.data ?? [];
    const questionRows = questionsRes.data ?? [];
    return partRows
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => {
        const qs = (questionRows || [])
          .filter((q) => q.part === p.key)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((q) => ({ key: q.key, label: q.label || q.key, answer_type: q.answer_type ?? 'emoji' }));
        return { key: p.key, label: p.label, questions: qs };
      })
      .filter((p) => p.questions.length > 0);
  } catch {
    return [];
  }
}

/** Average score per question key. Uses RATING_SCORE for emoji, SATISFACTION_SCORE for satisfaction; text is skipped. */
export function averagesForQuestions(list, questions) {
  const scoreMap = (type) => (type === 'satisfaction' ? SATISFACTION_SCORE : RATING_SCORE);
  const out = {};
  (questions || []).forEach((q) => {
    const map = scoreMap(q.answer_type);
    if (q.answer_type === 'text') {
      out[q.key] = null;
      return;
    }
    let sum = 0;
    let n = 0;
    list.forEach((r) => {
      const v = map[r[q.key]];
      if (v != null) {
        sum += v;
        n++;
      }
    });
    out[q.key] = n ? sum / n : 0;
  });
  return out;
}

/** Count per score 1..5 for each rating/satisfaction question. Used for segmented bars. */
export function distributionForQuestions(list, questions) {
  const scoreMap = (type) => (type === 'satisfaction' ? SATISFACTION_SCORE : RATING_SCORE);
  const out = {};
  (questions || []).forEach((q) => {
    if (q.answer_type === 'text') {
      out[q.key] = null;
      return;
    }
    const map = scoreMap(q.answer_type);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    list.forEach((r) => {
      const v = map[r[q.key]];
      if (v >= 1 && v <= 5) counts[v] = (counts[v] || 0) + 1;
    });
    out[q.key] = counts;
  });
  return out;
}

function parsePeriod(period) {
  const now = new Date();
  let from = new Date(now);
  if (period === 'This week') {
    from.setDate(now.getDate() - 7);
  } else if (period === 'This month') {
    from.setMonth(now.getMonth() - 1);
  } else if (period === 'Last 3 months') {
    from.setMonth(now.getMonth() - 3);
  } else if (period === 'This year') {
    from.setFullYear(now.getFullYear() - 1);
  } else {
    from.setMonth(now.getMonth() - 1);
  }
  return { from, to: now };
}

export async function fetchFeedback(period = 'This month', dateRange = null) {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Create dashboard/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).'
    );
  }
  // Query from evaluations and join with registrations
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, registrations(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Flatten registration into the row so KPI logic remains same
  const raw = data || [];
  const list = raw.map((r) => {
    const reg = r.registrations || {};
    const ans = r.answers && typeof r.answers === 'object' ? r.answers : (typeof r.answers === 'string' ? (() => { try { return JSON.parse(r.answers); } catch { return {}; } })() : {});
    return { ...reg, ...r, ...ans };
  });

  if (dateRange && dateRange.from && dateRange.to) {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    return list.filter((r) => {
      const d = new Date(r.created_at);
      return d >= from && d <= to;
    });
  }
  const { from } = parsePeriod(period);
  return list.filter((r) => new Date(r.created_at) >= from);
}

function pctChange(current, previous) {
  if (previous == null || previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function computeKPIs(list) {
  const n = list.length;
  const empty = {
    total: 0,
    avgSatisfaction: null,
    positiveRate: null,
    withSuggestions: 0,
    totalTrend: null,
    satisfactionTrend: null,
    positiveTrend: null,
    suggestionsTrend: null,
  };
  if (n === 0) return empty;

  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  fourDaysAgo.setHours(0, 0, 0, 0);

  const listLast2Days = list.filter((r) => new Date(r.created_at) >= twoDaysAgo);
  const listPrev2Days = list.filter((r) => {
    const d = new Date(r.created_at);
    return d >= fourDaysAgo && d < twoDaysAgo;
  });

  const scores = list
    .map((r) => SATISFACTION_SCORE[r.overall_satisfaction])
    .filter((s) => s != null);
  const avgSatisfaction = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const positive = list.filter(
    (r) => r.overall_satisfaction === 'Very Satisfied' || r.overall_satisfaction === 'Satisfied'
  ).length;
  const withSuggestions = list.filter((r) => r.comments && String(r.comments).trim().length > 0).length;

  const nLast = listLast2Days.length;
  const nPrev = listPrev2Days.length;
  const scoresLast = listLast2Days.map((r) => SATISFACTION_SCORE[r.overall_satisfaction]).filter((s) => s != null);
  const scoresPrev = listPrev2Days.map((r) => SATISFACTION_SCORE[r.overall_satisfaction]).filter((s) => s != null);
  const avgLast = scoresLast.length ? scoresLast.reduce((a, b) => a + b, 0) / scoresLast.length : null;
  const avgPrev = scoresPrev.length ? scoresPrev.reduce((a, b) => a + b, 0) / scoresPrev.length : null;
  const posLast = listLast2Days.filter(
    (r) => r.overall_satisfaction === 'Very Satisfied' || r.overall_satisfaction === 'Satisfied'
  ).length;
  const posPrev = listPrev2Days.filter(
    (r) => r.overall_satisfaction === 'Very Satisfied' || r.overall_satisfaction === 'Satisfied'
  ).length;
  const rateLast = nLast ? posLast / nLast : null;
  const ratePrev = nPrev ? posPrev / nPrev : null;
  const sugLast = listLast2Days.filter((r) => r.comments && String(r.comments).trim().length > 0).length;
  const sugPrev = listPrev2Days.filter((r) => r.comments && String(r.comments).trim().length > 0).length;

  const totalTrend = pctChange(nLast, nPrev);
  const satisfactionTrend =
    avgLast != null && avgPrev != null ? pctChange((avgLast / 5) * 100, (avgPrev / 5) * 100) : null;
  const positiveTrend = rateLast != null && ratePrev != null ? pctChange(rateLast * 100, ratePrev * 100) : null;
  const suggestionsTrend = pctChange(sugLast, sugPrev);

  return {
    total: n,
    avgSatisfaction,
    positiveRate: n ? positive / n : null,
    withSuggestions,
    totalTrend,
    satisfactionTrend,
    positiveTrend,
    suggestionsTrend,
  };
}

export function groupByTime(list, period) {
  const groups = {};
  list.forEach((r) => {
    const d = new Date(r.created_at);
    let key;
    if (period === 'This year') {
      key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    groups[key] = (groups[key] || 0) + 1;
  });
  return Object.entries(groups)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const d = (x) => new Date(x.label);
      return d(a) - d(b);
    })
    .slice(-12);
}

/** Avg satisfaction (1–5) per time period for "Satisfaction over time" chart */
export function satisfactionOverTime(list, period) {
  const groups = {};
  list.forEach((r) => {
    const score = SATISFACTION_SCORE[r.overall_satisfaction];
    if (score == null) return;
    const d = new Date(r.created_at);
    let key;
    if (period === 'This year') {
      key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (!groups[key]) groups[key] = { sum: 0, n: 0 };
    groups[key].sum += score;
    groups[key].n += 1;
  });
  return Object.entries(groups)
    .map(([label, { sum, n }]) => ({ label, value: sum / n }))
    .sort((a, b) => {
      const d = (x) => new Date(x.label);
      return d(a) - d(b);
    })
    .slice(-12);
}

export function satisfactionDistribution(list) {
  const dist = {};
  [
    'Very Satisfied',
    'Satisfied',
    'Neutral',
    'Dissatisfied',
    'Very Dissatisfied',
  ].forEach((k) => (dist[k] = 0));
  list.forEach((r) => {
    if (r.overall_satisfaction && dist[r.overall_satisfaction] !== undefined) {
      dist[r.overall_satisfaction]++;
    }
  });
  return dist;
}

export function criteriaAverages(list, keys) {
  const sums = {};
  const counts = {};
  keys.forEach((k) => {
    sums[k] = 0;
    counts[k] = 0;
  });
  list.forEach((r) => {
    keys.forEach((k) => {
      const v = RATING_SCORE[r[k]];
      if (v != null) {
        sums[k] += v;
        counts[k]++;
      }
    });
  });
  const out = {};
  keys.forEach((k) => {
    out[k] = counts[k] ? sums[k] / counts[k] : 0;
  });
  return out;
}

export function part2Averages(list) {
  return criteriaAverages(list, PART2_KEYS);
}

export function part3Averages(list) {
  return criteriaAverages(list, PART3_KEYS);
}

export function formatLatest(list) {
  return (list || []).map((r) => ({
    ...r,
    date: new Date(r.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));
}

/** Basic Information breakdowns for Respondents information page */
export function basicInfoBySex(list) {
  const out = { Male: 0, Female: 0, Other: 0 };
  (list || []).forEach((r) => {
    if (r.sex === 'Male' || r.sex === 'Female') {
      out[r.sex]++;
    } else {
      out.Other++;
    }
  });
  return Object.entries(out).map(([name, value]) => ({ name, value }));
}

export function basicInfoByOffice(list) {
  const counts = {};
  (list || []).forEach((r) => {
    const o = r.office_unit_other && String(r.office_unit_other).trim()
      ? `${r.office_unit_address || 'Others'} (${r.office_unit_other})`
      : (r.office_unit_address || '—');
    counts[o] = (counts[o] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function basicInfoByChildSex(list) {
  const out = { Male: 0, Female: 0 };
  (list || []).forEach((r) => {
    const children = Array.isArray(r.children) ? r.children : [];
    children.forEach((c) => {
      if (c.sex && out[c.sex] !== undefined) out[c.sex]++;
    });
  });
  return Object.entries(out).map(([name, value]) => ({ name, value }));
}

export function basicInfoByChildAge(list) {
  const counts = {};
  (list || []).forEach((r) => {
    const children = Array.isArray(r.children) ? r.children : [];
    children.forEach((c) => {
      const a = c.age != null && String(c.age).trim() !== '' ? String(c.age) : '—';
      counts[a] = (counts[a] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const na = parseInt(a.name, 10);
      const nb = parseInt(b.name, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      if (Number.isNaN(na)) return 1;
      return -1;
    });
}

export function formatRespondents(list) {
  return (list || []).map((r) => ({
    ...r,
    dateOfUseFormatted: r.date_of_use
      ? new Date(r.date_of_use).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    submittedFormatted: new Date(r.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));
}

/** Avg satisfaction score (1–5) per Part II, III, IV for the widget */
export function avgSatisfactionByPart(list) {
  const part2Avgs = part2Averages(list);
  const part3Avgs = part3Averages(list);
  const part2Vals = Object.values(part2Avgs).filter((v) => v > 0);
  const part3Vals = Object.values(part3Avgs).filter((v) => v > 0);
  const part4Scores = list
    .map((r) => SATISFACTION_SCORE[r.overall_satisfaction])
    .filter((s) => s != null);
  return [
    {
      name: 'Part II – Facility & Service',
      avg: part2Vals.length ? part2Vals.reduce((a, b) => a + b, 0) / part2Vals.length : 0,
    },
    {
      name: 'Part III – Staff Evaluation',
      avg: part3Vals.length ? part3Vals.reduce((a, b) => a + b, 0) / part3Vals.length : 0,
    },
    {
      name: 'Part IV – Overall Satisfaction',
      avg: part4Scores.length ? part4Scores.reduce((a, b) => a + b, 0) / part4Scores.length : 0,
    },
  ];
}
