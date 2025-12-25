from datetime import datetime
from typing import Dict, Any

def get_current_time_info() -> Dict[str, Any]:
    """Get current time information"""
    now = datetime.now()
    return {
        'hour': now.hour,
        'day_of_week': now.weekday(),
        'timestamp': now.isoformat()
    }

def format_location_response(success: bool, data: Dict[str, Any] = None, error: str = None) -> Dict[str, Any]:
    """Format standardized API response"""
    response = {
        'success': success,
        'timestamp': datetime.now().isoformat()
    }
    
    if success and data:
        response['data'] = data
    elif error:
        response['error'] = error
        
    return response