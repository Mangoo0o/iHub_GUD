import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import RespondentsInfo from '../pages/RespondentsInfo';
import FacilityAndService from '../pages/FacilityAndService';
import Suggestions from '../pages/Suggestions';
import FormManagement from '../pages/FormManagement';
import GenerateReport from '../pages/GenerateReport';
import Users from '../pages/Users';
import SystemLogs from '../pages/SystemLogs';

const STORAGE_KEY = 'csf-dashboard-widget-order';
const ACTIVE_VIEW_KEY = 'csf-dashboard-active-view';

function loadWidgetOrder() {
  const defaultOrder = ['kpis', 'chartTime', 'chartDonut', 'latest', 'byPart'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => id !== 'chartPart2' && id !== 'chartPart3');
      }
    }
  } catch (_) {}
  return defaultOrder;
}

function loadActiveView() {
  try {
    const saved = localStorage.getItem(ACTIVE_VIEW_KEY);
    if (saved && typeof saved === 'string') {
      const validViews = ['overview', 'demographics', 'facility', 'suggestions', 'form-management', 'generate-report', 'users', 'system-logs'];
      if (validViews.includes(saved)) {
        return saved;
      }
    }
  } catch (_) {}
  return 'overview';
}

export default function Layout({ period, onPeriodChange, dateRange, onDateRangeChange, subtitle, onLogout }) {
  const [activeView, setActiveViewState] = useState(() => loadActiveView());
  const [manageMode, setManageMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState(() => loadWidgetOrder());

  const setActiveView = (view) => {
    if (view === activeView) return;
    setActiveViewState(view);
    try {
      localStorage.setItem(ACTIVE_VIEW_KEY, view);
    } catch (_) {}
  };

  const persistOrder = (next) => {
    const filtered = (next || []).filter((id) => id !== 'chartPart2' && id !== 'chartPart3');
    setWidgetOrder(filtered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (_) {}
  };

  const pageContent =
    activeView === 'demographics' ? (
      <RespondentsInfo period={period} dateRange={dateRange} />
    ) : activeView === 'facility' ? (
      <FacilityAndService period={period} dateRange={dateRange} />
    ) : activeView === 'suggestions' ? (
      <Suggestions period={period} dateRange={dateRange} />
    ) : activeView === 'form-management' ? (
      <FormManagement />
    ) : activeView === 'generate-report' ? (
      <GenerateReport period={period} dateRange={dateRange} />
    ) : activeView === 'users' ? (
      <Users />
    ) : activeView === 'system-logs' ? (
      <SystemLogs />
    ) : (
      <Dashboard
        period={period}
        onPeriodChange={onPeriodChange}
        dateRange={dateRange}
        manageMode={manageMode}
        widgetOrder={widgetOrder}
        onWidgetOrderChange={persistOrder}
      />
    );

  const headerTitle =
    activeView === 'facility'
      ? 'Evaluations'
      : activeView === 'demographics'
        ? 'Respondents information'
        : activeView === 'suggestions'
          ? 'Suggestions'
          : activeView === 'form-management'
            ? 'Form Management'
            : activeView === 'generate-report'
              ? 'Generate report'
              : activeView === 'users'
                ? 'User Management'
                : activeView === 'system-logs'
                  ? 'System Logs'
                  : undefined;
  const reportLikeViews = activeView === 'facility' || activeView === 'demographics' || activeView === 'suggestions' || activeView === 'form-management' || activeView === 'generate-report';
  const headerSubtitle = reportLikeViews || activeView === 'users' || activeView === 'system-logs' ? '' : subtitle;
  const headerHideControls = reportLikeViews || activeView === 'users' || activeView === 'system-logs';
  const headerShowPeriodAndDate = reportLikeViews;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onNavigateToUsers={() => setActiveView('users')} onNavigateToSystemLogs={() => setActiveView('system-logs')} onLogout={onLogout} />
      <main className="flex-1 min-w-0 bg-white flex flex-col min-h-0 overflow-auto">
        <div className="p-8 mx-auto w-full max-w-[1600px] flex flex-col gap-0 min-h-full">
          <Header
            period={period}
            onPeriodChange={onPeriodChange}
            subtitle={headerSubtitle}
            title={headerTitle}
            hideControls={headerHideControls}
            showPeriodAndDatePicker={headerShowPeriodAndDate}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            manageMode={manageMode}
            onManageWidgetsClick={() => setManageMode((m) => !m)}
          />
          <div key={activeView}>
            {pageContent}
          </div>
        </div>
      </main>
    </div>
  );
}
