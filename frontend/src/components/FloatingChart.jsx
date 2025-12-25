import React, { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import "../styles/FloatingChart.css";

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    { by: "bot", text: "👋 Hi! I’m your CyberSathi AI Assistant — how can I help you today?" },
  ]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const userMessage = { by: "you", text };
    setMessages([...messages, userMessage]);

    // 🔮 Simple AI replies (for now)
    let reply = "I’m here to help! You can ask about SOS, Legal Rights, or Cyber Tips.";

    if (/help|sos|emergency/i.test(text)) {
      reply = "🚨 Stay calm! You can trigger the SOS alert or share your live location.";
    } else if (/harass|abuse|stalk/i.test(text)) {
      reply = "📜 You can report harassment under IPC Section 354D. Would you like to open the Legal page?";
    } else if (/crime|unsafe|risk/i.test(text)) {
      reply = "🧠 AI Crime Predictor can analyze area safety. Click 'Analyze Area' on the Dashboard.";
    } else if (/sad|angry|fear|lonely/i.test(text)) {
      reply = "💜 I understand. You’re not alone. Try the Emotion Detector for mood support.";
    } else if (/cyber|fraud|phish/i.test(text)) {
      reply = "🔒 Cyber Tip: Never share OTPs or passwords. Always verify official sources.";
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { by: "bot", text: reply }]);
    }, 800);

    setText("");
  };

  return (
    <>
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open Chat">
          <MessageSquare size={22} />
        </button>
      )}

      {open && (
        <div className="chat-box">
          <div className="chat-head">
            <span>CyberSathi AI Helpline</span>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.by === "you" ? "me" : "bot"}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
