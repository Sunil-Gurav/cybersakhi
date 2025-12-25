// frontend/src/hooks/useVoice.js
import { useEffect, useRef, useState } from "react";

export default function useVoice(options = {}) {
    const { lang = "en-IN", pitch = 1, rate = 1 } = options;

    const [speaking, setSpeaking] = useState(false);
    const voicesRef = useRef([]);
    const closeTimerRef = useRef(null);

    // Load voices safely
    useEffect(() => {
        const synth = window.speechSynthesis;
        if (!synth) return;

        const loadVoices = () => {
            const voices = synth.getVoices();
            voicesRef.current = Array.isArray(voices) ? voices : [];
        };

        loadVoices();
        if (typeof synth.onvoiceschanged !== "undefined") {
            synth.onvoiceschanged = loadVoices;
        } else if (synth.addEventListener) {
            // fallback
            synth.addEventListener("voiceschanged", loadVoices);
        }

        return () => {
            if (synth && synth.removeEventListener) {
                synth.removeEventListener("voiceschanged", loadVoices);
            }
        };
    }, []);

    const pickFemaleVoice = () => {
        const voices = voicesRef.current || [];
        if (!voices.length) return null;

        const by = (v) => (v && v.name ? v.name.toLowerCase() : "");
        const lg = (v) => (v && v.lang ? v.lang.toLowerCase() : "");

        return (
            voices.find((v) => lg(v).indexOf("en-in") >= 0 && by(v).indexOf("female") >= 0) ||
            voices.find((v) => by(v).indexOf("female") >= 0) ||
            voices.find((v) => lg(v).indexOf("en-in") >= 0) ||
            voices[0]
        );
    };

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const speak = (text) => {
        const synth = window.speechSynthesis;
        if (!synth) {
            alert("Speech synthesis not supported in this browser.");
            return;
        }
        if (!text) return;

        // Stop any ongoing speech
        synth.cancel();
        clearCloseTimer();

        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.pitch = pitch;
        u.rate = rate;

        const voice = pickFemaleVoice();
        if (voice) u.voice = voice;

        u.onstart = () => {
            setSpeaking(true);
        };

        u.onend = () => {
            setSpeaking(false);
            clearCloseTimer();
        };

        u.onerror = () => {
            setSpeaking(false);
            clearCloseTimer();
        };

        // Open/close mouth with boundary ticks
        u.onboundary = () => {
            setSpeaking(true);
            clearCloseTimer();
            closeTimerRef.current = setTimeout(() => {
                setSpeaking(false);
            }, 100);
        };

        synth.speak(u);
    };

    const cancel = () => {
        const synth = window.speechSynthesis;
        if (synth) synth.cancel();
        clearCloseTimer();
        setSpeaking(false);
    };

    return { speak, speaking, cancel };
}