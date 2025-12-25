import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Send, Volume2 } from "lucide-react";
import axios from "axios"; // Import axios
import "../styles/AIAssistantPage.css";

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I’m CyberSathi — your AI safety friend 💜" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const [lastBotReply, setLastBotReply] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎤 Single-Time Voice Input
  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert("Voice recognition not supported 😔");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setInput(voiceText);
    };
  };

  // 🔊 Manual Speak Bot Reply
  const speak = (text) => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.pitch = 1.1;
    speech.rate = 1;

    const femaleVoice = speechSynthesis
      .getVoices()
      .find((v) => v.name.toLowerCase().includes("female"));

    if (femaleVoice) speech.voice = femaleVoice;

    window.speechSynthesis.speak(speech);
  };

  // ✉️ Send Message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    // Clear input
    setInput("");

    try {
      const response = await axios.post("/api/ai/chat", { message: input });
      const botResponse = {
        from: "bot",
        text: response.data.reply,
      };
      setMessages((prev) => [...prev, botResponse]);
      setLastBotReply(botResponse.text);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      const errorBotResponse = {
        from: "bot",
        text: "Oops! Something went wrong while talking to the AI. Please try again.",
      };
      setMessages((prev) => [...prev, errorBotResponse]);
      setLastBotReply(errorBotResponse.text);
    }
  };

  return (
    <div className="ai-page">
      <motion.div
        className="ai-chatbox"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* HEADER */}
        <div className="ai-header">
          <h2>CyberSathi AI Assistant 💜</h2>
          <p>Your personal cyber safety companion</p>
        </div>

        {/* CHAT MESSAGES */}
        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`ai-msg ${msg.from === "user" ? "user-msg" : "bot-msg"}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT SECTION */}
        <div className="ai-input-area">
          <button className="btn-voice" onClick={handleVoiceInput}>
            <Mic size={22} />
          </button>

          <input
            type="text"
            placeholder="Type or speak your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button className="btn-send" onClick={handleSend}>
            <Send size={22} />
          </button>
        </div>

        {/* MANUAL VOICE PLAYBACK ONLY */}
        {lastBotReply && (
          <div className="voice-replay-area">
            <button className="btn-speak" onClick={() => speak(lastBotReply)}>
              <Volume2 size={20} /> Hear AI Reply
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIAssistantPage;
