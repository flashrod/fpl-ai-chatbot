import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import './Pages.css';

/**
 * Start Page Component
 * This is the landing page of the application
 */
const StartPage = () => {
  const navigate = useNavigate();
  const { saveTeamId } = useTeam();
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!teamId || isNaN(teamId) || teamId <= 0) {
      setError('Please enter a valid FPL Team ID');
      return;
    }

    // Save team ID and navigate to dashboard
    if (saveTeamId(teamId)) {
      navigate('/dashboard');
    } else {
      setError('Failed to save team ID');
    }
  };

  return (
    <div className="start-page-container">
      <div className="start-page-content">
        <h1 className="start-page-title">Welcome to FPL AI Assistant</h1>
        <p className="start-page-description">
          Get insights, analyze your team, and make smarter decisions for Fantasy Premier League.
        </p>
        
        <form onSubmit={handleSubmit} className="team-id-form">
          <div className="form-group">
            <label htmlFor="team-id" className="form-label">Enter your FPL Team ID:</label>
            <input
              type="number"
              id="team-id"
              className="form-input"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g., 1234567"
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          
          <div className="start-page-actions">
            <button 
              type="submit"
              className="start-page-button primary"
            >
              Get Started
            </button>
          </div>
        </form>
        
        <p className="help-text">
          To find your FPL Team ID, go to the FPL website, click on the "Points" tab. Your team ID will be in the URL.
        </p>
      </div>
    </div>
  );
};

export default StartPage; 