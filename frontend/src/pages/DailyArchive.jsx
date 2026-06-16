import React, { useState, useEffect, useRef } from 'react';
import { getDailyArchive, getMetaDates } from '../services/api';
import { formatTickerValue, markdownToHtml } from '../services/utils';
import MarketChart from '../components/MarketChart';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/themes/dark.css';

const DailyArchive = ({ showLoader, hideLoader, showToast }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [timeframe, setTimeframe] = useState('30');
  const [availableDates, setAvailableDates] = useState([]);
  const [archiveData, setArchiveData] = useState(null);
  const [searched, setSearched] = useState(false);

  const datePickerRef = useRef(null);
  const fpRef = useRef(null);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const result = await getMetaDates();
        if (result.status === 'success' && result.dates) {
          setAvailableDates(result.dates);
          // Set initial date to the latest available date
          if (result.dates.length > 0) {
            setSelectedDate(result.dates[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching meta dates:", err);
      }
    };
    fetchDates();
  }, []);

  // Initialize flatpickr when availableDates changes
  useEffect(() => {
    if (datePickerRef.current) {
      if (fpRef.current) {
        fpRef.current.destroy();
      }
      fpRef.current = flatpickr(datePickerRef.current, {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate,
        enable: availableDates.length > 0 ? availableDates : undefined,
        onChange: (selectedDates, dateStr) => {
          setSelectedDate(dateStr);
        }
      });
    }
    return () => {
      if (fpRef.current) {
        fpRef.current.destroy();
        fpRef.current = null;
      }
    };
  }, [availableDates]);

  // Keep flatpickr instance in sync with selectedDate state
  useEffect(() => {
    if (fpRef.current && selectedDate) {
      fpRef.current.setDate(selectedDate, false);
    }
  }, [selectedDate]);

  const handleFetchReport = async (isTimeframeChange = false) => {
    if (!selectedDate) {
      if (!isTimeframeChange) {
        showToast("Please select a valid date.", "error");
      }
      return;
    }

    showLoader(`Retrieving historical records for ${selectedDate}...`);
    try {
      const result = await getDailyArchive(selectedDate);
      // Note: the backend daily archive endpoint returns history_timeline if days parameter is passed,
      // but let's double check if we need to call it with target date and days:
      // In Flask: /api/data/archive/daily?date=YYYY-MM-DD
      // We can also append &days=X as the javascript code did: /api/data/archive/daily?date=${date}&days=${days}
      // Let's pass the days parameter as well by constructing url parameter or modifying api.js
      // Wait, let's look at getDailyArchive in api.js:
      // export const getDailyArchive = (date) => api.get(`/data/archive/daily?date=${date}`).then(res => res.data);
      // Let's modify it to take an optional days parameter:
      // getDailyArchive(date, days)
      const days = timeframe;
      const response = await fetch(`/api/data/archive/daily?date=${selectedDate}&days=${days}`);
      const dataResult = await response.json();

      if (dataResult.status === 'success') {
        setArchiveData(dataResult);
        setSearched(true);
        showToast(`Loaded records for ${selectedDate}`, 'success');
      } else {
        showToast(dataResult.message || "Failed to retrieve archive.", 'error');
      }
    } catch (err) {
      console.error("Error loading daily archive:", err);
      showToast("Failed loading daily archive.", "error");
    } finally {
      hideLoader();
    }
  };

  // Auto-reload data when timeframe changes if a date has already been fetched
  useEffect(() => {
    if (searched && selectedDate) {
      handleFetchReport(true);
    }
  }, [timeframe]);

  const sortedKeys = archiveData?.history_timeline?.assets 
    ? Object.keys(archiveData.history_timeline.assets).sort((a, b) => {
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
      <h1 style={{ marginBottom: '8px' }}>Daily Historical Report</h1>
      <p className="color-text-secondary" style={{ fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
        💡 <strong>Guidance</strong>: Choose a particular date from the options below to retrieve that specific day's market metrics. The platform will fetch historical prices, generate customizable timeline sparklines (up to 1 year), and load the stored AI report directly from SQL (no external APIs are called or wasted).
      </p>

      {/* Selector Controls Bar */}
      <div className="controls-bar">
        <div className="selector-group">
          <span className="selector-label">Choose Target Date:</span>
          <input 
            type="text" 
            ref={datePickerRef} 
            className="custom-date-input"
            placeholder="Select Date..."
            readOnly
          />
        </div>
        <div className="selector-group">
          <span className="selector-label">Choose Timeline Timeframe:</span>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)} 
            className="custom-select"
          >
            <option value="7">1 Week</option>
            <option value="30">1 Month</option>
            <option value="180">6 Months</option>
            <option value="365">1 Year</option>
          </select>
        </div>
        <button 
          className="sync-btn" 
          onClick={() => handleFetchReport(false)}
          style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: 'none' }}
        >
          Fetch Historical Report
        </button>
      </div>

      {/* Dashboard display for picked date */}
      {searched && archiveData ? (
        <div style={{ marginTop: '32px' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>
            Market Analysis for <span style={{ color: '#6366f1' }}>{archiveData.date}</span>
          </h1>
          
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
            Asset Performance & Timeline Trends ({timeframeName})
          </h2>

          <div className="dashboard-grid">
            {sortedKeys.map((name, idx) => {
              const history = archiveData.history_timeline.assets[name];
              if (!history || history.length === 0) return null;

              let latestVal = history[history.length - 1];
              let pctChange = 0.0;
              let status = "OPEN";

              if (name.includes("Flow")) {
                if (name === "FII Net Flow") {
                  latestVal = archiveData.fii_dii_flow ? archiveData.fii_dii_flow.fii_netflow : latestVal;
                } else if (name === "DII Net Flow") {
                  latestVal = archiveData.fii_dii_flow ? archiveData.fii_dii_flow.dii_netflow : latestVal;
                } else if (name === "Total Net Flow") {
                  latestVal = archiveData.fii_dii_flow ? archiveData.fii_dii_flow.total_netflow : latestVal;
                }
                status = "CLOSED";
              } else {
                const mItem = archiveData.market_data.find(item => item.index_name === name);
                if (mItem) {
                  pctChange = mItem.percent_change;
                  latestVal = mItem.price;
                  status = mItem.status;
                }
              }

              const isUp = name.includes("Flow") ? (latestVal >= 0) : (pctChange >= 0);
              const formattedVal = formatTickerValue(name, latestVal);
              const formattedChange = name.includes("Flow") ? "" : `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`;

              const canvasId = `archive_canvas_${idx}`;

              // Formulate sparkline configuration
              const sparklineConfig = {
                labels: archiveData.history_timeline.dates,
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
            {/* Historical AI Daily Report */}
            <div className="col-12 glass-card ai-report-container">
              <h2><span style={{ fontSize: '22px' }}>✦</span> AI Daily Market Intelligence Report</h2>
              <hr style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '16px 0' }} />
              <div 
                className="ai-report-content" 
                dangerouslySetInnerHTML={{ __html: markdownToHtml(archiveData.daily_report) }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div id="noArchivePlaceholder" className="glass-card" style={{ textAlign: 'center', padding: '48px 24px', marginTop: '24px' }}>
          <p className="color-text-secondary" style={{ fontStyle: 'italic', fontSize: '15px' }}>
            Please select a date from the selector above and click "Fetch Historical Report" to load data.
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyArchive;
