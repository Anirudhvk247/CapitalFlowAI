import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import { ToastContainer } from './components/Toast';
import Dashboard from './pages/Dashboard';
import DailyAnalysis from './pages/DailyAnalysis';
import MonthlyAnalysis from './pages/MonthlyAnalysis';
import DailyArchive from './pages/DailyArchive';
import MonthlyArchive from './pages/MonthlyArchive';
import Education from './pages/Education';
import EducationArticle from './pages/EducationArticle';
import { getTodayData, syncData } from './services/api';
import './styles.css';

function App() {
  const [todayData, setTodayData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loaderShow, setLoaderShow] = useState(false);
  const [loaderText, setLoaderText] = useState('Loading daily metrics...');
  const [toasts, setToasts] = useState([]);

  // Toast Helpers
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Loader Helpers
  const showLoader = (text) => {
    setLoaderText(text);
    setLoaderShow(true);
  };

  const hideLoader = () => {
    setLoaderShow(false);
  };

  // Load Today's Data
  const loadTodayData = async () => {
    try {
      const result = await getTodayData();
      if (result.status === 'success') {
        setTodayData(result);
      } else {
        showToast(result.message || "Failed to load dashboard data.", 'info');
      }
    } catch (err) {
      console.error("Error loading today data:", err);
      showToast("No active data loaded. Click 'Sync Today's Data' to get started.", "info");
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  // Sync latest market data
  const handleSync = async () => {
    setIsSyncing(true);
    showLoader("Syncing latest global market data...");
    try {
      const result = await syncData();
      if (result.status === 'success') {
        showToast("Market data synced successfully!", "success");
        await loadTodayData();
      } else {
        showToast(result.message || "Sync failed.", "error");
      }
    } catch (err) {
      console.error("Error syncing data:", err);
      showToast("Sync failed. Check network or server status.", "error");
    } finally {
      setIsSyncing(false);
      hideLoader();
    }
  };

  const commonProps = {
    showLoader,
    hideLoader,
    showToast,
    todayData
  };

  return (
    <div className="app-container">
      <Navbar onSync={handleSync} isSyncing={isSyncing} />
      <Loader show={loaderShow} text={loaderText} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main style={{ marginTop: '24px' }}>
        <Routes>
          <Route path="/" element={<Dashboard todayData={todayData} />} />
          <Route path="/daily" element={<DailyAnalysis {...commonProps} />} />
          <Route path="/monthly" element={<MonthlyAnalysis {...commonProps} />} />
          <Route path="/archive/daily" element={<DailyArchive {...commonProps} />} />
          <Route path="/archive/monthly" element={<MonthlyArchive {...commonProps} />} />
          <Route path="/education" element={<Education />} />
          <Route path="/education/markets-explained" element={<EducationArticle {...commonProps} />} />
          <Route path="/education/invest-globally" element={<EducationArticle {...commonProps} />} />
          <Route path="/education/macro-events" element={<EducationArticle {...commonProps} />} />
          <Route path="/education/hedging-diversification" element={<EducationArticle {...commonProps} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
