from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/weather', methods=['GET'])
def get_weather():
    latitude = request.args.get('lat')
    longitude = request.args.get('lon')
    
    if not latitude or not longitude:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    try:
        # Fetch current weather and forecast from Open-Meteo
        base_url = "https://api.open-meteo.com/v1/forecast"
        
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'current': 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m',
            'hourly': 'temperature_2m,weather_code',
            'daily': 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_hours,wind_speed_10m_max',
            'timezone': 'auto'
        }
        
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if response.status_code != 200:
            return jsonify({'error': data.get('reason', 'Failed to fetch weather data')}), response.status_code
        
        # Process the data
        processed_data = {
            'current': process_current_weather(data),
            'hourly': process_hourly_forecast(data),
            'daily': process_daily_forecast(data),
            'location': {
                'latitude': latitude,
                'longitude': longitude
            }
        }
        
        return jsonify(processed_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_current_weather(data):
    current = data.get('current', {})
    return {
        'temperature': current.get('temperature_2m'),
        'apparent_temperature': current.get('apparent_temperature'),
        'humidity': current.get('relative_humidity_2m'),
        'pressure': current.get('pressure_msl'),
        'wind_speed': current.get('wind_speed_10m'),
        'wind_direction': current.get('wind_direction_10m'),
        'weather_code': current.get('weather_code'),
        'precipitation': current.get('precipitation'),
        'rain': current.get('rain'),
        'showers': current.get('showers'),
        'snowfall': current.get('snowfall')
    }

def process_hourly_forecast(data):
    hourly = data.get('hourly', {})
    times = hourly.get('time', [])
    temps = hourly.get('temperature_2m', [])
    codes = hourly.get('weather_code', [])
    
    # Get next 24 hours
    forecast = []
    for i in range(24):
        if i < len(times):
            forecast.append({
                'time': times[i],
                'temperature': temps[i],
                'weather_code': codes[i]
            })
    
    return forecast

def process_daily_forecast(data):
    daily = data.get('daily', {})
    times = daily.get('time', [])
    codes = daily.get('weather_code', [])
    max_temps = daily.get('temperature_2m_max', [])
    min_temps = daily.get('temperature_2m_min', [])
    sunrises = daily.get('sunrise', [])
    sunsets = daily.get('sunset', [])
    precipitations = daily.get('precipitation_sum', [])
    wind_speeds = daily.get('wind_speed_10m_max', [])
    
    forecast = []
    for i in range(len(times)):
        forecast.append({
            'date': times[i],
            'weather_code': codes[i],
            'max_temp': max_temps[i],
            'min_temp': min_temps[i],
            'sunrise': sunrises[i],
            'sunset': sunsets[i],
            'precipitation': precipitations[i],
            'wind_speed': wind_speeds[i]
        })
    
    return forecast

if __name__ == '__main__':
    app.run(debug=True)