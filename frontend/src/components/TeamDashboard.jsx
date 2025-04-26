import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaSpinner, FaSearchPlus, FaArrowLeft, FaUser, FaTrophy, FaCoins, FaFootballBall } from 'react-icons/fa';
import TeamLineup from './TeamLineup';
import RankChart from './RankChart';
import ChipsStatus from './ChipsStatus';
import LoadingAnimation from './LoadingAnimation';
import './TeamDashboard.css';

const TeamDashboard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTeamId, setSearchTeamId] = useState('');

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!teamId || isNaN(teamId)) {
          throw new Error('Invalid team ID');
        }
        
        console.log('Fetching team data for ID:', teamId);
        const response = await axios.get(`/api/teams/${teamId}`);
        console.log('Response received:', response.data);
        setTeamData(response.data);
      } catch (err) {
        console.error('Error fetching team data:', err);
        if (err.response) {
          console.error('Error response status:', err.response.status);
          console.error('Error response data:', err.response.data);
        }
        setError(err.response?.data?.detail || err.message || 'Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [teamId]);

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
      <div className="team-dashboard loading-container">
        <LoadingAnimation size={60} />
        <p className="loading-text">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="team-dashboard error-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="error-content"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            animate={{ 
              rotate: [-5, 5, -5],
              transition: { repeat: Infinity, duration: 2, repeatType: "reverse" }
            }}
          >
            <FaExclamationTriangle className="error-icon" />
          </motion.div>
          <h2>Error Loading Team</h2>
          <p>{error}</p>
          <div className="error-actions">
            <motion.button 
              className="btn-secondary" 
              onClick={handleGoBack}
              whileHover={{ scale: 1.05, backgroundColor: '#e0e0e0' }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft /> Go Back
            </motion.button>
            <div className="search-team-form">
              <form onSubmit={handleSearchTeam}>
                <input
                  type="text"
                  value={searchTeamId}
                  onChange={(e) => setSearchTeamId(e.target.value)}
                  placeholder="Try another Team ID..."
                />
                <motion.button 
                  type="submit" 
                  className="btn-primary"
                  whileHover={{ scale: 1.05, backgroundColor: '#04db76' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSearchPlus /> Search
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="team-dashboard">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button 
          className="back-button" 
          onClick={handleGoBack}
          whileHover={{ backgroundColor: '#38003c', color: 'white' }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft /> Back
        </motion.button>
        
        <div className="team-info">
          <h1>{teamData?.name || `Team ${teamId}`}</h1>
          <h3>Managed by {teamData?.player_name || 'Unknown Manager'}</h3>
        </div>
        
        <div className="search-form">
          <form onSubmit={handleSearchTeam}>
            <input
              type="text"
              value={searchTeamId}
              onChange={(e) => setSearchTeamId(e.target.value)}
              placeholder="Enter Team ID..."
            />
            <motion.button 
              type="submit" 
              className="btn-primary"
              whileHover={{ backgroundColor: '#04db76', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSearchPlus /> Search
            </motion.button>
          </form>
        </div>
      </motion.div>

      <div className="dashboard-body">
        <motion.div 
          className="stats-overview"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="stat-icon">
              <FaFootballBall />
            </div>
            <div className="stat-content">
              <h3>Gameweek {teamData?.gameweek || 'N/A'} Points</h3>
              <p className="stat-value">{teamData?.gameweek_points || 0}</p>
              <p className="stat-subtitle">GW Rank: {formatRank(teamData?.gameweek_rank)}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="stat-icon">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <h3>Overall Points</h3>
              <p className="stat-value">{teamData?.total_points || 0}</p>
              <p className="stat-subtitle">OR: {formatRank(teamData?.overall_rank)}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="stat-icon">
              <FaCoins />
            </div>
            <div className="stat-content">
              <h3>Team Value</h3>
              <p className="stat-value">£{teamData?.value || 0}m</p>
              <p className="stat-subtitle">Bank: £{teamData?.bank || 0}m</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="stat-icon">
              <FaUser />
            </div>
            <div className="stat-content">
              <h3>Captain</h3>
              {renderCaptain(teamData?.lineup || [])}
            </div>
          </motion.div>
        </motion.div>

        <div className="dashboard-main-content">
          <motion.div 
            className="team-lineup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2>Gameweek {teamData?.gameweek || 'N/A'} Lineup</h2>
            <TeamLineup lineup={teamData?.lineup || []} />
          </motion.div>
          
          <div className="dashboard-sidebar">
            <motion.div 
              className="rank-history-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h2>Rank History</h2>
              <RankChart history={teamData?.rank_history || []} />
            </motion.div>
            
            <motion.div 
              className="chips-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <h2>Chips</h2>
              <ChipsStatus chips={teamData?.chips || { used: [], status: [] }} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatRank = (rank) => {
  if (!rank) return 'N/A';
  
  // Format with commas for thousands (e.g., 1,234,567)
  return rank.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

export default TeamDashboard; 