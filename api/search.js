import fetch from "node-fetch";
import { load } from "cheerio";

const BASE_URL = "https://vegamoviesdl.com/";
const STREAM_BASE = "https://hrujo406fix.com/play/";

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
    const posts = [];

    // 🔥 STATIC CID RESULT (ONLY ON PAGE 1)
    if (pageNumber === 1 && isCIDSearch(q)) {
      posts.push({
        title: "C.I.D (1998) Complete Series",
        url: null,
        image: "https://m.media-amazon.com/images/M/MV5BYWQyNzkxMDItZmNiNS00NTRkLTk0NTYtMWEzOTg4YjYwNTE0XkEyXkFqcGc@._V1_FMjpg_UY1639_.jpg",
        date: null,
        stream_id: "tt0401916",
        stream_url: `${STREAM_BASE}tt0401916`,
        static: true
      });
    }

    // 🔥 NORMAL SCRAPED RESULTS
    const scrapedPosts = await scrapeSearch(q, pageNumber);
    posts.push(...scrapedPosts);

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

// Check if search matches CID
function isCIDSearch(query) {
  const clean = query.toLowerCase().replace(/\./g, "").trim();
  return clean === "cid";
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
      date: dateEl.text().trim() || null,
      static: false
    });
  });

  return posts;
}
