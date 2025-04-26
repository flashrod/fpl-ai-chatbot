import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaSpinner, FaSearchPlus, FaArrowLeft, FaUser, FaTrophy, FaCoins, FaFootballBall } from 'react-icons/fa';
import TeamLineup from './TeamLineup';
import RankChart from './RankChart';
import ChipsStatus from './ChipsStatus';
import LoadingAnimation from './LoadingAnimation';
import { useTeam } from '../context/TeamContext';
import './TeamDashboard.css';
import LoadingSpinner from './LoadingSpinner';

const TeamDashboard = () => {
  // Get teamId from URL params or context
  const { teamId: paramTeamId } = useParams();
  const { teamId: contextTeamId, updateTeamData, saveTeamId } = useTeam();
  
  // Determine which teamId to use
  const teamId = paramTeamId || contextTeamId;
  
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTeamId, setSearchTeamId] = useState('');
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch data if we have a teamId and haven't already fetched for this render cycle
    if (teamId && !dataFetchedRef.current) {
      const fetchTeamData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Save the teamId in the context for future use
          saveTeamId(teamId);
          
          console.log(`Fetching team data for ID: ${teamId}`);
          const response = await axios.get(`/api/teams/${teamId}`);
          
          console.log('API Response:', response.data);
          
          if (response.data) {
            // Update both the context and local state
            updateTeamData(response.data);
            setTeamData(response.data);
            dataFetchedRef.current = true;  // Mark that we've fetched the data
          } else {
            console.error('No data received from API');
            setError('No data received from the server. Please try again.');
          }
        } catch (err) {
          console.error('Error fetching team data:', err);
          
          // More detailed error message
          const errorMessage = err.response 
            ? `Server error: ${err.response.status} ${err.response.statusText}`
            : 'Network error: Could not connect to the server.';
          
          setError(`Failed to load team data. ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      };

      fetchTeamData();
    }

    // Reset the ref when teamId changes
    return () => {
      dataFetchedRef.current = false;
    };
  }, [teamId, saveTeamId, updateTeamData]); // Include all dependencies

  const handleSearchTeam = (e) => {
    e.preventDefault();
    if (searchTeamId && !isNaN(searchTeamId)) {
      navigate(`/user/${searchTeamId}`);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="team-dashboard-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-dashboard-container">
        <div className="team-dashboard-error">
          <h3>Error Loading Team Data</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleGoBack} className="back-button">
              <FaArrowLeft /> Go Back
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="team-dashboard-container">
        <div className="team-dashboard-loading">
          <h3>No Team Data Available</h3>
          <p>Please enter your team ID to view your FPL dashboard.</p>
          
          <form onSubmit={handleSearchTeam} className="team-search-form">
            <input
              type="text"
              value={searchTeamId}
              onChange={(e) => setSearchTeamId(e.target.value.trim())}
              placeholder="Enter FPL Team ID..."
              className="team-search-input"
            />
            <button type="submit" className="team-search-button">
              View Team
            </button>
          </form>
          
          <p className="team-search-help">
            Your FPL ID can be found in the URL when you visit your team page:<br />
            <span className="example-url">https://fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/1</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-dashboard-container">
      <div className="team-dashboard-header">
        <h2>{teamData.name}</h2>
        <p className="team-manager">Manager: {teamData.player_name}</p>
      </div>

      <div className="team-stats-container">
        <div className="team-stat">
          <h3>Overall Rank</h3>
          <p>{teamData.overall_rank.toLocaleString()}</p>
        </div>
        <div className="team-stat">
          <h3>Gameweek</h3>
          <p>{teamData.gameweek}</p>
        </div>
        <div className="team-stat">
          <h3>Gameweek Points</h3>
          <p>{teamData.gameweek_points}</p>
        </div>
        <div className="team-stat">
          <h3>Total Points</h3>
          <p>{teamData.total_points}</p>
        </div>
      </div>

      <div className="team-value-container">
        <div className="team-value">
          <h3>Team Value</h3>
          <p>£{teamData.value.toFixed(1)}m</p>
        </div>
        <div className="team-value">
          <h3>In The Bank</h3>
          <p>£{teamData.bank.toFixed(1)}m</p>
        </div>
      </div>

      {/* Chips Status Section */}
      {teamData.chips && (
        <div className="team-chips-container">
          <h3>Available Chips</h3>
          <div className="chips-list">
            {teamData.chips.status && teamData.chips.status
              .filter(chip => chip.available)
              .map((chip, index) => (
                <div key={index} className="chip-item">
                  {formatChipName(chip.name)}
                </div>
              ))}
          </div>
          
          {/* Detailed Chips Status Component */}
          <div className="chips-status-wrapper">
            <ChipsStatus chips={teamData.chips} />
          </div>
        </div>
      )}

      {/* Team Lineup Section */}
      {teamData.lineup && teamData.lineup.length > 0 && (
        <div className="team-lineup-wrapper">
          <h3>Team Lineup</h3>
          <TeamLineup lineup={teamData.lineup} />
        </div>
      )}

      {/* Rank History Chart Section */}
      {teamData.rank_history && teamData.rank_history.length > 0 && (
        <div className="rank-history-wrapper">
          <h3>Rank History</h3>
          <RankChart history={teamData.rank_history} />
        </div>
      )}

      {/* Captain Information */}
      <div className="captain-section">
        <h3>Captain Selection</h3>
        <div className="captain-info">
          {renderCaptain(teamData.lineup)}
        </div>
      </div>

      {/* Current Event Information */}
      {teamData.current_event && (
        <div className="current-event-info">
          <h3>Current Gameweek Information</h3>
          <div className="event-details">
            <p><strong>Gameweek:</strong> {teamData.current_event.name}</p>
            <p><strong>Status:</strong> {getEventStatus(teamData.current_event)}</p>
            <p><strong>Average Points:</strong> {teamData.current_event.average_points}</p>
            <p><strong>Deadline:</strong> {formatDeadline(teamData.current_event.deadline)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatRank = (rank) => {
  if (!rank) return 'N/A';
  
  // Format with commas for thousands (e.g., 1,234,567)
  return rank.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatChipName = (name) => {
  const chipNames = {
    'wildcard': 'Wildcard',
    'wildcard2': 'Second Wildcard',
    'freehit': 'Free Hit',
    'bboost': 'Bench Boost',
    '3xc': 'Triple Captain'
  };
  
  return chipNames[name] || name;
};

const renderCaptain = (lineup) => {
  if (!lineup || !Array.isArray(lineup) || lineup.length === 0) {
    return <p>No captain data</p>;
  }
  
  const captain = lineup.find(player => player.is_captain);
  const viceCaptain = lineup.find(player => player.is_vice_captain);
  
  if (!captain) return <p>No captain selected</p>;
  
  return (
    <>
      <p className="stat-value">{captain.name || 'Unknown'}</p>
      <p className="stat-subtitle">VC: {viceCaptain?.name || 'None'}</p>
    </>
  );
};

const getEventStatus = (event) => {
  if (!event) return 'Unknown';
  
  if (event.finished) return 'Finished';
  if (event.is_current) return 'In Progress';
  if (event.is_next) return 'Upcoming';
  return 'Scheduled';
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'Not available';
  
  try {
    const date = new Date(deadline);
    return date.toLocaleString();
  } catch (e) {
    return deadline;
  }
};

export default TeamDashboard; 