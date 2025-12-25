#!/usr/bin/env python3
"""
Test script to verify the location analysis endpoint
"""
import requests
import json

def test_location_analysis():
    url = "http://localhost:8000/ai/analyze-location"
    
    # Test data that matches what the backend sends
    test_data = {
        "latitude": 28.6139,  # Delhi coordinates
        "longitude": 77.2090,
        "accuracy": 10,
        "timestamp": "2024-12-25T10:30:00Z",
        "hour": 10,
        "day_of_week": 4,
        "time_of_day": "morning"
    }
    
    print("🧪 Testing location analysis endpoint...")
    print(f"📍 Test coordinates: {test_data['latitude']}, {test_data['longitude']}")
    print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=30)
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Response:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Error {response.status_code}:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - AI service might not be running")
        print("💡 Start the AI service with: py server.py")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_location_analysis()