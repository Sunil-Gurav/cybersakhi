def detect_voice_trigger(text):
    text = text.lower()

    keywords = [
        "help me",
        "save me",
        "bachao",
        "mujhe bachao",
        "sos",
        "emergency",
        "please help"
    ]

    for word in keywords:
        if word in text:
            return "triggered"

    return "safe"
