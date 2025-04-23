import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';
import './ChipCalculator.css'; // Add CSS import

const ChipCalculator = () => {
  const [selectedGameweek, setSelectedGameweek] = useState(1);
  const [benchBoostRecommendations, setBenchBoostRecommendations] = useState([]);
  const [tripleCaptainRecommendations, setTripleCaptainRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      
      // Set last updated timestamp
      if (data.last_updated) {
        const lastUpdatedDate = new Date(data.last_updated * 1000);
        setLastUpdated(lastUpdatedDate.toLocaleString());
      }
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
          <div key={idx} className="fixture-item">
            <span className={`fixture-difficulty-indicator ${getDifficultyColor(fixture.difficulty)}`}></span>
            <span className="fixture-opponent">
              {fixture.is_home ? '' : '@'}{fixture.opponent}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderTeamCard = (teamData) => {
    return (
      <div className="team-card">
        <div className="team-name">{teamData.name}</div>
        <div className="team-fixtures-label">Next fixtures:</div>
        {renderFixtures(teamData)}
      </div>
    );
  };

  const renderPlayerRecommendations = (players, position) => {
    if (!players || players.length === 0) {
      return <p>No {position} recommendations available</p>;
    }

    const positionColors = {
      GK: 'position-gk',
      DEF: 'position-def',
      MID: 'position-mid',
      FWD: 'position-fwd'
    };

    return (
      <div className="position-group">
        <h4 className={`position-title ${positionColors[position]}`}>{position}</h4>
        <div className="position-players">
          {players.map((player, index) => (
            <div key={index} className="player-card">
              <div className="player-name">{player.name}</div>
              <div className="player-team">{player.team}</div>
              <div className="player-stats">
                <span className="player-stat">£{player.price.toFixed(1)}m</span>
                <span className="player-stat">Form: {player.form.toFixed(1)}</span>
                <span className="player-stat">Pts: {player.points}</span>
              </div>
              <div className="fixture-difficulty">
                <span className="difficulty-label">Fixtures:</span>
                <span className={`difficulty-value ${getDifficultyColor(Math.round(player.avg_fixture_difficulty))}`}>
                  {player.fixtures_count > 1 ? `${player.fixtures_count}x` : ''} 
                  Diff: {player.avg_fixture_difficulty.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendation = (recommendation, index, chipType) => {
    return (
      <div className="recommendation-card" key={`${chipType}-${index}`}>
        <div className="recommendation-header">
          <h3 className="recommendation-title">{chipType === 'bench_boost' ? 'Bench Boost' : 'Triple Captain'}</h3>
          <span className="recommendation-gameweek">Gameweek {recommendation.gameweek}</span>
        </div>
        
        <div className="recommendation-reasoning">
          <p className="recommendation-text">
            {chipType === 'bench_boost' 
              ? `Good Bench Boost opportunity with ${recommendation.teams_with_multiple_fixtures} teams having multiple fixtures.` 
              : `Good Triple Captain opportunity with favorable fixtures.`}
          </p>
          <p className="recommendation-text">Average fixture difficulty: {recommendation.avg_fixture_difficulty.toFixed(1)}</p>
        </div>

        <div className="recommended-players-section">
          <h4 className="recommended-players-title">Teams with Multiple Fixtures:</h4>
          <div className="players-list">
            {Object.values(recommendation.team_data)
              .filter(team => team.fixtures_count > 1)
              .map((team, idx) => (
                <div key={idx} className="player-item">
                  <span className="player-name">{team.name}</span>
                  <span className="player-team">({team.fixtures_count} fixtures)</span>
                </div>
              ))}
          </div>
        </div>

        {recommendation.recommended_players && (
          <div className="player-recommendations">
            <h4 className="recommendations-title">Recommended Players:</h4>
            <div className="positions-container">
              {renderPlayerRecommendations(recommendation.recommended_players.GK, 'GK')}
              {renderPlayerRecommendations(recommendation.recommended_players.DEF, 'DEF')}
              {renderPlayerRecommendations(recommendation.recommended_players.MID, 'MID')}
              {renderPlayerRecommendations(recommendation.recommended_players.FWD, 'FWD')}
            </div>
          </div>
        )}

        <div className="teams-section">
          <h4 className="teams-title">Teams with Good Fixtures:</h4>
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
        </div>
      </div>
    );
  };

  return (
    <div className="chip-calculator-container">
      <h2 className="calculator-title">FPL Chip Strategy Calculator</h2>
      <p className="calculator-description">
        Get recommendations on when to use your FPL chips based on fixture difficulty and team form.
      </p>

      <div className="calculator-controls">
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

        <button 
          className="calculator-button" 
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? (
            <span className="loading-indicator">
              <FaSpinner className="spinner-icon" /> Loading...
            </span>
          ) : (
            'Calculate Chip Strategy'
          )}
        </button>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Data last updated: {lastUpdated}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="recommendations-container">
        {(benchBoostRecommendations.length > 0 || tripleCaptainRecommendations.length > 0) ? (
          <>
            <h3>Bench Boost Recommendations</h3>
            <div className="recommendations-grid">
              {benchBoostRecommendations.map((rec, index) => renderRecommendation(rec, index, 'bench_boost'))}
            </div>
            
            <h3 className="mt-6">Triple Captain Recommendations</h3>
            <div className="recommendations-grid">
              {tripleCaptainRecommendations.map((rec, index) => renderRecommendation(rec, index, 'triple_captain'))}
            </div>
          </>
        ) : !loading && (
          <div className="no-recommendations-message">
            No recommendations yet. Select a gameweek and calculate to see chip strategy recommendations.
          </div>
        )}
      </div>

      <div className="difficulty-legend">
        <h4 className="legend-title">Fixture Difficulty:</h4>
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
      </div>
    </div>
  );
};

export default ChipCalculator; 