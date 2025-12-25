from models.intent_detector import detect_intent
from models.emotion_detector import detect_emotion
import random
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_response(user_input, chat_history):
    """
    Enhanced conversational assistant using intent and emotion detection.
    Falls back to rule-based responses.
    """
    return generate_fallback_response(user_input, chat_history)

def generate_fallback_response(user_input, chat_history):
    """
    Rule-based fallback when OpenAI is unavailable.
    """
    intent = detect_intent(user_input)
    emotion = detect_emotion(user_input)

    # Analyze chat history for context
    history_intents = [detect_intent(msg['text']) for msg in chat_history if msg['from'] == 'user']
    history_emotions = [detect_emotion(msg['text']) for msg in chat_history if msg['from'] == 'user']

    # Determine if this is a continuation
    is_continuation = len(chat_history) > 0

    # Response templates based on intent and emotion
    responses = {
        "sos": {
            "happy": ["I'm glad you're feeling positive! For safety, remember to stay aware. How can I help more?"],
            "sad": ["I sense you're feeling down. If you're in danger, please contact emergency services immediately. I'm here to support you."],
            "angry": ["I understand you're upset. Safety first - if you're in a threatening situation, call for help right away."],
            "scared": ["I can tell you're scared. Stay calm and contact emergency services if needed. You're not alone."],
            "neutral": ["Safety is important. If you're in an emergency, please call local authorities. How can I assist?"]
        },
        "location": {
            "happy": ["Great to hear you're positive! For location help, share your GPS if safe. What do you need?"],
            "sad": ["I'm sorry you're feeling sad. For location assistance, consider sharing with trusted contacts."],
            "angry": ["I sense frustration. For location services, use safe apps. How can I help?"],
            "scared": ["I understand you're worried. For safety, share location with family. What assistance do you need?"],
            "neutral": ["For location help, use reliable apps. How can I assist with your safety?"]
        },
        "crime": {
            "happy": ["Good to see positivity! For crime concerns, stay vigilant. What information do you need?"],
            "sad": ["I'm sorry you're feeling down. For crime prevention, focus on safe practices. I'm here to help."],
            "angry": ["I understand your anger. For crime situations, report to authorities. How can I support you?"],
            "scared": ["I can tell you're afraid. For crime safety, avoid risky areas. What do you need?"],
            "neutral": ["For crime-related concerns, prioritize safety. How can I assist?"]
        },
        "safety_tips": {
            "happy": ["Great attitude! Here are some safety tips: Stay aware of your surroundings, avoid isolated areas at night, and trust your instincts. What else can I help with?"],
            "sad": ["I understand you're feeling low. Safety tips: Keep emergency contacts handy, use well-lit paths, and share your location with trusted people. You're not alone."],
            "angry": ["I sense frustration. Safety advice: If something feels off, leave the situation, report suspicious activity, and prioritize your well-being. How can I assist further?"],
            "scared": ["I can tell you're anxious. Safety tips: Carry a personal alarm, learn self-defense basics, and avoid sharing personal info online. Take deep breaths - you're safe."],
            "distressed": ["I can sense you're in distress. Safety first: Get to a safe place, call emergency services if needed, and reach out to trusted contacts. I'm here to help."],
            "neutral": ["Here are some general safety tips: Be mindful in crowded places, use ride-sharing apps safely, and keep your phone charged. How else can I help?"]
        },
        "travel_safety": {
            "happy": [
                "Great to see you're planning ahead! For safe travel: Always choose well-lit, busy streets over shortcuts. Share your location with a trusted friend or family member. Keep your phone charged and consider using ride-sharing apps with safety features. Safe travels! 💜",
                "Excellent mindset! Travel safety tips: Walk confidently but stay alert. Avoid isolated areas, especially at night. Use apps that let you share real-time location. Have emergency contacts saved and ready. You're making smart choices! 🌟",
                "Love your positive approach! For road safety: If walking, stick to main roads with traffic. For public transport, sit near the driver or in well-lit areas. Trust your instincts - if something feels off, change your route immediately. Stay safe out there! 🚶‍♀️"
            ],
            "sad": [
                "I can sense you're feeling down about travel. Safety first: Choose routes with more people around. Use trusted transportation services. Keep your phone accessible and charged. Remember, it's okay to ask for help if you feel unsafe. You're not alone. 💙",
                "Travel worries are valid. Safety tips: Plan your journey during daylight when possible. Avoid empty streets or isolated stops. Share your plans with someone you trust. If you're feeling anxious, consider having a friend accompany you. Take care of yourself. 🌙",
                "I understand travel can feel overwhelming. For your safety: Use well-established routes. Keep emergency numbers handy. If walking alone, stay in populated areas. It's okay to prioritize your comfort and safety above convenience. You're doing great. 🤗"
            ],
            "angry": [
                "I sense your frustration with travel situations. Safety advice: If a route feels unsafe, don't hesitate to change it. Report any suspicious activity to authorities. Use transportation with good safety records. Your safety comes first - trust your instincts! ⚠️",
                "Travel annoyances are common, but safety matters. Tips: Avoid shortcuts through dark or isolated areas. Use apps with safety features and real-time tracking. If someone makes you uncomfortable, move away and report if needed. Stay strong! 💪",
                "Your anger about unsafe travel is understandable. Safety measures: Choose busy, well-lit paths. Keep your distance from strangers. Use official transportation services. If you encounter harassment, document it and seek help. You deserve safe journeys! 🚫"
            ],
            "scared": [
                "I can tell travel makes you anxious. Safety tips: Plan routes in advance using safe, populated paths. Carry a personal alarm or safety app. Share your location in real-time with trusted contacts. Remember, it's okay to feel scared - just stay vigilant. 🛡️",
                "Travel fear is common and valid. For safety: Avoid walking alone at night. Use well-lit, busy streets. Keep your phone charged and accessible. Have emergency contacts ready. You're taking important steps by being aware. Take deep breaths. 😌",
                "I understand your travel worries. Safety measures: Choose transportation during peak hours. Stay in areas with other people. Use apps that allow emergency sharing. If you feel unsafe, get to a public place immediately. You're not alone in this. 🤝"
            ],
            "distressed": [
                "I can sense you're really distressed about travel. Please prioritize your safety: Get to a safe, public location immediately. Call emergency services if you're in danger. Contact trusted friends or family. Use official transportation only. You're taking the right steps. 🚨",
                "Travel distress is serious. Safety actions: Move to a populated area right now. Use emergency contacts. Avoid isolated routes. If you're being followed, go to a store or public place. Seek immediate help if needed. Stay safe! 📞",
                "Your distress about travel safety concerns me. Please: Get to safety immediately. Call local emergency services. Inform trusted contacts of your location. Use only verified transportation. You're doing the right thing by being cautious. Help is available. 🆘"
            ],
            "neutral": [
                "For safe travel: Always choose well-populated routes over shortcuts. Share your location with someone you trust. Keep your phone charged and emergency numbers saved. Use transportation services with good safety ratings. Stay aware of your surroundings. 🗺️",
                "Travel safety basics: Plan your route in advance. Avoid isolated areas, especially after dark. Use ride-sharing apps with safety features. Keep emergency contacts accessible. Trust your instincts and change plans if something feels off. 🚶‍♀️",
                "General travel safety: Stick to main roads and busy areas. Use public transport during peak hours. Share your plans with trusted people. Keep your phone battery full. Stay alert and aware. Safe journeys! ✨"
            ]
        },
        "emotional_support": {
            "happy": ["I'm glad you're feeling positive! Remember, it's okay to feel scared sometimes. You're strong and capable. How can I support you?"],
            "sad": ["I can tell you're feeling down. It's normal to feel anxious about safety. Take deep breaths - you're not alone in this. Would you like some calming techniques?"],
            "angry": ["I sense your frustration. Safety concerns can be overwhelming. Let's focus on what you can control. I'm here to help you feel more secure."],
            "scared": ["I understand your fear. Safety anxiety is valid. Remember: you're taking positive steps by being aware. Deep breathing can help - inhale for 4, hold for 4, exhale for 4."],
            "distressed": ["I can sense you're in emotional distress. Please know that your feelings are valid. If you're in immediate danger, contact emergency services. Otherwise, let's work through this together."],
            "neutral": ["Emotional safety is important too. If you're feeling anxious, try grounding techniques: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste."]
        },
        "harassment": {
            "happy": ["Good that you're addressing this! For harassment situations: Document everything, tell trusted people, and consider reporting to authorities. You're taking the right steps."],
            "sad": ["I'm sorry you're dealing with this. Harassment is never okay. Safety tips: Avoid contact, document incidents, and seek support from friends or professionals."],
            "angry": ["Your anger is justified - harassment is unacceptable. Safety advice: Report the behavior, avoid the person, and build your support network. You deserve to feel safe."],
            "scared": ["I understand how frightening harassment can be. Safety tips: Change your routine if needed, inform trusted contacts, and consider legal protection options."],
            "distressed": ["If you're experiencing harassment: Get to a safe place immediately, contact emergency services if you're in danger, and reach out to support organizations."],
            "neutral": ["For harassment situations: Trust your instincts, document all incidents, tell someone you trust, and know that help is available through local authorities or support lines."]
        },
        "general": {
            "happy": ["I'm glad you're feeling good! How can I help with your safety today?"],
            "sad": ["I sense you're feeling down. Remember, you're strong. How can I support you?"],
            "angry": ["I understand you're upset. Let's focus on positive steps. What can I do?"],
            "scared": ["I can tell you're worried. Take deep breaths - you're safe. How can I help?"],
            "neutral": ["Hello! I'm CyberSathi, your safety companion. How can I assist you today?"]
        }
    }

    # Get base response
    base_responses = responses.get(intent, responses["general"])
    response = random.choice(base_responses.get(emotion, base_responses["neutral"]))

    # Add context from history if continuation
    if is_continuation:
        if intent == "sos" and "sos" in history_intents:
            response += " I remember you mentioned safety concerns before. Are you still in danger?"
        elif emotion == "sad" and history_emotions.count("sad") > 1:
            response += " I notice you've been feeling down. Would you like resources for support?"
        elif intent == "general" and len(chat_history) > 4:
            response += " We've been chatting for a while. Is there anything specific on your mind?"

    return response
