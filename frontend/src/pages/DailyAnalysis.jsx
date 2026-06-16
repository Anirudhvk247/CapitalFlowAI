import React, { useState, useEffect } from 'react';
import { getTodayData } from '../services/api';
import { formatTickerValue, markdownToHtml } from '../services/utils';
import MarketChart from '../components/MarketChart';

const DailyAnalysis = ({ showLoader, hideLoader, showToast }) => {
  const [timeframe, setTimeframe] = useState('30');
  const [data, setData] = useState(null);

  const loadData = async (daysVal) => {
    showLoader("Loading daily macro timelines...");
    try {
      const result = await getTodayData(daysVal);
      if (result.status === 'success') {
        setData(result);
      } else {
        showToast(result.message || "Failed to load data.", 'info');
      }
    } catch (err) {
      console.error("Error loading daily analysis:", err);
      showToast("Failed to load daily timelines. Click sync.", "error");
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe]);

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  if (!data) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="color-text-secondary">Loading daily analysis...</p>
      </div>
    );
  }

  const { date, history_timeline, market_data, fii_dii_flow, daily_report } = data;

  // Sort keys: Equities first, then Commodities, Cryptos, Currencies, and Flows last
  const sortedKeys = history_timeline?.assets 
    ? Object.keys(history_timeline.assets).sort((a, b) => {
        const aIsFlow = a.includes("Flow");
        const bIsFlow = b.includes("Flow");
        if (aIsFlow && !bIsFlow) return 1;
        if (!aIsFlow && bIsFlow) return -1;
        return a.localeCompare(b);
      })
    : [];

  let timeframeName = "Last Month";
  if (timeframe === "7") timeframeName = "Last 1 Week";
  else if (timeframe === "30") timeframeName = "Last 1 Month";
  else if (timeframe === "180") timeframeName = "Last 6 Months";
  else if (timeframe === "365") timeframeName = "Last 1 Year";

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>
        Daily Market Analysis: <span style={{ color: '#6366f1' }}>{date}</span>
      </h1>

      {/* Selector Controls Bar */}
      <div className="controls-bar" style={{ marginBottom: '24px' }}>
        <div className="selector-group">
          <span className="selector-label">Choose Timeline Timeframe:</span>
          <select 
            value={timeframe} 
            onChange={handleTimeframeChange} 
            className="custom-select"
          >
            <option value="7">1 Week</option>
            <option value="30">1 Month</option>
            <option value="180">6 Months</option>
            <option value="365">1 Year</option>
          </select>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
        Asset Performance & Timeline Trends ({timeframeName})
      </h2>

      <div className="dashboard-grid">
        {sortedKeys.map((name, idx) => {
          const history = history_timeline.assets[name];
          if (!history || history.length === 0) return null;

          let latestVal = history[history.length - 1];
          let pctChange = 0.0;
          let status = "OPEN";

          if (name.includes("Flow")) {
            if (name === "FII Net Flow") {
              latestVal = fii_dii_flow ? fii_dii_flow.fii_netflow : latestVal;
            } else if (name === "DII Net Flow") {
              latestVal = fii_dii_flow ? fii_dii_flow.dii_netflow : latestVal;
            } else if (name === "Total Net Flow") {
              latestVal = fii_dii_flow ? fii_dii_flow.total_netflow : latestVal;
            }
            status = "CLOSED";
          } else {
            const mItem = market_data.find(item => item.index_name === name);
            if (mItem) {
              pctChange = mItem.percent_change;
              latestVal = mItem.price;
              status = mItem.status;
            }
          }

          const isUp = name.includes("Flow") ? (latestVal >= 0) : (pctChange >= 0);
          const formattedVal = formatTickerValue(name, latestVal);
          const formattedChange = name.includes("Flow") ? "" : `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`;

          const canvasId = `daily_canvas_${idx}`;

          // Formulate sparkline configuration
          const sparklineConfig = {
            labels: history_timeline.dates,
            datasets: [{
              label: name,
              data: history,
              borderColor: isUp ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)',
              borderWidth: 2,
              backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 100);
                gradient.addColorStop(0, isUp ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                return gradient;
              },
              fill: true,
              tension: 0.15,
              pointRadius: 0,
              pointHoverRadius: 4
            }]
          };

          return (
            <div 
              key={name} 
              className="col-4 glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="ticker-name" style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }} title={name}>{name}</span>
                <span className={`ticker-status ${status.toLowerCase()}`}>{status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', color: '#f3f4f6' }}>{formattedVal}</span>
                <span className={`ticker-change ${isUp ? 'up' : 'down'}`} style={{ fontSize: '13px', fontWeight: '700' }}>{formattedChange}</span>
              </div>
              <div className="chart-container" style={{ height: '110px' }}>
                <MarketChart canvasId={canvasId} config={sparklineConfig} type="line" isSparkline={true} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        {/* Daily AI Intelligence Report */}
        <div className="col-12 glass-card ai-report-container">
          <h2><span style={{ fontSize: '22px' }}>✦</span> AI Daily Market Intelligence Report</h2>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '16px 0' }} />
          <div 
            className="ai-report-content" 
            dangerouslySetInnerHTML={{ __html: markdownToHtml(daily_report) }}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyAnalysis;
