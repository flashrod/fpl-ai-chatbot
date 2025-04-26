import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaArrowLeft, 
  FaUser, 
  FaTrophy, 
  FaCoins, 
  FaFootballBall,
  FaChartLine,
  FaCalendarAlt,
  FaShieldAlt,
  FaCrown,
  FaHistory,
  FaInfoCircle,
  FaStar,
  FaExchangeAlt,
  FaSyncAlt,
  FaMagic
} from 'react-icons/fa';
import TeamLineup from './TeamLineup';
import RankChart from './RankChart';
import ChipsStatus from './ChipsStatus';
import LoadingSpinner from './LoadingSpinner';
import { useTeam } from '../context/TeamContext';
import './TeamDashboard.css';

// Animation variants for components
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100,
      damping: 10
    }
  }
};

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
  const [activeTab, setActiveTab] = useState('overview');
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

  const handleRefresh = () => {
    fetchTeamData();
  };

  // Loading State
  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="dashboard-loading-content"
        >
        <LoadingSpinner />
          <h3>Loading Team Data</h3>
          <p>Fetching your Fantasy Premier League data...</p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="dashboard-error-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-error-content"
        >
          <div className="error-icon">
            <FaExclamationTriangle />
          </div>
          <h3>Error Loading Team Data</h3>
          <p>{error}</p>
          <div className="error-actions">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoBack} 
              className="btn-secondary"
            >
              <FaArrowLeft /> Go Back
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              <FaSyncAlt /> Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // No Team Data State (Search Form)
  if (!teamData) {
    return (
      <div className="dashboard-search-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-search-content"
        >
          <div className="search-icon">
            <FaFootballBall />
          </div>
          <h2>Welcome to FPL AI Assistant</h2>
          <p>Enter your FPL Team ID to view your personalized dashboard and insights.</p>
          
          <form onSubmit={handleSearchTeam} className="search-team-form">
            <div className="search-input-group">
            <input
              type="text"
              value={searchTeamId}
              onChange={(e) => setSearchTeamId(e.target.value.trim())}
                placeholder="Enter your FPL Team ID..."
                className="search-input"
              />
              <motion.button 
                type="submit" 
                className="search-button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!searchTeamId || isNaN(searchTeamId)}
              >
              View Team
              </motion.button>
            </div>
          </form>
          
          <div className="search-help">
            <FaInfoCircle className="help-icon" />
            <p>
              Your FPL Team ID can be found in the URL when you visit your team page:
              <br />
              <span className="help-url">
                https://fantasy.premierleague.com/entry/<strong>YOUR_ID</strong>/event/1
              </span>
          </p>
        </div>
        </motion.div>
      </div>
    );
  }

  // Main Dashboard Content
  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dashboard Header */}
      <motion.div 
        className="dashboard-header"
        variants={itemVariants}
      >
        <div className="team-info">
          <div className="team-header">
            <div className="team-badge">
              <FaShieldAlt />
            </div>
            <div>
              <h1>{teamData.name}</h1>
              <p className="manager-name">Managed by {teamData.player_name}</p>
            </div>
          </div>

          <div className="team-actions">
            <motion.button 
              className="refresh-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
            >
              <FaSyncAlt /> Refresh
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview Cards */}
      <motion.div 
        className="stats-overview"
        variants={itemVariants}
      >
        <StatCard 
          icon={<FaTrophy />} 
          title="Overall Rank" 
          value={teamData.overall_rank.toLocaleString()} 
          color="trophy"
        />
        <StatCard 
          icon={<FaCalendarAlt />} 
          title="Gameweek" 
          value={teamData.gameweek} 
          color="calendar"
        />
        <StatCard 
          icon={<FaChartLine />} 
          title="GW Points" 
          value={teamData.gameweek_points} 
          color="points"
        />
        <StatCard 
          icon={<FaStar />} 
          title="Total Points" 
          value={teamData.total_points} 
          color="star"
        />
      </motion.div>

      {/* Team Value Cards */}
      <motion.div 
        className="team-value-section"
        variants={itemVariants}
      >
        <div className="value-card">
          <div className="value-icon">
            <FaCoins />
          </div>
          <div className="value-content">
            <h3>Team Value</h3>
            <p className="value-amount" title="Team value includes the value of all players in your squad">
              {teamData.team_value || (teamData.value ? `£${teamData.value.toFixed(1)}m` : 'N/A')}
            </p>
          </div>
        </div>
        <div className="value-card">
          <div className="value-icon bank">
            <FaExchangeAlt />
          </div>
          <div className="value-content">
            <h3>In The Bank</h3>
            <p className="value-amount" title="Funds available for transfers">
              {teamData.bank_balance || (teamData.bank ? `£${teamData.bank.toFixed(1)}m` : 'N/A')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="dashboard-tabs"
        variants={itemVariants}
      >
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartLine /> Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'lineup' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineup')}
        >
          <FaShieldAlt /> Team Lineup
        </button>
        <button 
          className={`tab-button ${activeTab === 'chips' ? 'active' : ''}`}
          onClick={() => setActiveTab('chips')}
        >
          <FaMagic /> Chips
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> History
        </button>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="tab-content"
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="dashboard-grid-container">
              {/* Captain Information */}
              <div className="dashboard-card captain-card">
                <div className="card-header">
                  <FaCrown className="card-icon crown" />
                  <h3>Captain Selection</h3>
                </div>
                <div className="card-body">
                  {renderCaptain(teamData.lineup)}
        </div>
      </div>

              {/* Current Event Information */}
              {teamData.current_event && (
                <div className="dashboard-card gameweek-card">
                  <div className="card-header">
                    <FaCalendarAlt className="card-icon calendar" />
                    <h3>Current Gameweek</h3>
                  </div>
                  <div className="card-body">
                    <div className="event-details">
                      <div className="event-detail">
                        <span className="detail-label">Gameweek:</span>
                        <span className="detail-value">{teamData.current_event.name}</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">{getEventStatus(teamData.current_event)}</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-label">Average:</span>
                        <span className="detail-value">{teamData.current_event.average_points} pts</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value">{formatDeadline(teamData.current_event.deadline)}</span>
                      </div>
        </div>
        </div>
      </div>
              )}

              {/* Quick Chips Status */}
      {teamData.chips && (
                <div className="dashboard-card chips-overview-card">
                  <div className="card-header">
                    <FaMagic className="card-icon magic" />
          <h3>Available Chips</h3>
                  </div>
                  <div className="card-body">
          <div className="chips-list">
            {teamData.chips.status && teamData.chips.status
              .map((chip, index) => (
                          <div key={index} className={`chip-item ${chip.available ? 'available' : 'used'}`}>
                            <span className="chip-name">{formatChipName(chip.name)}</span>
                            <span className="chip-status">
                              {chip.available ? 'Available' : 'Used'}
                            </span>
                </div>
              ))}
          </div>
          </div>
        </div>
      )}

              {/* If we have rank history, show a preview chart */}
              {teamData.rank_history && teamData.rank_history.length > 0 && (
                <div className="dashboard-card rank-preview-card">
                  <div className="card-header">
                    <FaChartLine className="card-icon chart" />
                    <h3>Rank Progression</h3>
                  </div>
                  <div className="card-body chart-preview">
                    <RankChart history={teamData.rank_history} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Lineup Tab */}
          {activeTab === 'lineup' && (
            <div className="lineup-container">
              {teamData.lineup && teamData.lineup.length > 0 ? (
          <TeamLineup lineup={teamData.lineup} />
              ) : (
                <div className="empty-state">
                  <FaExclamationTriangle />
                  <p>No lineup data available</p>
                </div>
              )}
        </div>
      )}

          {/* Chips Tab */}
          {activeTab === 'chips' && (
            <div className="chips-container">
              {teamData.chips ? (
                <ChipsStatus chips={teamData.chips} />
              ) : (
                <div className="empty-state">
                  <FaExclamationTriangle />
                  <p>No chips data available</p>
                </div>
              )}
        </div>
      )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-container">
              {teamData.rank_history && teamData.rank_history.length > 0 ? (
                <div className="rank-history-full">
                  <div className="rank-chart-container">
                    <RankChart history={teamData.rank_history} />
      </div>

                  {/* Optional: Add a table view of the history data */}
                  <div className="rank-history-table">
                    <h3>Gameweek Performance</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>GW</th>
                          <th>Points</th>
                          <th>Rank</th>
                          <th>Team Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.rank_history.map((gw, index) => (
                          <tr key={index}>
                            <td>{gw.event || '--'}</td>
                            <td>{gw.points || '--'}</td>
                            <td>{gw.rank ? formatRank(gw.rank) : '--'}</td>
                            <td>
                              {gw.value 
                                ? `£${(gw.value / 10).toFixed(1)}m` 
                                : '--'}
                            </td>
                          </tr>
                        )).reverse()}
                      </tbody>
                    </table>
          </div>
        </div>
              ) : (
                <div className="empty-state">
                  <FaExclamationTriangle />
                  <p>No rank history data available</p>
                </div>
      )}
    </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  return (
    <motion.div 
      className={`stat-card ${color}`}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
      }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </motion.div>
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
    return (
      <div className="empty-state">
        <p>No captain data available</p>
      </div>
    );
  }
  
  const captain = lineup.find(player => player.is_captain);
  const viceCaptain = lineup.find(player => player.is_vice_captain);
  
  if (!captain) {
    return (
      <div className="empty-state">
        <p>No captain selected</p>
      </div>
    );
  }
  
  return (
    <div className="captain-display">
      <div className="captain-main">
        <FaCrown className="captain-icon" />
        <div className="captain-name">{captain.name || 'Unknown'}</div>
        {captain.team && <div className="captain-team">{captain.team}</div>}
      </div>
      
      {viceCaptain && (
        <div className="vice-captain">
          <span className="vc-label">Vice Captain:</span>
          <span className="vc-name">{viceCaptain.name}</span>
        </div>
      )}
    </div>
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
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return deadline;
  }
};

export default TeamDashboard; 