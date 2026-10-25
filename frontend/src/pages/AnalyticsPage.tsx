import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  Info,
  ScatterChart,
  Thermometer,
  Layers,
  PieChart as PieIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  ZAxis,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsSummary, DistributionsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [distributions, setDistributions] = useState<DistributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, distRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getAnalyticsDistributions()
      ]);
      setSummary(sumRes);
      setDistributions(distRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const CATEGORY_COLORS: Record<string, string> = {
    'Dairy': '#0284c7',
    'Meat & Poultry': '#e11d48',
    'Seafood': '#0d9488',
    'Fruits': '#ea580c',
    'Vegetables': '#16a34a',
    'Bakery': '#d97706',
  };

  const PACKAGING_COLORS = ['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#b7e4c7'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Print / Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-800" />
            <span>Food Quality Analytics & Empirical Reports</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Statistical distributions, multi-variable correlation analysis, and empirical storage condition insights.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print Report View</span>
          </button>
          <button
            onClick={() => window.open(api.getCsvExportUrl(), '_blank')}
            className="btn-primary text-xs"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* Observational Correlation Scientific Callout */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start space-x-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Academic & Statistical Methodology Disclosure:</p>
          <p className="mt-0.5 leading-relaxed">
            Charts display empirical observations and regression predictions from recorded storage conditions.
            Visual correlations between temperature, humidity, and shelf life represent observed associations in the database;
            mechanistic causality is established through chemical kinetics (Arrhenius Q10) and microbiological laboratory references.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-800" />
          <span className="text-sm font-medium">Aggregating database analytics and distributions...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <p className="font-semibold">Analytics unavailable</p>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Remaining Shelf Life Histogram */}
            <div className="sci-card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Remaining Shelf Life Distribution
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Frequency histogram across defined shelf-life intervals
              </p>

              <div className="h-64 w-full">
                {distributions?.shelf_life_distribution && distributions.shelf_life_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributions.shelf_life_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <XAxis
                        dataKey="bin_label"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        angle={-15}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} records`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#1b4332" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No data</div>
                )}
              </div>
            </div>

            {/* Chart 2: Category Breakdown & Averages */}
            <div className="sci-card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Predictions by Food Category
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Number of evaluated items and average remaining shelf life (days)
              </p>

              <div className="h-64 w-full">
                {distributions?.category_distribution && distributions.category_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributions.category_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(val: any, name: any, item: any) => [
                          `${val} items (Mean: ${item.payload.avg_remaining_days} days)`,
                          'Total Records'
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {distributions.category_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#2d6a4f'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No data</div>
                )}
              </div>
            </div>

            {/* Chart 3: Storage Temp vs Remaining Shelf Life Scatter Plot */}
            <div className="sci-card p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-1.5">
                  <Thermometer className="w-4 h-4 text-rose-600" />
                  <span>Storage Temperature vs. Remaining Shelf Life</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Scatter plot illustrating Arrhenius exponential decay across temperatures
              </p>

              <div className="h-64 w-full">
                {distributions?.scatter_points && distributions.scatter_points.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                      <XAxis
                        type="number"
                        dataKey="temperature"
                        name="Temperature"
                        unit="°C"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        type="number"
                        dataKey="remaining_days"
                        name="Remaining Days"
                        unit="d"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        label={{ value: 'Remaining Days', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                      />
                      <ZAxis range={[50, 50]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ payload }) => {
                          if (!payload || !payload[0]) return null;
                          const pt = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
                              <p className="font-semibold text-slate-900">{pt.id} ({pt.category})</p>
                              <p className="text-slate-600">Temp: {pt.temperature} °C</p>
                              <p className="text-slate-600">Humidity: {pt.humidity}% RH</p>
                              <p className="font-bold text-emerald-800">Remaining: {pt.remaining_days} days</p>
                              <p className="text-slate-500 text-[10px]">Status: {pt.status}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter name="Predictions" data={distributions.scatter_points}>
                        {distributions.scatter_points.map((entry, index) => (
                          <Cell
                            key={`scatter-cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || '#1b4332'}
                          />
                        ))}
                      </Scatter>
                    </RechartsScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No scatter data</div>
                )}
              </div>
            </div>

            {/* Chart 4: Packaging Type Breakdown */}
            <div className="sci-card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-emerald-800" />
                <span>Packaging Barrier Condition Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Proportion of samples in vacuum, MAP, sealed plastic, or ambient packaging
              </p>

              <div className="h-64 w-full">
                {distributions?.packaging_distribution && distributions.packaging_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributions.packaging_distribution}
                        dataKey="count"
                        nameKey="packaging"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }: any) => `${(name || '').split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {distributions.packaging_distribution.map((entry, index) => (
                          <Cell
                            key={`pkg-${index}`}
                            fill={PACKAGING_COLORS[index % PACKAGING_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [`${val} records`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No packaging data</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
