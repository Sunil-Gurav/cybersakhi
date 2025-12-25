from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import our custom modules
from models.location_analyzer import LocationAnalyzer
from models.geocoding_service import RealGeocoder
from models.safety_predictor import SafetyPredictor
from models.active_voice_detection import detect_voice_trigger
from models.emotion_detector import detect_emotion
from models.crime_prediction import predict_crime_risk

app = FastAPI(title="CyberSathi AI Location Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class CrimePredictionRequest(BaseModel):
    lat: float
    lon: float
    time_of_day: str
    weather: str
    user_profile: str
    location_name: Optional[str] = None
    area_type: Optional[str] = None

class LocationAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    timestamp: Optional[str] = None
    user_id: Optional[str] = None
    time_of_day: Optional[str] = None
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    weather: Optional[Dict[str, Any]] = None
    
    class Config:
        # Allow extra fields to be ignored instead of causing validation errors
        extra = "ignore"

class BatchLocationRequest(BaseModel):
    locations: List[Dict[str, Any]]

class PatternAnalysisRequest(BaseModel):
    user_id: str
    days: int = 30
    locations: Optional[List[Dict[str, Any]]] = None

# Initialize services
geocoder = RealGeocoder()
safety_predictor = SafetyPredictor()
location_analyzer = LocationAnalyzer(geocoder, safety_predictor)

# Location Analysis Endpoint
@app.post("/ai/analyze-location")
async def analyze_location(data: LocationAnalysisRequest):
    try:
        logger.info(f"📍 Analyzing location: {data.latitude}, {data.longitude}")
        
        # Perform comprehensive location analysis
        analysis_result = await location_analyzer.analyze_complete_location(data)
        
        logger.info(f"✅ Location analysis completed for {analysis_result.get('city_name', 'Unknown')}")
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"❌ Error in location analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Location analysis failed")

@app.post("/ai/analyze-locations-batch")
async def analyze_locations_batch(data: BatchLocationRequest):
    try:
        results = []
        for location in data.locations:
            location_data = LocationAnalysisRequest(**location)
            result = await location_analyzer.analyze_complete_location(location_data)
            results.append(result)
        
        return {'analyses': results}
        
    except Exception as e:
        logger.error(f"❌ Error in batch location analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Batch analysis failed")
    
@app.post("/ai/debug-location")
async def debug_location(data: LocationAnalysisRequest):
    """Debug endpoint to see what coordinates we're receiving"""
    logger.info(f"🔍 DEBUG - Received coordinates: {data.latitude}, {data.longitude}")
    
    # Test with multiple geocoding services
    from models.geocoding_service import RealGeocoder
    geocoder = RealGeocoder()
    
    results = {}
    
    # Test OpenStreetMap
    try:
        nominatim_result = await geocoder._get_nominatim_address(data.latitude, data.longitude)
        results['openstreetmap'] = nominatim_result
    except Exception as e:
        results['openstreetmap_error'] = str(e)
    
    # Test BigDataCloud
    try:
        bigdata_result = await geocoder._get_bigdatacloud_address(data.latitude, data.longitude)
        results['bigdatacloud'] = bigdata_result
    except Exception as e:
        results['bigdatacloud_error'] = str(e)
    
    return {
        'received_coordinates': {
            'latitude': data.latitude,
            'longitude': data.longitude,
            'accuracy': data.accuracy
        },
        'geocoding_results': results,
        'your_device_time': datetime.now().isoformat()
    }    

@app.post("/ai/analyze-patterns")
async def analyze_patterns(data: PatternAnalysisRequest):
    try:
        # This would analyze historical location data for patterns
        pattern_analysis = {
            'frequent_locations': [],
            'risk_patterns': [],
            'safety_trends': {
                'overall_trend': 'stable',
                'high_risk_periods': ['20:00-02:00'],
                'safe_locations': []
            },
            'recommendations': [
                "Consider varying your routine for enhanced safety",
                "Avoid high-risk areas during night hours"
            ]
        }
        
        return pattern_analysis
        
    except Exception as e:
        logger.error(f"❌ Error in pattern analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Pattern analysis failed")

# Active Voice Detection Endpoint
@app.post("/ai/active-voice")
async def active_voice_detection(data: Dict[str, Any]):
    try:
        text = data.get("text", "")
        if not text:
            return {"trigger": "safe"}

        trigger = detect_voice_trigger(text)
        logger.info(f"🎤 Active voice detection: '{text}' -> {trigger}")

        return {"trigger": trigger}

    except Exception as e:
        logger.error(f"❌ Error in active voice detection: {str(e)}")
        return {"trigger": "safe"}

# Emotion Detection Endpoint
@app.post("/ai/emotion")
async def emotion_detection(data: Dict[str, Any]):
    try:
        text = data.get("text", "")
        if not text:
            return {"emotion": "neutral"}

        emotion = detect_emotion(text)
        logger.info(f"😊 Emotion detection: '{text}' -> {emotion}")

        return {"emotion": emotion}

    except Exception as e:
        logger.error(f"❌ Error in emotion detection: {str(e)}")
        return {"emotion": "neutral"}

# Conversation Endpoint
@app.post("/ai/conversation")
async def conversation_endpoint(data: Dict[str, Any]):
    try:
        user_input = data.get("user_input", "")
        chat_history = data.get("chat_history", [])

        if not user_input:
            return {"reply": "Please provide a message to continue our conversation."}

        from models.conversational_assistant import generate_response
        reply = generate_response(user_input, chat_history)

        logger.info(f"💬 Conversation: '{user_input}' -> '{reply[:50]}...'")

        return {"reply": reply}

    except Exception as e:
        logger.error(f"❌ Error in conversation: {str(e)}")
        return {"reply": "I'm having trouble responding right now. Please try again."}

# Crime Prediction Endpoint
@app.post("/ai/predict-crime")
async def predict_crime_endpoint(data: CrimePredictionRequest):
    try:
        logger.info(f"🔮 Predicting crime risk for: {data.lat}, {data.lon}")
        
        # Perform crime risk prediction with enhanced parameters
        prediction_result = predict_crime_risk(
            lat=data.lat,
            lon=data.lon,
            time_of_day=data.time_of_day,
            weather=data.weather,
            user_profile=data.user_profile,
            location_name=data.location_name,
            area_type=data.area_type
        )
        
        logger.info(f"✅ Crime prediction completed: {prediction_result['risk']} ({prediction_result['score']}/10)")
        
        return prediction_result
        
    except Exception as e:
        logger.error(f"❌ Error in crime prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Crime prediction failed")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "CyberSathi AI Location Service",
        "features": ["real_geocoding", "safety_scoring", "weather_integration", "active_voice", "emotion_detection"]
    }

@app.get("/")
async def home():
    return {
        "message": "CyberSathi AI Location Service 🗺️", 
        "version": "2.0",
        "description": "Real-time location analysis with AI/ML"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)