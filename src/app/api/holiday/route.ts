import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const tomorrow = new Date(today.getTime() + 24*60*60*1000);
  const tmm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tdd = String(tomorrow.getDate()).padStart(2, '0');
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${yyyy}/JP`);
    if (!res.ok) {
      return NextResponse.json({ today: '', tomorrow: '' }, { status: 500 });
    }
    const holidays = await res.json();
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const tomorrowStr = `${yyyy}-${tmm}-${tdd}`;
    const todayHoliday = holidays.find((h: { date: string }) => h.date === todayStr);
    const tomorrowHoliday = holidays.find((h: { date: string }) => h.date === tomorrowStr);
    return NextResponse.json({ today: todayHoliday ? todayHoliday.localName : '', tomorrow: tomorrowHoliday ? tomorrowHoliday.localName : '' });
  } catch {
    return NextResponse.json({ today: '', tomorrow: '' }, { status: 500 });
  }
} 