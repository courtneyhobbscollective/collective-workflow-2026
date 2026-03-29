import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "missing_key", message: "Set GIPHY_API_KEY in .env.local for GIF search." },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "work";
  const limit = Math.min(Number(searchParams.get("limit") || "12"), 24);

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "giphy_error", status: res.status }, { status: 502 });
  }
  const data = (await res.json()) as {
    data: Array<{ id: string; images: { fixed_height_small: { url: string }; original: { url: string } } }>;
  };

  const gifUrls = data.data.map((g) => ({
    id: g.id,
    previewUrl: g.images.fixed_height_small.url,
    url: g.images.original.url,
  }));

  return NextResponse.json({ gifs: gifUrls });
}
