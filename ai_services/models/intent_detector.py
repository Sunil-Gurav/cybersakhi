def detect_intent(text):
    """
    Enhanced intent detection for safety-focused conversations.
    Uses keyword-based classification with expanded safety categories.
    """
    text = text.lower()

    # Emergency and SOS
    if any(word in text for word in ["help", "bachao", "save", "sos", "emergency", "danger", "threat"]):
        return "sos"

    # Location and navigation
    elif any(word in text for word in ["location", "where am i", "gps", "directions", "lost", "find"]):
        return "location"

    # Crime and security
    elif any(word in text for word in ["crime", "danger", "risk", "attack", "harassment", "stalking"]):
        return "crime"

    # Travel and movement safety
    elif any(word in text for word in ["travel", "alone", "night", "dark", "walking", "roads", "street", "public transport", "road", "path", "route", "journey", "commute", "bus", "train", "auto", "rickshaw", "taxi", "cab", "uber", "ola", "rapido"]):
        return "travel_safety"

    # Personal safety tips
    elif any(word in text for word in ["tips", "advice", "safety", "safe", "protect", "prevent", "how to", "what if"]):
        return "safety_tips"

    # Emotional support
    elif any(word in text for word in ["scared", "afraid", "fear", "anxious", "worried", "panic", "distress"]):
        return "emotional_support"

    # Harassment specific
    elif any(word in text for word in ["harassed", "unwanted", "attention", "following", "creepy", "uncomfortable"]):
        return "harassment"

    else:
        return "general"
