import React, { useState } from "react";
import { motion } from "framer-motion";
import "../styles/EmotionAi.css";

const emotions = {
  happy: "😊 You seem cheerful today! Keep spreading positivity 💜",
  sad: "😢 It’s okay to feel low sometimes. Take a deep breath and remember — you’re never alone 💜",
  angry: "😠 Try to relax. Step away, breathe slowly, and find your calm. You’ve got this 💪",
  anxious: "😟 You seem a bit stressed. It’s okay to pause and take things one step at a time 🌸",
  neutral: "🙂 Stay balanced and mindful. Every emotion teaches us something valuable.",
};

const EmotionAi = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const analyzeEmotion = () => {
    if (!text.trim()) return alert("Please type something first!");

    const lower = text.toLowerCase();
    let emotion = "neutral";

    if (lower.includes("happy") || lower.includes("great") || lower.includes("good"))
      emotion = "happy";
    else if (lower.includes("sad") || lower.includes("depressed") || lower.includes("cry"))
      emotion = "sad";
    else if (lower.includes("angry") || lower.includes("mad") || lower.includes("furious"))
      emotion = "angry";
    else if (lower.includes("scared") || lower.includes("nervous") || lower.includes("worried"))
      emotion = "anxious";

    setResult({ type: emotion, message: emotions[emotion] });
  };

  return (
    <div className="emotion-container">
      <motion.div
        className="emotion-box"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1>💜 Emotion-Based AI Interaction</h1>
        <p>
          Tell CyberSathi how you’re feeling, and it will respond with care and support 💬
        </p>

        <textarea
          className="emotion-input"
          placeholder="Type how you feel today..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <button className="btn-analyze" onClick={analyzeEmotion}>
          Analyze Emotion
        </button>

        {result && (
          <motion.div
            className={`emotion-result ${result.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p>{result.message}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default EmotionAi;
