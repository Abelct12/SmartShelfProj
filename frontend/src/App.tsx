import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Footer } from './components/Footer';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PredictPage } from './pages/PredictPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DatasetManagementPage } from './pages/DatasetManagementPage';
import { GuidelinesPage } from './pages/GuidelinesPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToPredict={() => setActiveTab('predict')}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        );
      case 'predict':
        return (
          <PredictPage
            onNavigateToHistory={() => setActiveTab('history')}
          />
        );
      case 'history':
        return <HistoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'model':
        return <ModelPerformancePage />;
      case 'dataset':
        return (
          <DatasetManagementPage
            onNavigateToModel={() => setActiveTab('model')}
          />
        );
      case 'guidelines':
        return <GuidelinesPage />;
      default:
        return (
          <DashboardPage
            onNavigateToPredict={() => setActiveTab('predict')}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] text-slate-800">
      {/* Top Disclaimer Advisory */}
      <DisclaimerBanner />

      {/* Main Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActivePage()}
      </main>

      {/* Academic Footer */}
      <Footer />
    </div>
  );
};

export default App;
