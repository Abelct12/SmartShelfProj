import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  Thermometer,
  Droplets,
  Package,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { PredictRequest, PredictResponse } from '../types';

interface PredictPageProps {
  onNavigateToHistory: () => void;
}

const FOOD_CATEGORY_OPTIONS = [
  {
    category: 'Dairy',
    items: ['Pasteurized Whole Milk', 'Greek Yogurt', 'Soft Cheddar Cheese', 'Heavy Cream', 'Cottage Cheese'],
    optimalTemp: 4.0,
    optimalHumidity: 55.0,
  },
  {
    category: 'Meat & Poultry',
    items: ['Raw Chicken Breast', 'Ground Beef (85/15)', 'Pork Tenderloin', 'Turkey Breast', 'Beef Steak'],
    optimalTemp: 2.0,
    optimalHumidity: 60.0,
  },
  {
    category: 'Seafood',
    items: ['Fresh Salmon Fillet', 'Atlantic Cod', 'Raw White Shrimp', 'Tuna Steaks'],
    optimalTemp: 1.0,
    optimalHumidity: 65.0,
  },
  {
    category: 'Fruits',
    items: ['Fresh Strawberries', 'Crisp Apples', 'Bananas', 'Valencia Oranges', 'Blueberries'],
    optimalTemp: 5.0,
    optimalHumidity: 85.0,
  },
  {
    category: 'Vegetables',
    items: ['Baby Spinach Leaves', 'Broccoli Florets', 'Carrots', 'Bell Peppers', 'Button Mushrooms'],
    optimalTemp: 4.0,
    optimalHumidity: 90.0,
  },
  {
    category: 'Bakery',
    items: ['White Sliced Bread', 'Whole Wheat Artisan Loaf', 'Butter Croissant', 'Muffins'],
    optimalTemp: 20.0,
    optimalHumidity: 45.0,
  },
];

const PACKAGING_OPTIONS = [
  'Vacuum Sealed',
  'Modified Atmosphere Packaging (MAP)',
  'Sealed Plastic Container',
  'Paper / Carton',
  'Ambient / Unsealed'
];

