"use client";
import React, { useEffect, useState } from "react";

const weatherCodeToJa: Record<number, string> = {
  0: "快晴",
  1: "主に晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "霧氷",
  51: "霧雨(弱)",
  53: "霧雨(中)",
  55: "霧雨(強)",
  56: "凍結霧雨(弱)",
  57: "凍結霧雨(強)",
  61: "雨(弱)",
  63: "雨(中)",
  65: "雨(強)",
  66: "凍結雨(弱)",
  67: "凍結雨(強)",
  71: "雪(弱)",
  73: "雪(中)",
  75: "雪(強)",
  77: "雪粒",
  80: "にわか雨(弱)",
  81: "にわか雨(中)",
  82: "にわか雨(強)",
  85: "にわか雪(弱)",
  86: "にわか雪(強)",
  95: "雷雨",
  96: "雷雨(弱い雹)",
  99: "雷雨(強い雹)"
};

interface WeatherData {
  temperature: number;
  weathercode: number;
}

interface WeatherProps {
  color?: string;
}

export default function Weather({ color }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<string>("");
  const [coords, setCoords] = useState<{latitude:number,longitude:number}|null>(null);

  // 位置情報は初回のみ取得
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("位置情報が取得できません");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setError("位置情報の取得に失敗しました");
        setLoading(false);
      }
    );
  }, []);

  // 天気・逆ジオコーディングは1分ごとに取得
  useEffect(() => {
    if (!coords) return;
    let stopped = false;
    const fetchWeather = () => {
      setLoading(true);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=Asia%2FTokyo`
      )
        .then((res) => res.json())
        .then((data) => {
          if (stopped) return;
          setWeather(data.current_weather);
          // 位置名取得（逆ジオコーディング）
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
            .then((res) => res.json())
            .then((geo) => {
              if (stopped) return;
              setLocation(geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.state || "");
            });
          setLoading(false);
        })
        .catch(() => {
          if (stopped) return;
          setError("天気情報の取得に失敗しました");
          setLoading(false);
        });
    };
    fetchWeather();
    const timer = setInterval(fetchWeather, 60000);
    return () => { stopped = true; clearInterval(timer); };
  }, [coords]);

  if (loading) return <div style={{fontSize:'14px',color:'var(--foreground)',opacity:0.7}}>天気を取得中...</div>;
  if (error) return <div style={{fontSize:'14px',color:'#e57373',opacity:0.8}}>{error}</div>;
  if (!weather) return null;

  return (
    <div style={{fontSize:'1.3em',color: color || 'var(--foreground)',fontWeight:500,lineHeight:1.3}}>
      {Math.round(weather.temperature)}°C
      <span style={{marginLeft:8}}>{weatherCodeToJa[weather.weathercode] || "不明"}</span>
      {location && <span style={{marginLeft:8,fontWeight:400,opacity:0.7}}>/ {location}</span>}
    </div>
  );
} 