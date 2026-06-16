import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatTickerValue } from '../services/utils';

const MarketChart = ({ canvasId, config, type = 'bar', isSparkline = false }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!config || !canvasRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    // Premium theme options
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: canvasId !== 'equitiesChart' && canvasId !== 'commoditiesChart' && canvasId !== 'othersChart',
          labels: {
            color: '#9ca3af',
            font: { family: 'Plus Jakarta Sans', size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 25, 40, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { family: 'Outfit', weight: 'bold' },
          bodyFont: { family: 'Plus Jakarta Sans' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                const dsLabel = context.dataset.label || '';
                if (dsLabel.includes('% Change')) {
                  label += (context.parsed.y >= 0 ? '+' : '') + context.parsed.y.toFixed(2) + '%';
                } else {
                  label += formatTickerValue(dsLabel || canvasId, context.parsed.y);
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    };

    // Override options for sparkline rendering
    if (isSparkline) {
      options.plugins.legend = { display: false };
      options.plugins.tooltip = {
        backgroundColor: 'rgba(17, 25, 40, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
        titleFont: { family: 'Outfit', size: 10 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 10 },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatTickerValue(context.dataset.label, context.parsed.y)}`;
          }
        }
      };
      options.scales = {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { family: 'Plus Jakarta Sans', size: 8 },
            maxTicksLimit: 3
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.02)' },
          ticks: {
            color: '#6b7280',
            font: { family: 'Plus Jakarta Sans', size: 8 },
            maxTicksLimit: 3
          }
        }
      };
    }

    // Handle dual scale axes for trends
    if (canvasId === 'indexTrendChart') {
      options.scales = {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        yNifty: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#10b981', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'NIFTY 50', color: '#10b981', font: { family: 'Outfit', weight: 'bold' } }
        },
        ySpx: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#6366f1', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'S&P 500', color: '#6366f1', font: { family: 'Outfit', weight: 'bold' } }
        }
      };
    }

    if (canvasId === 'monthlyAssetsChart') {
      options.scales = {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        yNifty: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#10b981', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'NIFTY 50', color: '#10b981' }
        },
        ySpx: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#6366f1', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'S&P 500', color: '#6366f1' }
        },
        yGold: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#fbbf24', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'Gold', color: '#fbbf24' }
        },
        yBtc: {
          type: 'linear',
          position: 'left',
          grid: { drawOnChartArea: false },
          ticks: { color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 10 } },
          title: { display: true, text: 'Bitcoin', color: '#ef4444' }
        }
      };
    }

    const datasets = config.datasets || [];

    chartInstanceRef.current = new Chart(ctx, {
      type: type,
      data: {
        labels: config.labels,
        datasets: datasets
      },
      options: options
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [config, canvasId, type]);

  return (
    <div className="chart-container" style={{ position: 'relative', width: '100%', height: '300px' }}>
      <canvas id={canvasId} ref={canvasRef} />
    </div>
  );
};

export default MarketChart;
