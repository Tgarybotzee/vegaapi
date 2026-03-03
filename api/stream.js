import fetch from "node-fetch";
import { load } from "cheerio";

const STREAM_BASE = "https://hrujo406fix.com/play/";

export default async function handler(req, res) {
  const { url, id, redirect } = req.query;

  try {
    let streamId = null;

    // 🔹 Option 1: Direct ID usage (for static results like CID)
    if (id) {
      if (!/^tt\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid stream ID format" });
      }
      streamId = id;
    }

    // 🔹 Option 2: Extract from post URL
    if (!streamId && url) {
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

      $("script").each((_, el) => {
        const content = $(el).html();
        if (!content) return;

        const match = content.match(/src\s*:\s*['"](tt\d+)['"]/);
        if (match) {
          streamId = match[1];
          return false;
        }
      });
    }

    if (!streamId) {
      return res.status(404).json({ error: "Stream ID not found" });
    }

    const finalUrl = `${STREAM_BASE}${streamId}`;

    // 🔥 If redirect mode enabled
    if (redirect === "true") {
      return res.redirect(finalUrl);
    }

    // 🔥 Player-compatible headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Frame-Options", "ALLOWALL");

    res.status(200).json({
      id: streamId,
      stream_url: finalUrl,
      embed_url: finalUrl,
      iframe: `<iframe src="${finalUrl}" width="100%" height="100%" allowfullscreen></iframe>`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
