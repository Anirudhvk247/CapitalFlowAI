import React, { useState, useEffect } from 'react';
import { getMonthlyArchive } from '../services/api';
import { markdownToHtml } from '../services/utils';
import MarketChart from '../components/MarketChart';

const MonthlyAnalysis = ({ showLoader, hideLoader, showToast }) => {
  const [data, setData] = useState(null);
  const [errorText, setErrorText] = useState(null);

  const loadData = async () => {
    showLoader("Analyzing monthly macro data...");
    setErrorText(null);
    try {
      const now = new Date();
      const month = now.getMonth() + 1; // 1-indexed
      const year = now.getFullYear();

      const result = await getMonthlyArchive(month, year);
      if (result.status === 'success') {
        setData(result);
      } else {
        setErrorText(result.message || "Failed to load monthly analysis.");
      }
    } catch (err) {
      console.error("Error loading monthly analysis:", err);
      setErrorText("Could not retrieve monthly analysis. Ensure that database runs have occurred during the selected month.");
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>
        Monthly Macro Review: <span style={{ color: '#6366f1' }}>{monthName} {year}</span>
      </h1>

      <div className="dashboard-grid">
        {/* Asset price trends line chart */}
        <div className="col-12 glass-card">
          <h2>Key Global Assets Trend (Normalized Multi-axis)</h2>
          {data?.charts?.assets ? (
            <div className="chart-container" style={{ height: '380px' }}>
              <MarketChart canvasId="monthlyAssetsChart" config={data.charts.assets} type="line" />
            </div>
          ) : (
            <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="color-text-secondary">Asset chart data not available.</p>
            </div>
          )}
        </div>

        {/* FII/DII flow trends line chart */}
        <div className="col-12 glass-card">
          <h2>Institutional Net Flows Trend (Cr)</h2>
          {data?.charts?.flows ? (
            <div className="chart-container" style={{ height: '320px' }}>
              <MarketChart canvasId="monthlyFlowsChart" config={data.charts.flows} type="line" />
            </div>
          ) : (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="color-text-secondary">Flow chart data not available.</p>
            </div>
          )}
        </div>

        {/* Monthly AI report */}
        <div className="col-12 glass-card ai-report-container">
          <h2><span style={{ fontSize: '22px' }}>✦</span> AI Monthly Macro Research Report</h2>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '16px 0' }} />
          {errorText ? (
            <p className="color-text-secondary" style={{ fontStyle: 'italic' }}>
              {errorText}
            </p>
          ) : data?.monthly_report ? (
            <div 
              className="ai-report-content" 
              dangerouslySetInnerHTML={{ __html: markdownToHtml(data.monthly_report) }}
            />
          ) : (
            <p className="color-text-secondary">Loading Monthly Macro Report...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
