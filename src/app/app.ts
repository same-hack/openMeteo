import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  current_units?: {
    temperature_2m?: string;
    wind_speed_10m?: string;
  };
};

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div id="map" style="height:100vh;width:100%"></div>

    <div
      style="
      position: fixed;
      left: 12px;
      top: 12px;
      z-index: 9999;
      background: rgba(255,255,255,0.95);
      padding: 12px;
      border-radius: 10px;
      font: 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      min-width: 280px;
    "
    >
      <div style="font-weight:600; margin-bottom:8px;">中心の天気（Open-Meteo）</div>

      @if (loading) {
        <div>取得中…</div>
      }

      @if (error) {
        <div style="color:#b00020;">{{ error }}</div>
      }

      @if (weather) {
        <div><strong>天気:</strong> {{ weatherText }}</div>

        <div>
          <strong>気温:</strong>
          {{ weather.current?.temperature_2m }}
          {{ weather.current_units?.temperature_2m ?? '°C' }}
        </div>

        <div>
          <strong>風速:</strong>
          {{ weather.current?.wind_speed_10m }}
          {{ weather.current_units?.wind_speed_10m ?? 'km/h' }}
        </div>

        <div style="margin-top:6px; font-size:12px; color:#666;">
          {{ weather.current?.time }}
        </div>

        <div style="margin-top:6px; font-size:12px; color:#777;">
          center: {{ weather.latitude.toFixed(5) }}, {{ weather.longitude.toFixed(5) }}
        </div>
      } @else {
        <div style="font-size:12px; color:#777;">未取得</div>
      }
    </div>
  `,
})
export class App implements AfterViewInit {
  weather: OpenMeteoResponse | null = null;
  weatherText = '';
  loading = false;
  error = '';

  private map!: L.Map;
  private debounceTimer: number | null = null;

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([35.681236, 139.767125], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // NG0100回避：初回は次タスクへ
    setTimeout(() => {
      this.fetchWeatherAtCenter();
    }, 0);

    this.map.on('moveend', () => {
      if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        this.fetchWeatherAtCenter();
      }, 400);
    });
  }

  private async fetchWeatherAtCenter(): Promise<void> {
    const center = this.map.getCenter();
    const lat = Number(center.lat.toFixed(5));
    const lon = Number(center.lng.toFixed(5));

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    // NG0100回避：状態更新を次タスクへ寄せる（強め）
    setTimeout(() => {
      this.loading = true;
      this.error = '';
    }, 0);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as OpenMeteoResponse;
      const text = this.weatherCodeToText(json.current?.weather_code);

      // NG0100回避：反映も次タスクへ
      setTimeout(() => {
        this.weather = json;
        this.weatherText = text;
      }, 0);
    } catch (e) {
      const msg = `取得失敗: ${(e as Error).message}`;
      setTimeout(() => {
        this.error = msg;
        this.weather = null;
        this.weatherText = '';
      }, 0);
    } finally {
      setTimeout(() => {
        this.loading = false;
      }, 0);
    }
  }

  /**
   * WMO weather_code → 日本語変換
   * 一覧: https://open-meteo.com/en/docs#weather_code_list
   */
  private weatherCodeToText(code?: number): string {
    switch (code) {
      case 0:
        return '快晴';
      case 1:
        return 'ほぼ晴れ';
      case 2:
        return '一部曇り';
      case 3:
        return '曇り';

      case 45:
      case 48:
        return '霧';

      case 51:
      case 53:
      case 55:
        return '霧雨';

      case 56:
      case 57:
        return '着氷性霧雨';

      case 61:
      case 63:
      case 65:
        return '雨';

      case 66:
      case 67:
        return '着氷性雨';

      case 71:
      case 73:
      case 75:
        return '雪';

      case 77:
        return '雪粒';

      case 80:
      case 81:
      case 82:
        return 'にわか雨';

      case 85:
      case 86:
        return 'にわか雪';

      case 95:
        return '雷雨';

      case 96:
      case 99:
        return '雹を伴う雷雨';

      default:
        return `不明（code=${code ?? 'null'}）`;
    }
  }
}