export const PredictPage: React.FC<PredictPageProps> = ({ onNavigateToHistory }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<PredictRequest>({
    food_category: 'Dairy',
    food_item: 'Pasteurized Whole Milk',
    storage_temperature_c: 4.0,
    relative_humidity_percent: 60.0,
    packaging_type: 'Sealed Plastic Container',
    initial_quality_index: 9.0,
    storage_duration_days: 2.0,
    reference_date: todayStr,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedCategoryInfo = FOOD_CATEGORY_OPTIONS.find(c => c.category === formData.food_category);

  const handleCategoryChange = (cat: string) => {
    const info = FOOD_CATEGORY_OPTIONS.find(c => c.category === cat);
    setFormData(prev => ({
      ...prev,
      food_category: cat,
      food_item: info?.items[0] || '',
      storage_temperature_c: info?.optimalTemp ?? prev.storage_temperature_c,
      relative_humidity_percent: info?.optimalHumidity ?? prev.relative_humidity_percent,
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.food_category) {
      errs.food_category = 'Please select a food category.';
    }

    if (formData.storage_temperature_c === undefined || isNaN(formData.storage_temperature_c)) {
      errs.storage_temperature_c = 'Storage temperature is required.';
    } else if (formData.storage_temperature_c < -25 || formData.storage_temperature_c > 50) {
      errs.storage_temperature_c = 'Temperature must be between -25°C and 50°C.';
    }

    if (formData.relative_humidity_percent === undefined || isNaN(formData.relative_humidity_percent)) {
      errs.relative_humidity_percent = 'Relative humidity is required.';
    } else if (formData.relative_humidity_percent < 15 || formData.relative_humidity_percent > 99) {
      errs.relative_humidity_percent = 'Humidity must be between 15% and 99%.';
    }

    if (!formData.packaging_type) {
      errs.packaging_type = 'Please select a packaging type.';
    }

    if (formData.storage_duration_days === undefined || isNaN(formData.storage_duration_days)) {
      errs.storage_duration_days = 'Storage duration is required.';
    } else if (formData.storage_duration_days < 0) {
      errs.storage_duration_days = 'Storage duration cannot be negative.';
    }

    if (formData.initial_quality_index === undefined || isNaN(formData.initial_quality_index)) {
      errs.initial_quality_index = 'Initial quality index is required.';
    } else if (formData.initial_quality_index < 1.0 || formData.initial_quality_index > 10.0) {
      errs.initial_quality_index = 'Quality score must be between 1.0 and 10.0.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.predictShelfLife(formData);
      setResult(response);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err: any) {
      setApiError(err.message || 'Failed to generate prediction. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      food_category: 'Dairy',
      food_item: 'Pasteurized Whole Milk',
      storage_temperature_c: 4.0,
      relative_humidity_percent: 60.0,
      packaging_type: 'Sealed Plastic Container',
      initial_quality_index: 9.0,
      storage_duration_days: 0.0,
      reference_date: todayStr,
    });
    setErrors({});
    setResult(null);
    setApiError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Optimal':
        return <span className="badge-optimal font-semibold text-sm px-3 py-1">Optimal Stability</span>;
      case 'Moderate':
        return <span className="badge-moderate font-semibold text-sm px-3 py-1">Moderate Shelf Life</span>;
      case 'Critical':
        return <span className="badge-critical font-semibold text-sm px-3 py-1">Critical (Near Expiry)</span>;
      case 'Expired':
        return <span className="badge-expired font-semibold text-sm px-3 py-1">Spoiled / Expired</span>;
      default:
        return <span className="badge-moderate font-semibold text-sm px-3 py-1">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Estimate Food Shelf Life
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Provide observed environmental parameters to generate verified kinetic shelf-life predictions.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          <span>Inference: Gradient Boosting Pipeline</span>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Prediction Submission Error</p>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="sci-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-800" />
            <span>Product & Environmental Storage Parameters</span>
          </h2>
          <span className="text-xs text-slate-400">* Required inputs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Food Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Food Category *
            </label>
            <select
              id="food-category-select"
              value={formData.food_category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
            >
              {FOOD_CATEGORY_OPTIONS.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
            {errors.food_category && (
              <p className="text-xs text-rose-600">{errors.food_category}</p>
            )}
            <p className="text-[11px] text-slate-400">
              Optimal storage: ~{selectedCategoryInfo?.optimalTemp}°C, {selectedCategoryInfo?.optimalHumidity}% RH
            </p>
          </div>

          {/* Specific Food Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Specific Food Item (Optional)
            </label>
            <input
              type="text"
              id="food-item-input"
              list="suggested-items"
              value={formData.food_item || ''}
              onChange={(e) => setFormData({ ...formData, food_item: e.target.value })}
              placeholder="e.g. Pasteurized Whole Milk, Atlantic Cod..."
              className="form-input"
            />
            <datalist id="suggested-items">
              {selectedCategoryInfo?.items.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-400">
              Helps identify item-specific baseline kinetics and records
            </p>
          </div>

          {/* Storage Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                <span>Storage Temperature (°C) *</span>
              </label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {formData.storage_temperature_c} °C
              </span>
            </div>
            <input
              type="range"
              id="temp-slider"
              min="-20"
              max="40"
              step="0.5"
              value={formData.storage_temperature_c}
              onChange={(e) => setFormData({ ...formData, storage_temperature_c: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-20°C (Deep Frozen)</span>
              <span>0°C</span>
              <span>4°C (Fridge)</span>
              <span>21°C (Room)</span>
              <span>40°C (Extreme)</span>
            </div>
            {/* Quick-Preset Shortcuts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Freezer (-18°C)', temp: -18 },
                { label: 'Cold Storage (1°C)', temp: 1 },
                { label: 'Standard Fridge (4°C)', temp: 4 },
                { label: 'Cool Cellar (12°C)', temp: 12 },
                { label: 'Room Temp (21°C)', temp: 21 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, storage_temperature_c: preset.temp })}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {errors.storage_temperature_c && (
              <p className="text-xs text-rose-600">{errors.storage_temperature_c}</p>
            )}
            {formData.storage_temperature_c > 4.0 && ['Dairy', 'Meat & Poultry', 'Seafood'].includes(formData.food_category) && (
              <div className="flex items-center space-x-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Notice: Temperature &gt; 4°C enters the USDA Danger Zone for {formData.food_category}.</span>
              </div>
            )}
          </div>

          {/* Relative Humidity */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <span>Relative Humidity (%) *</span>
              </label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {formData.relative_humidity_percent} %
              </span>
            </div>
            <input
              type="range"
              id="humidity-slider"
              min="20"
              max="98"
              step="1"
              value={formData.relative_humidity_percent}
              onChange={(e) => setFormData({ ...formData, relative_humidity_percent: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20% (Dry)</span>
              <span>50% (Standard)</span>
              <span>85% (High/Crisper)</span>
              <span>98% (Saturated)</span>
            </div>
            {errors.relative_humidity_percent && (
              <p className="text-xs text-rose-600">{errors.relative_humidity_percent}</p>
            )}
          </div>

          {/* Packaging Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>Packaging Type or Condition *</span>
            </label>
            <select
              id="packaging-select"
              value={formData.packaging_type}
              onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
              className="form-select"
            >
              {PACKAGING_OPTIONS.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
            {errors.packaging_type && (
              <p className="text-xs text-rose-600">{errors.packaging_type}</p>
            )}
            <p className="text-[11px] text-slate-400">
              Barrier protection reduces oxygen transmission rate (OTR) and moisture loss
            </p>
          </div>

          {/* Elapsed Storage Duration (Days) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Elapsed Storage Duration (Days) *</span>
            </label>
            <input
              type="number"
              id="elapsed-duration-input"
              min="0"
              max="365"
              step="0.1"
              value={formData.storage_duration_days}
              onChange={(e) => setFormData({ ...formData, storage_duration_days: parseFloat(e.target.value) || 0 })}
              className="form-input"
            />
            {errors.storage_duration_days && (
              <p className="text-xs text-rose-600">{errors.storage_duration_days}</p>
            )}
            <p className="text-[11px] text-slate-400">
              How many days the product has already spent under these conditions
            </p>
          </div>

          {/* Initial Freshness / Quality Index */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Initial Freshness / Quality Score (1 - 10) *
              </label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {formData.initial_quality_index} / 10
              </span>
            </div>
            <input
              type="range"
              id="quality-slider"
              min="3"
              max="10"
              step="0.5"
              value={formData.initial_quality_index}
              onChange={(e) => setFormData({ ...formData, initial_quality_index: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>3.0 (Near Limit)</span>
              <span>7.0 (Good)</span>
              <span>9.0 (Fresh)</span>
              <span>10.0 (Pristine)</span>
            </div>
            {errors.initial_quality_index && (
              <p className="text-xs text-rose-600">{errors.initial_quality_index}</p>
            )}
          </div>

          {/* Reference / Start Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>Reference Storage Start Date (Optional)</span>
            </label>
            <input
              type="date"
              id="ref-date-input"
              value={formData.reference_date || ''}
              onChange={(e) => setFormData({ ...formData, reference_date: e.target.value })}
              className="form-input"
            />
            <p className="text-[11px] text-slate-400">
              Used to project estimated calendar expiry date
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Reset Form</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            id="submit-prediction-btn"
            className="btn-primary w-full sm:w-auto px-8 py-3 text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Evaluating Kinetics & Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                <span>Predict Remaining Shelf Life</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Prediction Results Display */}
      {result && (
        <div id="prediction-result-card" className="sci-card p-6 sm:p-8 space-y-6 border-2 border-emerald-600/30 shadow-lg animate-fadeIn">
          {/* Header of Result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <span className="font-mono font-semibold text-slate-800">{result.prediction_id}</span>
                <span>•</span>
                <span>{new Date(result.timestamp).toLocaleString()}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Prediction Evaluation Output
              </h2>
            </div>
            <div>
              {getStatusBadge(result.shelf_life_status)}
            </div>
          </div>

          {/* Hero KPI Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200/80">
            {/* Remaining Days */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Estimated Remaining Shelf Life
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl sm:text-5xl font-black text-emerald-900 tracking-tight">
                  {result.predicted_remaining_days}
                </span>
                <span className="text-lg font-medium text-slate-600">days remaining</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Raw model regression value: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{result.raw_model_prediction} days</code>
              </p>
            </div>

            {/* Estimated Expiry Date */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Estimated Expiry / Consumption Date
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
                  {result.estimated_expiry_date || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Calculated from reference start date + elapsed duration ({result.storage_duration_days}d) + predicted remaining
              </p>
            </div>
          </div>

          {/* Input Summary Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Storage Conditions Evaluated
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block">Food Type</span>
                <span className="font-semibold text-slate-800">{result.food_category}</span>
                <span className="text-[11px] text-slate-500 block truncate">{result.food_item || '-'}</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block">Temperature & RH</span>
                <span className="font-semibold text-slate-800">{result.storage_temperature_c} °C</span>
                <span className="text-[11px] text-slate-500 block">{result.relative_humidity_percent} % RH</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block">Packaging Barrier</span>
                <span className="font-semibold text-slate-800 truncate block">{result.packaging_type}</span>
                <span className="text-[11px] text-slate-500 block">Elapsed: {result.storage_duration_days} d</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-400 block">Initial Quality</span>
                <span className="font-semibold text-slate-800">{result.initial_quality_index} / 10</span>
                <span className="text-[11px] text-slate-500 block">Baseline Freshness</span>
              </div>
            </div>
          </div>

          {/* Domain Guidance Callout */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Food Technology & Domain Safety Guidance</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-emerald-900">
              {result.safety_guidance.map((note, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Disclaimer Callout */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> {result.disclaimer}
            </p>
          </div>

          {/* Next Steps Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span>Print Record</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-xs"
              >
                <span>Predict Another Item</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNavigateToHistory}
              className="btn-primary text-xs"
            >
              <span>View in Saved History</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
