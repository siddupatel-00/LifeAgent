import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#d8f277', '#ef6f3e', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#64748b'];
const EARN_COLOR = '#a7c878';
const SPEND_COLOR = '#ef6f3e';

export default function MoneyCharts({ transactions = [], chartType, currency = '$' }) {
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No items logged yet</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>No transactions logged. Click + to add your first entry.</p>
      </div>
    );
  }

  // 1. Prepare Time-Series Data (Bar & Line)
  const groupedByDate = transactions.reduce((acc, t) => {
    const d = t.date ? t.date.split('T')[0] : 'Unknown';
    if (!acc[d]) acc[d] = { date: d, earn: 0, spend: 0 };
    if (t.type === 'earn') acc[d].earn += Number(t.amount) || 0;
    if (t.type === 'spend') acc[d].spend += Number(t.amount) || 0;
    return acc;
  }, {});
  
  const timeData = Object.values(groupedByDate).sort((a,b) => a.date.localeCompare(b.date));

  // If there's only one day of data, pad with the previous day (0 values) so the line chart has something to draw from
  if (timeData.length === 1 && timeData[0].date !== 'Unknown') {
    const singleDate = new Date(timeData[0].date);
    singleDate.setDate(singleDate.getDate() - 1);
    const prevDateStr = singleDate.toISOString().split('T')[0];
    timeData.unshift({ date: prevDateStr, earn: 0, spend: 0 });
  }

  // 2. Prepare Category Data (Pie)
  const getCategoryData = (type) => {
    const catMap = transactions.filter(t => t.type === type).reduce((acc, t) => {
      const c = t.category || 'Other';
      acc[c] = (acc[c] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };

  const earnData = getCategoryData('earn');
  const spendData = getCategoryData('spend');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}>
          <p style={{ margin: '0 0 6px 0', font: "500 0.78rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0', font: "600 0.85rem 'DM Mono', monospace" }}>
              {entry.name}: {currency}{(Number(entry.value) || 0).toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={timeData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11 }} tickMargin={10} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11 }} tickFormatter={(val) => `${currency}${val}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--text-muted)', opacity: 0.08 }} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }} />
          <Bar dataKey="earn" name="Earnings" fill={EARN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={45} minPointSize={3} />
          <Bar dataKey="spend" name="Spending" fill={SPEND_COLOR} radius={[4, 4, 0, 0]} maxBarSize={45} minPointSize={3} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timeData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11 }} tickMargin={10} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11 }} tickFormatter={(val) => `${currency}${val}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }} />
          <Line type="monotone" dataKey="earn" name="Earnings" stroke={EARN_COLOR} strokeWidth={2.5} dot={{ r: 4, fill: EARN_COLOR }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="spend" name="Spending" stroke={SPEND_COLOR} strokeWidth={2.5} dot={{ r: 4, fill: SPEND_COLOR }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)', font: "500 0.8rem 'DM Mono', monospace" }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '3px', flexShrink: 0 }} />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  if (chartType === 'pie') {
    const totalEarn = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalSpend = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const overallData = [
      { name: 'Earnings', value: totalEarn },
      { name: 'Spending', value: totalSpend }
    ].filter(d => d.value > 0);

    const renderPieSection = (title, data, colorTitle, colors) => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', height: '260px', marginBottom: '20px' }}>
        <h4 style={{ color: colorTitle, marginBottom: '8px', fontFamily: "Fraunces, Georgia, serif", fontSize: '1rem', fontWeight: 600 }}>{title}</h4>
        {data.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', font: "400 0.8rem 'DM Mono', monospace" }}>No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend layout="vertical" verticalAlign="middle" align="right" content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '20px', paddingBottom: '16px' }}>
        {renderPieSection('Overall Cashflow', overallData, 'var(--text-main)', [EARN_COLOR, SPEND_COLOR])}
        {renderPieSection('Earnings by Category', earnData, 'var(--text-main)', COLORS)}
        {renderPieSection('Spendings by Category', spendData, 'var(--text-main)', COLORS)}
      </div>
    );
  }

  return null;
}
