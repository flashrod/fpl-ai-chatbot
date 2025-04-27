import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-rings">
          <div className="spinner-ring outer"></div>
          <div className="spinner-ring middle"></div>
          <div className="spinner-ring inner"></div>
        </div>
        <motion.p 
          className="spinner-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Loading data...
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 