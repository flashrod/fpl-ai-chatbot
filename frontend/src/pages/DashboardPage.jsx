import React from 'react';
import TeamDashboard from '../components/TeamDashboard';
import DashboardCountdownWidget from '../components/DashboardCountdownWidget';
import './Pages.css';

/**
 * Dashboard Page Component
 * This is the main dashboard page of the application
 */
const DashboardPage = () => {
  // Function to handle refreshing data when deadline passes
  const handleDeadlinePassed = () => {
    console.log("Dashboard deadline passed - refreshing dashboard data");
  };

  return (
    <div className="page-container">
      <DashboardCountdownWidget onDeadlinePassed={handleDeadlinePassed} />
      <TeamDashboard />
    </div>
  );
};

export default DashboardPage; 