import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Mic, Square, Volume2, Globe } from "lucide-react";
import "../styles/TalkingAssistant.css";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import api from "../api/apiclient";

/* ------------------------------------------------------
      BEAUTIFUL 3D GIRL AVATAR
------------------------------------------------------ */
const GirlAvatar = ({ speaking }) => {
  const group = useRef();
  const mouthRef = useRef();
  const { scene, animations } = useGLTF("/models/girl_avatar.glb");
  const mixer = useRef();

  useEffect(() => {
    if (animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene);
      const action = mixer.current.clipAction(animations[0]);
      action.play();
    }

    // detect mouth
    scene.traverse((obj) => {
      if (obj.name.toLowerCase().includes("mouth")) mouthRef.current = obj;
    });
  }, [scene, animations]);

  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta);

    if (mouthRef.current) {
      mouthRef.current.scale.y = speaking
        ? 1 + Math.sin(state.clock.elapsedTime * 18) * 0.35
        : 1;
    }

    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
    }
  });

  return (
    <group ref={group} scale={1.7} position={[0, -1.5, 0]}>
      <primitive object={scene} />
    </group>
  );
};

/* ------------------------------------------------------
                TALKING ASSISTANT MAIN
------------------------------------------------------ */
const TalkingAssistant = ({ onClose }) => {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState(
    "Hi 💜 I'm CyberSathi, talk to me anytime!"
  );
  const [show3D, setShow3D] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState("en-IN"); // Language state

  const recognitionRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/assistant/history/${sessionId}`);
      if (response.data.messages.length > 0) {
        const lastBotMessage = response.data.messages
          .filter((msg) => msg.from === "bot")
          .pop();
        if (lastBotMessage) {
          setMessage(lastBotMessage.text);
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  /* --------------------------------------------------
            START LISTENING (TALK BUTTON)
  -------------------------------------------------- */
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert("Voice recognition not supported!");

    const recog = new SpeechRecognition();
    recog.lang = language; // Use selected language
    recog.continuous = true;
    recog.interimResults = false;

    recog.onstart = () => setListening(true);

    recog.onresult = async (event) => {
      const text = event.results[event.resultIndex][0].transcript;
      setMessage(`You: ${text}`);

      const reply = await sendToAI(text);

      speak(reply);
      setMessage(reply);
    };

    recog.onend = () => {
      if (listening && !speaking) recog.start();
    };

    recognitionRef.current = recog;
    recog.start();
  };

  /* --------------------------------------------------
                STOP LISTENING
  -------------------------------------------------- */
  const stopListening = () => {
    setListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  };

  /* --------------------------------------------------
          SEND TEXT TO AI SERVICE (BACKEND)
  -------------------------------------------------- */
  const sendToAI = async (text) => {
    try {
      const response = await api.post("/assistant/chat", {
        prompt: text,
        sessionId,
      });
      const newSessionId = response.data.sessionId;
      if (!sessionId) setSessionId(newSessionId);
      return response.data.reply;
    } catch (err) {
      console.error("AI error:", err);
      return "Sorry, something went wrong! Please try again 💜";
    }
  };

  /* --------------------------------------------------
                SPEAK AI RESPONSE
  -------------------------------------------------- */
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language; // Use selected language
    utter.pitch = 1;
    utter.rate = 1;

    utter.onstart = () => {
      setSpeaking(true);
      stopListening();
    };

    utter.onend = () => {
      setSpeaking(false);
      if (listening) startListening();
    };

    window.speechSynthesis.speak(utter);
  };

  /* CLEANUP */
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopListening();
    };
  }, []);

  return (
    <motion.div
      className="assistant-container"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* AVATAR */}
      <div className="avatar-wrapper">
        {show3D ? (
          <Canvas camera={{ position: [0, 2, 4], fov: 40 }}>
            <ambientLight intensity={1} />
            <directionalLight position={[3, 5, 5]} intensity={1.5} />
            <GirlAvatar speaking={speaking} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        ) : (
          <div className={`ai-avatar-2d ${speaking ? "talking" : ""}`}>
            <div className="avatar-face">
              <div className="eye left"></div>
              <div className="eye right"></div>
              <div className={`mouth ${speaking ? "talking" : ""}`}></div>
            </div>
          </div>
        )}

        <button
          className="btn-toggle-avatar"
          onClick={() => setShow3D(!show3D)}
        >
          {show3D ? "Switch to 2D" : "Switch to 3D"}
        </button>
      </div>

      {/* MESSAGE */}
      <div className="assistant-message">
        <motion.p key={message}>{message}</motion.p>
      </div>

      {/* CONTROLS */}
      <div className="assistant-controls">
        {/* TALK / STOP BUTTON */}
        {listening ? (
          <motion.button className="btn-stop" onClick={stopListening}>
            <Square size={20} /> Stop
          </motion.button>
        ) : (
          <motion.button className="btn-voice" onClick={startListening}>
            <Mic size={20} /> Talk
          </motion.button>
        )}

        <motion.button className="btn-speak" onClick={() => speak(message)}>
          <Volume2 size={20} /> Repeat
        </motion.button>

        {/* LANGUAGE SELECTOR */}
        <div className="language-selector">
          <Globe size={20} />
          <select onChange={(e) => setLanguage(e.target.value)} value={language}>
            <option value="en-IN">English</option>
            <option value="mr-IN">Marathi</option>
            <option value="kn-IN">Kannada</option>
          </select>
        </div>
      </div>

      {/* CLOSE */}
      <motion.button
        className="btn-close"
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            // Fallback for direct usage
            const container = document.querySelector(".assistant-container");
            if (container && container.parentNode) {
              container.parentNode.removeChild(container);
            }
          }
        }}
      >
        <X size={18} />
      </motion.button>
    </motion.div>
  );
};

export default TalkingAssistant;
