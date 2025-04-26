import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTeam } from '../context/TeamContext';
import '../components/TeamSearch.css'; // Reuse existing styles

const StartPage = () => {
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveTeamId, teamId: existingTeamId } = useTeam();

  // If user already has a team ID, redirect to dashboard
  useEffect(() => {
    if (existingTeamId) {
      navigate('/dashboard');
    }
  }, [existingTeamId, navigate]);

  const validateTeamId = (id) => {
    return /^\d{1,10}$/.test(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!teamId.trim()) {
      setError('Please enter your FPL Team ID');
      return;
    }

    if (!validateTeamId(teamId)) {
      setError('Please enter a valid FPL Team ID (numbers only)');
      return;
    }

    setLoading(true);

    try {
      // Try to fetch basic team data to validate the ID
      const response = await fetch(`/api/teams/${teamId}`);

      if (!response.ok) {
        throw new Error('Unable to verify team ID. Please check and try again.');
      }

      // Save valid team ID and redirect
      saveTeamId(teamId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error validating team ID:', error);
      setError(error.message || 'Unable to verify team ID. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-page">
      <motion.div
        className="start-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="start-title">Welcome to FPL Assistant</h1>
        <p className="start-subtitle">Enter your FPL Team ID to get personalized insights and recommendations</p>

        <form onSubmit={handleSubmit} className="team-id-form">
          <div className="input-container">
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Your FPL Team ID"
              className="team-search-input"
              inputMode="numeric"
            />

            <button
              type="submit"
              className="team-search-button"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>

          {error && <div className="team-search-error">{error}</div>}

          <div className="team-search-help">
            <p>Your FPL ID can be found in the URL when you visit your team page:</p>
            <p className="example-url">https://fantasy.premierleague.com/entry/<span className="highlight">YOUR_ID_HERE</span>/event/7</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default StartPage; 