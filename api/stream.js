import fetch from "node-fetch";
import { load } from "cheerio";

const STREAM_BASE = "https://hrujo406fix.com/play/";
const STATIC_CID_STREAM = "tt0401916";
const STATIC_CID_TRIGGER = "m.media-amazon.com";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Missing required 'url' query parameter"
    });
  }

  try {
    // 🔥 STATIC CID FILTER
    if (url.includes(STATIC_CID_TRIGGER)) {
      return res.status(200).json({
        id: STATIC_CID_STREAM,
        stream_url: `${STREAM_BASE}${STATIC_CID_STREAM}`,
        static: true
      });
    }

    // 🔥 NORMAL SCRAPING FLOW
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch post page");
    }

    const html = await response.text();
    const $ = load(html);

    let streamId = null;

    $("script").each((_, el) => {
      const content = $(el).html();
      if (!content) return;

      const match = content.match(/src\s*:\s*['"](tt\d+)['"]/);

      if (match && match[1]) {
        streamId = match[1];
        return false;
      }
    });

    if (!streamId) {
      return res.status(404).json({
        error: "Stream ID not found"
      });
    }

    res.status(200).json({
      id: streamId,
      stream_url: `${STREAM_BASE}${streamId}`,
      static: false
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
