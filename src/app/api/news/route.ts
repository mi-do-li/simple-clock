export const runtime = "nodejs"; // Edgeでは外部RSSが弾かれやすいのでNodeに切替

import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export async function GET() {
  const rssUrl = "https://www3.nhk.or.jp/rss/news/cat0.xml";
  try {
    const res = await fetch(rssUrl, { redirect: "follow" });
    if (!res.ok) {
      return NextResponse.json({ titles: [] }, { status: 500 });
    }
    const xml = await res.text();
    const json = await parseStringPromise(xml);
    let items = json.rss.channel[0].item;
    if (!Array.isArray(items)) items = [items];
    console.log("item count:", items.length);
    const titles = (items as { title: string[] }[]).slice(0, 5).map((item) => item.title[0]);
    console.log("titles:", titles);
    return NextResponse.json({ titles });
  } catch {
    return NextResponse.json({ titles: [] }, { status: 500 });
  }
} 