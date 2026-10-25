import React from 'react';
import { Leaf, Award, BookOpen, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
              <Leaf className="w-5 h-5 text-emerald-700" />
              <span>FoodShelf.AI Prediction Platform</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              An interdisciplinary research system combining Computer Science (Machine Learning, REST APIs, Reactive UI) and Food Technology (Arrhenius shelf-life kinetics, spoilage mechanisms, USDA/FDA standards).
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Scientific Foundation
            </h4>
            <ul className="text-xs space-y-1 text-slate-500">
              <li>• Arrhenius Reaction Rate Kinetics: <code className="text-emerald-700">k = A·exp(-Ea/RT)</code></li>
              <li>• Q10 Temperature Sensitivity Coefficients</li>
              <li>• Labuza Water Activity & Sorption Isotherms</li>
              <li>• Packaging Gas & Moisture Transmission Barriers</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Regulatory Standards Referenced
            </h4>
            <ul className="text-xs space-y-1 text-slate-500">
              <li>• USDA FSIS Danger Zone Temperature Standards (4°C–60°C)</li>
              <li>• FDA Food Code §3-501.16 Refrigeration Limits</li>
              <li>• FDA Fish & Fishery Products Hazards and Controls Guidance</li>
              <li>• Scikit-learn Machine Learning Framework</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 AI and Data Science–Based Food Shelf Life Prediction System. Computer Science & Food Technology Academic Project.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center text-emerald-700 font-medium">
              <Award className="w-3.5 h-3.5 mr-1" />
              Production Academic Release v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
