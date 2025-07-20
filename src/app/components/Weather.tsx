"use client";
import React, { useEffect, useState } from "react";

// 天気コード→日本語
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

interface InfoSettings {
  weather: boolean;
  forecast: boolean;
  news: boolean;
  holiday: boolean;
  exchange: boolean;
  sun: boolean;
}

export default function Weather({ color, infoSettings }: { color: string, infoSettings: InfoSettings }) {
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [current, setCurrent] = useState<string>("取得中...");
  const [forecast, setForecast] = useState<string>("");
  const [holiday, setHoliday] = useState<string>("");
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exchange, setExchange] = useState<string>("");
  const [newsList, setNewsList] = useState<string[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  // 次の日の入りまたは日の出（近い方）
  const [nextSunEvent, setNextSunEvent] = useState<string>("");
  // 警報・注意報
  const [alert, setAlert] = useState<string>("");
  // 警報の緊急情報スライドのみ
  const [emergencyIndex, setEmergencyIndex] = useState(0);
  const emergencySlides = [alert].filter(Boolean);

  // 位置情報取得
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo(null)
    );
  }, []);

  // 現在の気温・天気・都市名（1分ごとに自動更新）
  useEffect(() => {
    if (!geo) return;
    const fetchCurrent = () => {
      const urlCurrent = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&current_weather=true&timezone=auto`;
      fetch(urlCurrent)
        .then((res) => res.json())
        .then((data) => {
          if (data.current_weather && typeof data.current_weather.temperature === 'number') {
            const temp = `${Math.round(data.current_weather.temperature)}°C`;
            const code = data.current_weather.weathercode;
            const weatherJa = weatherCodeToJa[code] || "不明";
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${geo.lat}&lon=${geo.lng}&format=json`)
              .then((res) => res.json())
              .then((geoData) => {
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.state || "";
                setCurrent(`${temp} ${weatherJa}${city ? ` / ${city}` : ""}`);
              })
              .catch(() => setCurrent(`${temp} ${weatherJa}`));
          } else {
            setCurrent("気温取得失敗");
          }
        })
        .catch(() => setCurrent("気温取得失敗"));
    };
    fetchCurrent();
    const timer = setInterval(fetchCurrent, 60 * 1000);
    return () => clearInterval(timer);
  }, [geo]);

  // 明日の予報（1分ごとに自動更新）
  useEffect(() => {
    if (!geo) return;
    const fetchForecast = () => {
      const urlForecast = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
      fetch(urlForecast)
        .then((res) => res.json())
        .then((data) => {
          if (
            data.daily &&
            data.daily.temperature_2m_max &&
            data.daily.temperature_2m_min &&
            data.daily.weathercode &&
            data.daily.time
          ) {
            const tomorrow = 1;
            const tmax = data.daily.temperature_2m_max;
            const tmin = data.daily.temperature_2m_min;
            const wcode = data.daily.weathercode;
            const weatherJa = weatherCodeToJa[wcode[tomorrow]] || "不明";
            setForecast(`明日 ${Math.round(tmax[tomorrow])}°C / ${Math.round(tmin[tomorrow])}°C ${weatherJa}`);
          } else {
            setForecast("天気取得失敗");
          }
        })
        .catch(() => setForecast("天気取得失敗"));
    };
    fetchForecast();
    const timer = setInterval(fetchForecast, 60 * 1000);
    return () => clearInterval(timer);
  }, [geo]);

  // ニュース取得（/api/news経由、1分ごとに自動更新、最新5件をスライド）
  useEffect(() => {
    const fetchNews = () => {
      fetch('/api/news')
        .then(res => res.json())
        .then(data => {
          if (data.titles && data.titles.length > 0) {
            setNewsList(data.titles);
          }
        });
    };
    fetchNews();
    const timer = setInterval(() => {
      setNewsIndex(prev => {
        if (newsList.length > 0) {
          return (prev + 1) % newsList.length;
        }
        return prev;
      });
      fetchNews();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [newsList.length]);

  // 為替レート取得（/api/exchange経由、1分ごとに自動更新）
  useEffect(() => {
    const fetchExchange = () => {
      fetch('/api/exchange')
        .then(res => res.json())
        .then(data => {
          if (data.usd && data.eur) {
            setExchange(`USD/JPY ${data.usd.toFixed(2)} | EUR/JPY ${data.eur.toFixed(2)}`);
          }
        });
    };
    fetchExchange();
    const timer = setInterval(fetchExchange, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 祝日・記念日取得（/api/holiday経由、1日1回更新）
  useEffect(() => {
    const fetchHoliday = () => {
      fetch('/api/holiday')
        .then(res => res.json())
        .then(data => {
          if (data.today) setHoliday(`今日は「${data.today}」`);
          else if (data.tomorrow) setHoliday(`明日は「${data.tomorrow}」`);
          else setHoliday("");
        });
    };
    fetchHoliday();
    // 1日1回だけで十分
  }, []);

  // 次の日の入りまたは日の出（近い方）
  useEffect(() => {
    // sunTimesはpage.tsxで取得しているが、ここではAPIやpropsで受け取っていないので、
    // ここで取得する簡易版（Open-MeteoのAPIを利用）
    if (!geo) return;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=sunrise,sunset&timezone=auto`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.daily && data.daily.sunrise && data.daily.sunset) {
          const now = new Date();
          const today = 0;
          const tomorrow = 1;
          const sunriseToday = new Date(data.daily.sunrise[today]);
          const sunsetToday = new Date(data.daily.sunset[today]);
          const sunriseTomorrow = new Date(data.daily.sunrise[tomorrow]);
          const sunsetTomorrow = new Date(data.daily.sunset[tomorrow]);
          // 直近のイベントを探す
          let nextLabel = '';
          let nextTime: Date | null = null;
          if (now < sunriseToday) {
            nextLabel = '今日の日の出'; nextTime = sunriseToday;
          } else if (now < sunsetToday) {
            nextLabel = '今日の日の入り'; nextTime = sunsetToday;
          } else if (now < sunriseTomorrow) {
            nextLabel = '明日の日の出'; nextTime = sunriseTomorrow;
          } else if (now < sunsetTomorrow) {
            nextLabel = '明日の日の入り'; nextTime = sunsetTomorrow;
          } else {
            // 24時を過ぎて翌日のデータがない場合は前日扱い
            nextLabel = '前日の日の出'; nextTime = sunriseToday;
          }
          if (nextTime) {
            setNextSunEvent(`${nextLabel} ${nextTime.getHours().toString().padStart(2,'0')}:${nextTime.getMinutes().toString().padStart(2,'0')}`);
          } else {
            setNextSunEvent("");
          }
        }
      });
  }, [geo]);

  // 警報・注意報（1分ごとに自動更新）
  useEffect(() => {
    if (!geo) return;
    const fetchAlert = () => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${geo.lat}&lon=${geo.lng}&format=json`)
        .then(res => res.json())
        .then(geoData => {
          const pref = geoData.address?.state || geoData.address?.province || geoData.address?.region || "";
          if (!pref) return;
          // 警報・注意報API
          fetch(`/api/alert?pref=${encodeURIComponent(pref)}`)
            .then(res => res.json())
            .then(data => {
              if (data.alerts && data.alerts.length > 0) {
                setAlert(data.alerts[0]); // 1件だけ表示
              } else {
                setAlert("");
              }
            });
        });
    };
    fetchAlert();
    const timer = setInterval(fetchAlert, 60 * 1000);
    return () => clearInterval(timer);
  }, [geo]);

  // slides配列を更新
  useEffect(() => {
    const arr = [];
    if (infoSettings.weather) arr.push(current);
    if (infoSettings.forecast) arr.push(forecast);
    if (infoSettings.news) arr.push(newsList[newsIndex] || '');
    if (infoSettings.holiday) arr.push(holiday);
    if (infoSettings.exchange) arr.push(exchange);
    if (infoSettings.sun) arr.push(nextSunEvent);
    setSlides(arr);
  }, [current, forecast, newsList, newsIndex, holiday, exchange, nextSunEvent, infoSettings]);

  // 5秒ごとにスライド切り替え
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // 警報・遅延の緊急情報スライド
  useEffect(() => {
    if (emergencySlides.length <= 1) return;
    const timer = setInterval(() => {
      setEmergencyIndex(i => (i + 1) % emergencySlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [emergencySlides.length]);

  return (
    <>
      <div style={{ color, fontSize: "1.3em", minHeight: 28, textAlign: "center", opacity: 0.9, position: "relative", height: 32 }}>
        <span className={`weather-fade fade-in`} key={currentSlide}>
          {slides[currentSlide]}
        </span>
      </div>
      {emergencySlides.length > 0 && (
        <div style={{marginTop: 2}}>
          <div style={{ color, fontSize: '1em', textAlign: 'center', opacity: 0.8, fontWeight: 600, letterSpacing: 1 }}>交通・気候の緊急情報</div>
          <div style={{ color, fontSize: '1.3em', textAlign: 'center', opacity: 0.9, fontWeight: 500 }}>
            {emergencySlides[emergencyIndex]}
          </div>
        </div>
      )}
    </>
  );
} 