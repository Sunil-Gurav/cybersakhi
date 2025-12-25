#!/usr/bin/env python3
"""
Test script for CSV Crime Analysis
Run this to test the CSV crime analyzer functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.csv_crime_analyzer import CSVCrimeAnalyzer
import json

def test_csv_crime_analysis():
    """Test CSV crime analysis with sample coordinates"""
    
    print("🔍 Testing CSV Crime Analysis System")
    print("=" * 50)
    
    # Initialize analyzer
    analyzer = CSVCrimeAnalyzer()
    
    # Check if CSV data is loaded
    stats = analyzer.get_crime_statistics()
    print(f"📊 CSV Data Status:")
    print(f"   Total Records: {stats.get('total_records', 0)}")
    print(f"   Date Range: {stats.get('date_range', 'Unknown')}")
    print(f"   Crime Types: {list(stats.get('crime_types', {}).keys())}")
    print(f"   Areas Covered: {len(stats.get('areas_covered', []))}")
    
    # Test locations
    test_locations = [
        {"name": "Delhi Center", "lat": 28.6139, "lon": 77.2090},
        {"name": "Mumbai Center", "lat": 19.0760, "lon": 72.8777},
        {"name": "Bangalore Center", "lat": 12.9716, "lon": 77.5946},
        {"name": "Test Location", "lat": 28.5355, "lon": 77.3910}
    ]
    
    print(f"\n🎯 Testing Crime Risk Analysis")
    print("-" * 40)
    
    for location in test_locations:
        print(f"\n📍 Analyzing: {location['name']}")
        print(f"   Coordinates: {location['lat']}, {location['lon']}")
        
        try:
            # Analyze crime risk for this location
            result = analyzer.analyze_location_crime_risk(
                lat=location['lat'], 
                lon=location['lon'], 
                radius_km=2.0
            )
            
            print(f"   🎯 Risk Score: {result['risk_score']}/10")
            print(f"   ⚠️  Risk Level: {result['risk_level']}")
            print(f"   📊 CSV Crimes Found: {result['crime_data_found']} incidents")
            print(f"   🏘️  Area Crime Rate: {result['crime_statistics']['crime_rate']}")
            
            if result['crime_statistics']['most_common_crime'] not in ['None', 'Data unavailable']:
                print(f"   🚨 Most Common Crime: {result['crime_statistics']['most_common_crime']} ({result['crime_statistics']['crime_frequency']} cases)")
            
            if result['hotspot_analysis']['is_hotspot']:
                print(f"   ⚡ HOTSPOT AREA - High Crime Activity!")
            
            print(f"   🔒 Safety Index: {result['crime_statistics']['safety_index']}/10")
            print(f"   📈 Confidence: {result['confidence']*100:.0f}%")
            
            # Show crime breakdown if available
            if result['crime_statistics']['crime_breakdown']:
                print(f"   📋 Crime Breakdown:")
                for crime_type, count in result['crime_statistics']['crime_breakdown'].items():
                    print(f"      - {crime_type}: {count}")
            
            # Show top recommendations
            print(f"   💡 Top Recommendations:")
            for i, rec in enumerate(result['safety_recommendations'][:3], 1):
                print(f"      {i}. {rec}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print("-" * 30)
    
    print(f"\n✅ CSV Crime Analysis Test Complete!")
    print(f"\n📋 CSV File Instructions:")
    print(f"1. Place your crime_data.csv file in: ai_services/data/crime_data.csv")
    print(f"2. Required columns: latitude, longitude, crime_type")
    print(f"3. Optional columns: date, area, severity")
    print(f"4. Example CSV format:")
    print(f"   latitude,longitude,crime_type,date,area,severity")
    print(f"   28.6139,77.2090,theft,2024-12-01,Delhi Central,6")
    print(f"   28.6129,77.2080,assault,2024-12-02,Delhi Central,8")
    
    # Show sample CSV structure
    print(f"\n📝 Sample CSV has been created for reference")
    print(f"   Location: ai_services/data/crime_data.csv")
    print(f"   Replace with your actual crime data")

if __name__ == "__main__":
    test_csv_crime_analysis()