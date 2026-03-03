import fetch from "node-fetch";
import { load } from "cheerio";

const BASE_URL = "https://vegamovies.mobile/";

export default async function handler(req, res) {
  const { q, page } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Missing required 'q' query parameter"
    });
  }

  const pageNumber = parseInt(page || "1", 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({
      error: "Invalid page number"
    });
  }

  try {
    const posts = await scrapeSearch(q, pageNumber);

    res.status(200).json({
      query: q,
      page: pageNumber,
      total: posts.length,
      posts
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}

async function scrapeSearch(query, page) {
  const encodedQuery = encodeURIComponent(query);

  const url = page === 1
    ? `${BASE_URL}xfsearch/${encodedQuery}/`
    : `${BASE_URL}xfsearch/${encodedQuery}/page/${page}/`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch search page");
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
