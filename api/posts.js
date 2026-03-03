import fetch from "node-fetch";
import { load } from "cheerio";

const BASE_URL = "https://vegamoviesdl.com/";

export default async function handler(req, res) {
  try {
    const page = parseInt(req.query.page || "1", 10);

    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: "Invalid page number" });
    }

    const posts = await scrapePage(page);

    res.status(200).json({
      page,
      total: posts.length,
      posts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function scrapePage(page) {
  const url = page === 1
    ? BASE_URL
    : `${BASE_URL}page/${page}/`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch source page");
  }

  const html = await response.text();
  const $ = load(html);

  const posts = [];

  $("article.post-item.site__col").each((_, el) => {
    const titleEl = $(el).find("h3.entry-title a");
    const imgEl = $(el).find("a.blog-img img");
    const dateEl = $(el).find(".date-time span");

    posts.push({
      title: titleEl.text().trim(),
      url: titleEl.attr("href") || null,
      image: imgEl.attr("src")
        ? new URL(imgEl.attr("src"), BASE_URL).href
        : null,
      date: dateEl.text().trim() || null
    });
  });

  return posts;
}
