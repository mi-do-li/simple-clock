"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import Weather from "./components/Weather";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./components/ThemeContext";
import { useMemo } from "react";

// AnimatedNumber, themeOptions, presetThemes, handleFullscreen などをHome関数の外に定義
function AnimatedNumber({ value, className, style }: { value: string, className?: string, style?: React.CSSProperties }) {
  return <span className={className} style={style}>{value}</span>;
}

const themeOptions = [
  { key: "auto", label: "自動" },
  { key: "morning", label: "朝" },
  { key: "day", label: "昼" },
  { key: "evening", label: "夕" },
  { key: "night", label: "夜" },
];

const presetThemes = [
  { key: 'retro', label: 'レトロ', bg: '#f5e9da', color: '#7c4f20', sec: '#bfa77a', font: 'Courier New, monospace' },
  { key: 'modern', label: 'モダン', bg: '#222', color: '#fff', sec: '#bbb', font: 'Montserrat, sans-serif' },
  { key: 'spring', label: '春', bg: '#ffeef4', color: '#d17c9c', sec: '#f8bbd0', font: 'Noto Sans JP, sans-serif' },
  { key: 'summer', label: '夏', bg: '#e0f7fa', color: '#00796b', sec: '#4dd0e1', font: 'Noto Sans JP, sans-serif' },
  { key: 'autumn', label: '秋', bg: '#fff3e0', color: '#b26a00', sec: '#ffb74d', font: 'Noto Sans JP, sans-serif' },
  { key: 'winter', label: '冬', bg: '#e3f2fd', color: '#1565c0', sec: '#90caf9', font: 'Noto Sans JP, sans-serif' },
  { key: 'custom', label: 'カスタム', bg: '#fff', color: '#222', sec: '#bbb', font: 'Arial, sans-serif' },
];

function handleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// 時間帯・明るさごとのテーマ色
const themes = [
  // 朝（薄い黄色）
  {
    name: "morning",
    bg: "#fff9e3", // 薄い黄色
    color: "#a68b00",
    sec: "#ffe066"
  },
  // 昼（もっと薄い水色）
  {
    name: "day",
    bg: "#e6f7ff", // 以前より薄い水色
    color: "#247ba0",
    sec: "#7fd6e6"
  },
  // 夕方（薄いオレンジ）
  {
    name: "evening",
    bg: "#ffe5b4", // 薄いオレンジ
    color: "#b85c00",
    sec: "#ffb870"
  },
  // 夜（紺色）
  {
    name: "night",
    bg: "#223366", // 以前の夕方色
    color: "#fff",
    sec: "#aabbee"
  }
];

// テーマごとの中心時刻（24h制）
const themeCenters = [
  6.5,   // 朝: 5-8時 → 中心6:30
  12.5,  // 昼: 8-17時 → 中心12:30
  18,    // 夕: 17-19時 → 中心18:00
  23,    // 夜: 19-翌5時 → 中心23:00（夜は19-29時=翌5時）
];

// HEXカラーをRGB配列に変換
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [255, 255, 255]; // 不正なhexなら白を返す
  return [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];
}
// RGB配列をHEXに
function rgbToHex(rgb: [number,number,number]): string {
  return '#' + rgb.map(x=>x.toString(16).padStart(2,'0')).join('');
}
// 2色をtで補間
function lerpColor(a: string, b: string, t: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(a)) a = '#ffffff';
  if (!/^#[0-9a-f]{6}$/i.test(b)) b = '#ffffff';
  const ar = hexToRgb(a), br = hexToRgb(b);
  return rgbToHex([
    Math.round(ar[0]+(br[0]-ar[0])*t),
    Math.round(ar[1]+(br[1]-ar[1])*t),
    Math.round(ar[2]+(br[2]-ar[2])*t)
  ]);
}

function getTimeTheme(date: Date, ambient: number | null) {
  if (ambient !== null && ambient < 30) {
    return { ...themes[3], name: 'night' };
  }
  const hour = date.getHours() + date.getMinutes() / 60;
  const centers = themeCenters;
  const n = centers.length;
  const h = hour;
  for (let i = 0; i < n; ++i) {
    const c0 = centers[i];
    let c1 = centers[(i + 1) % n];
    if (c1 <= c0) c1 += 24;
    let hh = h;
    if (hh < c0) hh += 24;
    // 区間の右端も含める
    if (hh >= c0 && hh <= c1) {
      const t = (hh - c0) / (c1 - c0);
      const fromTheme = themes[i];
      const toTheme = themes[(i + 1) % n];
      return {
        bg: lerpColor(fromTheme.bg, toTheme.bg, t),
        color: lerpColor(fromTheme.color, toTheme.color, t),
        sec: lerpColor(fromTheme.sec, toTheme.sec, t),
        name: fromTheme.name + '-' + toTheme.name
      };
    }
  }
  // 念のため、どれにも該当しない場合は夜テーマを返す
  return { ...themes[3], name: 'night' };
}

