import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatBot.css'
import TeamSearch from './TeamSearch'

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      content: "👋 Hi, I'm your FPL Assistant! I can help with player recommendations, transfer advice, and team ratings. Ask me anything about FPL!",
      timestamp: new Date(),
      isTyping: false
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prevMessages => [...prevMessages, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Add typing indicator
    const typingIndicator = {
      id: messages.length + 2,
      sender: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }

    setMessages(prevMessages => [...prevMessages, typingIndicator])

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage.content
      })

      // Replace typing indicator with actual message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isTyping ? {
            ...msg,
            content: formatMessage(response.data.response),
            isTyping: false
          } : msg
        )
      )
    } catch (error) {
      // Replace typing indicator with error message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isTyping ? {
            ...msg,
            content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
            isTyping: false
          } : msg
        )
      )
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamSearch = async (teamId) => {
    setIsLoading(true)
    
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: `Rate team ${teamId}`,
      timestamp: new Date()
    }

    setMessages(prevMessages => [...prevMessages, userMessage])

    // Add typing indicator
    const typingIndicator = {
      id: messages.length + 2,
      sender: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }

    setMessages(prevMessages => [...prevMessages, typingIndicator])

    try {
      const response = await axios.post('/api/chat', {
        message: `Rate team ${teamId}`
      })

      // Replace typing indicator with actual message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isTyping ? {
            ...msg,
            content: formatMessage(response.data.response),
            isTyping: false
          } : msg
        )
      )
    } catch (error) {
      // Replace typing indicator with error message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isTyping ? {
            ...msg,
            content: "Sorry, I couldn't retrieve that team's information. Please check the team ID and try again.",
            isTyping: false
          } : msg
        )
      )
      console.error('Error rating team:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (text) => {
    if (!text) return ""
    
    // Convert bullet points (lines starting with * or -) to HTML list
    let formattedText = text.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    if (formattedText.includes('<li>')) {
      formattedText = formattedText.replace(/<li>(.+)<\/li>/g, '<ul><li>$1</li></ul>')
      formattedText = formattedText.replace(/<\/ul>\s*<ul>/g, '')
    }
    
    // Make section headings bold
    formattedText = formattedText.replace(/^(#+) (.+)$/gm, (match, hashes, content) => {
      return `<h${hashes.length}>${content}</h${hashes.length}>`
    })
    
    // Convert line breaks to <br>
    formattedText = formattedText.replace(/\n/g, '<br>')
    
    return formattedText
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>FPL Assistant</h2>
        <p>Ask about players, strategies, or get advice on transfers</p>
      </div>
      
      <TeamSearch onTeamSearch={handleTeamSearch} />
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.isTyping ? (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: message.sender === 'bot' ? message.content : message.content }}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask about players, fixtures, or strategy..."
          disabled={isLoading}
        />
        <button type="submit" disabled={!inputMessage.trim() || isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatBot 