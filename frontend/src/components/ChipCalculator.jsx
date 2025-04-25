import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaSync, FaChartLine, FaRegCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useScrollAnimation, scrollAnimationVariants } from '../hooks/useScrollAnimation';
import LoadingAnimation from './LoadingAnimation';
import './ChipCalculator.css';

const ChipCalculator = () => {
  const [selectedGameweek, setSelectedGameweek] = useState(1);
  const [benchBoostRecommendations, setBenchBoostRecommendations] = useState([]);
  const [tripleCaptainRecommendations, setTripleCaptainRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);

  // Animation refs
  const { ref: headerRef, controls: headerControls } = useScrollAnimation();
  const { ref: controlsRef, controls: controlsControls } = useScrollAnimation();
  const { ref: bbRef, controls: bbControls } = useScrollAnimation();
  const { ref: tcRef, controls: tcControls } = useScrollAnimation();

  // Format the remaining time until next update
  const formatTimeRemaining = (timeInSeconds) => {
    if (timeInSeconds <= 0) return 'Updating soon...';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Update the countdown timer every minute
  useEffect(() => {
    if (!nextUpdateTime) return;
    
    const updateTimer = () => {
      const now = new Date();
      const nextUpdate = new Date(nextUpdateTime);
      const timeDiff = Math.floor((nextUpdate - now) / 1000);
      setTimeUntilNextUpdate(formatTimeRemaining(timeDiff > 0 ? timeDiff : 0));
    };
    
    // Initial update
    updateTimer();
    
    // Set interval to update every minute
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [nextUpdateTime]);
  
  // Timer to auto refresh data when needed
  useEffect(() => {
    if (!autoUpdateEnabled || !nextUpdateTime) return;
    
    // Calculate milliseconds until next refresh
    const nextRefresh = new Date(nextUpdateTime);
    const now = new Date();
    const msUntilRefresh = Math.max(0, nextRefresh - now);
    
    // Set timeout to refresh when the time comes
    const refreshTimeout = setTimeout(() => {
      fetchRecommendations();
    }, msUntilRefresh);
    
    return () => clearTimeout(refreshTimeout);
  }, [autoUpdateEnabled, nextUpdateTime]);

  // Auto-fetch recommendations on first render
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chips/calculate?gameweek=${selectedGameweek}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      setBenchBoostRecommendations(data.bench_boost || []);
      setTripleCaptainRecommendations(data.triple_captain || []);
      
      // Set last updated timestamp and next refresh information
      if (data.last_updated) {
        const lastUpdatedDate = new Date(data.last_updated * 1000);
        setLastUpdated(lastUpdatedDate.toLocaleString());
      }
      
      if (data.next_refresh) {
        const nextRefreshDate = new Date(data.next_refresh * 1000);
        setNextUpdateTime(nextRefreshDate.toLocaleString());
      }
      
      setAutoUpdateEnabled(data.auto_update_enabled || false);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (value) => {
    switch (value) {
      case 1:
        return 'difficulty-very-easy';
      case 2:
        return 'difficulty-easy';
      case 3:
        return 'difficulty-medium';
      case 4:
        return 'difficulty-hard';
      case 5:
        return 'difficulty-very-hard';
      default:
        return 'difficulty-medium';
    }
  };

  const renderFixtures = (teamData) => {
    if (!teamData.fixture_details || teamData.fixture_details.length === 0) {
      return <div className="no-fixtures">No upcoming fixtures</div>;
    }
    
    return (
      <div className="fixtures-container">
        {teamData.fixture_details.map((fixture, idx) => (
          <motion.div
            key={idx}
            className="fixture-item glass-effect"
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
          >
            <span className={`fixture-difficulty-indicator ${getDifficultyColor(fixture.difficulty)}`}></span>
            <span className="fixture-opponent">
              {fixture.is_home ? '' : '@'}{fixture.opponent}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTeamCard = (teamData) => {
    return (
      <motion.div 
        className="team-card card"
        whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
        transition={{ duration: 0.2 }}
      >
        <div className="team-name">{teamData.name}</div>
        <div className="team-fixtures-label">Next fixtures:</div>
        {renderFixtures(teamData)}
      </motion.div>
    );
  };

  const renderRecommendation = (recommendation, index, chipType) => {
    const isTripleCaptain = chipType === 'triple_captain';
    
    return (
      <motion.div 
        className="recommendation-card card"
        key={`${chipType}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -5 }}
      >
        <div className="recommendation-header">
          <h3 className="recommendation-title">
            {isTripleCaptain ? (
              <span className="title-icon">👑 Triple Captain</span>
            ) : (
              <span className="title-icon">🔄 Bench Boost</span>
            )}
          </h3>
          <span className="recommendation-gameweek">
            <FaRegCalendarAlt className="gw-icon" /> Gameweek {recommendation.gameweek}
          </span>
        </div>
        
        <div className="recommendation-reasoning">
          <p className="recommendation-text">
            {isTripleCaptain 
              ? <span>Good Triple Captain opportunity with favorable fixtures.</span>
              : <span>Good Bench Boost opportunity with <strong className="highlight">{recommendation.teams_with_multiple_fixtures} teams</strong> having multiple fixtures.</span>
            }
          </p>
          <div className="recommendation-metrics">
            <div className="metric">
              <FaChartLine className="metric-icon" />
              <span>Avg. difficulty: <strong>{recommendation.avg_fixture_difficulty.toFixed(1)}</strong></span>
            </div>
          </div>
        </div>

        <motion.div 
          className="teams-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="teams-title">
            {chipType === 'bench_boost' 
              ? 'Teams with Multiple Fixtures:'
              : 'Recommended Teams:'}
          </h4>
          <div className="teams-grid">
            {Object.values(recommendation.team_data)
              .sort((a, b) => a.avg_difficulty - b.avg_difficulty)
              .slice(0, 6)
              .map((team, idx) => (
                <div key={idx} className="team-wrapper">
                  {renderTeamCard(team)}
                </div>
              ))}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="chip-calculator-container">
      <motion.div
        ref={headerRef}
        initial="hidden"
        animate={headerControls}
        variants={scrollAnimationVariants.slideUp}
        className="calculator-header"
      >
        <h2 className="calculator-title">FPL Chip Strategy Calculator</h2>
        <p className="calculator-description">
          Get data-driven recommendations on when to use your FPL chips based on fixture difficulty and team form.
          <span className="auto-update-badge">Auto-refresh every 24h</span>
        </p>
      </motion.div>

      <motion.div 
        ref={controlsRef}
        initial="hidden"
        animate={controlsControls}
        variants={scrollAnimationVariants.fadeIn}
        className="calculator-controls glass-effect"
      >
        <div className="gameweek-selector">
          <label htmlFor="gameweek" className="gameweek-label">Starting from Gameweek:</label>
          <select
            id="gameweek"
            className="gameweek-dropdown"
            value={selectedGameweek}
            onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
          >
            {[...Array(38)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <motion.button 
          className="calculator-button btn-primary" 
          onClick={fetchRecommendations}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? (
            <span className="loading-indicator">
              <LoadingAnimation size={24} /> Loading...
            </span>
          ) : (
            'Calculate Chip Strategy'
          )}
        </motion.button>
      </motion.div>

      {lastUpdated && (
        <motion.div 
          className="data-update-info glass-effect"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="last-updated">
            <span className="update-label">Data updated:</span> {lastUpdated}
          </div>
          {autoUpdateEnabled && timeUntilNextUpdate && (
            <div className="next-update">
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ display: 'inline-block' }}
              >
                <FaSync className="sync-icon" />
              </motion.span>
              <span className="update-label">Next refresh in:</span> {timeUntilNextUpdate}
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <FaExclamationTriangle /> {error}
        </motion.div>
      )}

      <div className="recommendations-container">
        {(benchBoostRecommendations.length > 0 || tripleCaptainRecommendations.length > 0) ? (
          <>
            <motion.div
              ref={bbRef}
              initial="hidden"
              animate={bbControls}
              variants={scrollAnimationVariants.slideInLeft}
            >
              <h3 className="section-heading">Bench Boost Recommendations</h3>
              <div className="recommendations-grid">
                {benchBoostRecommendations.map((rec, index) => renderRecommendation(rec, index, 'bench_boost'))}
              </div>
            </motion.div>
            
            <motion.div
              ref={tcRef}
              initial="hidden"
              animate={tcControls}
              variants={scrollAnimationVariants.slideInRight}
              className="mt-6"
            >
              <h3 className="section-heading">Triple Captain Recommendations</h3>
              <div className="recommendations-grid">
                {tripleCaptainRecommendations.map((rec, index) => renderRecommendation(rec, index, 'triple_captain'))}
              </div>
            </motion.div>
          </>
        ) : !loading && (
          <motion.div 
            className="no-recommendations-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="message-content">
              <p>No recommendations yet. Select a gameweek and calculate to see chip strategy recommendations.</p>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div 
        className="difficulty-legend card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="legend-title">Fixture Difficulty Guide:</h4>
        <div className="legend-items">
          {[1, 2, 3, 4, 5].map((difficulty) => (
            <div key={difficulty} className="legend-item">
              <span className={`difficulty-indicator ${getDifficultyColor(difficulty)}`}></span>
              <span className="difficulty-label">
                {difficulty === 1 && 'Very Easy'}
                {difficulty === 2 && 'Easy'}
                {difficulty === 3 && 'Medium'}
                {difficulty === 4 && 'Hard'}
                {difficulty === 5 && 'Very Hard'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ChipCalculator; 