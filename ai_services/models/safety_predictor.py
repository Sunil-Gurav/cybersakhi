import numpy as np
from datetime import datetime
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class SafetyPredictor:
    def __init__(self):
        # In production, load your actual trained model here
        self.model = None
    
    def predict_safety_score(self, features: Dict[str, Any]) -> float:
        """
        Predict safety score based on location features
        Returns score between 1-10 (10 being safest)
        """
        base_score = 7.0
        
        # Time-based factors (25% weight)
        hour = features.get('hour', 12)
        if 22 <= hour <= 23 or 0 <= hour <= 5:  # Late night
            base_score -= 2.5
        elif 18 <= hour <= 21:  # Evening
            base_score -= 1.5
        elif 6 <= hour <= 17:  # Daytime
            base_score += 0.5
        
        # Area type factors (30% weight)
        area_type = features.get('area_type', 'unknown')
        if area_type == 'residential':
            base_score += 1.5
        elif area_type == 'commercial':
            base_score += 0.5
        elif area_type == 'industrial':
            base_score -= 1.0
        elif area_type == 'isolated':
            base_score -= 2.0
        
        # Weather factors (20% weight)
        weather = features.get('weather', {}).get('condition', 'clear')
        if weather in ['heavy_rain', 'storm', 'thunderstorm']:
            base_score -= 2.0
        elif weather in ['rain', 'fog']:
            base_score -= 1.0
        
        # Urban vs Rural (15% weight)
        city_size = features.get('city_size', 'medium')
        if city_size == 'metro':
            base_score -= 0.5  # Metropolitan areas have mixed safety
        elif city_size == 'small':
            base_score += 1.0
        
        # Weekend factors (10% weight)
        day_of_week = features.get('day_of_week', 0)
        if day_of_week in [5, 6]:  # Weekend
            base_score -= 0.5
        
        return max(1.0, min(10.0, round(base_score, 1)))
    
    def detect_area_type(self, address_components: Dict[str, Any]) -> str:
        """Detect area type based on address components"""
        place_type = address_components.get('place_type', '')
        road = address_components.get('road', '')
        city = address_components.get('city', '')
        
        if any(keyword in str(address_components.values()).lower() for keyword in ['mall', 'market', 'shop']):
            return 'commercial'
        elif any(keyword in str(address_components.values()).lower() for keyword in ['factory', 'industrial']):
            return 'industrial'
        elif road and not address_components.get('house_number'):
            return 'highway'
        elif not city and not road:
            return 'isolated'
        else:
            return 'residential'
    
    def get_risk_factors(self, safety_score: float, features: Dict[str, Any]) -> List[str]:
        """Identify specific risk factors"""
        factors = []
        
        hour = features.get('hour', 12)
        if 18 <= hour <= 23 or 0 <= hour <= 6:
            factors.append("Night time - Reduced visibility")
        
        weather = features.get('weather', {}).get('condition', 'clear')
        if weather in ['rain', 'storm', 'fog', 'heavy_rain']:
            factors.append(f"Weather: {weather}")
        
        area_type = features.get('area_type')
        if area_type == 'industrial':
            factors.append("Industrial area")
        elif area_type == 'isolated':
            factors.append("Isolated location")
        elif area_type == 'highway':
            factors.append("Highway/road area")
        
        if safety_score <= 4:
            factors.append("High risk area")
        elif safety_score <= 6:
            factors.append("Moderate risk area")
        
        return factors
    
    def get_safety_recommendations(self, safety_score: float, risk_factors: List[str], features: Dict[str, Any]) -> List[str]:
        """Generate personalized safety recommendations"""
        recommendations = []
        
        # Base recommendations
        recommendations.append("Stay aware of your surroundings")
        recommendations.append("Keep emergency contacts accessible")
        
        # Time-based recommendations
        hour = features.get('hour', 12)
        if hour >= 18:
            recommendations.append("Use well-lit routes")
            recommendations.append("Avoid isolated shortcuts")
        
        # Weather-based recommendations
        weather = features.get('weather', {}).get('condition', 'clear')
        if weather in ['rain', 'storm']:
            recommendations.append("Seek shelter if weather worsens")
        
        # Area-based recommendations
        area_type = features.get('area_type')
        if area_type == 'industrial':
            recommendations.append("Stay on main roads")
        elif area_type == 'isolated':
            recommendations.append("Share your live location")
        
        # Risk-level specific recommendations
        if safety_score <= 5:
            recommendations.append("Consider using trusted transportation")
            recommendations.append("Avoid staying alone")
        
        return recommendations[:4]
    
    def get_risk_level(self, safety_score: float) -> str:
        """Convert safety score to risk level"""
        if safety_score >= 8:
            return "Low Risk"
        elif safety_score >= 6:
            return "Moderate Risk"
        elif safety_score >= 4:
            return "High Risk"
        else:
            return "Very High Risk"