import React, { useState } from 'react';
import './TeamSearch.css';

const TeamSearch = ({ onTeamSearch }) => {
  const [teamId, setTeamId] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamId && teamId.trim() !== '') {
      onTeamSearch(teamId);
      setTeamId('');
      setIsExpanded(false);
    }
  };

  return (
    <div className="team-search-container">
      <button
        className="team-search-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide Team Search' : 'Search FPL Team'}
      </button>
      
      {isExpanded && (
        <form className="team-search-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="team-id">FPL Team ID:</label>
            <input
              id="team-id"
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter FPL team ID"
            />
          </div>
          <div className="team-search-help">
            <p>Your FPL ID can be found in the URL when you visit your team page:</p>
            <p className="example-url">https://fantasy.premierleague.com/entry/<span className="highlight">YOUR_ID_HERE</span>/event/7</p>
          </div>
          <button type="submit" disabled={!teamId.trim()}>
            Search
          </button>
        </form>
      )}
    </div>
  );
};

export default TeamSearch; 