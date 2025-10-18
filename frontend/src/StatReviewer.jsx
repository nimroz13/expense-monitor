import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatReviewer = ({ data, currentMonth, showLabels = false }) => {
  // Use prop or default to current date
  const monthFilter = currentMonth || new Date().toISOString().slice(0, 7);

  // Filter for current month
  const currentMonthData = data.filter(item => item.date.startsWith(monthFilter));
  const currentSavings = currentMonthData.filter(item => item.type === 'saving').reduce((sum, item) => sum + item.amount, 0);
  const currentExpenses = currentMonthData.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

  // Pie chart data
  const pieData = [
    { name: 'Savings', value: currentSavings, color: '#1fbf7a' },
    { name: 'Expenses', value: currentExpenses, color: '#ef6b6b' },
  ];

  // Aggregate monthly data (all available months)
  const monthlyData = {};
  data.forEach(item => {
    const month = item.date.slice(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { month, expenses: 0, savings: 0 };
    if (item.type === 'expense') monthlyData[month].expenses += item.amount;
    else monthlyData[month].savings += item.amount;
  });
  const barData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Dynamic height for mobile
  const isMobile = window.innerWidth < 700;
  const chartHeight = isMobile ? 250 : 300;
  const outerRadius = isMobile ? 60 : 80;

  return (
    <div className="stat-reviewer">
      <h2>Stat Reviewer</h2>
      <div className="chart-container">
        <div className="pie-chart">
          <h3>Current Month: Savings vs Expenses</h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="value"
                label={(showLabels || isMobile) ? ({ name, value }) => `${name}: ${value.toFixed(0)}` : false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bar-chart">
          <h3>Monthly Expenses vs Savings</h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expenses" fill="#ef6b6b" />
              <Bar dataKey="savings" fill="#1fbf7a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatReviewer;
