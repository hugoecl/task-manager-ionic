/**
 * Service para integração com API de Clima (Open-Meteo)
 * API gratuita e sem necessidade de API key
 * Utiliza geolocalização do dispositivo para obter clima local
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, from, switchMap } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { Platform } from '@ionic/angular';

/**
 * Interface para dados de clima
 */
export interface WeatherData {
  temperature: number;        // Temperatura em Celsius
  condition: string;          // Condição (ex: "Ensolarado", "Nublado")
  icon: string;              // Código do ícone
  humidity?: number;         // Humidade (%)
  windSpeed?: number;        // Velocidade do vento (km/h)
  description?: string;      // Descrição detalhada
}

/**
 * Interface para resposta da API Open-Meteo
 */
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  current_units: {
    temperature_2m: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private cachedLocation: { latitude: number; longitude: number } | null = null;
  private locationCacheDuration = 30 * 60 * 1000; // 30 minutos para cache de localização

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) {}

  /**
   * Obtém a localização atual do dispositivo
   * @returns Observable com coordenadas (latitude, longitude)
   */
  getCurrentLocation(): Observable<{ latitude: number; longitude: number } | null> {
    // Verificar se está em dispositivo nativo
    if (!this.platform.is('capacitor')) {
      // Em browser, usar API HTML5 Geolocation
      return new Observable(observer => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              observer.next({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
              observer.complete();
            },
            (error) => {
              console.error('Erro ao obter localização:', error);
              // Fallback para coordenadas padrão (Lisboa)
              observer.next({ latitude: 38.7223, longitude: -9.1393 });
              observer.complete();
            }
          );
        } else {
          // Fallback se geolocalização não estiver disponível
          observer.next({ latitude: 38.7223, longitude: -9.1393 });
          observer.complete();
        }
      });
    }

    // Usar cache de localização se disponível e recente
    if (this.cachedLocation) {
      return of(this.cachedLocation);
    }

    // Obter localização usando Capacitor
    return from(
      Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
        .then(position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.cachedLocation = location;
          // Limpar cache após 30 minutos
          setTimeout(() => {
            this.cachedLocation = null;
          }, this.locationCacheDuration);
          return location;
        })
        .catch(error => {
          console.error('Erro ao obter localização:', error);
          // Fallback para coordenadas padrão (Lisboa)
          return { latitude: 38.7223, longitude: -9.1393 };
        })
    );
  }

  /**
   * Obtém o clima atual baseado na localização do dispositivo
   * @returns Observable com dados do clima
   */
  getCurrentWeather(): Observable<WeatherData | null> {
    return this.getCurrentLocation().pipe(
      switchMap(location => {
        const lat = location?.latitude || 38.7223;
        const lon = location?.longitude || -9.1393;
        return this.getWeatherForCoordinates(lat, lon);
      }),
      catchError(() => {
        // Em caso de erro, usar coordenadas padrão
        return this.getWeatherForCoordinates(38.7223, -9.1393);
      })
    );
  }

  /**
   * Obtém o clima atual para coordenadas específicas
   * @param latitude Latitude da localização
   * @param longitude Longitude da localização
   * @returns Observable com dados do clima
   */
  getWeatherForCoordinates(latitude: number, longitude: number): Observable<WeatherData | null> {
    const cacheKey = `${latitude},${longitude}`;
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }

    const url = `${this.API_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

    return this.http.get<OpenMeteoResponse>(url).pipe(
      map(response => {
        const weatherData: WeatherData = {
          temperature: Math.round(response.current.temperature_2m),
          condition: this.getWeatherCondition(response.current.weather_code),
          icon: this.getWeatherIcon(response.current.weather_code),
          humidity: response.current.relative_humidity_2m,
          windSpeed: Math.round(response.current.wind_speed_10m),
          description: this.getWeatherDescription(response.current.weather_code)
        };

        // Guardar no cache
        this.cache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        });

        return weatherData;
      }),
      catchError(error => {
        console.error('Erro ao obter dados do clima:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtém o clima para uma data específica (previsão) baseado na localização do dispositivo
   * @param date Data para previsão
   * @returns Observable com dados do clima
   */
  getWeatherForDate(date: Date): Observable<WeatherData | null> {
    return this.getCurrentLocation().pipe(
      switchMap(location => {
        const lat = location?.latitude || 38.7223;
        const lon = location?.longitude || -9.1393;
        return this.getWeatherForDateWithCoordinates(lat, lon, date);
      }),
      catchError(() => {
        // Em caso de erro, usar coordenadas padrão
        return this.getWeatherForDateWithCoordinates(38.7223, -9.1393, date);
      })
    );
  }

  /**
   * Obtém o clima para uma data específica (previsão) com coordenadas
   * @param latitude Latitude da localização
   * @param longitude Longitude da localização
   * @param date Data para previsão
   * @returns Observable com dados do clima
   */
  getWeatherForDateWithCoordinates(latitude: number, longitude: number, date: Date): Observable<WeatherData | null> {
    const dateStr = date.toISOString().split('T')[0];
    const url = `${this.API_BASE_URL}?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.daily && response.daily.weather_code && response.daily.weather_code.length > 0) {
          const weatherCode = response.daily.weather_code[0];
          const tempMax = response.daily.temperature_2m_max[0];
          const tempMin = response.daily.temperature_2m_min[0];
          
          return {
            temperature: Math.round((tempMax + tempMin) / 2),
            condition: this.getWeatherCondition(weatherCode),
            icon: this.getWeatherIcon(weatherCode),
            description: this.getWeatherDescription(weatherCode)
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Erro ao obter previsão do clima:', error);
        return of(null);
      })
    );
  }

  /**
   * Converte código de clima da API para condição legível
   * @param code Código do clima (WMO Weather interpretation codes)
   */
  private getWeatherCondition(code: number): string {
    // Códigos WMO Weather interpretation codes
    if (code === 0) return 'Ensolarado';
    if (code === 1 || code === 2 || code === 3) return 'Parcialmente Nublado';
    if (code === 45 || code === 48) return 'Neblina';
    if (code === 51 || code === 53 || code === 55) return 'Chuvisco';
    if (code === 56 || code === 57) return 'Chuvisco Gelado';
    if (code === 61 || code === 63 || code === 65) return 'Chuva';
    if (code === 66 || code === 67) return 'Chuva Gelada';
    if (code === 71 || code === 73 || code === 75) return 'Neve';
    if (code === 77) return 'Granizo';
    if (code === 80 || code === 81 || code === 82) return 'Aguaceiros';
    if (code === 85 || code === 86) return 'Aguaceiros de Neve';
    if (code === 95) return 'Trovoada';
    if (code === 96 || code === 99) return 'Trovoada com Granizo';
    return 'Desconhecido';
  }

  /**
   * Obtém o ícone correspondente ao código do clima
   * @param code Código do clima
   */
  private getWeatherIcon(code: number): string {
    if (code === 0) return 'sunny';
    if (code >= 1 && code <= 3) return 'partly-sunny';
    if (code === 45 || code === 48) return 'cloudy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code === 77) return 'snow';
    if (code >= 80 && code <= 86) return 'rainy';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    return 'cloud';
  }

  /**
   * Obtém descrição detalhada do clima
   * @param code Código do clima
   */
  private getWeatherDescription(code: number): string {
    return this.getWeatherCondition(code);
  }

  /**
   * Limpa o cache de dados do clima
   */
  clearCache(): void {
    this.cache.clear();
  }
}
