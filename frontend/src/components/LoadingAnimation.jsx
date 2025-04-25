import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ size = 40 }) => {
  return (
    <div className="loading-animation-container" style={{ width: `${size}px`, height: `${size}px` }}>
      <div className="loading-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 