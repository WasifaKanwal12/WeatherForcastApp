import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('celsius');
  const [background, setBackground] = useState('default');

  // Weather code to description mapping
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  const getLocationCoordinates = async () => {
    try {
      const response = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const { latitude, longitude } = response.data.results[0];
        setCoords({ latitude, longitude });
        return { latitude, longitude };
      } else {
        throw new Error('Location not found');
      }
    } catch (err) {
      setError('Failed to find location. Please try another name.');
      setLoading(false);
      return null;
    }
  };

  const fetchWeather = async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const coordinates = await getLocationCoordinates();
      if (!coordinates) return;
      
      const response = await axios.get('http://localhost:5000/weather', {
        params: {
          lat: coordinates.latitude,
          lon: coordinates.longitude
        }
      });
      
      setWeatherData(response.data);
      updateBackground(response.data.current.weather_code);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateBackground = (weatherCode) => {
    // Determine background based on weather code
    if (weatherCode >= 95) {
      setBackground('thunderstorm');
    } else if (weatherCode >= 80 || (weatherCode >= 50 && weatherCode <= 67)) {
      setBackground('rainy');
    } else if (weatherCode >= 70) {
      setBackground('snowy');
    } else if (weatherCode >= 45) {
      setBackground('foggy');
    } else if (weatherCode >= 1) {
      setBackground('cloudy');
    } else {
      setBackground('clear');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather();
  };

  const getWeatherIcon = (code) => {
    // Simple emoji-based icons
    if (code >= 95) return '⛈️';
    if (code >= 80) return '🌧️';
    if (code >= 70) return '❄️';
    if (code >= 50) return '🌧️';
    if (code >= 45) return '🌫️';
    if (code >= 1) return '☁️';
    return '☀️';
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const convertTemp = (temp) => {
    if (unit === 'fahrenheit') {
      return (temp * 9/5) + 32;
    }
    return temp;
  };

  const getTempUnit = () => {
    return unit === 'fahrenheit' ? '°F' : '°C';
  };

  return (
    <div className={`app ${background}`}>
      <div className="container">
        <header>
          <h1>Weather Forecast</h1>
          <div className="unit-toggle">
            <button 
              className={unit === 'celsius' ? 'active' : ''} 
              onClick={() => setUnit('celsius')}
            >
              °C
            </button>
            <button 
              className={unit === 'fahrenheit' ? 'active' : ''} 
              onClick={() => setUnit('fahrenheit')}
            >
              °F
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {weatherData && (
          <div className="weather-container">
            <div className="current-weather">
              <h2>{location}</h2>
              <div className="weather-main">
                <div className="temp">
                  {Math.round(convertTemp(weatherData.current.temperature))}{getTempUnit()}
                  <div className="feels-like">
                    Feels like {Math.round(convertTemp(weatherData.current.apparent_temperature))}{getTempUnit()}
                  </div>
                </div>
                <div className="weather-info">
                  <div className="weather-icon">{getWeatherIcon(weatherData.current.weather_code)}</div>
                  <div className="description">
                    {weatherCodes[weatherData.current.weather_code] || 'Unknown weather'}
                  </div>
                </div>
              </div>
              <div className="weather-details">
                <div className="detail">
                  <span>Humidity</span>
                  <span>{weatherData.current.humidity}%</span>
                </div>
                <div className="detail">
                  <span>Pressure</span>
                  <span>{weatherData.current.pressure} hPa</span>
                </div>
                <div className="detail">
                  <span>Wind</span>
                  <span>
                    {weatherData.current.wind_speed} km/h
                    <span 
                      className="wind-direction" 
                      style={{ transform: `rotate(${weatherData.current.wind_direction}deg)` }}
                    >
                      ↑
                    </span>
                  </span>
                </div>
                <div className="detail">
                  <span>Precipitation</span>
                  <span>{weatherData.current.precipitation} mm</span>
                </div>
              </div>
            </div>

            <div className="hourly-forecast">
              <h3>24-Hour Forecast</h3>
              <div className="forecast-items">
                {weatherData.hourly.slice(0, 24).map((hour, index) => (
                  <div key={index} className="forecast-item">
                    <div className="forecast-time">{formatTime(hour.time)}</div>
                    <div className="forecast-icon">{getWeatherIcon(hour.weather_code)}</div>
                    <div className="forecast-temp">
                      {Math.round(convertTemp(hour.temperature))}{getTempUnit()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="daily-forecast">
              <h3>7-Day Forecast</h3>
              <div className="forecast-items">
                {weatherData.daily.map((day, index) => (
                  <div key={index} className="forecast-item">
                    <div className="forecast-date">{formatDate(day.date)}</div>
                    <div className="forecast-icon">{getWeatherIcon(day.weather_code)}</div>
                    <div className="forecast-temps">
                      <span className="max-temp">
                        {Math.round(convertTemp(day.max_temp))}{getTempUnit()}
                      </span>
                      <span className="min-temp">
                        {Math.round(convertTemp(day.min_temp))}{getTempUnit()}
                      </span>
                    </div>
                    <div className="forecast-details">
                      <span>🌧️ {day.precipitation}mm</span>
                      <span>💨 {day.wind_speed} km/h</span>
                    </div>
                    <div className="forecast-sun">
                      <span>☀️ {formatTime(day.sunrise)}</span>
                      <span>🌙 {formatTime(day.sunset)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;