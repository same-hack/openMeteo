import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

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

const PREF_CAPITALS: PrefCapital[] = [
  { pref: '北海道', city: '札幌', lat: 43.063968, lng: 141.347899 },
  { pref: '青森', city: '青森', lat: 40.824623, lng: 140.740593 },
  { pref: '岩手', city: '盛岡', lat: 39.703531, lng: 141.152667 },
  { pref: '宮城', city: '仙台', lat: 38.268839, lng: 140.872103 },
  { pref: '秋田', city: '秋田', lat: 39.7186, lng: 140.102334 },
  { pref: '山形', city: '山形', lat: 38.240437, lng: 140.363634 },
  { pref: '福島', city: '福島', lat: 37.750299, lng: 140.467521 },

  { pref: '茨城', city: '水戸', lat: 36.341813, lng: 140.446793 },
  { pref: '栃木', city: '宇都宮', lat: 36.565725, lng: 139.883565 },
  { pref: '群馬', city: '前橋', lat: 36.391208, lng: 139.060156 },
  { pref: '埼玉', city: 'さいたま', lat: 35.857428, lng: 139.648933 },
  { pref: '千葉', city: '千葉', lat: 35.605058, lng: 140.123308 },
  { pref: '東京', city: '東京', lat: 35.689521, lng: 139.691704 },
  { pref: '神奈川', city: '横浜', lat: 35.447753, lng: 139.642514 },

  { pref: '新潟', city: '新潟', lat: 37.902418, lng: 139.023221 },
  { pref: '富山', city: '富山', lat: 36.69529, lng: 137.211338 },
  { pref: '石川', city: '金沢', lat: 36.594682, lng: 136.625573 },
  { pref: '福井', city: '福井', lat: 36.065219, lng: 136.221642 },
  { pref: '山梨', city: '甲府', lat: 35.664158, lng: 138.568449 },
  { pref: '長野', city: '長野', lat: 36.651289, lng: 138.181224 },
  { pref: '岐阜', city: '岐阜', lat: 35.391227, lng: 136.722291 },
  { pref: '静岡', city: '静岡', lat: 34.975562, lng: 138.38276 },
  { pref: '愛知', city: '名古屋', lat: 35.180188, lng: 136.906565 },
  { pref: '三重', city: '津', lat: 34.730283, lng: 136.508591 },

  { pref: '滋賀', city: '大津', lat: 35.004531, lng: 135.86859 },
  { pref: '京都', city: '京都', lat: 35.021004, lng: 135.755607 },
  { pref: '大阪', city: '大阪', lat: 34.686316, lng: 135.519711 },
  { pref: '兵庫', city: '神戸', lat: 34.691279, lng: 135.183025 },
  { pref: '奈良', city: '奈良', lat: 34.685333, lng: 135.832744 },
  { pref: '和歌山', city: '和歌山', lat: 34.226034, lng: 135.167506 },

  { pref: '鳥取', city: '鳥取', lat: 35.503869, lng: 134.237672 },
  { pref: '島根', city: '松江', lat: 35.472324, lng: 133.05052 },
  { pref: '岡山', city: '岡山', lat: 34.661772, lng: 133.934675 },
  { pref: '広島', city: '広島', lat: 34.39656, lng: 132.459622 },
  { pref: '山口', city: '山口', lat: 34.185956, lng: 131.471374 },

  { pref: '徳島', city: '徳島', lat: 34.07027, lng: 134.554844 },
  { pref: '香川', city: '高松', lat: 34.340149, lng: 134.043444 },
  { pref: '愛媛', city: '松山', lat: 33.84166, lng: 132.765362 },
  { pref: '高知', city: '高知', lat: 33.559706, lng: 133.53108 },

  { pref: '福岡', city: '福岡', lat: 33.590355, lng: 130.401716 },
  { pref: '佐賀', city: '佐賀', lat: 33.249367, lng: 130.298822 },
  { pref: '長崎', city: '長崎', lat: 32.744839, lng: 129.873756 },
  { pref: '熊本', city: '熊本', lat: 32.7898, lng: 130.741667 },
  { pref: '大分', city: '大分', lat: 33.238194, lng: 131.612591 },
  { pref: '宮崎', city: '宮崎', lat: 31.91109, lng: 131.423855 },
  { pref: '鹿児島', city: '鹿児島', lat: 31.560178, lng: 130.558146 },
  { pref: '沖縄', city: '那覇', lat: 26.212401, lng: 127.680932 },
];

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
      padding: 12px 14px;
      border-radius: 10px;
      font: 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      min-width: 260px;
    "
    >
      <div style="font-weight:700; margin-bottom:8px;">中心の天気（Open-Meteo）</div>

      @if (centerLoading) {
        <div>取得中…</div>
      }

      @if (centerError) {
        <div style="color:#b00020;">{{ centerError }}</div>
      }

      @if (centerWeather) {
        <div><strong>天気:</strong> {{ centerWeatherText }}</div>
        <div>
          <strong>気温:</strong> {{ centerWeather.current?.temperature_2m }}
          {{ centerWeather.current_units?.temperature_2m ?? '°C' }}
        </div>
        <div>
          <strong>風速:</strong> {{ centerWeather.current?.wind_speed_10m }}
          {{ centerWeather.current_units?.wind_speed_10m ?? 'km/h' }}
        </div>

        <div style="margin-top:8px; font-size:12px; color:#666;">
          {{ centerWeather.current?.time }}
        </div>
        <div style="margin-top:4px; font-size:12px; color:#777;">
          center: {{ centerWeather.latitude.toFixed(5) }}, {{ centerWeather.longitude.toFixed(5) }}
        </div>

        <div style="margin-top:6px; font-size:12px; color:#999;">zoom: {{ currentZoom }}</div>
      }
    </div>
  `,
})
export class App implements AfterViewInit {
  private map!: L.Map;
  private prefLayer = L.layerGroup();

  private readonly SHOW_PREF_MAX_ZOOM = 8;

  currentZoom = 0;

  private prefWeatherList: OpenMeteoSingle[] | null = null;

  private debounceTimer: number | null = null;

  centerWeather: OpenMeteoSingle | null = null;
  centerWeatherText = '';
  centerLoading = false;
  centerError = '';

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
      this.updatePrefVisibilityByZoom();
    }, 0);

    this.map.on('zoomend', () => {
      this.currentZoom = this.map.getZoom();
      this.updatePrefVisibilityByZoom();
    });

    this.map.on('moveend', () => {
      if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => this.updateCenterWeather(), 250);
    });
  }

  private async updatePrefVisibilityByZoom(): Promise<void> {
    const zoom = this.map.getZoom();
    const shouldShow = zoom <= this.SHOW_PREF_MAX_ZOOM; // 13以下なら表示

    if (!shouldShow) {
      this.prefLayer.clearLayers();
      return;
    }

    if (!this.prefWeatherList) {
      await this.fetchPrefWeatherNationwide();
    }
    this.renderPrefMarkers();
  }

  private async fetchPrefWeatherNationwide(): Promise<void> {
    const latList = PREF_CAPITALS.map((p) => p.lat.toFixed(5)).join(',');
    const lonList = PREF_CAPITALS.map((p) => p.lng.toFixed(5)).join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latList}` +
      `&longitude=${lonList}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=auto`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      this.prefWeatherList = Array.isArray(json) ? json : [json];
    } catch (e) {
      console.error('全国（県庁所在地）の天気取得に失敗:', e);
      this.prefWeatherList = null;
    }
  }

  private renderPrefMarkers(): void {
    if (!this.prefWeatherList) return;

    this.prefLayer.clearLayers();

    for (let i = 0; i < PREF_CAPITALS.length; i++) {
      const p = PREF_CAPITALS[i];
      const w = this.prefWeatherList[i] as OpenMeteoSingle | undefined;

      const code = w?.current?.weather_code;
      const temp = w?.current?.temperature_2m;
      const unit = w?.current_units?.temperature_2m ?? '°C';

      const meta = this.weatherCodeToMaterial(code);

      const bubbleSize = 40;
      const totalW = 64;
      const totalH = 54;

      const iconHtml = `
        <div style="
          position: relative;
          width: ${totalW}px;
          height: ${totalH}px;
          transform: translateZ(0);
          pointer-events: none;
        ">
          <div style="
            position: absolute;
            left: 50%;
            top: 0;
            width: ${bubbleSize}px;
            height: ${bubbleSize}px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: rgba(255,255,255,0.92);
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span class="material-icons" style="
              font-size: 22px;
              line-height: 22px;
              color: ${meta.color};
              transform: ${meta.offset};
            ">${meta.iconName}</span>
          </div>

          <div style="
            position: absolute;
            left: 50%;
            top: ${bubbleSize - 2}px;
            transform: translateX(-50%);
            font-size: 11px;
            line-height: 1;
            font-weight: 800;
            color: #111;
            background: rgba(255,255,255,0.92);
            padding: 2px 6px;
            border-radius: 999px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.20);
            white-space: nowrap;
          ">${this.escapeHtml(p.pref)}</div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [totalW, totalH],
        iconAnchor: [totalW / 2, bubbleSize / 2],
      });

      const marker = L.marker([p.lat, p.lng], { icon });

      const popupHtml = `
        <div style="min-width:180px">
          <div style="font-weight:800;margin-bottom:4px;">
            ${this.escapeHtml(p.pref)}（${this.escapeHtml(p.city)}）
          </div>
          <div style="font-weight:700;margin-bottom:6px;">
            ${this.escapeHtml(meta.text)}
          </div>
          <div>気温: ${temp ?? '-'} ${this.escapeHtml(unit)}</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">
            座標: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(this.prefLayer);
    }
  }

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

    setTimeout(() => {
      this.centerLoading = true;
      this.centerError = '';
    }, 0);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as OpenMeteoSingle;
      const text = this.weatherCodeToText(data.current?.weather_code);

      setTimeout(() => {
        this.centerWeather = data;
        this.centerWeatherText = text;
      }, 0);
    } catch (e) {
      const msg = `取得失敗: ${(e as Error).message}`;
      setTimeout(() => {
        this.centerError = msg;
        this.centerWeather = null;
        this.centerWeatherText = '';
      }, 0);
    } finally {
      setTimeout(() => {
        this.centerLoading = false;
      }, 0);
    }
  }

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
      case 61:
      case 63:
      case 65:
        return '雨';
      case 71:
      case 73:
      case 75:
        return '雪';
      case 80:
      case 81:
      case 82:
        return 'にわか雨';
      case 95:
        return '雷雨';
      case 96:
      case 99:
        return '雹を伴う雷雨';
      default:
        return `不明（code=${code ?? 'null'}）`;
    }
  }

  private weatherCodeToMaterial(code?: number): {
    iconName: string;
    color: string;
    text: string;
    offset: string;
  } {
    switch (code) {
      case 0:
        return {
          iconName: 'wb_sunny',
          color: '#fbc02d',
          text: '快晴',
          offset: 'translate(0px, 0px)',
        };
      case 1:
      case 2:
        return {
          iconName: 'partly_cloudy_day',
          color: '#ffca28',
          text: '晴れ時々曇り',
          offset: 'translate(0px, 0px)',
        };
      case 3:
        return {
          iconName: 'cloud',
          color: '#90a4ae',
          text: '曇り',
          offset: 'translate(-1px, 0px)',
        };
      case 45:
      case 48:
        return { iconName: 'foggy', color: '#9e9e9e', text: '霧', offset: 'translate(0px, 0px)' };
      case 61:
      case 63:
      case 65:
      case 80:
      case 81:
      case 82:
        return {
          iconName: 'umbrella',
          color: '#1976d2',
          text: '雨',
          offset: 'translate(0px, 0px)',
        };
      case 71:
      case 73:
      case 75:
        return { iconName: 'ac_unit', color: '#64b5f6', text: '雪', offset: 'translate(0px, 0px)' };
      case 95:
        return {
          iconName: 'thunderstorm',
          color: '#d32f2f',
          text: '雷雨',
          offset: 'translate(0px, 0px)',
        };
      default:
        return {
          iconName: 'help_outline',
          color: '#757575',
          text: '不明',
          offset: 'translate(0px, 0px)',
        };
    }
  }

  private escapeHtml(s: string): string {
    return (s ?? '').replace(/[&<>"']/g, (c) => {
      switch (c) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return c;
      }
    });
  }
}
