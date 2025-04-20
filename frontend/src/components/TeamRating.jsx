import { useState } from 'react'
import axios from 'axios'
import './TeamRating.css'

const TeamRating = ({ onRatingReceived }) => {
  const [teamInput, setTeamInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!teamInput.trim() || isLoading) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Call backend API with the team data
      const response = await axios.post('http://localhost:8000/chat', { 
        message: `Rate my team:\n${teamInput}` 
      })

      // Pass the rating response back to parent component
      onRatingReceived(response.data.reply)
      
      // Clear the input
      setTeamInput('')
    } catch (error) {
      console.error('Error getting team rating:', error)
      setError('Sorry, there was an error rating your team. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="team-rating-container">
      <div className="team-rating-header">
        <h2>Team Rating Tool</h2>
        <p>Enter your FPL team below (one player per line) to get an AI rating on a scale of 1-10</p>
      </div>
      
      <form onSubmit={handleSubmit} className="team-form">
        <textarea
          className="team-input"
          value={teamInput}
          onChange={(e) => setTeamInput(e.target.value)}
          placeholder={`Enter your team (example):\nPickford (Everton)\nTrippier (Newcastle)\nSaliba (Arsenal)\nVan Dijk (Liverpool)\nBruno (Man United)\nSaka (Arsenal)\nHaaland (Man City)\nWatkins (Aston Villa)\nIsak (Newcastle)\n...`}
          rows={10}
          disabled={isLoading}
        />
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="rate-button"
          disabled={isLoading || !teamInput.trim()}
        >
          {isLoading ? 'Rating...' : 'Rate My Team'}
        </button>
      </form>
      
      <div className="rating-tips">
        <h3>Tips:</h3>
        <ul>
          <li>Include player names and their teams</li>
          <li>You can include position and price if you want</li>
          <li>Format doesn't need to be perfect</li>
          <li>List at least 11 players for best results</li>
        </ul>
      </div>
    </div>
  )
}

export default TeamRating 