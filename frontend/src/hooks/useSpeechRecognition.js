// frontend/src/hooks/useSpeechRecognition.js
import { useEffect, useRef, useState } from "react";

export default function useSpeechRecognition(options = {}) {
    const { lang = "en-IN", onResult = () => {} } = options;

    const recognitionRef = useRef(null);
    const [listening, setListening] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn("SpeechRecognition not supported in this browser.");
            setSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = lang;

        recognition.onstart = function() {
            setListening(true);
        };

        recognition.onend = function() {
            setListening(false);
            // 🔁 Restart automatically for continuous listening
            try {
                setTimeout(() => recognition.start(), 1000);
            } catch (err) {
                console.warn("Restart error:", err);
            }
        };

        recognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
            setListening(false);
        };

        recognition.onresult = function(event) {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            if (onResult && typeof onResult === "function") {
                onResult(transcript);
            }
        };

        recognitionRef.current = recognition;

        return function cleanup() {
            if (recognition) {
                try {
                    recognition.stop();
                } catch (e) {
                    console.warn("Error stopping recognition:", e);
                }
            }
        };
    }, [lang, onResult]);

    const startListening = function() {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn("Recognition start error:", e);
            }
        }
    };

    const stopListening = function() {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn("Recognition stop error:", e);
            }
        }
    };

    return { listening, supported, startListening, stopListening };
}