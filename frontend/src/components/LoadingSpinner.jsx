import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
        <p className="spinner-text">Loading data...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 