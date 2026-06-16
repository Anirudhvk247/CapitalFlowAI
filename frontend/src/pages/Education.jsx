import React from 'react';
import { Link } from 'react-router-dom';

const Education = () => {
  const guides = [
    {
      emoji: '📈',
      title: 'Markets Explained',
      desc: 'Understand all 21 key financial indices, commodities, currencies, cryptos, and institutional flows tracked by CapitalFlowAI.',
      link: '/education/markets-explained',
      btnText: 'Explore Tickers Guide'
    },
    {
      emoji: '🌍',
      title: 'How Indians Invest Globally',
      desc: 'Explore direct LRS routes, domestic international ETFs, tax structures, and fintech platforms like INDmoney.',
      link: '/education/invest-globally',
      btnText: 'Explore Investing Guide'
    },
    {
      emoji: '🏛️',
      title: 'Macro Events Guide',
      desc: 'See how central bank interest rates, inflation data, GDP, and elections impact stock valuations and capital flows.',
      link: '/education/macro-events',
      btnText: 'Explore Macro Guide'
    },
    {
      emoji: '🛡️',
      title: 'Hedging & Diversification',
      desc: 'Master portfolio diversification ratios and risk mitigation using hedges like Gold during macroeconomic crises.',
      link: '/education/hedging-diversification',
      btnText: 'Explore Risk Guide'
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '12px' }}>Investor Education Hub</h1>
      <p className="color-text-secondary" style={{ marginBottom: '32px', fontSize: '15px', maxWidth: '600px' }}>
        Learn how global capital behaves, identify key macroeconomic triggers, and discover how to construct international portfolios.
      </p>

      <div className="dashboard-grid">
        {guides.map((guide, idx) => (
          <div 
            key={idx} 
            className="col-6 glass-card" 
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>{guide.emoji}</span>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{guide.title}</h2>
              <p className="color-text-secondary" style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                {guide.desc}
              </p>
            </div>
            <Link to={guide.link} className="overview-banner-btn" style={{ textAlign: 'center', width: '100%', display: 'block' }}>
              {guide.btnText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Education;