// テーマ切り替えロジックを動的に
function getTimeThemeDynamic(date: Date, ambient: number | null, sunTimes: {sunrise: Date|null, sunset: Date|null}|null) {
  if (ambient !== null && ambient < 30) {
    return { ...themes[3], name: 'night' };
  }
  if (!sunTimes || !sunTimes.sunrise || !sunTimes.sunset) {
    // フォールバック: 従来のロジック
    return getTimeTheme(date, ambient);
  }
  const now = date.getTime();
  const sunrise = sunTimes.sunrise.getTime();
  const sunset = sunTimes.sunset.getTime();
  // 朝: 日の出45分前〜日の出3時間後
  const morningStart = sunrise - 45*60*1000;
  const morningEnd = sunrise + 3*60*60*1000;
  // 昼: 朝の終わり〜日の入り1時間前
  const dayStart = morningEnd;
  const dayEnd = sunset - 60*60*1000;
  // 夕方: 昼の終わり〜日の入り+30分
  const eveningStart = sunset - 60*60*1000; // 日の入り1時間前
  const eveningPeak = sunset - 10*60*1000; // 日の入り10分前
  const eveningEnd = sunset + 30*60*1000;  // 日の入り30分後
  // 夜: それ以外
  if (now >= morningStart && now < morningEnd) {
    // 朝: 朝→昼補間
    const t = (now - morningStart) / (morningEnd - morningStart);
    return {
      bg: lerpColor(themes[0].bg, themes[1].bg, t),
      color: lerpColor(themes[0].color, themes[1].color, t),
      sec: lerpColor(themes[0].sec, themes[1].sec, t),
      name: 'morning-day'
    };
  } else if (now >= dayStart && now < dayEnd) {
    // 昼
    return { ...themes[1], name: 'day' };
  } else if (now >= eveningStart && now < eveningPeak) {
    // 昼→夕方色へ補間
    const t = (now - eveningStart) / (eveningPeak - eveningStart);
    return {
      bg: lerpColor(themes[1].bg, themes[2].bg, t),
      color: lerpColor(themes[1].color, themes[2].color, t),
      sec: lerpColor(themes[1].sec, themes[2].sec, t),
      name: 'day-evening'
    };
  } else if (now >= eveningPeak && now < eveningEnd) {
    // 夕方色→夜色へ補間
    const t = (now - eveningPeak) / (eveningEnd - eveningPeak);
    return {
      bg: lerpColor(themes[2].bg, themes[3].bg, t),
      color: lerpColor(themes[2].color, themes[3].color, t),
      sec: lerpColor(themes[2].sec, themes[3].sec, t),
      name: 'evening-night'
    };
  } else {
    // 夜
    return { ...themes[3], name: 'night' };
  }
}

// AmbientLightSensor型が存在しない場合の型定義
interface AmbientLightSensor extends EventTarget {
  illuminance: number;
  start: () => void;
  stop: () => void;
  addEventListener(type: "reading", listener: () => void): void;
}

function pad(num: number) {
  return num.toString().padStart(2, "0");
}

