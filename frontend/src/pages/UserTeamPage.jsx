import React from 'react';
import TeamDashboard from '../components/TeamDashboard';
import DashboardCountdownWidget from '../components/DashboardCountdownWidget.jsx';
import './Pages.css';

/**
 * User Team Page Component
 * This page handles the legacy route for viewing a specific team by ID
 */
const UserTeamPage = () => {
  // Function to handle refreshing data when deadline passes
  const handleDeadlinePassed = () => {
    console.log("User team deadline passed - refreshing team data");
  };

  return (
    <div className="page-container">
      <DashboardCountdownWidget onDeadlinePassed={handleDeadlinePassed} />
      <TeamDashboard />
    </div>
  );
};

export default UserTeamPage; 