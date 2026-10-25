import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Award,
  Layers,
  BarChart,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ModelInfo } from '../types';

export const ModelPerformancePage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retrain state
  const [confirmRetrain, setConfirmRetrain] = useState(false);
  const [testSplit, setTestSplit] = useState(0.2);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [retrainError, setRetrainError] = useState<string | null>(null);

  const fetchModelInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await api.getModelInfo();
      setModelInfo(info);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve model performance metadata.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const handleRetrain = async () => {
    if (!confirmRetrain) {
      alert('Please check the confirmation box before initiating model training.');
      return;
    }
    setRetrainLoading(true);
    setRetrainSuccess(null);
    setRetrainError(null);
    try {
      const res = await api.retrainModel(true, testSplit, 42);
      setRetrainSuccess(
        `Training complete! Selected: ${res.selected_algorithm} (Test RMSE: ${res.evaluation_metrics.test_rmse} d, R²: ${res.evaluation_metrics.test_r2})`
      );
      setConfirmRetrain(false);
      fetchModelInfo();
    } catch (err: any) {
      setRetrainError(err.message || 'Retraining failed.');
    } finally {
      setRetrainLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-800 animate-spin" />
        <p className="text-sm text-slate-600">Loading model architecture & cross-validation metrics...</p>
      </div>
    );
  }

  if (error || !modelInfo) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        <p className="font-semibold text-rose-900 mb-1">Model Metadata Unavailable</p>
        <p>{error || 'Model has not been trained yet. Please execute training script.'}</p>
        <button
          onClick={fetchModelInfo}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  const comparisons = modelInfo.all_model_comparisons || {};
  const comparisonList = Object.entries(comparisons).map(([name, metrics]: [string, any]) => ({
    name,
    ...metrics,
    isBest: name === modelInfo.model_name
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-emerald-800" />
            <span>Machine Learning Model Performance & Transparency</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Algorithm evaluation, cross-validation metrics, feature importances, and academic limitations.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            Active: {modelInfo.selected_algorithm}
          </span>
          <span className="text-slate-400">v{modelInfo.model_version}</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="sci-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Algorithm</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{modelInfo.model_name}</p>
          <p className="text-xs text-emerald-700 mt-2 font-medium">Class: {modelInfo.selected_algorithm}</p>
        </div>

        <div className="sci-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test R² (Coeff. of Det.)</span>
          <p className="text-3xl font-extrabold text-emerald-900 mt-1">
            {modelInfo.evaluation_metrics.test_r2}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            5-Fold CV R²: {modelInfo.evaluation_metrics.cv_r2}
          </p>
        </div>

        <div className="sci-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test MAE (Mean Abs. Error)</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {modelInfo.evaluation_metrics.test_mae} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            5-Fold CV MAE: {modelInfo.evaluation_metrics.cv_mae} days
          </p>
        </div>

        <div className="sci-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test RMSE (Root Mean Sq.)</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {modelInfo.evaluation_metrics.test_rmse} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            5-Fold CV RMSE: {modelInfo.evaluation_metrics.cv_rmse} days
          </p>
        </div>
      </div>

      {/* Candidate Algorithms Comparison Table */}
      <div className="sci-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Candidate Algorithm Evaluation & Model Selection
            </h2>
            <p className="text-xs text-slate-500">
              Standardized comparison on identical 80/20 split and 5-fold cross-validation
            </p>
          </div>
          <span className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-600 font-mono">
            Seed: {modelInfo.random_state} | Split: {modelInfo.train_test_split_ratio}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Candidate Algorithm</th>
                <th className="px-6 py-3.5">Role / Architecture</th>
                <th className="px-6 py-3.5">5-Fold CV MAE</th>
                <th className="px-6 py-3.5">5-Fold CV RMSE</th>
                <th className="px-6 py-3.5">Test MAE</th>
                <th className="px-6 py-3.5">Test RMSE</th>
                <th className="px-6 py-3.5">Test R²</th>
                <th className="px-6 py-3.5 text-right">Selection Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {comparisonList.map((cand) => (
                <tr
                  key={cand.name}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    cand.isBest ? 'bg-emerald-50/50 font-medium' : ''
                  }`}
                >
                  <td className="px-6 py-4 flex items-center space-x-2 font-semibold text-slate-900">
                    {cand.isBest && <Award className="w-4 h-4 text-emerald-700" />}
                    <span>{cand.name}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {cand.name === 'Linear Regression' ? 'Baseline OLS' :
                     cand.name === 'Ridge Regression' ? 'L2 Regularized Baseline' :
                     cand.name === 'Random Forest' ? 'Bagged Decision Trees' :
                     'Sequential Boosting (Gradient Trees)'}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-700">{cand.cv_mae} d</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-700">{cand.cv_rmse} d</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-900 font-semibold">{cand.test_mae} d</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-900 font-semibold">{cand.test_rmse} d</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-900 font-bold">{cand.test_r2}</td>
                  <td className="px-6 py-4 text-right">
                    {cand.isBest ? (
                      <span className="badge-optimal text-xs">Winning Model</span>
                    ) : (
                      <span className="text-xs text-slate-400">Candidate</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importances & Model Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importances Chart */}
        <div className="sci-card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Feature Importances (Gini / MDI)</h2>
          <p className="text-xs text-slate-500 mb-4">
            Relative impact of input features in predicting remaining shelf life
          </p>

          <div className="h-72 w-full">
            {modelInfo.feature_importances && modelInfo.feature_importances.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={modelInfo.feature_importances.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    width={110}
                    tickFormatter={(val: string) => val.replace('packaging_type_', '').replace('food_category_', '').replace('_c', ' °C')}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`${(val * 100).toFixed(1)}% Relative Weight`, 'Importance']}
                  />
                  <Bar dataKey="importance" fill="#1b4332" radius={[0, 4, 4, 0]}>
                    {modelInfo.feature_importances.slice(0, 8).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#1b4332' : index === 1 ? '#2d6a4f' : '#40916c'}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No feature importances</div>
            )}
          </div>
        </div>

        {/* Model Architecture & Pipeline Specs */}
        <div className="sci-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Pipeline Specifications & Metadata</h2>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block">Dataset Source</span>
              <span className="font-semibold text-slate-800 break-all">{modelInfo.dataset_path}</span>
              <span className="text-slate-500 block">{modelInfo.dataset_samples_total} rows</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block">Target Variable</span>
              <span className="font-semibold text-slate-800">{modelInfo.target_column}</span>
              <span className="text-slate-500 block">Continuous Days</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block">Preprocessing Pipeline</span>
              <span className="font-semibold text-slate-800">ColumnTransformer</span>
              <span className="text-slate-500 block">StandardScaler + OneHotEncoder</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block">Training Split</span>
              <span className="font-semibold text-slate-800">{modelInfo.train_samples} Train / {modelInfo.test_samples} Test</span>
              <span className="text-slate-500 block">Ratio: {modelInfo.train_test_split_ratio}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">Feature Representation:</span>
            <p><strong>Numerical:</strong> {modelInfo.numerical_features.join(', ')}</p>
            <p><strong>Categorical:</strong> {modelInfo.categorical_features.join(', ')} ({modelInfo.supported_categories.length} categories, {modelInfo.supported_packaging.length} packaging types)</p>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Trained on: {new Date(modelInfo.training_timestamp).toLocaleString()}</span>
            <span>Artifact: models/food_shelf_life_pipeline.joblib</span>
          </div>
        </div>
      </div>

      {/* Controlled Retraining Panel */}
      <div className="sci-card p-6 sm:p-8 border-2 border-emerald-700/20">
        <div className="flex items-center space-x-2 text-emerald-950 font-bold mb-2">
          <Sliders className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base sm:text-lg">Controlled Candidate-Model Retraining</h2>
        </div>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Trigger a controlled training cycle that executes 5-fold cross-validation on all candidate algorithms (Linear Regression, Ridge, Random Forest, Gradient Boosting), selects the best-performing model, updates evaluation artifacts, and seamlessly reloads the live inference service.
        </p>

        {retrainSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{retrainSuccess}</span>
          </div>
        )}

        {retrainError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{retrainError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Held-Out Test Set Ratio: {Math.round(testSplit * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSplit}
              onChange={(e) => setTestSplit(parseFloat(e.target.value))}
              disabled={retrainLoading}
              className="w-full h-2 bg-slate-200 rounded-lg accent-emerald-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10% (More Training Data)</span>
              <span>20% (Recommended)</span>
              <span>40% (Conservative)</span>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-3">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                id="retrain-confirm-checkbox"
                checked={confirmRetrain}
                onChange={(e) => setConfirmRetrain(e.target.checked)}
                disabled={retrainLoading}
                className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-500 h-4 w-4"
              />
              <span className="font-medium">
                I explicitly authorize retraining and artifact replacement.
              </span>
            </label>

            <button
              onClick={handleRetrain}
              disabled={!confirmRetrain || retrainLoading}
              id="retrain-submit-btn"
              className="btn-primary text-xs"
            >
              {retrainLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span>Evaluating 4 Candidates & Fitting Models...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Execute Model Retraining</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Academic Limitations & Gaps */}
      <div className="sci-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Academic Scope & Known Methodological Limitations</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-600">
          {modelInfo.academic_limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
