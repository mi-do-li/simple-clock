"use client";
import React, { useEffect, useState } from "react";

// シンプルな天気予報（今日・明日）
export default function Weather({ color }: { color: string }) {
  const [forecast, setForecast] = useState<string>("取得中...");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  // 位置情報取得
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo(null)
    );
  }, []);

  // Open-Meteo APIで天気予報取得
  useEffect(() => {
    if (!geo) return;
    // Open-Meteo: https://open-meteo.com/en/docs
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (
          data.daily &&
          data.daily.temperature_2m_max &&
          data.daily.temperature_2m_min &&
          data.daily.time
        ) {
          // 今日・明日のデータ
          const today = 0;
          const tomorrow = 1;
          const tmax = data.daily.temperature_2m_max;
          const tmin = data.daily.temperature_2m_min;
          const time = data.daily.time;
          setForecast(
            `今日 ${Math.round(tmax[today])}°C / ${Math.round(tmin[today])}°C  明日 ${Math.round(tmax[tomorrow])}°C / ${Math.round(tmin[tomorrow])}°C`
          );
        } else {
          setForecast("天気取得失敗");
        }
      })
      .catch(() => setForecast("天気取得失敗"));
  }, [geo]);

  return (
    <div style={{ color, fontSize: "0.95em", minHeight: 22, textAlign: "center", opacity: 0.85 }}>
      {forecast}
    </div>
  );
} 