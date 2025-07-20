import { NextResponse } from "next/server";

export async function GET() {
  // JST基準でtoday, tomorrowを作成
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + jstOffset);
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, '0');
  const dd = String(jst.getDate()).padStart(2, '0');
  const tomorrowJST = new Date(jst.getTime() + 24*60*60*1000);
  const tmm = String(tomorrowJST.getMonth() + 1).padStart(2, '0');
  const tdd = String(tomorrowJST.getDate()).padStart(2, '0');
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