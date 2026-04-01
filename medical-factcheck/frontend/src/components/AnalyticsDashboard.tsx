'use client';

import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsDashboardProps {
  analytics: {
    total_verified: number;
    true_count: number;
    false_count: number;
    partial_count: number;
    unverifiable_count: number;
    avg_confidence_score: number;
    domain_distribution: Record<string, number>;
    daily_trend: Array<{
      date: string;
      true: number;
      false: number;
      partial: number;
      unverifiable: number;
    }>;
    misinformation_rate: number;
    avg_processing_time_ms: number;
  };
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  // Verify label distribution
  const labelData = [
    { name: 'True', value: analytics.true_count, color: '#10b981' },
    { name: 'False', value: analytics.false_count, color: '#ef4444' },
    { name: 'Partial', value: analytics.partial_count, color: '#f59e0b' },
    { name: 'Unverifiable', value: analytics.unverifiable_count, color: '#6b7280' },
  ];

  // Domain distribution
  const domainData = Object.entries(analytics.domain_distribution).map(([domain, count]) => ({
    name: domain,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Verified" value={analytics.total_verified} color="blue" />
        <KPICard title="Avg Confidence" value={`${(analytics.avg_confidence_score * 100).toFixed(1)}%`} color="green" />
        <KPICard title="Misinformation Rate" value={`${(analytics.misinformation_rate * 100).toFixed(1)}%`} color="red" />
        <KPICard title="Avg Processing Time" value={`${analytics.avg_processing_time_ms.toFixed(0)}ms`} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Label Distribution */}
        <ChartCard title="Verification Label Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={labelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {labelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} claims`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Domain Distribution */}
        <ChartCard title="Claims by Medical Domain">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Daily Trend */}
      <ChartCard title="Daily Verification Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.daily_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="true" stroke="#10b981" name="True" />
            <Line type="monotone" dataKey="false" stroke="#ef4444" name="False" />
            <Line type="monotone" dataKey="partial" stroke="#f59e0b" name="Partial" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => {
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
  }[color];

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  }[color];

  return (
    <div className={`${bgColor} rounded-lg p-4 border`}>
      <p className="text-xs text-gray-600 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);
