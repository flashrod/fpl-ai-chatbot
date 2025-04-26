import React, { useState } from 'react';
import axios from 'axios';
import './ApiTester.css';

const ApiTester = () => {
  const [endpoint, setEndpoint] = useState('/api/teams/test');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const testEndpoints = [
    { name: 'Test Teams API', url: '/api/teams/test' },
    { name: 'Team Search', url: '/api/teams/search?query=test' },
    { name: 'Get Team', url: '/api/teams/' },
    { name: 'Chat API', url: '/api/chat' },
    { name: 'Injuries API', url: '/api/injuries' },
    { name: 'Root API', url: '/api' }
  ];

  const handleEndpointChange = (e) => {
    setEndpoint(e.target.value);
  };

  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    let finalEndpoint = endpoint;
    if (endpoint === '/api/teams/' && teamId) {
      finalEndpoint += teamId;
    }

    try {
      console.log(`Making request to: ${finalEndpoint}`);
      const response = await axios.get(finalEndpoint);
      
      console.log('Response:', response.data);
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    } catch (err) {
      console.error('API test error:', err);
      
      let errorMessage = 'An error occurred';
      if (err.response) {
        errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = err.message;
      }
      
      setError({
        message: errorMessage,
        details: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-tester-container">
      <h2>API Endpoint Tester</h2>
      <p className="tester-description">
        Use this tool to test API endpoints and diagnose connection issues.
      </p>
      
      <div className="endpoint-selector">
        <label htmlFor="endpoint-select">Select an endpoint:</label>
        <select 
          id="endpoint-select"
          value={endpoint}
          onChange={handleEndpointChange}
          className="endpoint-select"
        >
          {testEndpoints.map((ep) => (
            <option key={ep.url} value={ep.url}>
              {ep.name} ({ep.url})
            </option>
          ))}
        </select>
      </div>
      
      {endpoint === '/api/teams/' && (
        <div className="team-id-input">
          <label htmlFor="team-id">Team ID:</label>
          <input
            id="team-id"
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value.trim())}
            placeholder="Enter FPL Team ID"
            className="team-id-field"
          />
        </div>
      )}
      
      <button 
        onClick={makeRequest}
        disabled={loading || (endpoint === '/api/teams/' && !teamId)}
        className="test-button"
      >
        {loading ? 'Testing...' : 'Test Endpoint'}
      </button>
      
      {error && (
        <div className="error-display">
          <h3>Error</h3>
          <p>{error.message}</p>
          <pre>{JSON.stringify(error.details, null, 2)}</pre>
        </div>
      )}
      
      {response && (
        <div className="response-display">
          <h3>Response: {response.status} {response.statusText}</h3>
          <div className="response-data">
            <pre>{JSON.stringify(response.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTester; 