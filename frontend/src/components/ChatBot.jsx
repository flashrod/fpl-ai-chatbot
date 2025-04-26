import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './ChatBot.css'
import TeamSearch from './TeamSearch'

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm your FPL Assistant. Ask me about players, strategies, or use the team search to get personalized advice about your FPL team.",
      sender: 'bot'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const lastMessageRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const formatMessage = (message) => {
    let formattedText = message.replace(/•\s(.*?)(?=\n•|\n\n|$)/g, '<li>$1</li>')
    formattedText = formattedText.replace(/<li>(.*?)<\/li>/g, '<ul class="chat-bullet-list">$&</ul>')
    
    formattedText = formattedText.replace(/<\/ul>\s*<ul class="chat-bullet-list">/g, '')
    
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    formattedText = formattedText.replace(/\n/g, '<br>')
    
    return formattedText
  }

  const isTeamIdQuery = (message) => {
    const teamIdRegex = /team\s+(?:id\s*[:=]?\s*)?(\d{4,8})/i
    const justIdRegex = /^(\d{4,8})$/

    return teamIdRegex.test(message) || justIdRegex.test(message)
  }

  const extractTeamId = (message) => {
    const teamIdRegex = /team\s+(?:id\s*[:=]?\s*)?(\d{4,8})/i
    const justIdRegex = /^(\d{4,8})$/
    
    const teamIdMatch = message.match(teamIdRegex)
    if (teamIdMatch && teamIdMatch[1]) {
      return teamIdMatch[1]
    }
    
    const justIdMatch = message.match(justIdRegex)
    if (justIdMatch && justIdMatch[1]) {
      return justIdMatch[1]
    }
    
    return null
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() && !loading) return

    const userMessage = { text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    
    const userInput = input.trim()
    setInput('')
    setLoading(true)

    if (isTeamIdQuery(userInput)) {
      const teamId = extractTeamId(userInput)
      if (teamId) {
        const botMessage = {
          text: `I'll show you the detailed dashboard for team ID ${teamId}. Opening team dashboard...`,
          sender: 'bot'
        }
        
        setMessages(prev => [...prev, botMessage])
        setLoading(false)
        
        setTimeout(() => {
          navigate(`/user/${teamId}`)
        }, 1500)
        return
      }
    }

    try {
      const response = await axios.post('/api/chat', { message: userInput })
      
      if (response.data && response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot'
        }
        
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage])
          setLoading(false)
        }, 500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = {
        text: "Sorry, I couldn't process your request. Please try again later.",
        sender: 'bot'
      }
      
      setMessages(prev => [...prev, errorMessage])
      setLoading(false)
    }
  }

  const handleTeamSelect = (team) => {
    const userMessage = { 
      text: `I want to analyze team ID: ${team.id}`, 
      sender: 'user' 
    }
    
    setMessages(prev => [...prev, userMessage])
    
    const botMessage = {
      text: `I'll show you the detailed dashboard for team ${team.id} (${team.name}). Opening team dashboard...`,
      sender: 'bot'
    }
    
    setMessages(prev => [...prev, botMessage])
    
    setTimeout(() => {
      navigate(`/user/${team.id}`)
    }, 1500)
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>FPL Assistant</h2>
      </div>
      
      <div className="search-section">
        <TeamSearch onTeamSelect={handleTeamSelect} />
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <div 
                dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
                className="message-text"
              />
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chat-message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about FPL or enter a team ID..."
          disabled={loading}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="chat-send-button"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatBot 