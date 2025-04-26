import React from 'react';
import ChipCalculator from '../components/ChipCalculator';
import DashboardCountdownWidget from '../components/DashboardCountdownWidget.jsx';
import './Pages.css';

/**
 * Chips Page Component
 * This page contains the chip calculator functionality for FPL chip strategy
 */
const ChipsPage = () => {
  // Function to handle refreshing data when deadline passes
  const handleDeadlinePassed = () => {
    console.log("Chips deadline passed - refreshing chips data");
  };

  return (
    <div className="page-container">
      <DashboardCountdownWidget onDeadlinePassed={handleDeadlinePassed} />
      <ChipCalculator />
    </div>
  );
};

export default ChipsPage; 