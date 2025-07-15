import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import axios from 'axios';
import NavBar from '../components/NavBar';
import './StartPage.css';

const StartPage = () => {
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveTeamId } = useTeam(); 

  const validateTeamId = (id) => {
    return /^\d{1,10}$/.test(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamId.trim() || !validateTeamId(teamId)) {
      setError('Please enter a valid FPL Team ID (numbers only)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This call will now correctly resolve to GET http://127.0.0.1:8000/api/teams/YOUR_ID
      const response = await axios.get(`/teams/${teamId}`);
      
      if (response.status === 200) {
        saveTeamId(teamId);
        navigate(`/user/${teamId}`);
      }
    } catch (err) {
      console.error('Error validating team ID:', err);
      if (err.response && err.response.status === 404) {
        setError(`Team ID ${teamId} could not be found. Please check and try again.`);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-page">
      <NavBar />
      <div className="start-container">
        <h1 className="start-title">
          <span className="title-highlight">FPL</span> Assistant
        </h1>
        <p className="start-subtitle">Enter your FPL Team ID to get personalized insights</p>

        <form onSubmit={handleSubmit} className="team-id-form">
          <div className="input-container">
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Your FPL Team ID"
              className="team-input"
              inputMode="numeric"
            />
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="help-text">
            <p>Your FPL ID can be found in the URL when you visit your team page:</p>
            <p className="example-url">
              https://fantasy.premierleague.com/entry/<span className="highlight">YOUR_ID_HERE</span>/event/7
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartPage;