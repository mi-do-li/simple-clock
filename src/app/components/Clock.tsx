"use client";
import React, { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="font-mono font-bold tracking-widest"
        style={{
          fontSize: "4.5rem",
          letterSpacing: "0.12em",
          color: "#bfa77a",
          lineHeight: 1.1,
          textShadow: "0 2px 12px #e5decf, 0 1px 0 #fff"
        }}
      >
        {pad(time.getHours())}:{pad(time.getMinutes())}
      </div>
      <div className="mt-2 text-base text-gray-500" style={{ letterSpacing: "0.08em" }}>
        {time.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
      </div>
    </div>
  );
} 