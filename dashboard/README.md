# Feedback Dashboard – DOST iHub GAD

React + Vite + Tailwind dashboard for Child-Minding Station feedback. Uses the same Supabase project as the mobile app.

## Quick start

1. **Copy env and add Supabase keys**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `VITE_SUPABASE_URL` – Project URL from Supabase → Settings → API
   - `VITE_SUPABASE_ANON_KEY` – anon key from the same page  
   (Same values as in the mobile app’s `lib/supabaseConfig.js`.)

2. **Install and run**
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

## What’s on the dashboard

- **KPI cards:** Total feedbacks, average satisfaction, positive rate, count with suggestions.
- **Feedback over time:** Bar chart of submissions by time period.
- **Overall satisfaction:** Donut chart (Very Satisfied → Very Dissatisfied).
- **Part II & III:** Horizontal bar charts of average ratings per criterion.
- **Latest feedback:** Table of last submissions (date, parent/unit, child age, satisfaction, suggestion snippet).

The date filter in the header (“This week”, “This month”, etc.) filters all data to that range.
