import React from 'react';
import ChipCalculator from '../components/ChipCalculator';
import './Pages.css';

/**
 * Chips Page Component
 * This page contains the chip calculator functionality for FPL chip strategy
 */
const ChipsPage = () => {
  return (
    <div className="page-container">
      <ChipCalculator />
    </div>
  );
};

export default ChipsPage; 