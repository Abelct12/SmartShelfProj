import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Thermometer,
  Droplets,
  Package,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { FoodGuideline } from '../types';

export const GuidelinesPage: React.FC = () => {
  const [guidelines, setGuidelines] = useState<FoodGuideline[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    setLoading(true);
    api.getFoodGuidelines()
      .then((res) => {
        setGuidelines(res.guidelines);
        setDisclaimer(res.disclaimer);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load food storage guidelines.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === 'All'
    ? guidelines
    : guidelines.filter((g) => g.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-800" />
            <span>Food Science Storage Reference Standards</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Empirical guidelines, microbiological spoilage mechanisms, and regulatory safety standards.
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium self-start">
          Citations: USDA FSIS & FDA Food Code
        </div>
      </div>

      {/* Domain Reference Distinction Alert */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start space-x-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Educational Domain Reference Notice:</p>
          <p className="mt-0.5 leading-relaxed">
            {disclaimer || 'These standards represent documented food science literature and regulatory recommendations. They provide educational context and baseline microbiological rules to accompany statistical machine learning outputs.'}
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Dairy', 'Meat & Poultry', 'Seafood', 'Fruits', 'Vegetables', 'Bakery'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              activeCategory === cat
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-800" />
          <span className="text-sm font-medium">Loading food technology guidelines...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <p className="font-semibold">Failed to load guidelines</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div key={item.category} className="sci-card p-6 space-y-4 sci-card-hover flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">{item.category}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    Commercial Standard
                  </span>
                </div>

                {/* Storage Conditions Specs */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 flex items-center mb-0.5">
                      <Thermometer className="w-3.5 h-3.5 text-rose-600 mr-1" />
                      Optimal Temp
                    </span>
                    <span className="font-semibold text-slate-800">{item.optimal_temperature_range}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 flex items-center mb-0.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-600 mr-1" />
                      Optimal RH
                    </span>
                    <span className="font-semibold text-slate-800">{item.optimal_humidity_range}</span>
                  </div>
                </div>

                {/* Packaging & Typical Shelf Life */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block flex items-center mb-0.5">
                      <Package className="w-3.5 h-3.5 text-slate-500 mr-1" />
                      Recommended Packaging:
                    </span>
                    <p className="text-slate-600">{item.recommended_packaging}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Typical Baseline Shelf Life:</span>
                    <p className="text-slate-600">{item.typical_shelf_life_unopened}</p>
                  </div>
                </div>

                {/* Spoilage Mechanisms */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-900 block">Biological & Spoilage Pathways:</span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {item.primary_spoilage_mechanisms.map((mech, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{mech}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Food Safety Warning */}
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Critical Regulatory Safety Rule:</span>
                  </div>
                  <p className="leading-relaxed">{item.critical_food_safety_rule}</p>
                </div>
              </div>

              {/* Source Attribution */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Source Citation:</span>
                <span className="font-medium text-slate-600 truncate max-w-[280px]">{item.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
