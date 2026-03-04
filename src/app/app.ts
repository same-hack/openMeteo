import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

type RegionPoint = { region: string; lat: number; lng: number };

type OpenMeteoSingle = {
  latitude: number;
  longitude: number;
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

type PrefCapital = { pref: string; city: string; lat: number; lng: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
})
export class App implements AfterViewInit {
  private map!: L.Map;
  private prefLayer = L.layerGroup();

  currentZoom = 0;

  panelClosed = false;
  showNationwide = true;

  private debounceTimer: number | null = null;

  /** ===== 天気キャッシュ ===== */

  private prefWeatherList: OpenMeteoSingle[] | null = null;
  private regionWeatherList: OpenMeteoSingle[] | null = null;

  /** ===== 中心天気 ===== */

  centerWeather: OpenMeteoSingle | null = null;
  centerWeatherText = '';
  centerLoading = false;
  centerError = '';

  /** ===== ズームモード ===== */

  private readonly REGION_MODE_MAX_ZOOM = 5;
  private currentOverlayMode: 'region' | 'pref' = 'pref';

  /** ===== 地方代表座標 ===== */

  REGION_POINTS: RegionPoint[] = [
    { region: '北海道', lat: 43.064, lng: 141.347 },
    { region: '東北', lat: 39.703, lng: 141.153 },
    { region: '関東', lat: 35.689, lng: 139.692 },
    { region: '中部', lat: 36.651, lng: 138.181 },
    { region: '近畿', lat: 34.686, lng: 135.52 },
    { region: '中国', lat: 34.397, lng: 132.46 },
    { region: '四国', lat: 33.842, lng: 132.765 },
    { region: '九州', lat: 33.59, lng: 130.402 },
    { region: '沖縄', lat: 26.212, lng: 127.681 },
  ];

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([36.2, 138.25], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.prefLayer.addTo(this.map);

    setTimeout(() => {
      this.currentZoom = this.map.getZoom();
      this.updateCenterWeather();
      this.updateOverlayByZoom();
    }, 0);

    this.map.on('zoomend', () => {
      this.currentZoom = this.map.getZoom();
      this.updateOverlayByZoom();
    });

    this.map.on('moveend', () => {
      if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => this.updateCenterWeather(), 250);
    });
  }

  /** =================================
   * 全国表示トグル
   * ================================= */

  toggleNationwide(): void {
    this.showNationwide = !this.showNationwide;

    if (!this.showNationwide) {
      this.prefLayer.clearLayers();
      return;
    }

    this.updateOverlayByZoom();
  }

  /** =================================
   * ズームによる表示切替
   * ================================= */

  private updateOverlayByZoom(): void {
    if (!this.showNationwide) {
      this.prefLayer.clearLayers();
      return;
    }

    const zoom = this.map.getZoom();

    const next: 'region' | 'pref' = zoom <= this.REGION_MODE_MAX_ZOOM ? 'region' : 'pref';

    if (this.currentOverlayMode === next) return;

    this.currentOverlayMode = next;

    if (next === 'region') {
      this.ensureRegionRendered();
    } else {
      this.ensurePrefRendered();
    }
  }

  /** =================================
   * Pref 表示
   * ================================= */

  private ensurePrefRendered(): void {
    if (this.prefWeatherList) {
      this.renderMarkers('pref');
      return;
    }

    const latList = PREF_CAPITALS.map((p) => p.lat.toFixed(5)).join(',');
    const lonList = PREF_CAPITALS.map((p) => p.lng.toFixed(5)).join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latList}` +
      `&longitude=${lonList}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        this.prefWeatherList = Array.isArray(json) ? json : [json];
        this.renderMarkers('pref');
      })
      .catch((e) => console.error('pref取得失敗', e));
  }

  /** =================================
   * Region 表示
   * ================================= */

  private ensureRegionRendered(): void {
    if (this.regionWeatherList) {
      this.renderMarkers('region');
      return;
    }

    const latList = this.REGION_POINTS.map((p) => p.lat.toFixed(5)).join(',');
    const lonList = this.REGION_POINTS.map((p) => p.lng.toFixed(5)).join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latList}` +
      `&longitude=${lonList}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        this.regionWeatherList = Array.isArray(json) ? json : [json];
        this.renderMarkers('region');
      })
      .catch((e) => console.error('region取得失敗', e));
  }

  /** =================================
   * 共通描画
   * ================================= */

  private renderMarkers(mode: 'pref' | 'region'): void {
    this.prefLayer.clearLayers();

    const points =
      mode === 'pref'
        ? PREF_CAPITALS.map((p) => ({
            lat: p.lat,
            lng: p.lng,
            label: p.pref,
            title: this.formatPrefCity(p.pref, p.city),
          }))
        : this.REGION_POINTS.map((r) => ({
            lat: r.lat,
            lng: r.lng,
            label: r.region,
            title: r.region,
          }));

    const weatherList = mode === 'pref' ? this.prefWeatherList : this.regionWeatherList;

    if (!weatherList) return;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const w = weatherList[i];

      const meta = this.weatherCodeToMaterial(w?.current?.weather_code);

      const iconHtml = `
        <div style="
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:8px 10px;
          background:rgba(34,34,34,0.92);
          border-radius:10px;
          box-shadow:0 4px 10px rgba(0,0,0,0.35);
          white-space:nowrap;
          pointer-events:none;
        ">
          <span class="material-icons" style="
            font-size:22px;
            color:${meta.color};
            margin-bottom:4px;
          ">${meta.iconName}</span>

          <span style="
            font-size:12px;
            font-weight:800;
            color:${meta.color};
          ">${this.escapeHtml(p.label)}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [72, 58],
        iconAnchor: [36, 29],
      });

      const marker = L.marker([p.lat, p.lng], { icon });

      const popupHtml = `
        <div style="min-width:220px;">
          <div style="font-weight:700;margin-bottom:8px;">
            ${this.escapeHtml(p.title)}
          </div>
          <div><strong>天気:</strong> ${meta.text}</div>
          <div><strong>気温:</strong> ${w?.current?.temperature_2m ?? '-'}°C</div>
          <div><strong>風速:</strong> ${w?.current?.wind_speed_10m ?? '-'}km/h</div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-popup',
        closeButton: true,
      });

      marker.addTo(this.prefLayer);
    }
  }

  /** =================================
   * 中心天気
   * ================================= */

  private async updateCenterWeather(): Promise<void> {
    const c = this.map.getCenter();

    const lat = Number(c.lat.toFixed(5));
    const lon = Number(c.lng.toFixed(5));

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    this.centerLoading = true;

    try {
      const res = await fetch(url);

      const data = await res.json();

      this.centerWeather = data;

      this.centerWeatherText = this.weatherCodeToText(data.current?.weather_code);
    } catch (e) {
      this.centerError = '取得失敗';
    } finally {
      this.centerLoading = false;
    }
  }

  /** =================================
   * Utility
   * ================================= */

  private weatherCodeToText(code?: number): string {
    switch (code) {
      case 0:
        return '快晴';
      case 1:
      case 2:
        return '晴れ';
      case 3:
        return '曇り';
      case 61:
      case 63:
      case 65:
        return '雨';
      case 71:
      case 73:
      case 75:
        return '雪';
      case 95:
        return '雷雨';
      default:
        return '不明';
    }
  }

  private weatherCodeToMaterial(code?: number) {
    switch (code) {
      case 0:
        return { iconName: 'wb_sunny', color: '#fbc02d', text: '快晴' };

      case 1:
      case 2:
        return { iconName: 'partly_cloudy_day', color: '#ffca28', text: '晴れ' };

      case 3:
        return { iconName: 'cloud', color: '#90a4ae', text: '曇り' };

      case 61:
      case 63:
      case 65:
        return { iconName: 'umbrella', color: '#1976d2', text: '雨' };

      case 71:
      case 73:
      case 75:
        return { iconName: 'ac_unit', color: '#64b5f6', text: '雪' };

      case 95:
        return { iconName: 'thunderstorm', color: '#d32f2f', text: '雷雨' };

      default:
        return { iconName: 'help_outline', color: '#757575', text: '不明' };
    }
  }

  private formatPrefCity(pref: string, city: string): string {
    return `${pref}県${city}市`;
  }

  private escapeHtml(s: string): string {
    return (s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
    );
  }
}
