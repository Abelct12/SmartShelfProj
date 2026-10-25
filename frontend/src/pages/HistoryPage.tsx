import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Thermometer,
  Droplets,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { PredictionItem, PaginatedPredictionsResponse } from '../types';

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<PaginatedPredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<PredictionItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPredictions({
        page,
        pageSize,
        category,
        statusFilter,
        search,
        sortBy,
        order
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve prediction records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, category, statusFilter, sortBy, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await api.deletePrediction(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchHistory();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'optimal':
        return <span className="badge-optimal">Optimal</span>;
      case 'moderate':
        return <span className="badge-moderate">Moderate</span>;
      case 'critical':
        return <span className="badge-critical">Critical</span>;
      case 'expired':
        return <span className="badge-expired">Expired</span>;
      default:
        return <span className="badge-moderate">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-emerald-800" />
            <span>Prediction Records History</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse, search, inspect, and export all validated predictions stored in the SQLite database.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              window.open(api.getCsvExportUrl(), '_blank');
            }}
            className="btn-secondary text-xs"
            title="Export entire prediction database to CSV"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchHistory}
            className="btn-secondary text-xs"
            title="Refresh records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sci-card p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="history-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. PRED-), food item, or category..."
              className="form-input pl-9 text-xs"
            />
          </div>
          <button type="submit" className="btn-primary text-xs whitespace-nowrap">
            Search Records
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Food Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="form-select text-xs py-1.5"
            >
              <option value="All">All Categories</option>
              <option value="Dairy">Dairy</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Seafood">Seafood</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Bakery">Bakery</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status Range
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select text-xs py-1.5"
            >
              <option value="All">All Statuses</option>
              <option value="Optimal">Optimal (&gt;7d)</option>
              <option value="Moderate">Moderate (2-7d)</option>
              <option value="Critical">Critical (&lt;2d)</option>
              <option value="Expired">Expired (0d)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort By Field
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select text-xs py-1.5"
            >
              <option value="created_at">Timestamp</option>
              <option value="predicted_remaining_days">Remaining Days</option>
              <option value="storage_temperature_c">Storage Temp</option>
              <option value="storage_duration_days">Storage Duration</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort Direction
            </label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
              className="form-select text-xs py-1.5"
            >
              <option value="desc">Descending (Newest / Highest)</option>
              <option value="asc">Ascending (Oldest / Lowest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="sci-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-500 space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-800" />
            <span className="text-sm">Fetching prediction records from database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50 text-sm">
            <p className="font-semibold mb-1">Error Loading Records</p>
            <p>{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No prediction records matched your filters.</p>
            <p className="text-xs">Try clearing filters or run a new prediction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID / Date</th>
                  <th className="px-5 py-3.5">Food Product</th>
                  <th className="px-5 py-3.5">Conditions</th>
                  <th className="px-5 py-3.5">Packaging</th>
                  <th className="px-5 py-3.5">Elapsed</th>
                  <th className="px-5 py-3.5">Remaining Shelf Life</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {data.items.map((row) => (
                  <tr key={row.prediction_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {row.prediction_id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{row.food_item || row.food_category}</div>
                      <div className="text-xs text-slate-400">{row.food_category}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div>{row.storage_temperature_c} °C</div>
                      <div className="text-[11px] text-slate-400">{row.relative_humidity_percent}% RH</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[120px] truncate" title={row.packaging_type}>
                      {row.packaging_type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {row.storage_duration_days} d
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {row.predicted_remaining_days} <span className="text-xs font-normal text-slate-500">days</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(row.shelf_life_status)}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(row)}
                        className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded transition"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(row.prediction_id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.total_pages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-800">
                Page {page} of {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="btn-secondary p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-500">{selectedRecord.prediction_id}</span>
                <h2 className="text-lg font-bold text-slate-900">Prediction Record Inspection</h2>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-xs text-slate-500">Predicted Remaining Shelf Life</span>
                <div className="text-3xl font-extrabold text-emerald-900 mt-1">
                  {selectedRecord.predicted_remaining_days} days
                </div>
                <div className="text-xs text-slate-500 mt-1">Raw regression score: {selectedRecord.raw_prediction_days} d</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Estimated Expiry Date</span>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {selectedRecord.estimated_expiry_date || 'N/A'}
                </div>
                <div className="mt-1">{getStatusBadge(selectedRecord.shelf_life_status)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Storage Conditions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Category & Item</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.food_category}</span>
                  <span className="text-slate-500 block truncate">{selectedRecord.food_item || '-'}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Temperature & RH</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.storage_temperature_c} °C</span>
                  <span className="text-slate-500 block">{selectedRecord.relative_humidity_percent}% RH</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Packaging Barrier</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedRecord.packaging_type}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Initial Quality Score</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.initial_quality_index} / 10</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Elapsed Storage</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.storage_duration_days} days</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Model Version</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.model_name} (v{selectedRecord.model_version})</span>
                </div>
              </div>
            </div>

            {selectedRecord.safety_notes && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-bold block">Assigned Domain Food Safety Advisory:</span>
                <p>{selectedRecord.safety_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn-secondary text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Confirm Record Deletion</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete prediction record{' '}
              <strong className="font-mono text-slate-900">{deleteConfirmId}</strong> from the SQLite database? This operation cannot be reversed.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="btn-danger text-xs"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
