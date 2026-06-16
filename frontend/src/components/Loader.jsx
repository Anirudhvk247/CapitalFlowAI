import React from 'react';

const Loader = ({ show, text = "Loading capital flows..." }) => {
  if (!show) return null;
  return (
    <div id="loaderOverlay" className="loader-overlay" style={{ display: 'flex' }}>
      <div className="spinner"></div>
      <div id="loaderText" className="loader-text">{text}</div>
    </div>
  );
};

export default Loader;
