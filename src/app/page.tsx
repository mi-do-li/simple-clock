"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Weather from "./components/Weather";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./components/ThemeContext";

// AnimatedNumber, themeOptions, presetThemes, handleFullscreen などをHome関数の外に定義
function AnimatedNumber({ value, className, style }: { value: string, className?: string, style?: React.CSSProperties }) {
  return <span className={className} style={style}>{value}</span>;
}

const presetThemes = [
  { key: 'retro', label: 'レトロ', bg: '#f5e9da', color: '#7c4f20', sec: '#bfa77a', font: 'Courier New, monospace' },
  { key: 'modern', label: 'モダン', bg: '#222', color: '#fff', sec: '#bbb', font: 'Montserrat, sans-serif' },
  { key: 'spring', label: '春', bg: '#ffeef4', color: '#d17c9c', sec: '#f8bbd0', font: 'Noto Sans JP, sans-serif' },
  { key: 'summer', label: '夏', bg: '#e0f7fa', color: '#00796b', sec: '#4dd0e1', font: 'Noto Sans JP, sans-serif' },
  { key: 'autumn', label: '秋', bg: '#fff3e0', color: '#b26a00', sec: '#ffb74d', font: 'Noto Sans JP, sans-serif' },
  { key: 'winter', label: '冬', bg: '#e3f2fd', color: '#1565c0', sec: '#90caf9', font: 'Noto Sans JP, sans-serif' },
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
    bg: "#223366",
    color: "#fff",
    sec: "#aabbee"
  },
  // dusk（紺と水色の中間、白文字で見やすく）
  {
    name: "dusk",
    bg: "#466fa3",
    color: "#fff",
    sec: "#aaddff"
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
  const duskEnd = sunset + 10*60*1000; // 日の入り+10分
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
  } else if (now >= eveningPeak && now < duskEnd) {
    // 夕方色→dusk
    const t = (now - eveningPeak) / (duskEnd - eveningPeak);
    return {
      bg: lerpColor(themes[2].bg, themes[4].bg, t),
      color: lerpColor(themes[2].color, themes[4].color, t),
      sec: lerpColor(themes[2].sec, themes[4].sec, t),
      name: 'evening-dusk'
    };
  } else if (now >= duskEnd && now < eveningEnd) {
    // dusk→夜色へ補間
    const t = (now - duskEnd) / (eveningEnd - duskEnd);
    return {
      bg: lerpColor(themes[4].bg, themes[3].bg, t),
      color: lerpColor(themes[4].color, themes[3].color, t),
      sec: lerpColor(themes[4].sec, themes[3].sec, t),
      name: 'dusk-night'
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
  const { theme, setTheme } = useTheme();
  const [hourMode, setHourMode] = useState<'24'|'12'>('24');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('home'); // home, countdown, countup, pomodoro, fullscreen, settings

  // 日の出・日の入り時刻を管理するstateを追加
  const [sunTimes, setSunTimes] = useState<{sunrise: Date|null, sunset: Date|null}|null>(null);

  // Geolocation + Sunrise-Sunset APIでその日の時刻を取得
  useEffect(() => {
    if (!navigator.geolocation) return;
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
            }
          });
      }
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

  // 情報表示設定
  const defaultInfoSettings = {
    weather: true,
    forecast: true,
    news: true,
    holiday: true,
    exchange: true,
    sun: true,
  };
  const [infoSettings, setInfoSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('infoSettings');
      if (saved) return JSON.parse(saved);
    }
    return defaultInfoSettings;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('infoSettings', JSON.stringify(infoSettings));
    }
  }, [infoSettings]);

  // テーマ分岐をuseMemoでまとめる
  // theme.name==='auto'のときはgetTimeThemeDynamicで色を決定
  const displayTheme = theme.name === 'auto'
    ? { ...getTimeThemeDynamic(now, ambient, sunTimes), font: theme.font, name: 'auto' }
    : theme;
  const fontFamily = displayTheme.font;

  // テーマ切り替えUI例
  // <button onClick={() => setTheme({ ...theme, bg: "#222", color: "#fff", name: "dark" })}>ダーク</button>
  // <button onClick={() => setTheme({ ...theme, bg: "#fff", color: "#222", name: "light" })}>ライト</button>
  // カスタムテーマ編集例
  // <input type="color" value={theme.bg} onChange={e => setTheme({ ...theme, bg: e.target.value })} />

  // デバッグ表示用
  // 現在地（緯度・経度）と次のイベント（日の出/日の入り）
  const h24 = now.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const h = pad(hourMode === '24' ? h24 : h12);
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());

  // 日付・曜日の文字列
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  // 画面幅でモバイル判定
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ハンバーガーメニューアイコン
  const HamburgerIcon = (!isMobile || !settingsOpen) && (
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

  // isClientがtrueになるまでUIを描画しない
  if (!isClient) {
    return null;
  }

  // メイン画面（時計・天気・日付）
  const MainContent = (
    <div className={styles.minimalClockBg} style={{ background: displayTheme.bg, fontFamily: fontFamily, position: 'relative' }}>
      {HamburgerIcon}
      <div className={styles.minimalClockWrapper}>
        <div className={styles.minimalClockCenter}>
          <AnimatedNumber value={h} className={styles.hour} style={{ color: displayTheme.color }} />
          <span className={styles.colon} style={{ color: displayTheme.sec }} >:</span>
          <AnimatedNumber value={m} className={styles.minute} style={{ color: displayTheme.color }} />
        </div>
        <div style={{fontSize:'1.3em',color:displayTheme.color,fontWeight:500,lineHeight:1.3,margin:'0.2em 0',textAlign:'center'}}>
          {dateStr}
        </div>
        <div className={styles.weatherWrapper}>
          <Weather color={displayTheme.color} infoSettings={infoSettings} />
        </div>
      </div>
      <div className={styles.minimalClockSec}>
        <AnimatedNumber value={s} className={styles.second} style={{ color: displayTheme.sec }} />
      </div>
      {/* {isClient && (
        <div style={{position:'fixed',bottom:8,left:0,right:0,textAlign:'center',fontSize:'12px',color:'#888',pointerEvents:'none',zIndex:99,opacity:0.7}}>{debugStr}</div>
      )} */}
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
        theme={displayTheme}
      />
      {/* 設定ポップアップ */}
      {settingsOpen && (
        <div className={styles.settingsPopup}>
          <button className={styles.settingsPopupClose} onClick={() => setSettingsOpen(false)} aria-label="閉じる">×</button>
          <div className={styles.settingsPopupTitle}>設定</div>
          {/* 情報表示設定 */}
          <div className={styles.settingsPopupSection}>
            <div style={{fontWeight:500,marginBottom:4}}>表示する情報</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label><input type="checkbox" checked={infoSettings.weather} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, weather: e.target.checked}))}/> 現在の天気</label>
              <label><input type="checkbox" checked={infoSettings.forecast} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, forecast: e.target.checked}))}/> 明日の天気</label>
              <label><input type="checkbox" checked={infoSettings.news} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, news: e.target.checked}))}/> ニュース</label>
              <label><input type="checkbox" checked={infoSettings.holiday} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, holiday: e.target.checked}))}/> 祝日情報</label>
              <label><input type="checkbox" checked={infoSettings.exchange} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, exchange: e.target.checked}))}/> 為替</label>
              <label><input type="checkbox" checked={infoSettings.sun} onChange={e => setInfoSettings((s: typeof infoSettings) => ({...s, sun: e.target.checked}))}/> 日の出/日の入り</label>
            </div>
          </div>
          {/* テーマ選択 */}
          <div className={styles.settingsPopupSection}>
            <div style={{fontWeight:500,marginBottom:4}}>テーマ</div>
            <div className={styles.settingsPopupRadioGroup}>
              {presetThemes.map(t => (
                <button
                  key={t.key}
                  className={styles.themePanelBtn + (theme.name === t.key ? ' ' + styles.selected : '')}
                  onClick={() => setTheme({ ...theme, ...t, name: t.key, font: t.font })}
                >{t.label}</button>
              ))}
              <button
                className={styles.themePanelBtn + (theme.name === 'auto' ? ' ' + styles.selected : '')}
                onClick={() => setTheme({ ...theme, name: 'auto' })}
              >自動</button>
            </div>
          </div>
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
