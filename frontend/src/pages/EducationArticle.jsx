import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getEducationContent } from '../services/api';
import { markdownToHtml } from '../services/utils';

const EducationArticle = ({ showLoader, hideLoader, showToast }) => {
  const location = useLocation();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  // Map subpaths to keys in API response
  const routeMap = {
    '/education/markets-explained': { key: 'markets_explained', title: 'Markets Explained' },
    '/education/invest-globally': { key: 'invest_globally', title: 'How Indians Invest Globally' },
    '/education/macro-events': { key: 'macro_guide', title: 'Macro Events Guide' },
    '/education/hedging-diversification': { key: 'hedging_guide', title: 'Hedging & Diversification' },
  };

  useEffect(() => {
    const fetchArticle = async () => {
      const config = routeMap[location.pathname];
      if (!config) return;

      setTitle(config.title);
      showLoader(`Loading ${config.title} guide...`);

      try {
        const result = await getEducationContent();
        if (result.status === 'success' && result.content) {
          const mdText = result.content[config.key];
          setContent(markdownToHtml(mdText));
        } else {
          showToast("Failed to fetch educational articles", "error");
        }
      } catch (err) {
        console.error("Error fetching guide:", err);
        showToast("Network error fetching guides", "error");
      } finally {
        hideLoader();
      }
    };

    fetchArticle();
  }, [location.pathname]);

  return (
    <div>
      <Link 
        to="/education" 
        className="overview-banner-btn" 
        style={{ marginBottom: '24px', display: 'inline-block' }}
      >
        ← Back to Education Hub
      </Link>
      
      <div className="glass-card ai-report-container">
        <div 
          className="ai-report-content" 
          id="educationContentArea"
          dangerouslySetInnerHTML={{ __html: content || `<p className="color-text-secondary">Loading ${title} guide...</p>` }}
        />
      </div>
    </div>
  );
};

export default EducationArticle;
