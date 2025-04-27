import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ size = 40 }) => {
  return (
    <div className="loading-animation-container" style={{ width: `${size}px`, height: `${size}px` }}>
      <div className="loading-animation">
        <div className="loading-dot primary"></div>
        <div className="loading-dot secondary"></div>
        <div className="loading-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 