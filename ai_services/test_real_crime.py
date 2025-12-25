#!/usr/bin/env python3
"""
Test script for Real Crime Analysis
Run this to test the real crime analyzer functionality
"""

import asyncio
import json
from models.real_crime_analyzer import RealCrimeAnalyzer

async def test_real_crime_analysis():
    """Test real crime analysis with sample coordinates"""
    
    analyzer = RealCrimeAnalyzer()
    
    # Test locations (you can change these)
    test_locations = [
        {"name": "Delhi Center", "lat": 28.6139, "lon": 77.2090},
        {"name": "Mumbai Center", "lat": 19.0760, "lon": 72.8777},
        {"name": "Bangalore Center", "lat": 12.9716, "lon": 77.5946},
        {"name": "Your Test Location", "lat": 28.5355, "lon": 77.3910}  # Gurgaon
    ]
    
    print("🔍 Testing Real Crime Analysis System")
    print("=" * 50)
    
    for location in test_locations:
        print(f"\n📍 Analyzing: {location['name']}")
        print(f"   Coordinates: {location['lat']}, {location['lon']}")
        
        try:
            # Analyze crime risk for this location
            result = await analyzer.analyze_location_crime_risk(
                lat=location['lat'], 
                lon=location['lon'], 
                radius_km=1.0
            )
            
            print(f"   🎯 Risk Score: {result['risk_score']}/10")
            print(f"   ⚠️  Risk Level: {result['risk_level']}")
            print(f"   📊 Crime Data Found: {result['crime_data_found']} incidents")
            print(f"   🏘️  Area Crime Rate: {result['crime_statistics']['crime_rate']}")
            
            if result['crime_statistics']['most_common_crime'] != 'None':
                print(f"   🚨 Most Common Crime: {result['crime_statistics']['most_common_crime']}")
            
            if result['hotspot_analysis']['is_hotspot']:
                print(f"   ⚡ HOTSPOT AREA - High Crime Activity!")
            
            print(f"   🔒 Safety Index: {result['crime_statistics']['safety_index']}/10")
            print(f"   📈 Confidence: {result['confidence']*100:.0f}%")
            
            # Show top recommendations
            print(f"   💡 Top Recommendations:")
            for i, rec in enumerate(result['safety_recommendations'][:3], 1):
                print(f"      {i}. {rec}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print("-" * 40)
    
    print("\n✅ Real Crime Analysis Test Complete!")
    print("\n📋 How to integrate:")
    print("1. The system fetches real crime data from multiple sources")
    print("2. Analyzes crime patterns and hotspots")
    print("3. Provides location-specific safety recommendations")
    print("4. Combines real data with contextual factors (time, weather, etc.)")
    print("5. Shows confidence levels based on data availability")

if __name__ == "__main__":
    asyncio.run(test_real_crime_analysis())