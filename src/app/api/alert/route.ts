import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

function fetchWithTimeout(resource: string, options: any = {}) {
  const { timeout = 10000 } = options;
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pref = searchParams.get('pref');
  if (!pref) return NextResponse.json({ alerts: [] });
  const url = "https://www.data.jma.go.jp/developer/xml/feed/extra_l.xml";
  try {
    const res = await fetchWithTimeout(url, { redirect: "follow", timeout: 10000 }) as Response;
    if (!res.ok) {
      console.error('alert fetch failed:', res.status, res.statusText);
      return NextResponse.json({ alerts: [] }, { status: 500 });
    }
    const xml = await res.text();
    let json;
    try {
      json = await parseStringPromise(xml);
    } catch (e) {
      console.error('alert xml parse error:', e);
      return NextResponse.json({ alerts: [] }, { status: 500 });
    }
    let items = json?.rss?.channel?.[0]?.item;
    if (!Array.isArray(items)) items = [items];
    const alerts = (items || [])
      .filter((item: any) => item && item.title && Array.isArray(item.title) && typeof item.title[0] === 'string')
      .map((item: any) => item.title[0])
      .filter((title: string) => title.includes(pref));
    return NextResponse.json({ alerts });
  } catch (e) {
    console.error('alert fetch error:', e);
    return NextResponse.json({ alerts: [] }, { status: 500 });
  }
} 