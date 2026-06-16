import React from 'react';
import { formatTickerValue } from '../services/utils';

const TickerGrid = ({ marketData, displayTickers }) => {
  if (!marketData) return null;

  const filteredData = marketData.filter(item => 
    displayTickers.includes(item.index_name)
  );

  return (
    <div className="market-ticker-grid" id="marketTickerGrid">
      {filteredData.map(item => {
        const isUp = item.percent_change >= 0;
        return (
          <div key={item.index_name} className="ticker-card">
            <div className="ticker-header">
              <span className="ticker-name" title={item.index_name}>{item.index_name}</span>
              <span className={`ticker-status ${item.status.toLowerCase()}`}>{item.status}</span>
            </div>
            <div className="ticker-price">{formatTickerValue(item.index_name, item.price)}</div>
            <div className={`ticker-change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{item.percent_change.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TickerGrid;
