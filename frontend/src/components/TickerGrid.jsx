import React from 'react';

export function formatTickerValue(name, price) {
  if (price === null || price === undefined) return "--";
  
  if (name === "FII Net Flow" || name === "DII Net Flow" || name === "Total Net Flow") {
      const sign = price >= 0 ? "+₹" : "-₹";
      return `${sign}${Math.abs(price).toLocaleString()} Cr INR`;
  }
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("yield") || lowerName === "vix" || lowerName.includes("bond")) {
      return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}%`;
  }
  
  if (lowerName.includes("dollar index") || lowerName === "dxy") {
      return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Pts`;
  }
  
  if (lowerName.includes("nifty") || lowerName === "usd/inr") {
      return `₹${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} INR`;
  }
  
  if (lowerName.includes("s&p 500") || lowerName.includes("nasdaq") || lowerName === "gold" || lowerName === "silver" || lowerName === "copper" || lowerName.includes("brent") || lowerName === "bitcoin" || lowerName === "ethereum") {
      return `$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} USD`;
  }
  
  if (lowerName.includes("ftse")) {
      return `£${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} GBP`;
  }
  if (lowerName.includes("cac 40") || lowerName.includes("stoxx")) {
      return `€${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} EUR`;
  }
  
  if (lowerName.includes("nikkei")) {
      return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} JPY`;
  }
  
  if (lowerName.includes("shanghai") || lowerName.includes("china")) {
      return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} CNY`;
  }
  
  if (lowerName.includes("taiex") || lowerName.includes("taiwan")) {
      return `NT$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} TWD`;
  }
  
  return price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2});
}

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
