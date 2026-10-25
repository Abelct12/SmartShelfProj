import React, { useState, useEffect } from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsSummary, DistributionsData, PredictionItem } from '../types';

interface DashboardPageProps {
  onNavigateToPredict: () => void;
  onNavigateToHistory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToPredict,
  onNavigateToHistory
}) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [distributions, setDistributions] = useState<DistributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);

  const fetchDashboardData = async () => {
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
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'optimal':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'moderate':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'critical':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'expired':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    'Dairy': '#0284c7',
    'Meat & Poultry': '#e11d48',
    'Seafood': '#0d9488',
    'Fruits': '#ea580c',
    'Vegetables': '#16a34a',
    'Bakery': '#d97706',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading food quality analytics & prediction records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <div className="flex items-center space-x-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-rose-900">Failed to load analytics</h3>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="sci-card p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interdisciplinary Food Science & Machine Learning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
            AI Food Shelf Life Prediction Dashboard
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Empirical degradation kinetics combined with Gradient Boosting regression to estimate food storage stability, remaining shelf life, and critical safety thresholds.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onNavigateToPredict}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition flex items-center space-x-2"
            >
              <span>Run New Prediction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToHistory}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              View Prediction Records
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Predictions */}
        <div className="sci-card p-5 sci-card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Recorded Predictions</p>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.total_predictions ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            Persistent in SQLite Database
          </p>
        </div>

        {/* Categories Represented */}
        <div className="sci-card p-5 sci-card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Food Categories</p>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.categories_represented_count ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dairy, Meat, Seafood, Fruits, Veggies, Bakery
          </p>
        </div>

        {/* Average Remaining Shelf Life */}
        <div className="sci-card p-5 sci-card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Remaining Shelf Life</p>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.average_remaining_shelf_life_days ?? 0.0} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Mean across active database items
          </p>
        </div>

        {/* Active Model Status */}
        <div className="sci-card p-5 sci-card-hover">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active ML Model</p>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2 truncate">
            {summary?.model_name || 'Gradient Boosting'}
          </p>
          <div className="mt-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-emerald-700 font-medium">Status: {summary?.model_status}</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown & Storage Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="sci-card p-6 lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center justify-between">
            <span>Shelf Life Status Range</span>
            <span className="text-xs font-normal text-slate-500">Verified Thresholds</span>
          </h2>
          
          <div className="space-y-4">
            {summary?.status_breakdown && summary.status_breakdown.length > 0 ? (
              summary.status_breakdown.map((item) => (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'Optimal' ? 'bg-emerald-500' :
                        item.status === 'Moderate' ? 'bg-blue-500' :
                        item.status === 'Critical' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="text-slate-800">{item.status}</span>
                    </span>
                    <span className="text-slate-600">{item.count} items ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'Optimal' ? 'bg-emerald-500' :
                        item.status === 'Moderate' ? 'bg-blue-500' :
                        item.status === 'Critical' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No prediction records available.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
            <p className="font-semibold text-slate-700">Documented Range Rules:</p>
            <p>• <strong>Optimal:</strong> &gt; 7.0 days remaining</p>
            <p>• <strong>Moderate:</strong> 2.0 to 7.0 days remaining</p>
            <p>• <strong>Critical:</strong> &gt; 0.0 to 2.0 days remaining</p>
            <p>• <strong>Expired:</strong> 0.0 days remaining</p>
          </div>
        </div>

        {/* Charts: Shelf Life Distribution */}
        <div className="sci-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Remaining Shelf Life Distribution</h2>
              <p className="text-xs text-slate-500">Histogram of recorded prediction horizons</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Refresh charts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 w-full">
            {distributions?.shelf_life_distribution && distributions.shelf_life_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.shelf_life_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="bin_label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: any) => [`${value} Records`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#1b4332" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No distribution data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Predictions by Category & Food Science Storage Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="sci-card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Predictions by Food Category</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution and average shelf life per food category</p>

          <div className="h-64 w-full">
            {distributions?.category_distribution && distributions.category_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.category_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} predictions (Avg: ${item.payload.avg_remaining_days} days)`,
                      'Records'
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
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No category data available.
              </div>
            )}
          </div>
        </div>

        {/* Food Storage Kinetic Principles Callout */}
        <div className="sci-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold mb-2">
              <Info className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base">Food Science Kinetic Storage Insights</h2>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Food shelf life degradation follows biochemical and microbial kinetics modeled by the Arrhenius and Labuza equations:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-900 block mb-1">Arrhenius Temperature Sensitivity (Q10)</span>
                <p className="text-slate-600">
                  For every 10°C temperature elevation, microbial proliferation rates typically increase by a factor of 2.0x to 3.5x for meat, dairy, and seafood.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-900 block mb-1">Relative Humidity & Water Activity (aw)</span>
                <p className="text-slate-600">
                  Relative humidity exceeding 70% in bakery items accelerates fungal spore germination, whereas relative humidity below 85% in fresh vegetables causes moisture loss and wilting.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="font-semibold text-slate-900 block mb-1">Packaging Barrier Integrity</span>
                <p className="text-slate-600">
                  Vacuum and Modified Atmosphere Packaging (MAP) suppress aerobic psychrotrophic bacterial growth, typically extending shelf life by 1.8x to 2.5x compared to standard ambient storage.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Reference: USDA FSIS & Labuza Food Kinetics</span>
            <span className="text-emerald-700 font-medium">Valid for All Categories</span>
          </div>
        </div>
      </div>

      {/* Recent Prediction Activity Table */}
      <div className="sci-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Prediction Activity</h2>
            <p className="text-xs text-slate-500">Latest predictions processed and persisted in the SQLite database</p>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1"
          >
            <span>View All in History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Prediction ID</th>
                <th className="px-6 py-3">Food Item & Category</th>
                <th className="px-6 py-3">Storage Temp</th>
                <th className="px-6 py-3">Humidity</th>
                <th className="px-6 py-3">Remaining Shelf Life</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {summary?.latest_activity && summary.latest_activity.length > 0 ? (
                summary.latest_activity.map((rec) => (
                  <tr key={rec.prediction_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">
                      {rec.prediction_id}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-800">{rec.food_item || rec.food_category}</div>
                      <div className="text-xs text-slate-400">{rec.food_category}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 text-xs">
                      {rec.temperature} °C
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 text-xs">
                      {rec.humidity} %
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {rec.predicted_remaining_days} <span className="text-xs font-normal text-slate-500">days</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(rec.shelf_life_status)}`}>
                        {rec.shelf_life_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500">
                    No predictions recorded yet. Run your first prediction above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