export default function Home() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(timer);
  }, []);
  const [ambient, setAmbient] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manualTheme, setManualTheme] = useState<null | string>(null);
  const [hourMode, setHourMode] = useState<'24'|'12'>('24');
  const [selectedPreset, setSelectedPreset] = useState<string|null>(null); // null=時間帯テーマ
  const [customTheme, setCustomTheme] = useState({ bg: '#fff', color: '#222', sec: '#bbb', font: 'Arial, sans-serif' });
  const handleThemeChange = useCallback((key: string) => {
    setManualTheme(key === "auto" ? null : key);
    // 時間帯テーマ詳細（themeOptions）選択時は設定を閉じない
    if (!themeOptions.some(opt => opt.key === key)) {
      setSettingsOpen(false);
    }
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('home'); // home, countdown, countup, pomodoro, fullscreen, settings
  const { theme: contextTheme } = useTheme();

  // 日の出・日の入り時刻を管理するstateを追加
  const [sunTimes, setSunTimes] = useState<{sunrise: Date|null, sunset: Date|null}|null>(null);
  const [geoError, setGeoError] = useState<string|null>(null);

  // Geolocation + Sunrise-Sunset APIでその日の時刻を取得
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'OK') {
              setSunTimes({
                sunrise: new Date(data.results.sunrise),
                sunset: new Date(data.results.sunset)
              });
            } else {
              setGeoError('Failed to get sun times');
            }
          })
          .catch(() => setGeoError('Failed to fetch sun times'));
      },
      (err) => setGeoError('Failed to get location')
    );
  }, []);

  // Ambient Light Sensor（部屋の明るさ）
  useEffect(() => {
    let sensor: AmbientLightSensor | undefined = undefined;
    if ("AmbientLightSensor" in window) {
      // @ts-expect-error: AmbientLightSensor is not standard in all browsers
      sensor = new window.AmbientLightSensor();
      sensor!.addEventListener("reading", () => {
        setAmbient(sensor!.illuminance);
      });
      sensor!.start();
    } else {
      setAmbient(null);
    }
    return () => {
      if (sensor) {
        sensor.stop();
      }
    };
  }, []);

  const h24 = now.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const h = pad(hourMode === '24' ? h24 : h12);
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  // テーマ分岐をuseMemoでまとめる
  const theme = useMemo(() => {
    let t;
    let fontFamily = '';
    if (!selectedPreset) {
      // 時間帯テーマ
      if (manualTheme && manualTheme !== "auto") {
        const idx = themeOptions.findIndex(opt => opt.key === manualTheme) - 1;
        if (idx >= 0) t = { ...themes[idx], name: manualTheme, font: contextTheme.font };
      } else {
        // manualThemeが未指定または'auto'なら、現在時刻・ambientで動的に決定（now, ambient依存で毎回再計算）
        t = { ...getTimeThemeDynamic(now, ambient, sunTimes), font: contextTheme.font };
      }
    } else if (selectedPreset === 'custom') {
      t = { ...customTheme, name: 'custom', font: customTheme.font };
      fontFamily = customTheme.font;
    } else {
      const preset = presetThemes.find(pt => pt.key === selectedPreset);
      if (preset) {
        t = { bg: preset.bg, color: preset.color, sec: preset.sec, name: preset.label, font: preset.font };
        fontFamily = preset.font;
      }
    }
    // 型安全のため、string型で返す
    return {
      ...t,
      bg: t?.bg ?? '#ffffff',
      color: t?.color ?? '#000000',
      sec: t?.sec ?? '#888888',
      fontFamily: fontFamily ?? 'Arial, sans-serif',
    };
  }, [contextTheme, manualTheme, selectedPreset, customTheme, now, ambient, sunTimes]);
  const fontFamily = theme.fontFamily;

  // デバッグ表示用
  // 現在地（緯度・経度）と次のイベント（日の出/日の入り）
  const [geo, setGeo] = useState<{lat: number, lng: number}|null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo(null)
    );
  }, []);

  let nextEventStr = '';
  if (sunTimes && sunTimes.sunrise && sunTimes.sunset) {
    const nowTime = now.getTime();
    const sunrise = sunTimes.sunrise.getTime();
    const sunset = sunTimes.sunset.getTime();
    let nextLabel = '';
    let nextTime = 0;
    if (nowTime < sunrise && (sunrise < sunset || nowTime > sunset)) {
      nextLabel = '日の出';
      nextTime = sunrise;
    } else if (nowTime < sunset) {
      nextLabel = '日の入り';
      nextTime = sunset;
    } else {
      nextLabel = '日の出';
      nextTime = sunrise + 24*60*60*1000; // 翌日
    }
    const d = new Date(nextTime);
    nextEventStr = `${nextLabel}: ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }
  const debugStr = `${h}:${m}:${s} / theme: ${theme.name}` +
    (nextEventStr ? ` / ${nextEventStr}` : '');

  // 日付・曜日の文字列
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  // ハンバーガーメニューアイコン
  const HamburgerIcon = (
    <button
      className={styles.settingsIconBtn}
      aria-label="メニュー"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 300,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {sidebarOpen ? (
        // X アイコン
        <svg width="28" height="28" viewBox="0 0 28 28" stroke="#888" strokeWidth="2" strokeLinecap="round">
          <line x1="6" y1="6" x2="22" y2="22" />
          <line x1="22" y1="6" x2="6" y2="22" />
        </svg>
      ) : (
        // ハンバーガーアイコン
        <svg width="28" height="28" viewBox="0 0 28 28" stroke="#888" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="8" width="18" height="2" rx="1" />
          <rect x="5" y="14" width="18" height="2" rx="1" />
          <rect x="5" y="20" width="18" height="2" rx="1" />
        </svg>
      )}
    </button>
  );

  // メイン画面（時計・天気・日付）
  const MainContent = (
    <div className={styles.minimalClockBg} style={{ background: theme.bg, fontFamily: fontFamily, position: 'relative' }}>
      {HamburgerIcon}
      <div className={styles.minimalClockWrapper}>
        <div className={styles.minimalClockCenter}>
          <AnimatedNumber value={h} className={styles.hour} style={{ color: theme.color }} />
          <span className={styles.colon} style={{ color: theme.sec }} >:</span>
          <AnimatedNumber value={m} className={styles.minute} style={{ color: theme.color }} />
        </div>
        <div style={{fontSize:'1.3em',color:theme.color,fontWeight:500,lineHeight:1.3,margin:'0.2em 0',textAlign:'center'}}>
          {dateStr}
        </div>
        <div className={styles.weatherWrapper}>
          <Weather color={theme.color} />
        </div>
      </div>
      <div className={styles.minimalClockSec}>
        <AnimatedNumber value={s} className={styles.second} style={{ color: theme.sec }} />
      </div>
      {isClient && (
        <div style={{position:'fixed',bottom:8,left:0,right:0,textAlign:'center',fontSize:'12px',color:'#888',pointerEvents:'none',zIndex:99,opacity:0.7}}>{debugStr}</div>
      )}
    </div>
  );

  // タイマー関連の状態・UI・ロジック・ボタン・ハンドラをすべて削除

  // タイマーUI本体（中身だけ返す）
  // タイマーUI本体（中身だけ返す）

  // Sidebarからのナビゲーション
  const handleSidebarNavigate = (page: string) => {
    if (page === 'fullscreen') {
      handleFullscreen();
      setSidebarOpen(false);
      return;
    }
    if (page === 'settings') {
      setSettingsOpen(true);
      setSidebarOpen(false);
      return;
    }
    setActivePage(page);
    setSidebarOpen(false);
  };

  // ページ切り替え
  const pageContent = MainContent;
  // ページ切り替え

  return (
    <>
      {HamburgerIcon}
      {pageContent}
      <Sidebar
        open={sidebarOpen}
        onNavigate={handleSidebarNavigate}
        active={activePage}
        theme={theme}
      />
      {/* 設定ポップアップ */}
      {settingsOpen && (
        <div className={styles.settingsPopup}>
          <button className={styles.settingsPopupClose} onClick={() => setSettingsOpen(false)} aria-label="閉じる">×</button>
          <div className={styles.settingsPopupTitle}>設定</div>
          {/* テーマ選択 */}
          <div className={styles.settingsPopupSection}>
            <div style={{fontWeight:500,marginBottom:4}}>テーマ</div>
            <div className={styles.settingsPopupRadioGroup}>
              <button
                className={styles.themePanelBtn + (!selectedPreset ? ' ' + styles.selected : '')}
                onClick={() => setSelectedPreset(null)}
              >時間帯テーマ</button>
              {presetThemes.map(t => (
                <button
                  key={t.key}
                  className={styles.themePanelBtn + (selectedPreset === t.key ? ' ' + styles.selected : '')}
                  onClick={() => setSelectedPreset(t.key)}
                >{t.label}</button>
              ))}
            </div>
          </div>
          {/* 時間帯テーマ選択時だけ下に自動/テーマボタン群を表示 */}
          {!selectedPreset && (
            <div className={styles.settingsPopupSection}>
              <div style={{fontWeight:500,marginBottom:4}}>時間帯テーマ詳細</div>
              <div className={styles.settingsPopupRadioGroup}>
                {themeOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={styles.themePanelBtn + (manualTheme === opt.key || (!manualTheme && opt.key === "auto") ? ' ' + styles.selected : '')}
                    onClick={() => handleThemeChange(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* カスタムテーマ編集UI */}
          {selectedPreset === 'custom' && (
            <div className={styles.settingsPopupSection}>
              <div style={{fontWeight:500,marginBottom:4}}>カスタムテーマ編集</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <label>背景色 <input type="color" value={customTheme.bg} onChange={e => setCustomTheme(v => ({...v, bg: e.target.value}))} /></label>
                <label>文字色 <input type="color" value={customTheme.color} onChange={e => setCustomTheme(v => ({...v, color: e.target.value}))} /></label>
                <label>秒の色 <input type="color" value={customTheme.sec} onChange={e => setCustomTheme(v => ({...v, sec: e.target.value}))} /></label>
                <label>フォント
                  <select value={customTheme.font} onChange={e => setCustomTheme(v => ({...v, font: e.target.value}))}>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Noto Sans JP, sans-serif">Noto Sans JP</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Inter', 'Roboto Mono', 'Menlo', monospace">Inter/Roboto Mono</option>
                  </select>
                </label>
              </div>
            </div>
          )}
          {/* 時刻表記 */}
          <div className={styles.settingsPopupSection}>
            <div style={{fontWeight:500,marginBottom:4}}>時刻表記</div>
            <div className={styles.settingsPopupRadioGroup}>
              <label><input type="radio" name="hourMode" value="24" checked={hourMode==='24'} onChange={()=>setHourMode('24')} /> 24時間</label>
              <label><input type="radio" name="hourMode" value="12" checked={hourMode==='12'} onChange={()=>setHourMode('12')} /> 12時間</label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
