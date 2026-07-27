const React = require('react');
const { renderToString } = require('react-dom/server');
const AnalyticsPanel = require('./src/components/AnalyticsPanel.jsx').default;

const mockData = {
  habits: {
    total: 1,
    completedToday: 0,
    consistency: 0,
    totalStreaks: 0,
    bestStreak: 0,
    breakdown: [
      { label: "Read 10 pages", category: "Mind", streak: 1, checkedToday: false, completionRate: 0, daysChecked: 0, daysTotal: 1 }
    ],
    categories: {
      "Mind": { total: 1, done: 0, totalDays: 1, checkedDays: 0 }
    }
  },
  finance: { totalEarned: 0, totalSpent: 0, netBalance: 0 },
  sleep: { avgHours: 0 },
  today: { total: 0, done: 0 },
  notes: { count: 0 }
};

global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve(mockData)
});

try {
  // To test the loaded state, we can mock useState to return our mock data.
  // We'll just render it with data = null first to see if initial render crashes.
  const html = renderToString(React.createElement(AnalyticsPanel, { token: "123", userProfile: { timezone: "America/New_York" } }));
  console.log("Initial render HTML length:", html.length);
} catch (e) {
  console.error("Crash during initial render:", e);
}
