import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import os
from math import radians, cos, sin, asin, sqrt
import json

logger = logging.getLogger(__name__)

class CSVCrimeAnalyzer:
    """
    CSV-based crime data analyzer for location-based risk assessment
    """
    
    def __init__(self, csv_file_path: str = "data/crime_data.csv"):
        self.csv_file_path = csv_file_path
        self.crime_data = None
        self.load_crime_data()
        
        # Crime severity weights
        self.crime_weights = {
            'murder': 10,
            'rape': 10,
            'robbery': 9,
            'assault': 8,
            'burglary': 7,
            'theft': 6,
            'vehicle_theft': 6,
            'fraud': 5,
            'vandalism': 4,
            'drug_offense': 4,
            'public_disorder': 3,
            'other': 3
        }
    
    def load_crime_data(self):
        """Load crime data from CSV file"""
        try:
            if os.path.exists(self.csv_file_path):
                self.crime_data = pd.read_csv(self.csv_file_path)
                logger.info(f"✅ Loaded {len(self.crime_data)} crime records from CSV")
                
                # Standardize column names (case insensitive)
                self.crime_data.columns = self.crime_data.columns.str.lower().str.strip()
                
                # Expected columns: latitude, longitude, crime_type, date, area, severity
                required_cols = ['latitude', 'longitude', 'crime_type']
                missing_cols = [col for col in required_cols if col not in self.crime_data.columns]
                
                if missing_cols:
                    logger.warning(f"⚠️ Missing columns in CSV: {missing_cols}")
                    logger.info(f"📋 Available columns: {list(self.crime_data.columns)}")
                
                # Convert date column if exists
                if 'date' in self.crime_data.columns:
                    try:
                        self.crime_data['date'] = pd.to_datetime(self.crime_data['date'])
                    except:
                        logger.warning("⚠️ Could not parse date column")
                
                logger.info(f"📊 Crime data loaded successfully: {self.crime_data.shape}")
                
            else:
                logger.warning(f"⚠️ CSV file not found: {self.csv_file_path}")
                logger.info("📝 Creating sample CSV structure...")
                self.create_sample_csv()
                
        except Exception as e:
            logger.error(f"❌ Error loading CSV: {e}")
            self.crime_data = None
    
    def create_sample_csv(self):
        """Create a sample CSV file structure for reference"""
        sample_data = {
            'latitude': [28.6139, 28.6129, 28.6149, 19.0760, 19.0770],
            'longitude': [77.2090, 77.2080, 77.2100, 72.8777, 72.8787],
            'crime_type': ['theft', 'assault', 'burglary', 'robbery', 'fraud'],
            'date': ['2024-12-01', '2024-12-02', '2024-12-03', '2024-12-04', '2024-12-05'],
            'area': ['Delhi Central', 'Delhi Central', 'Delhi Central', 'Mumbai Central', 'Mumbai Central'],
            'severity': [6, 8, 7, 9, 5]
        }
        
        sample_df = pd.DataFrame(sample_data)
        sample_df.to_csv(self.csv_file_path, index=False)
        logger.info(f"📝 Sample CSV created at: {self.csv_file_path}")
        
        # Load the sample data
        self.crime_data = sample_df
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    def analyze_location_crime_risk(self, lat: float, lon: float, radius_km: float = 2.0) -> Dict[str, Any]:
        """
        Analyze crime risk for a specific location using CSV data
        """
        try:
            if self.crime_data is None or self.crime_data.empty:
                return self._fallback_analysis(lat, lon)
            
            # Find crimes within radius
            nearby_crimes = self._find_nearby_crimes(lat, lon, radius_km)
            
            # Analyze crime patterns
            crime_analysis = self._analyze_crime_patterns(nearby_crimes, lat, lon)
            
            # Calculate risk metrics
            risk_metrics = self._calculate_risk_metrics(nearby_crimes, crime_analysis)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_metrics, crime_analysis)
            
            # Determine area information
            area_info = self._get_area_info(lat, lon, nearby_crimes)
            
            return {
                'location': {'lat': lat, 'lon': lon, 'radius_km': radius_km},
                'crime_data_found': len(nearby_crimes),
                'risk_score': risk_metrics['risk_score'],
                'risk_level': risk_metrics['risk_level'],
                'crime_statistics': {
                    'total_crimes': len(nearby_crimes),
                    'crime_rate': risk_metrics['crime_rate'],
                    'most_common_crime': crime_analysis['most_common_crime'],
                    'crime_frequency': crime_analysis['crime_frequency'],
                    'safety_index': risk_metrics['safety_index'],
                    'crime_density_per_km2': risk_metrics['crime_density'],
                    'crime_breakdown': crime_analysis['crime_breakdown']
                },
                'recent_incidents': crime_analysis['recent_incidents'],
                'hotspot_analysis': {
                    'is_hotspot': risk_metrics['is_hotspot'],
                    'risk_factor': risk_metrics['hotspot_risk_factor'],
                    'high_severity_count': crime_analysis['high_severity_count']
                },
                'safety_recommendations': recommendations,
                'area_info': area_info,
                'data_sources': ['csv_crime_data'],
                'analysis_timestamp': datetime.now().isoformat(),
                'confidence': risk_metrics['confidence']
            }
            
        except Exception as e:
            logger.error(f"❌ CSV crime analysis failed: {e}")
            return self._fallback_analysis(lat, lon)
    
    def _find_nearby_crimes(self, lat: float, lon: float, radius_km: float) -> pd.DataFrame:
        """Find crimes within specified radius"""
        if self.crime_data is None or 'latitude' not in self.crime_data.columns:
            return pd.DataFrame()
        
        # Calculate distances
        distances = []
        for _, crime in self.crime_data.iterrows():
            try:
                crime_lat = float(crime['latitude'])
                crime_lon = float(crime['longitude'])
                distance = self.haversine_distance(lat, lon, crime_lat, crime_lon)
                distances.append(distance)
            except:
                distances.append(float('inf'))
        
        # Filter crimes within radius
        self.crime_data['distance'] = distances
        nearby_crimes = self.crime_data[self.crime_data['distance'] <= radius_km].copy()
        
        return nearby_crimes
    
    def _analyze_crime_patterns(self, nearby_crimes: pd.DataFrame, lat: float, lon: float) -> Dict:
        """Analyze patterns in nearby crimes"""
        if nearby_crimes.empty:
            return {
                'most_common_crime': 'None',
                'crime_frequency': 0,
                'crime_breakdown': {},
                'recent_incidents': [],
                'high_severity_count': 0,
                'temporal_patterns': {}
            }
        
        # Crime type analysis
        if 'crime_type' in nearby_crimes.columns:
            crime_counts = nearby_crimes['crime_type'].value_counts()
            most_common = crime_counts.index[0] if len(crime_counts) > 0 else 'Unknown'
            crime_frequency = crime_counts.iloc[0] if len(crime_counts) > 0 else 0
            crime_breakdown = crime_counts.to_dict()
        else:
            most_common = 'Unknown'
            crime_frequency = len(nearby_crimes)
            crime_breakdown = {'unknown': len(nearby_crimes)}
        
        # Recent incidents (last 30 days)
        recent_incidents = []
        if 'date' in nearby_crimes.columns:
            try:
                cutoff_date = datetime.now() - timedelta(days=30)
                recent_mask = nearby_crimes['date'] >= cutoff_date
                recent_incidents = nearby_crimes[recent_mask].to_dict('records')
            except:
                recent_incidents = nearby_crimes.head(5).to_dict('records')
        else:
            recent_incidents = nearby_crimes.head(5).to_dict('records')
        
        # High severity crimes
        high_severity_count = 0
        if 'severity' in nearby_crimes.columns:
            try:
                high_severity_count = len(nearby_crimes[nearby_crimes['severity'] >= 7])
            except:
                pass
        elif 'crime_type' in nearby_crimes.columns:
            # Use crime type to estimate severity
            high_severity_crimes = ['murder', 'rape', 'robbery', 'assault']
            high_severity_count = len(nearby_crimes[nearby_crimes['crime_type'].isin(high_severity_crimes)])
        
        return {
            'most_common_crime': most_common,
            'crime_frequency': crime_frequency,
            'crime_breakdown': crime_breakdown,
            'recent_incidents': recent_incidents[:5],  # Limit to 5
            'high_severity_count': high_severity_count,
            'temporal_patterns': self._analyze_temporal_patterns(nearby_crimes)
        }
    
    def _analyze_temporal_patterns(self, crimes: pd.DataFrame) -> Dict:
        """Analyze temporal patterns in crime data"""
        patterns = {}
        
        if 'date' in crimes.columns and not crimes.empty:
            try:
                crimes['hour'] = pd.to_datetime(crimes['date']).dt.hour
                crimes['day_of_week'] = pd.to_datetime(crimes['date']).dt.dayofweek
                
                # Hour patterns
                hour_counts = crimes['hour'].value_counts().sort_index()
                patterns['peak_hours'] = hour_counts.head(3).index.tolist()
                
                # Day patterns
                day_counts = crimes['day_of_week'].value_counts().sort_index()
                patterns['peak_days'] = day_counts.head(3).index.tolist()
                
            except Exception as e:
                logger.warning(f"⚠️ Temporal analysis failed: {e}")
        
        return patterns
    
    def _calculate_risk_metrics(self, nearby_crimes: pd.DataFrame, crime_analysis: Dict) -> Dict:
        """Calculate risk metrics based on crime data"""
        total_crimes = len(nearby_crimes)
        
        # Base risk score calculation
        if total_crimes == 0:
            risk_score = 8.0  # Safe if no crimes found
            crime_rate = 'Very Low'
            is_hotspot = False
            hotspot_risk_factor = 1.0
        else:
            # Calculate weighted severity
            total_severity = 0
            if 'severity' in nearby_crimes.columns:
                try:
                    total_severity = nearby_crimes['severity'].sum()
                except:
                    total_severity = total_crimes * 5  # Default severity
            elif 'crime_type' in nearby_crimes.columns:
                # Calculate severity from crime types
                for _, crime in nearby_crimes.iterrows():
                    crime_type = str(crime['crime_type']).lower()
                    severity = self.crime_weights.get(crime_type, 5)
                    total_severity += severity
            else:
                total_severity = total_crimes * 5
            
            # Risk score (1-10, higher is safer)
            avg_severity = total_severity / total_crimes if total_crimes > 0 else 5
            crime_density = total_crimes / 4.0  # Assuming 2km radius = ~4 km²
            
            risk_score = max(1.0, 10.0 - (crime_density * 0.8) - (avg_severity - 5) * 0.4)
            
            # Crime rate classification
            if crime_density > 15:
                crime_rate = 'Very High'
            elif crime_density > 10:
                crime_rate = 'High'
            elif crime_density > 5:
                crime_rate = 'Moderate'
            elif crime_density > 2:
                crime_rate = 'Low'
            else:
                crime_rate = 'Very Low'
            
            # Hotspot analysis
            is_hotspot = (crime_analysis['high_severity_count'] > 2 or 
                         total_crimes > 10 or 
                         len(crime_analysis['recent_incidents']) > 3)
            
            hotspot_risk_factor = min(3.0, 1.0 + (total_crimes / 10.0))
        
        # Risk level determination
        if risk_score >= 8:
            risk_level = "Low Risk"
        elif risk_score >= 6:
            risk_level = "Moderate Risk"
        elif risk_score >= 4:
            risk_level = "High Risk"
        else:
            risk_level = "Very High Risk"
        
        # Safety index (same as risk score for consistency)
        safety_index = risk_score
        
        # Confidence based on data availability
        confidence = min(0.95, 0.7 + (min(total_crimes, 20) * 0.01))
        
        return {
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'crime_rate': crime_rate,
            'safety_index': round(safety_index, 1),
            'crime_density': round(total_crimes / 4.0, 2),
            'is_hotspot': is_hotspot,
            'hotspot_risk_factor': round(hotspot_risk_factor, 2),
            'confidence': round(confidence, 2)
        }
    
    def _generate_recommendations(self, risk_metrics: Dict, crime_analysis: Dict) -> List[str]:
        """Generate safety recommendations based on analysis"""
        recommendations = []
        
        # Risk-based recommendations
        if risk_metrics['risk_score'] <= 4:
            recommendations.extend([
                "⚠️ HIGH RISK AREA: Avoid this location if possible",
                "Share your live location with trusted contacts immediately",
                "Use well-lit main roads only, avoid shortcuts"
            ])
        elif risk_metrics['risk_score'] <= 6:
            recommendations.extend([
                "⚡ MODERATE RISK: Exercise extra caution in this area",
                "Avoid walking alone, especially during evening/night hours"
            ])
        else:
            recommendations.append("✅ Relatively safe area, maintain normal precautions")
        
        # Crime-specific recommendations
        most_common = crime_analysis['most_common_crime'].lower()
        if 'theft' in most_common:
            recommendations.append("🎒 High theft activity - secure valuables and avoid displaying expensive items")
        elif 'robbery' in most_common:
            recommendations.append("💰 Robbery incidents reported - avoid carrying large amounts of cash")
        elif 'assault' in most_common:
            recommendations.append("👥 Assault cases in area - stay in groups and avoid confrontations")
        elif 'burglary' in most_common:
            recommendations.append("🏠 Burglary activity nearby - be cautious around residential areas")
        elif 'vehicle' in most_common:
            recommendations.append("🚗 Vehicle crimes reported - ensure car security and park in safe areas")
        
        # Hotspot recommendations
        if risk_metrics['is_hotspot']:
            recommendations.append("📍 Crime hotspot identified - consider alternative routes")
        
        # Recent activity recommendations
        if len(crime_analysis['recent_incidents']) > 2:
            recommendations.append(f"⏰ {len(crime_analysis['recent_incidents'])} recent incidents - heightened vigilance advised")
        
        return recommendations[:5]  # Limit to 5 most important
    
    def _get_area_info(self, lat: float, lon: float, nearby_crimes: pd.DataFrame) -> Dict:
        """Get area information from crime data"""
        area_info = {
            'area_name': 'Unknown Area',
            'city': 'Unknown City',
            'state': 'Unknown State',
            'country': 'India'
        }
        
        if not nearby_crimes.empty and 'area' in nearby_crimes.columns:
            # Get most common area name
            area_counts = nearby_crimes['area'].value_counts()
            if len(area_counts) > 0:
                area_info['area_name'] = area_counts.index[0]
        
        return area_info
    
    def _fallback_analysis(self, lat: float, lon: float) -> Dict:
        """Fallback analysis when CSV data is unavailable"""
        return {
            'location': {'lat': lat, 'lon': lon, 'radius_km': 2.0},
            'crime_data_found': 0,
            'risk_score': 6.0,
            'risk_level': 'Moderate Risk',
            'crime_statistics': {
                'total_crimes': 0,
                'crime_rate': 'Unknown',
                'most_common_crime': 'Data unavailable',
                'crime_frequency': 0,
                'safety_index': 6.0,
                'crime_density_per_km2': 0.0,
                'crime_breakdown': {}
            },
            'recent_incidents': [],
            'hotspot_analysis': {
                'is_hotspot': False,
                'risk_factor': 1.0,
                'high_severity_count': 0
            },
            'safety_recommendations': [
                "CSV crime data unavailable - using general safety guidelines",
                "Stay aware of your surroundings",
                "Keep emergency contacts accessible",
                "Use well-lit and populated routes"
            ],
            'area_info': {
                'area_name': f"Location ({lat:.4f}, {lon:.4f})",
                'city': 'Unknown City',
                'state': 'Unknown State',
                'country': 'India'
            },
            'data_sources': ['fallback'],
            'analysis_timestamp': datetime.now().isoformat(),
            'confidence': 0.3
        }
    
    def get_crime_statistics(self) -> Dict:
        """Get overall crime statistics from CSV data"""
        if self.crime_data is None or self.crime_data.empty:
            return {'status': 'No data available'}
        
        stats = {
            'total_records': len(self.crime_data),
            'date_range': 'Unknown',
            'crime_types': {},
            'areas_covered': [],
            'data_quality': 'Good'
        }
        
        # Crime types
        if 'crime_type' in self.crime_data.columns:
            stats['crime_types'] = self.crime_data['crime_type'].value_counts().to_dict()
        
        # Areas
        if 'area' in self.crime_data.columns:
            stats['areas_covered'] = self.crime_data['area'].unique().tolist()
        
        # Date range
        if 'date' in self.crime_data.columns:
            try:
                min_date = self.crime_data['date'].min()
                max_date = self.crime_data['date'].max()
                stats['date_range'] = f"{min_date} to {max_date}"
            except:
                pass
        
        return stats