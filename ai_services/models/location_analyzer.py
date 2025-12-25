import logging
from datetime import datetime
from typing import Dict, Any
import requests
from .geocoding_service import RealGeocoder
from .safety_predictor import SafetyPredictor

logger = logging.getLogger(__name__)

class LocationAnalyzer:
    def __init__(self, geocoder: RealGeocoder, safety_predictor: SafetyPredictor):
        self.geocoder = geocoder
        self.safety_predictor = safety_predictor
    
    async def analyze_complete_location(self, location_data) -> Dict[str, Any]:
        """Complete location analysis with real address and safety scoring"""
        
        # Get real address details
        address_info = await self.geocoder.get_real_address(
            location_data.latitude, 
            location_data.longitude
        )
        
        # Get weather data
        weather_data = await self._get_weather_data(location_data.latitude, location_data.longitude)
        
        # Prepare features for safety prediction
        features = {
            'latitude': location_data.latitude,
            'longitude': location_data.longitude,
            'hour': location_data.hour or datetime.now().hour,
            'day_of_week': location_data.day_of_week or datetime.now().weekday(),
            'weather': weather_data,
            'time_of_day': location_data.time_of_day,
            'address_components': address_info['components'],
            'area_type': self.safety_predictor.detect_area_type(address_info),
            'city_size': self._get_city_size(address_info['components'].get('city', ''))
        }
        
        # Calculate safety score
        safety_score = self.safety_predictor.predict_safety_score(features)
        
        # Generate insights
        risk_factors = self.safety_predictor.get_risk_factors(safety_score, features)
        recommendations = self.safety_predictor.get_safety_recommendations(safety_score, risk_factors, features)
        risk_level = self.safety_predictor.get_risk_level(safety_score)
        
        # Prepare final response
        response = {
            'safety_score': safety_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'area_type': features['area_type'],
            'address_info': address_info,
            'weather': weather_data,
            'confidence_score': 0.85,
            'timestamp': datetime.now().isoformat(),
            'city_name': address_info['components'].get('city') or address_info['components'].get('town') or 'Your Location',
            'area_name': address_info['components'].get('neighbourhood') or address_info['components'].get('suburb') or address_info['components'].get('road') or 'Current Area'
        }
        
        logger.info(f"✅ Analysis complete - Safety: {safety_score}, City: {response['city_name']}")
        return response
    
    async def _get_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather data"""
        try:
            response = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    'latitude': lat,
                    'longitude': lon,
                    'current_weather': 'true',
                    'timezone': 'auto'
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    'temperature': data['current_weather']['temperature'],
                    'condition': self._get_weather_condition(data['current_weather']['weathercode'])
                }
        except Exception as e:
            logger.warning(f"🌤️ Weather API error: {e}")
        
        return {'temperature': None, 'condition': 'unknown'}
    
    def _get_weather_condition(self, weather_code: int) -> str:
        """Convert weather code to condition"""
        weather_codes = {
            0: 'clear', 1: 'clear', 2: 'partly_cloudy', 3: 'overcast',
            45: 'fog', 48: 'fog', 51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
            61: 'rain', 63: 'rain', 65: 'heavy_rain', 80: 'rain', 81: 'rain', 82: 'heavy_rain',
            95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm'
        }
        return weather_codes.get(weather_code, 'unknown')
    
    def _get_city_size(self, city: str) -> str:
        """Determine city size based on name (simplified)"""
        metro_cities = ['delhi', 'mumbai', 'kolkata', 'chennai', 'bangalore', 'hyderabad', 'pune']
        if city.lower() in metro_cities:
            return 'metro'
        elif city:
            return 'medium'
        else:
            return 'small'