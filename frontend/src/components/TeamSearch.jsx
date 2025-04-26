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
        await axios.get('/api/teams/search?query=test');
        setApiStatus({ checked: true, working: true });
      } catch (error) {
        console.warn('Team search API appears to be unavailable:', error);
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
      const response = await axios.get(`/api/teams/search?query=${encodeURIComponent(query)}`);
      setTeams(response.data || []);
      
      if (response.data && response.data.length === 0) {
        setError('No teams found with that name. Try a different search or use a team ID directly.');
      }
    } catch (error) {
      console.error('Error searching teams:', error);
      setError('Team search is unavailable. You can enter a team ID directly.');
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
    if (mode === 'search') {
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

  const toggleMode = () => {
    setMode(mode === 'search' ? 'direct' : 'search');
    setError('');
    setTeams([]);
  };

  return (
    <div className="team-search-container">
      {apiStatus.working && (
        <div className="search-mode-toggle">
          <button 
            className={`mode-button ${mode === 'search' ? 'active' : ''}`} 
            onClick={() => setMode('search')}
          >
            Search Team
          </button>
          <button 
            className={`mode-button ${mode === 'direct' ? 'active' : ''}`} 
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
          placeholder={mode === 'search' ? "Search for a team..." : "Enter team ID..."}
          className="team-search-input"
          inputMode={mode === 'direct' ? 'numeric' : 'text'}
        />
        <button type="submit" className="team-search-button" disabled={loading}>
          {loading ? 'Searching...' : mode === 'search' ? 'Search' : 'Look Up'}
        </button>
      </form>
      
      {error && <div className="team-search-error">{error}</div>}
      
      {mode === 'direct' && (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSearch; 