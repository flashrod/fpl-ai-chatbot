import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeamSearch.css';

const TeamSearch = ({ onTeamSelect }) => {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('search'); // 'search' or 'direct'
  const [apiStatus, setApiStatus] = useState({ checked: false, working: true });

  // Check if the search API is working
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Make a simple test request to check if the search API is working
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        await axios.get('/api/teams/search?query=test', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setApiStatus({ checked: true, working: true });
      } catch (error) {
        console.warn('Team search API appears to be unavailable:', error);
        if (error.name === 'AbortError') {
          console.warn('Team search API timed out');
        }
        setApiStatus({ checked: true, working: false });
        // Switch to direct mode if the API isn't working
        setMode('direct');
      }
    };

    if (!apiStatus.checked) {
      checkApiStatus();
    }
  }, [apiStatus]);

  const searchTeams = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Add a timeout to the axios request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await axios.get(`/api/teams/search?query=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setTeams(response.data || []);
      
      if (response.data && response.data.length === 0) {
        setError('No teams found with that name. Try a different search or use a team ID directly.');
      }
    } catch (error) {
      console.error('Error searching teams:', error);
      let errorMessage = 'Team search is unavailable. You can enter a team ID directly.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Search request timed out. Please try again or enter a team ID directly.';
      }
      
      setError(errorMessage);
      // Switch to direct mode if search fails
      setMode('direct');
      setApiStatus({ checked: true, working: false });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectTeamLookup = () => {
    if (!query.trim() || isNaN(query)) {
      setError('Please enter a valid team ID (numbers only)');
      return;
    }
    
    const teamId = parseInt(query.trim());
    // Create a team object with the ID
    const team = {
      id: teamId,
      name: `Team ${teamId}`
    };
    
    handleTeamSelect(team);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'search' && apiStatus.working) {
      searchTeams();
    } else {
      handleDirectTeamLookup();
    }
  };

  const handleTeamSelect = (team) => {
    if (onTeamSelect) {
      onTeamSelect(team);
    }
    // Clear results after selection
    setTeams([]);
    setQuery('');
  };

  return (
    <div className="team-search-container">
      {apiStatus.checked && (
        <div className="search-mode-toggle">
          <button 
            className={`mode-button ${mode === 'search' && apiStatus.working ? 'active' : ''}`} 
            onClick={() => setMode('search')}
            disabled={!apiStatus.working}
          >
            Search Team
          </button>
          <button 
            className={`mode-button ${mode === 'direct' || !apiStatus.working ? 'active' : ''}`} 
            onClick={() => setMode('direct')}
          >
            Enter Team ID
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="team-search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={(mode === 'search' && apiStatus.working) ? "Search for a team..." : "Enter team ID..."}
          className="team-search-input"
          inputMode={(mode === 'direct' || !apiStatus.working) ? 'numeric' : 'text'}
        />
        <button type="submit" className="team-search-button" disabled={loading}>
          {loading ? 'Searching...' : (mode === 'search' && apiStatus.working) ? 'Search' : 'Look Up'}
        </button>
      </form>
      
      {error && <div className="team-search-error">{error}</div>}
      
      {(mode === 'direct' || !apiStatus.working) && (
        <div className="team-search-help">
          <p>Your FPL ID can be found in the URL when you visit your team page:</p>
          <p className="example-url">https://fantasy.premierleague.com/entry/<span className="highlight">YOUR_ID_HERE</span>/event/7</p>
        </div>
      )}
      
      {teams.length > 0 && (
        <div className="team-search-results">
          {teams.map((team) => (
            <div 
              key={team.id || team.name} 
              className="team-search-result-item"
              onClick={() => handleTeamSelect(team)}
            >
              {team.name || team.team_name}
              {team.player_name && <span className="team-manager-name"> - {team.player_name}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSearch; 