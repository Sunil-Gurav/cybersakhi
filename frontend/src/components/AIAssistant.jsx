import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Send, 
  X, 
  Sparkles, 
  Play, 
  Square, 
  MicOff, 
  Volume2, 
  VolumeX,
  Bot,
  User,
  Zap,
  Heart,
  Download,
  Trash2,
  Clock
} from "lucide-react";
import "../styles/AIAssistant.css";
import api from "../api/apiclient";

const AIAssistant = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { 
      from: "bot", 
      text: "Hi, I'm your CyberSathi 💜 — how can I help you today?",
      timestamp: new Date(),
      emotion: "happy"
    },
  ]);

  const [input, setInput] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const speechSynthesis = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesis.current = window.speechSynthesis;
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  // Load chat history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("cybersathi_chat_history");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
    
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/assistant/history/${sessionId}`);
      if (response.data.messages.length > 0) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  }, [messages]);

  // Save chat history
  const saveChatToHistory = () => {
    const chatData = {
      id: Date.now(),
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: messages,
      timestamp: new Date()
    };
    
    const updatedHistory = [chatData, ...chatHistory.slice(0, 9)]; // Keep last 10 chats
    setChatHistory(updatedHistory);
    localStorage.setItem("cybersathi_chat_history", JSON.stringify(updatedHistory));
  };

  // Load specific chat from history
  const loadChatFromHistory = (chat) => {
    setMessages(chat.messages);
    setActiveTab("chat");
  };

  // Clear current chat
  const clearChat = () => {
    setMessages([
      { 
        from: "bot", 
        text: "Hi, I'm your CyberSathi 💜 — how can I help you today?",
        timestamp: new Date(),
        emotion: "happy"
      }
    ]);
  };

  // -----------------------
  // 📌 SEND MESSAGE
  // -----------------------
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { 
      from: "user", 
      text: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const prompt = input;
    setIsTyping(true);

    try {
      const response = await api.post("/assistant/chat", { prompt, sessionId });
      const reply = response.data.reply;
      const newSessionId = response.data.sessionId;

      if (!sessionId) setSessionId(newSessionId);

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMsg = { 
          from: "bot", 
          text: reply,
          timestamp: new Date(),
          emotion: "helpful"
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);

        // Speak reply if voice is enabled
        if (voiceEnabled && "speechSynthesis" in window) {
          speakMessage(reply);
        }

        // Save to history after bot response
        saveChatToHistory();
      }, 1000 + Math.random() * 1000);

    } catch (err) {
      console.log(err);
      const errorMsg = { 
        from: "bot", 
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        emotion: "sad"
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  // -----------------------
  // 🔊 SPEAK MESSAGE
  // -----------------------
  const speakMessage = (text) => {
    if (!speechSynthesis.current) return;

    // Cancel any ongoing speech
    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
    }
  };

  // -----------------------
  // 🎤 VOICE RECOGNITION
  // -----------------------
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("❌ Voice recognition is not supported in your browser");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = isContinuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = async (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setInput(finalTranscript);

        // Detect emotion from voice input
        try {
          const emotionResponse = await api.post("/ai/emotion", { text: finalTranscript });
          const detectedEmotion = emotionResponse.data.emotion;

          // Update emotion in localStorage and emit to dashboards
          localStorage.setItem("currentEmotion", detectedEmotion);
          window.dispatchEvent(new CustomEvent("emotionUpdate", { 
            detail: { emotion: detectedEmotion } 
          }));

          console.log("🎭 Emotion detected from voice:", detectedEmotion);
        } catch (err) {
          console.error("Emotion detection failed:", err);
        }

        // Auto-send in continuous mode
        if (isContinuous) {
          setTimeout(() => handleSend(), 400);
        }
      }
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      if (isContinuous && recognition) {
        recognition.start();
      }
    };

    rec.start();
    setRecognition(rec);
  };

  // -----------------------
  // 🛑 STOP LISTENING
  // -----------------------
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  // -----------------------
  // 🔄 CONTINUOUS MODE
  // -----------------------
  const toggleContinuousMode = () => {
    if (isContinuous) {
      stopListening();
      setIsContinuous(false);
    } else {
      setIsContinuous(true);
      startListening();
    }
  };

  // -----------------------
  // 📥 QUICK ACTIONS
  // -----------------------
  const quickActions = [
    { text: "What's my current safety risk?", icon: "🛡️" },
    { text: "How to stay safe online?", icon: "🌐" },
    { text: "Emergency contacts near me", icon: "🚨" },
    { text: "Check my emotional state", icon: "😊" }
  ];

  const handleQuickAction = (text) => {
    setInput(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="ai-assistant"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Header */}
        <div className="ai-header">
          <div className="header-left">
            <motion.div 
              className="ai-avatar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bot size={20} />
            </motion.div>
            <div className="header-text">
              <h3>CyberSathi Assistant</h3>
              <span className="status">
                {isTyping ? "Typing..." : isListening ? "Listening..." : "Online"}
              </span>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className={`voice-toggle ${voiceEnabled ? 'active' : ''}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Disable voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            
            <motion.button 
              onClick={onClose} 
              className="ai-close"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="ai-tabs">
          <button 
            className={`tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            💬 Chat
          </button>
          <button 
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Clock size={16} />
            History
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            {/* Quick Actions */}
            {messages.length <= 2 && (
              <motion.div 
                className="quick-actions"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p>Quick questions:</p>
                <div className="action-buttons">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      className="action-btn"
                      onClick={() => handleQuickAction(action.text)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {action.icon} {action.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat Messages */}
            <div className="ai-chat">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`message ${msg.from === "user" ? "user-message" : "bot-message"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-avatar">
                    {msg.from === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                  {msg.from === "bot" && voiceEnabled && (
                    <button 
                      className="speak-btn"
                      onClick={() => isSpeaking ? stopSpeaking() : speakMessage(msg.text)}
                    >
                      {isSpeaking ? <Square size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div 
                  className="typing-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="typing-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} className="chat-anchor" />
            </div>

            {/* Voice Controls */}
            {/* <div className="voice-controls">
              {isListening ? (
                <motion.button 
                  className="btn-stop-listening"
                  onClick={stopListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MicOff size={16} />
                  Stop Listening
                  <div className="pulse-ring"></div>
                </motion.button>
              ) : (
                <motion.button 
                  className="btn-start-listening"
                  onClick={startListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic size={16} />
                  Start Listening
                </motion.button>
              )}
              
              <motion.button 
                className={`btn-continuous ${isContinuous ? 'active' : ''}`}
                onClick={toggleContinuousMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isContinuous ? <Square size={14} /> : <Play size={14} />}
                {isContinuous ? 'Continuous On' : 'Continuous'}
              </motion.button>
            </div> */}

            {/* Input Area */}
            <div className="ai-input-area">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask CyberSathi anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isListening}
                />
                <motion.button 
                  onClick={handleSend}
                  className="btn-send"
                  disabled={!input.trim() || isTyping}
                  whileHover={{ scale: input.trim() ? 1.1 : 1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="history-tab">
            <div className="history-header">
              <h4>Chat History</h4>
              <button 
                className="btn-clear-chat"
                onClick={clearChat}
                disabled={messages.length <= 1}
              >
                <Trash2 size={16} />
                Clear Current
              </button>
            </div>
            
            {chatHistory.length === 0 ? (
              <div className="empty-history">
                <Clock size={48} />
                <p>No chat history yet</p>
                <span>Your conversations will appear here</span>
              </div>
            ) : (
              <div className="history-list">
                {chatHistory.map((chat) => (
                  <motion.div
                    key={chat.id}
                    className="history-item"
                    onClick={() => loadChatFromHistory(chat)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="history-title">{chat.title}</div>
                    <div className="history-preview">
                      {chat.messages.slice(-1)[0]?.text.substring(0, 60)}...
                    </div>
                    <div className="history-time">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="ai-footer">
          <div className="footer-info">
            <Sparkles size={14} />
            <span>Powered by AI • Your Safety Companion</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;