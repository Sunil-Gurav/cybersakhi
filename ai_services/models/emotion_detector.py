def detect_emotion(text):
    """
    Enhanced emotion detection for safety conversations.
    Analyzes emotional state to provide appropriate support.
    """
    text = text.lower()

    # Positive emotions
    if any(word in text for word in ["happy", "good", "great", "awesome", "fine", "okay", "confident", "safe"]):
        return "happy"

    # Negative emotions - sadness
    elif any(word in text for word in ["sad", "bad", "terrible", "awful", "depressed", "down", "unhappy", "low"]):
        return "sad"

    # Negative emotions - anger
    elif any(word in text for word in ["angry", "mad", "furious", "rage", "frustrated", "annoyed", "irritated"]):
        return "angry"

    # Fear and anxiety
    elif any(word in text for word in ["scared", "afraid", "fear", "terrified", "anxious", "worried", "panic", "nervous"]):
        return "scared"

    # Distress and panic
    elif any(word in text for word in ["distress", "crisis", "emergency", "help", "danger", "threat", "unsafe"]):
        return "distressed"

    else:
        return "neutral"
