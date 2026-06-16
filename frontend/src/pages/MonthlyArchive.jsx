import React, { useState, useEffect, useRef } from 'react';
import { getMonthlyArchive, getMetaDates } from '../services/api';
import { markdownToHtml } from '../services/utils';
import MarketChart from '../components/MarketChart';
import flatpickr from 'flatpickr';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/plugins/monthSelect/style.css';
import 'flatpickr/dist/themes/dark.css';

const MonthlyArchive = ({ showLoader, hideLoader, showToast }) => {
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [archiveData, setArchiveData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorText, setErrorText] = useState(null);

  const monthPickerRef = useRef(null);
  const fpRef = useRef(null);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const result = await getMetaDates();
        if (result.status === 'success' && result.months) {
          setAvailableMonths(result.months);
          if (result.months.length > 0) {
            const first = result.months[0];
            setSelectedMonthYear(`${first.year}-${String(first.month).padStart(2, '0')}`);
          }
        }
      } catch (err) {
        console.error("Error fetching meta months:", err);
      }
    };
    fetchMonths();
  }, []);

  // Initialize flatpickr with monthSelectPlugin
  useEffect(() => {
    if (monthPickerRef.current) {
      if (fpRef.current) {
        fpRef.current.destroy();
      }

      const enabledDates = availableMonths.map(m => new Date(m.year, m.month - 1, 1));

      fpRef.current = flatpickr(monthPickerRef.current, {
        plugins: [
          new monthSelectPlugin({
            shorthand: true,
            dateFormat: "Y-m",
            altFormat: "F Y",
            theme: "dark"
          })
        ],
        defaultDate: selectedMonthYear,
        enable: enabledDates.length > 0 ? enabledDates : undefined,
        onChange: (selectedDates, dateStr) => {
          setSelectedMonthYear(dateStr);
        }
      });
    }

    return () => {
      if (fpRef.current) {
        fpRef.current.destroy();
        fpRef.current = null;
      }
    };
  }, [availableMonths]);

  // Keep flatpickr instance in sync with selectedMonthYear state
  useEffect(() => {
    if (fpRef.current && selectedMonthYear) {
      fpRef.current.setDate(selectedMonthYear, false);
    }
  }, [selectedMonthYear]);

  const handleFetchReport = async () => {
    if (!selectedMonthYear) {
      showToast("Please select a valid month.", "error");
      return;
    }

    const parts = selectedMonthYear.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    showLoader(`Retrieving monthly review for ${monthName} ${year}...`);
    setErrorText(null);

    try {
      const result = await getMonthlyArchive(month, year);
      if (result.status === 'success') {
        setArchiveData({
          ...result,
          monthName,
          year
        });
        setSearched(true);
        showToast(`Loaded review for ${monthName} ${year}`, 'success');
      } else {
        showToast(result.message || "Failed to retrieve archive.", 'error');
        setErrorText(result.message);
      }
    } catch (err) {
      console.error("Error fetching monthly archive:", err);
      showToast("Failed loading monthly archive.", "error");
      setErrorText("Failed loading monthly archive. Ensure data was stored during this month.");
    } finally {
      hideLoader();
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>Monthly Historical Report</h1>
      <p className="color-text-secondary" style={{ fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
        💡 <strong>Guidance</strong>: Choose a particular month and year from the selector below to retrieve that month's aggregated trends. Clicking "Fetch Monthly Report" will load monthly asset fluctuations and the stored Monthly AI Research report directly from SQL (no external APIs are called or wasted).
      </p>

      {/* Selector Controls Bar */}
      <div className="controls-bar">
        <div className="selector-group">
          <span className="selector-label">Choose Target Month:</span>
          <input 
            type="text" 
            ref={monthPickerRef} 
            className="custom-date-input"
            placeholder="Select Month..."
            readOnly
          />
        </div>
        <button 
          className="sync-btn" 
          onClick={handleFetchReport}
          style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: 'none' }}
        >
          Fetch Monthly Report
        </button>
      </div>

      {/* Dashboard display for picked date */}
      {searched && archiveData ? (
        <div style={{ marginTop: '32px' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '24px' }}>
            Market Analysis for <span style={{ color: '#6366f1' }}>{archiveData.monthName} {archiveData.year}</span>
          </h1>
          
          <div className="dashboard-grid">
            {/* Key asset trends line chart */}
            <div className="col-12 glass-card">
              <h2>Key Global Assets Trend (Normalized Multi-axis)</h2>
              {archiveData.charts?.assets ? (
                <div className="chart-container" style={{ height: '380px' }}>
                  <MarketChart canvasId="archiveMonthlyAssetsChart" config={archiveData.charts.assets} type="line" />
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
              {archiveData.charts?.flows ? (
                <div className="chart-container" style={{ height: '320px' }}>
                  <MarketChart canvasId="archiveMonthlyFlowsChart" config={archiveData.charts.flows} type="line" />
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
              {archiveData.monthly_report ? (
                <div 
                  className="ai-report-content" 
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(archiveData.monthly_report) }}
                />
              ) : (
                <p className="color-text-secondary" style={{ fontStyle: 'italic' }}>
                  {errorText || "No Monthly report found."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div id="noMonthlyArchivePlaceholder" className="glass-card" style={{ textAlign: 'center', padding: '48px 24px', marginTop: '24px' }}>
          <p className="color-text-secondary" style={{ fontStyle: 'italic', fontSize: '15px' }}>
            Please select a month and year from the selector above and click "Fetch Monthly Report" to load historical data.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyArchive;
