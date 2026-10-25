import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calculator,
  History,
  BarChart3,
  Cpu,
  Database,
  BookOpen,
  Menu,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelStatus, setModelStatus] = useState<{ ready: boolean; name?: string }>({ ready: false });

  useEffect(() => {
    api.getHealth()
      .then(res => {
        setModelStatus({
          ready: res.model_status === 'loaded',
          name: res.model_name
        });
      })
      .catch(() => {
        setModelStatus({ ready: false });
      });
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'predict', label: 'Predict Shelf Life', icon: Calculator },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'model', label: 'Model Performance', icon: Cpu },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'guidelines', label: 'Storage Guidelines', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  FoodShelf<span className="text-emerald-700">.AI</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  CS & Food Tech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Shelf Life Prediction & Food Quality Analytics
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Model Health Status Pill */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              modelStatus.ready
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {modelStatus.ready ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Model: {modelStatus.name || 'GBR Active'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Model Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Model Status:</span>
            <span className={modelStatus.ready ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {modelStatus.ready ? 'Gradient Boosting Ready' : 'Model Offline'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
