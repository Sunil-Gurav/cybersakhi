import requests
import logging
from typing import Dict, Any
import time
import json

logger = logging.getLogger(__name__)

class RealGeocoder:
    def __init__(self):
        self.services = [
            self._get_nominatim_address,    # OpenStreetMap
            self._get_bigdatacloud_address, # BigDataCloud (Free)
            self._get_locationiq_address,   # LocationIQ (Free tier)
        ]
    
    async def get_real_address(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get real address using multiple geocoding services"""
        logger.info(f"🌍 Getting accurate address for: {lat}, {lon}")
        
        # Try all services until we get a good result
        for service in self.services:
            try:
                address_info = await service(lat, lon)
                if address_info and self._is_valid_address(address_info):
                    logger.info(f"✅ Address found: {address_info['formatted_address']}")
                    return address_info
            except Exception as e:
                logger.warning(f"⚠️ Service failed: {e}")
                continue
        
        # If all services fail, return fallback
        return self._get_fallback_address(lat, lon)
    
    async def _get_nominatim_address(self, lat: float, lon: float) -> Dict[str, Any]:
        """OpenStreetMap Nominatim"""
        params = {
            'format': 'json',
            'lat': lat,
            'lon': lon,
            'zoom': 18,
            'addressdetails': 1
        }
        
        headers = {
            'User-Agent': 'CyberSathi-Safety-App/1.0',
            'Accept-Language': 'en'
        }
        
        time.sleep(1)  # Respect rate limits
        
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params=params,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._parse_nominatim_data(data, lat, lon)
        
        return None
    
    async def _get_bigdatacloud_address(self, lat: float, lon: float) -> Dict[str, Any]:
        """BigDataCloud Reverse Geocoding (More Accurate)"""
        try:
            response = requests.get(
                f"https://api.bigdatacloud.net/data/reverse-geocode-client",
                params={
                    'latitude': lat,
                    'longitude': lon,
                    'localityLanguage': 'en'
                },
                timeout=8
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_bigdatacloud_data(data, lat, lon)
        except:
            pass
        
        return None
    
    async def _get_locationiq_address(self, lat: float, lon: float) -> Dict[str, Any]:
        """LocationIQ Geocoding"""
        try:
            # You need to get free API key from locationiq.com
            api_key = "pk.your_locationiq_key_here"  # Get free from locationiq.com
            
            response = requests.get(
                f"https://us1.locationiq.com/v1/reverse.php",
                params={
                    'key': api_key,
                    'lat': lat,
                    'lon': lon,
                    'format': 'json',
                    'zoom': 18
                },
                timeout=8
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_locationiq_data(data, lat, lon)
        except:
            pass
        
        return None
    
    def _parse_nominatim_data(self, data: Dict, lat: float, lon: float) -> Dict[str, Any]:
        """Parse OpenStreetMap data"""
        address = data.get('address', {})
        
        return {
            'formatted_address': data.get('display_name', f"Location ({lat:.4f}, {lon:.4f})"),
            'components': {
                'house_number': address.get('house_number', ''),
                'road': address.get('road', ''),
                'neighbourhood': address.get('neighbourhood', ''),
                'suburb': address.get('suburb', ''),
                'city': address.get('city') or address.get('town') or address.get('village') or '',
                'state': address.get('state', ''),
                'country': address.get('country', ''),
                'postcode': address.get('postcode', ''),
                'county': address.get('county', '')
            },
            'source': 'openstreetmap',
            'accuracy': 'high'
        }
    
    def _parse_bigdatacloud_data(self, data: Dict, lat: float, lon: float) -> Dict[str, Any]:
        """Parse BigDataCloud data"""
        locality = data.get('locality', '')
        city = data.get('city', '')
        countryName = data.get('countryName', '')
        principalSubdivision = data.get('principalSubdivision', '')
        
        # Build formatted address
        address_parts = []
        if locality:
            address_parts.append(locality)
        if city and city != locality:
            address_parts.append(city)
        
        formatted_address = ", ".join(address_parts) if address_parts else f"Location ({lat:.4f}, {lon:.4f})"
        
        return {
            'formatted_address': formatted_address,
            'components': {
                'locality': locality,
                'city': city,
                'state': principalSubdivision,
                'country': countryName,
                'continent': data.get('continent', ''),
                'plus_code': data.get('plusCode', '')
            },
            'source': 'bigdatacloud',
            'accuracy': 'very_high'
        }
    
    def _parse_locationiq_data(self, data: Dict, lat: float, lon: float) -> Dict[str, Any]:
        """Parse LocationIQ data"""
        address = data.get('address', {})
        
        return {
            'formatted_address': data.get('display_name', f"Location ({lat:.4f}, {lon:.4f})"),
            'components': {
                'house_number': address.get('house_number', ''),
                'road': address.get('road', ''),
                'neighbourhood': address.get('neighbourhood', ''),
                'suburb': address.get('suburb', ''),
                'city': address.get('city') or address.get('town') or address.get('village') or '',
                'state': address.get('state', ''),
                'country': address.get('country', ''),
                'postcode': address.get('postcode', ''),
                'county': address.get('county', '')
            },
            'source': 'locationiq',
            'accuracy': 'high'
        }
    
    def _is_valid_address(self, address_info: Dict[str, Any]) -> bool:
        """Check if address is valid and not generic"""
        components = address_info.get('components', {})
        city = components.get('city', '')
        formatted = address_info.get('formatted_address', '')
        
        # Check if address is too generic
        generic_terms = ['location', 'coordinates', 'unknown', 'current location']
        if any(term in formatted.lower() for term in generic_terms):
            return False
        
        # Check if we have at least city or locality
        if not city and not components.get('locality'):
            return False
            
        return True
    
    def _get_fallback_address(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fallback with coordinates"""
        return {
            'formatted_address': f"Your Current Location ({lat:.6f}, {lon:.6f})",
            'components': {
                'city': 'Your City',
                'state': 'Your State', 
                'country': 'Your Country',
                'road': 'Current Location'
            },
            'source': 'fallback',
            'accuracy': 'low'
        }