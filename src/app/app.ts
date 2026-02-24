import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

/* ==========================================================
 * Open-Meteo のレスポンス型（このアプリで使う分だけ）
 * ----------------------------------------------------------
 * - Open-Meteo は多くのフィールドを返しますが、
 *   本アプリは current と units だけ使います。
 * - 型を絞ることで、移植時に「どの値を使っているか」が明確になります。
 * ========================================================== */
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

/* ==========================================================
 * 県庁所在地マスタ（全国表示の基準点）
 * ----------------------------------------------------------
 * - 全国の「代表地点」をどこにするかは要件次第です。
 *   ここでは県庁所在地の代表座標を使っています。
 * - ここを差し替えるだけで、表示位置をまとめて調整できます。
 * ========================================================== */
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

/* ==========================================================
 * コンポーネント
 * ----------------------------------------------------------
 * - templateUrl で HTML を分離しているだけ
 * - JS/TS側の処理は「以前動いていた版」から一切変えていません
 * ========================================================== */
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App implements AfterViewInit {
  /* ==========================================================
   * Leaflet 本体
   * ========================================================== */

  /** Leaflet Map インスタンス（ngAfterViewInit で生成） */
  private map!: L.Map;

  /**
   * 全国表示（県庁所在地アイコン）をまとめて管理する LayerGroup
   * - 表示ON/OFF は clearLayers() で一括制御できる
   */
  private prefLayer = L.layerGroup();

  /* ==========================================================
   * 仕様：ズーム閾値
   * ----------------------------------------------------------
   * - 13以下：左上 + 全国表示
   * - 14以上：左上のみ（全国は非表示）
   * ========================================================== */
  private readonly SHOW_PREF_MAX_ZOOM = 13;

  /* ==========================================================
   * UI表示用の状態
   * ========================================================== */

  /** 現在ズーム（左上パネルに表示） */
  currentZoom = 0;

  /**
   * 全国の天気結果キャッシュ
   * - Open-Meteo は 47地点を一括取得できる
   * - ズームを戻すたびに再取得すると無駄なのでキャッシュする
   */
  private prefWeatherList: OpenMeteoSingle[] | null = null;

  /**
   * moveend の度に中心天気を更新するとAPIが過剰になるため、
   * デバウンス（最後の操作から一定時間後に1回だけ取得）する。
   */
  private debounceTimer: number | null = null;

  /** 中心地点の天気（左上） */
  centerWeather: OpenMeteoSingle | null = null;

  /** 中心地点の天気コード→日本語変換した表示文字列 */
  centerWeatherText = '';

  /** 左上：ローディング表示のためのフラグ */
  centerLoading = false;

  /** 左上：エラー表示 */
  centerError = '';

  /* ==========================================================
   * 初期化
   * ========================================================== */
  ngAfterViewInit(): void {
    // 1) 地図生成（日本中心あたり）
    this.map = L.map('map').setView([36.2, 138.25], 5);

    // 2) 背景タイル（OpenStreetMap）
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // 3) 全国レイヤーを追加（表示・非表示は clearLayers で制御）
    this.prefLayer.addTo(this.map);

    /**
     * 4) 初回処理
     * - setTimeout(0) を挟む理由：
     *   Angular初期描画直後に state を更新する際、
     *   NG0100（ExpressionChangedAfter...）を避けるため。
     *   ※この挙動も「以前動いていた版」から変更していません。
     */
    setTimeout(() => {
      this.currentZoom = this.map.getZoom();
      this.updateCenterWeather(); // 左上（中心天気）を取得
      this.updatePrefVisibilityByZoom(); // 全国表示 ON/OFF
    }, 0);

    // 5) ズーム終了時：全国表示のON/OFF判定
    this.map.on('zoomend', () => {
      this.currentZoom = this.map.getZoom();
      this.updatePrefVisibilityByZoom();
    });

    // 6) パンなど移動終了時：中心天気のみ更新（デバウンス）
    this.map.on('moveend', () => {
      if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => this.updateCenterWeather(), 250);
    });
  }

  /* ==========================================================
   * ズームに応じて全国表示を切り替える
   * ========================================================== */
  private async updatePrefVisibilityByZoom(): Promise<void> {
    const zoom = this.map.getZoom();

    // 仕様：13以下なら全国表示、14以上なら全国非表示
    const shouldShow = zoom <= this.SHOW_PREF_MAX_ZOOM;

    if (!shouldShow) {
      // 全国を消す（左上パネルは残る）
      this.prefLayer.clearLayers();
      return;
    }

    // 全国表示が必要で、まだ取得していないなら一括取得
    if (!this.prefWeatherList) {
      await this.fetchPrefWeatherNationwide();
    }

    // 取得結果をもとに全国マーカーを描画
    this.renderPrefMarkers();
  }

  /* ==========================================================
   * 全国（47地点）の天気を一括取得
   * ----------------------------------------------------------
   * - Open-Meteo は latitude / longitude をカンマ区切りで複数指定できる
   * - timezone=auto にして、各地点のローカル時刻が返る
   * ========================================================== */
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

      // 複数地点の場合は配列が返る想定。
      // 万一単体が返っても動くように配列化して保持。
      this.prefWeatherList = Array.isArray(json) ? json : [json];
    } catch (e) {
      // 失敗時：全国は表示できないのでキャッシュを無効化
      console.error('全国（県庁所在地）の天気取得に失敗:', e);
      this.prefWeatherList = null;
    }
  }

  /* ==========================================================
   * 全国マーカー描画
   * ----------------------------------------------------------
   * - divIcon を使って Material Icons + 県名ラベルを重ねる
   * - iconAnchor を「円の中心」に合わせることでズレを抑える
   * - cloud系の見た目中心ズレは meta.offset で微調整
   * ========================================================== */
  private renderPrefMarkers(): void {
    if (!this.prefWeatherList) return;

    // いったん全削除してから再描画（状態が崩れない）
    this.prefLayer.clearLayers();

    for (let i = 0; i < PREF_CAPITALS.length; i++) {
      const p = PREF_CAPITALS[i];
      const w = this.prefWeatherList[i] as OpenMeteoSingle | undefined;

      // 天気コードなどを取り出し（無い場合は undefined）
      const code = w?.current?.weather_code;
      const temp = w?.current?.temperature_2m;
      const unit = w?.current_units?.temperature_2m ?? '°C';

      // 天気コード→アイコン/色/文言に変換
      const meta = this.weatherCodeToMaterial(code);

      // 見た目サイズ（以前の版と同じ）
      const bubbleSize = 40;
      const totalW = 64;
      const totalH = 54;

      // 表示HTML（円 + Materialアイコン + 県名ラベル）
      const iconHtml = `
        <div style="position:relative;width:${totalW}px;height:${totalH}px;pointer-events:none;">
          <div style="
            position:absolute;left:50%;top:0;
            width:${bubbleSize}px;height:${bubbleSize}px;
            transform:translateX(-50%);
            border-radius:50%;
            background:rgba(255,255,255,0.92);
            box-shadow:0 4px 10px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
          ">
            <span class="material-icons" style="
              font-size:22px;line-height:22px;
              color:${meta.color};
              transform:${meta.offset};
            ">${meta.iconName}</span>
          </div>

          <div style="
            position:absolute;left:50%;top:${bubbleSize - 2}px;
            transform:translateX(-50%);
            font-size:11px;line-height:1;font-weight:800;color:#111;
            background:rgba(255,255,255,0.92);
            padding:2px 6px;border-radius:999px;
            box-shadow:0 3px 8px rgba(0,0,0,0.20);
            white-space:nowrap;
          ">${this.escapeHtml(p.pref)}</div>
        </div>
      `;

      // Leaflet の divIcon 化
      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [totalW, totalH],
        // ★円の中心が座標に一致するように調整（以前の版と同じ）
        iconAnchor: [totalW / 2, bubbleSize / 2],
      });

      // マーカー生成
      const marker = L.marker([p.lat, p.lng], { icon });

      // クリック時のポップアップ（任意情報）
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

      // レイヤーに追加
      marker.addTo(this.prefLayer);
    }
  }

  /* ==========================================================
   * 中心地点の天気取得（左上パネル）
   * ----------------------------------------------------------
   * - moveend 後に呼ばれる（デバウンス済み）
   * - timezone=auto で中心地点のローカル時刻を返す
   * - setTimeout(0) は NG0100 回避（以前版と同じ）
   * ========================================================== */
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

    // Angularの変更検知タイミングを崩さないため setTimeout で状態更新
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

  /* ==========================================================
   * weather_code → 日本語の天気テキスト
   * ========================================================== */
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

  /* ==========================================================
   * weather_code → Material Icon 表現
   * ----------------------------------------------------------
   * - iconName: Material Icons の名前
   * - color: アイコン色
   * - text: ポップアップ用の短い説明
   * - offset: グリフの視覚中心ズレ補正
   * ========================================================== */
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
        // cloud は見た目中心が少しズレるため微調整（以前の版と同じ）
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

  /* ==========================================================
   * HTMLエスケープ
   * ----------------------------------------------------------
   * - アイコンHTMLに県名等を埋め込んでいるため、
   *   念のため escape しておく（XSS対策の基本）
   * ========================================================== */
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
