import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://api.frankfurter.app/latest?from=USD&to=JPY,EUR";
  try {
    console.log("fetching:", url);
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ usd: null, eur: null }, { status: 500 });
    }
    const data = await res.json();
    const usd = data.rates.JPY ?? null;
    const eur = data.rates.EUR ?? null;
    return NextResponse.json({ usd, eur });
  } catch {
    return NextResponse.json({ usd: null, eur: null }, { status: 500 });
  }
} 