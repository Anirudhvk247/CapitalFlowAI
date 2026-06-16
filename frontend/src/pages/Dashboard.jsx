import React from 'react';
import { Link } from 'react-router-dom';
import TickerGrid from '../components/TickerGrid';
import { formatTickerValue } from '../services/utils';
import MarketChart from '../components/MarketChart';

const Dashboard = ({ todayData }) => {
  if (!todayData) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="color-text-secondary">No active data loaded. Click "Sync Today's Data" above to get started.</p>
      </div>
    );
  }

  const { fii_dii_flow, market_data, charts, daily_report } = todayData;

  const fii = fii_dii_flow?.fii_netflow || 0;
  const dii = fii_dii_flow?.dii_netflow || 0;
  const total = fii_dii_flow?.total_netflow || 0;

  // Extract summary text
  let summaryText = "No summary available.";
  if (daily_report) {
    const execSummaryIdx = daily_report.indexOf("## Executive Summary");
    if (execSummaryIdx !== -1) {
      const nextSectionIdx = daily_report.indexOf("##", execSummaryIdx + 20);
      if (nextSectionIdx !== -1) {
        summaryText = daily_report.substring(execSummaryIdx + 20, nextSectionIdx).trim();
      } else {
        summaryText = daily_report.substring(execSummaryIdx + 20).trim();
      }
    } else {
      // Take first paragraph
      const cleanLines = daily_report.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
      summaryText = cleanLines.length > 0 ? cleanLines[0] : daily_report;
    }
    summaryText = summaryText.replace(/[\*\#\-]/g, '');
  }

  const displayTickers = ["NIFTY 50", "Nifty 50", "S&P 500", "NASDAQ", "Gold", "Bitcoin", "Brent Crude", "Brent Crude Oil", "USD/INR", "VIX"];

  return (
    <div className="dashboard-grid">
      {/* Banner/Overview */}
      <div className="col-8 glass-card overview-banner">
        <h2 className="overview-banner-title">Global Macro Intelligence</h2>
        <p className="overview-banner-subtitle">
          Tracking real-time asset pricing, international currencies, volatility metrics, and domestic FII/DII cash flows.
        </p>
        <Link to="/education" className="overview-banner-btn">Learn How to Invest Globally</Link>
      </div>

      {/* Today's Flow Card */}
      <div className="col-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <h2>Institutional Net Flows</h2>
        <div className="stats-grid" style={{ margin: '16px 0' }}>
          <div className="stat-box">
            <div className="stat-label">FII Cash</div>
            <div className={`stat-value ${fii >= 0 ? 'up' : 'down'}`}>
              {formatTickerValue("FII Net Flow", fii)}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">DII Cash</div>
            <div className={`stat-value ${dii >= 0 ? 'up' : 'down'}`}>
              {formatTickerValue("DII Net Flow", dii)}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Total Net</div>
            <div className={`stat-value ${total >= 0 ? 'up' : 'down'}`}>
              {formatTickerValue("Total Net Flow", total)}
            </div>
          </div>
        </div>
        <p className="color-text-secondary" style={{ fontSize: '11px', textAlign: 'center' }}>
          {fii_dii_flow?.date ? `Institutional Activity Date: ${fii_dii_flow.date}` : 'As of today'}
        </p>
      </div>

      {/* Global Tickers Section */}
      <div className="col-12 glass-card">
        <h2>Global Market Dash</h2>
        <TickerGrid marketData={market_data} displayTickers={displayTickers} />
      </div>

      {/* Charts & Today's Summary */}
      <div className="col-8 glass-card">
        <h2>Nifty 50 vs S&P 500 (7-Day Performance)</h2>
        {charts?.index_trend ? (
          <MarketChart canvasId="indexTrendChart" config={charts.index_trend} type="line" />
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="color-text-secondary">Chart data not available.</p>
          </div>
        )}
      </div>

      <div className="col-4 glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Today's Executive Summary</h2>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px' }}>
          <p className="color-text-secondary" style={{ fontStyle: 'italic', lineHeight: '1.8', fontSize: '14px' }}>
            {summaryText}
          </p>
        </div>
        <Link to="/daily" className="overview-banner-btn" style={{ marginTop: '20px', textAlign: 'center', width: '100%', display: 'block' }}>
          Read Full Daily AI Report
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
