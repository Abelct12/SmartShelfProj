import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Table,
  RefreshCw,
  FileCheck,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetValidationResponse } from '../types';

interface DatasetManagementPageProps {
  onNavigateToModel: () => void;
}

export const DatasetManagementPage: React.FC<DatasetManagementPageProps> = ({ onNavigateToModel }) => {
  const [activeDatasetInfo, setActiveDatasetInfo] = useState<DatasetValidationResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<DatasetValidationResponse | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveDataset = async () => {
    setLoadingActive(true);
    setError(null);
    try {
      const info = await api.getActiveDatasetInfo();
      setActiveDatasetInfo(info);
    } catch (err: any) {
      setError(err.message || 'Failed to inspect active dataset.');
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchActiveDataset();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Only .csv files are supported.');
      return;
    }

    setUploadLoading(true);
    setUploadResult(null);
    try {
      const res = await api.validateDatasetFile(file);
      setUploadResult(res);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const displayedDataset = uploadResult || activeDatasetInfo;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-6 h-6 text-emerald-800" />
            <span>Dataset Inspection & Validation Management</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Audit schema definitions, examine column statistics, verify missing values, and validate new CSV datasets.
          </p>
        </div>
        <button
          onClick={fetchActiveDataset}
          className="btn-secondary text-xs self-start"
          title="Reload active dataset information"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>Reload Active Dataset</span>
        </button>
      </div>

      {/* CSV Upload & Safe Validation Card */}
      <div className="sci-card p-6 sm:p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload CSV Dataset for Feature Validation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any candidate food dataset CSV file. The system will inspect dimensions, detect duplicate rows, check required features, and verify the target column without overriding the production model.
            </p>
          </div>

          <div>
            <label className="btn-primary text-xs cursor-pointer inline-flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>{uploadLoading ? 'Validating Dataset...' : 'Choose CSV File to Validate'}</span>
              <input
                type="file"
                accept=".csv"
                id="dataset-upload-input"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-[11px] text-slate-400">
            Safety protocol: Uploading evaluates compatibility separately; retraining is strictly controlled.
          </p>
        </div>
      </div>

      {/* Active vs Uploaded Switcher Banner */}
      {uploadResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-700" />
            <span>Showing newly uploaded dataset: <strong>{uploadResult.filename}</strong></span>
          </div>
          <button
            onClick={() => setUploadResult(null)}
            className="text-emerald-800 font-semibold hover:underline"
          >
            Switch back to Active Dataset
          </button>
        </div>
      )}

      {/* Dataset Summary Cards */}
      {displayedDataset && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="sci-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">File Name</span>
              <p className="text-base font-bold text-slate-900 mt-1 truncate">{displayedDataset.filename}</p>
              <p className="text-xs text-slate-500 mt-1">
                {uploadResult ? 'Uploaded candidate' : 'Active system data'}
              </p>
            </div>

            <div className="sci-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dimensions</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {displayedDataset.total_rows} <span className="text-xs font-normal text-slate-500">rows</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{displayedDataset.total_columns} columns</p>
            </div>

            <div className="sci-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Duplicate Rows</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {displayedDataset.duplicate_rows_count}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {displayedDataset.duplicate_rows_count === 0 ? 'Clean (0 duplicates)' : 'Duplicates detected'}
              </p>
            </div>

            <div className="sci-card p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Training Compatibility</span>
              <div className="mt-1">
                {displayedDataset.is_valid_for_training ? (
                  <span className="badge-optimal text-xs">Ready for Training</span>
                ) : (
                  <span className="badge-critical text-xs">Incompatible Features</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Target: {displayedDataset.target_column_found ? 'Found' : 'Missing'}
              </p>
            </div>
          </div>

          {/* Validation Messages Callout */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Data Quality & Schema Validation Report</span>
            </h3>
            <ul className="space-y-1 text-xs text-slate-600">
              {displayedDataset.validation_messages.map((msg, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-700">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Columns & Data Types Table */}
          <div className="sci-card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Column Schema & Missing-Value Profile</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Column Name</th>
                    <th className="px-5 py-3">Inferred Data Type</th>
                    <th className="px-5 py-3">Missing Count</th>
                    <th className="px-5 py-3">Missing %</th>
                    <th className="px-5 py-3">Unique Values</th>
                    <th className="px-5 py-3">Feature Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {displayedDataset.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-900">{col.name}</td>
                      <td className="px-5 py-3 text-slate-600">{col.dtype}</td>
                      <td className="px-5 py-3 text-slate-600">{col.missing_count}</td>
                      <td className="px-5 py-3 text-slate-600">{col.missing_percentage}%</td>
                      <td className="px-5 py-3 text-slate-600">{col.unique_count}</td>
                      <td className="px-5 py-3">
                        {col.name === 'remaining_shelf_life_days' ? (
                          <span className="badge-optimal text-[10px]">Target Variable</span>
                        ) : ['food_category', 'packaging_type'].includes(col.name) ? (
                          <span className="badge-moderate text-[10px]">Categorical Feature</span>
                        ) : ['storage_temperature_c', 'relative_humidity_percent', 'initial_quality_index', 'storage_duration_days'].includes(col.name) ? (
                          <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Numerical Feature
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Metadata / Optional</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numerical Descriptive Statistics Table */}
          <div className="sci-card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Numerical Features Descriptive Statistics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Feature</th>
                    <th className="px-5 py-3">Mean</th>
                    <th className="px-5 py-3">Std Dev</th>
                    <th className="px-5 py-3">Min</th>
                    <th className="px-5 py-3">25% (Q1)</th>
                    <th className="px-5 py-3">Median</th>
                    <th className="px-5 py-3">75% (Q3)</th>
                    <th className="px-5 py-3">Max</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-mono">
                  {displayedDataset.numeric_statistics.map((stat) => (
                    <tr key={stat.column} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-sans font-semibold text-slate-900">{stat.column}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.mean}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.std}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.min}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.q25}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{stat.median}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.q75}</td>
                      <td className="px-5 py-3 text-slate-700">{stat.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* First 10 Records Preview Table */}
          <div className="sci-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Dataset Records Preview (First 10 Rows)</h3>
              <span className="text-xs text-slate-400">Sample inspection</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    {displayedDataset.columns.map((c) => (
                      <th key={c.name} className="px-4 py-2.5 whitespace-nowrap">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {displayedDataset.preview_rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80">
                      {displayedDataset.columns.map((c) => (
                        <td key={c.name} className="px-4 py-2 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                          {row[c.name] !== null && row[c.name] !== undefined ? String(row[c.name]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
