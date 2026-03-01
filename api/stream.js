import fetch from "node-fetch";
import { load } from "cheerio";

const STREAM_BASE = "https://hrujo406fix.com/play/";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Missing required 'url' query parameter"
    });
  }

  try {
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

    // Search inside all <script> tags
    $("script").each((_, el) => {
      const scriptContent = $(el).html();
      if (!scriptContent) return;

      // Match: src: 'tt12345678'
      const match = scriptContent.match(/src\s*:\s*['"](tt\d+)['"]/);

      if (match && match[1]) {
        streamId = match[1];
        return false; // break loop
      }
    });

    if (!streamId) {
      return res.status(404).json({
        error: "Stream ID not found"
      });
    }

    res.status(200).json({
      id: streamId,
      stream_url: `${STREAM_BASE}${streamId}`
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
