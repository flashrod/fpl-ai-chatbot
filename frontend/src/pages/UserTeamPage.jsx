import React from 'react';
import TeamDashboard from '../components/TeamDashboard';
import './Pages.css';

/**
 * User Team Page Component
 * This page handles the legacy route for viewing a specific team by ID
 */
const UserTeamPage = () => {
  return (
    <div className="page-container">
      <TeamDashboard />
    </div>
  );
};

export default UserTeamPage; 