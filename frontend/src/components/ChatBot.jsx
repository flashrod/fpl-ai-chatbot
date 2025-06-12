import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import { AlertCircle, RefreshCw } from 'lucide-react'
import './ChatBot.css'

// Error message types for different scenarios
const ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  SERVER: 'server',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: "I'm having trouble connecting to the server. Please check your internet connection.",
  [ERROR_TYPES.TIMEOUT]: "The request is taking too long. Please try a simpler question or try again later.",
  [ERROR_TYPES.SERVER]: "The server encountered an error. Please try again in a few moments.",
  [ERROR_TYPES.VALIDATION]: "I couldn't understand your question. Please try rephrasing it.",
  [ERROR_TYPES.UNKNOWN]: "Something went wrong. Please try again."
}

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm your FPL Assistant. Ask me about players, strategies, or use the team search to get personalized advice about your FPL team.",
      sender: 'bot'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryMessage, setRetryMessage] = useState(null)
  const messagesEndRef = useRef(null)
  const lastMessageRef = useRef(null)
  const navigate = useNavigate()
  const { teamId, teamData } = useTeam()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (teamData && messages.length === 1) {
      const teamInfoMessage = {
        text: `I've loaded your team "${teamData.name}". I can now provide personalized advice based on your current squad and performance.`,
        sender: 'bot'
      }
      setMessages(prev => [...prev, teamInfoMessage])
    }
  }, [teamData, messages.length])

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

  const getErrorMessage = (error) => {
    // Handle HTTP exceptions from the backend
    if (error.response?.data?.error) {
      const { type, message } = error.response.data.error;
      return {
        type: type || ERROR_TYPES.UNKNOWN,
        message: message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
      };
    }
    
    // Handle other types of errors
    if (error.name === 'AbortError') {
      return {
        type: ERROR_TYPES.TIMEOUT,
        message: ERROR_MESSAGES[ERROR_TYPES.TIMEOUT]
      };
    }
    
    if (!error.response) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: ERROR_MESSAGES[ERROR_TYPES.NETWORK]
      };
    }
    
    const status = error.response.status;
    if (status >= 500) {
      return {
        type: ERROR_TYPES.SERVER,
        message: ERROR_MESSAGES[ERROR_TYPES.SERVER]
      };
    }
    
    if (status === 400) {
      return {
        type: ERROR_TYPES.VALIDATION,
        message: ERROR_MESSAGES[ERROR_TYPES.VALIDATION]
      };
    }
    
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
    };
  }

  const handleRetry = async () => {
    if (!retryMessage) return
    
    setError(null)
    setLoading(true)
    
    try {
      const response = await axios.post('/api/chat', { 
        message: retryMessage,
        team_id: teamId
      })
      
      if (response.data && response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot'
        }
        setMessages(prev => [...prev, botMessage])
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error)
      setError(errorInfo)
    } finally {
      setLoading(false)
      setRetryMessage(null)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() && !loading) return

    const userMessage = { text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    
    const userInput = input.trim()
    setInput('')
    setLoading(true)
    setError(null)
    setRetryMessage(userInput)

    if (isTeamIdQuery(userInput)) {
      const newTeamId = extractTeamId(userInput)
      if (newTeamId) {
        const botMessage = {
          text: `I'll show you the detailed dashboard for team ID ${newTeamId}. Opening team dashboard...`,
          sender: 'bot'
        }
        
        setMessages(prev => [...prev, botMessage])
        setLoading(false)
        
        setTimeout(() => {
          navigate(`/user/${newTeamId}`)
        }, 1500)
        return
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await axios.post('/api/chat', { 
        message: userInput,
        team_id: teamId
      }, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.data && response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot'
        }
        setMessages(prev => [...prev, botMessage])
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error)
      setError(errorInfo)
      
      // Add error message to chat
      const errorMessage = {
        text: errorInfo.message,
        sender: 'bot',
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
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
        {teamData && (
          <p className="team-indicator">
            Personalized advice for: <span>{teamData.name}</span>
          </p>
        )}
      </div>
      
      <div className="search-section">
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
          >
            <div className="message-content">
              {message.isError && <AlertCircle className="error-icon" />}
              <div 
                dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
                className="message-text"
              />
              {message.isError && retryMessage && (
                <button 
                  className="retry-button"
                  onClick={handleRetry}
                  disabled={loading}
                >
                  <RefreshCw className="retry-icon" />
                  Try Again
                </button>
              )}
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
          placeholder="Ask me about your FPL team..."
          disabled={loading}
          className="chat-input"
          aria-label="Chat input"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="chat-send-button"
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatBot 