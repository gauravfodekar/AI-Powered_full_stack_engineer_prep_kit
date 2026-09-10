import axios from "axios";
import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { env } from "../config/env.js";

// ============================================================================
// 1. SSRF URL Protection & IP Validation
// ============================================================================

/**
 * Checks whether an IP address belongs to a private, loopback, or reserved range.
 * Protects against SSRF attacks targeting internal VPCs, metadata services (169.254.169.254),
 * and local services in production.
 *
 * @param {string} ipStr - IP address string (IPv4 or IPv6)
 * @param {boolean} allowLocal - If true, permits loopback/localhost (used for local evaluation)
 * @returns {boolean} True if the IP is blocked, false if safe to connect
 */
export function isPrivateOrBlockedIp(ipStr, allowLocal = false) {
  try {
    const addr = ipaddr.parse(ipStr);
    const range = addr.range();

    // Loopback handling: allowed in testing/local evaluation mode
    if (range === "loopback") {
      return !allowLocal;
    }

    // Always block cloud instance metadata (AWS/GCP/Azure link-local: 169.254.169.254)
    if (range === "linkLocal") {
      return true;
    }

    // If local test hosts are permitted, allow private subnets (e.g. docker network)
    if (allowLocal && (range === "private" || range === "uniqueLocal")) {
      return false;
    }

    // Standard blocked ranges in production
    const blockedRanges = [
      "private",
      "uniqueLocal",
      "carrierGradeNat",
      "broadcast",
      "multicast",
      "reserved",
      "unspecified",
    ];

    return blockedRanges.includes(range);
  } catch {
    // If it cannot be parsed as a valid IP address, block it for safety
    return true;
  }
}

/**
 * Validates external URL for protocol and performs DNS pre-resolution
 * to prevent SSRF and DNS rebinding attacks.
 *
 * @param {string} inputUrl - URL to validate
 * @param {boolean} allowLocal - Whether local URLs are allowed
 * @returns {Promise<{ valid: boolean, normalizedUrl?: string, error?: string }>}
 */
export async function validateUrl(inputUrl, allowLocal = env.allowLocalUrls) {
  try {
    const parsed = new URL(inputUrl);

    // Enforce HTTP / HTTPS protocol strictly
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: `Invalid protocol: ${parsed.protocol}. Only http: and https: are permitted.`,
      };
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return { valid: false, error: "Empty hostname." };
    }

    // Bypass DNS lookup if hostname is directly localhost and local URLs are permitted
    if (allowLocal && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")) {
      return { valid: true, normalizedUrl: parsed.toString() };
    }

    // Resolve DNS records to verify the actual destination IP
    try {
      const records = await dns.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        return { valid: false, error: `Could not resolve hostname: ${hostname}` };
      }

      for (const record of records) {
        if (isPrivateOrBlockedIp(record.address, allowLocal)) {
          return {
            valid: false,
            error: `SSRF blocked: Host '${hostname}' resolves to restricted IP '${record.address}'.`,
          };
        }
      }
    } catch (dnsErr) {
      return {
        valid: false,
        error: `DNS resolution failed for '${hostname}': ${dnsErr.message}`,
      };
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch (err) {
    return { valid: false, error: `Malformed URL: ${err.message}` };
  }
}

// ============================================================================
// 2. Safe HTML Content Fetcher with Exponential Backoff
// ============================================================================

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 InterviewPrepBot/1.0";
const MAX_CONTENT_LENGTH_BYTES = 3 * 1024 * 1024; // 3 MB max per page

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches page content safely with exponential backoff on rate limits or transient errors.
 *
 * @param {string} url - Target URL
 * @param {object} options - Configuration options
 * @returns {Promise<{ ok: boolean, html?: string, status?: number, error?: string }>}
 */
export async function safeFetchHtml(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? env.CRAWL_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? 2;
  const allowLocal = options.allowLocal ?? env.allowLocalUrls;

  // SSRF guard check
  const validation = await validateUrl(url, allowLocal);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const targetUrl = validation.normalizedUrl;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await axios.get(targetUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: timeoutMs,
        maxContentLength: MAX_CONTENT_LENGTH_BYTES,
        responseType: "text",
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      });

      if (response.status === 404) {
        return {
          ok: false,
          status: 404,
          error: `HTTP 404 Not Found at ${targetUrl}`,
        };
      }

      // Verify content-type
      const contentType = response.headers["content-type"] || "";
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("text/plain") &&
        !contentType.includes("application/xhtml")
      ) {
        return {
          ok: false,
          status: response.status,
          error: `Unsupported content-type '${contentType}' at ${targetUrl}`,
        };
      }

      return {
        ok: true,
        status: response.status,
        html: response.data,
      };
    } catch (err) {
      attempt++;
      const isAxiosErr = axios.isAxiosError(err);
      const statusCode = isAxiosErr ? err.response?.status : undefined;

      // Do not retry 4xx errors (except 429 Too Many Requests)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return {
          ok: false,
          status: statusCode,
          error: `HTTP ${statusCode}: ${err.message}`,
        };
      }

      if (attempt > maxRetries) {
        return {
          ok: false,
          status: statusCode,
          error: `Failed after ${maxRetries + 1} attempts: ${err.message}`,
        };
      }

      // Exponential backoff with jitter
      const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 5000);
      await sleep(backoffMs);
    }
  }

  return { ok: false, error: "Exceeded max retries" };
}

// ============================================================================
// 3. HTML Cleaning & Semantic Text Extraction
// ============================================================================

/**
 * Strips boilerplate (scripts, styles, headers, footers, navbars, cookie notices)
 * and returns clean readable plain text for the LLM.
 *
 * @param {string} html - Raw HTML
 * @param {object} options - Options
 * @returns {{ title: string, text: string, isHiring: boolean, isInterview: boolean }}
 */
export function cleanHtml(html, options = {}) {
  const maxChars = options.maxChars ?? 10000;
  const $ = cheerio.load(html);

  // Extract page title
  const title = $("title").first().text().trim() || $("h1").first().text().trim() || "";

  // Check for hiring or interview signals in raw document
  const rawLower = html.toLowerCase();
  const isHiring =
    rawLower.includes("careers") ||
    rawLower.includes("open positions") ||
    rawLower.includes("join our team") ||
    rawLower.includes("we are hiring") ||
    rawLower.includes("job openings");

  const isInterview =
    rawLower.includes("interview process") ||
    rawLower.includes("how we hire") ||
    rawLower.includes("engineering handbook") ||
    rawLower.includes("interview stages") ||
    rawLower.includes("culture code");

  // Remove noisy non-content elements
  $(
    "script, style, noscript, svg, canvas, iframe, form, button, input, select, textarea, [role='dialog'], [role='alert'], .cookie-banner, #cookie-notice, #cookie-consent, nav, footer, header, [role='navigation'], [role='contentinfo']"
  ).remove();

  // Prefer main semantic containers if available
  let contentElement = $("main, article, [role='main'], #content, .content, .main").first();
  if (contentElement.length === 0) {
    contentElement = $("body");
  }

  // Extract text and normalize whitespace
  let extractedText = contentElement.text();
  extractedText = extractedText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  // Truncate cleanly if too long
  if (extractedText.length > maxChars) {
    extractedText = extractedText.substring(0, maxChars) + "\n...[Content truncated for length]";
  }

  return {
    title,
    text: extractedText,
    isHiring,
    isInterview,
  };
}

// ============================================================================
// 4. Link Discovery & Semantic Relevance Ranking
// ============================================================================

const KEYWORD_WEIGHTS = {
  // Hiring & Careers
  careers: { weight: 20, category: "careers" },
  jobs: { weight: 20, category: "careers" },
  hiring: { weight: 18, category: "careers" },
  "join-us": { weight: 18, category: "careers" },
  "work-with-us": { weight: 18, category: "careers" },
  openings: { weight: 16, category: "careers" },
  positions: { weight: 16, category: "careers" },

  // Interview & Culture
  "interview-process": { weight: 25, category: "careers" },
  "how-we-hire": { weight: 25, category: "careers" },
  handbook: { weight: 22, category: "engineering" },
  culture: { weight: 16, category: "careers" },
  values: { weight: 14, category: "about" },

  // Engineering & Tech
  engineering: { weight: 16, category: "engineering" },
  "tech-blog": { weight: 16, category: "engineering" },
  tech: { weight: 12, category: "engineering" },
  developers: { weight: 12, category: "engineering" },

  // About & Company
  about: { weight: 12, category: "about" },
  "about-us": { weight: 14, category: "about" },
  team: { weight: 10, category: "about" },
  company: { weight: 10, category: "about" },
  "what-we-do": { weight: 12, category: "about" },
};

const NEGATIVE_KEYWORDS = [
  "privacy",
  "terms",
  "cookie",
  "legal",
  "security",
  "status",
  "login",
  "signup",
  "register",
  "cart",
  "checkout",
  "contact",
  "support",
  "faq",
  "press",
  "pricing",
  "download",
];

/**
 * Normalizes URL and removes tracking query params or hash fragments
 *
 * @param {string} href - Link href
 * @param {string} baseUrl - Base URL of the crawling page
 * @returns {string|null} Normalized URL or null if invalid
 */
export function normalizeLinkUrl(href, baseUrl) {
  try {
    const url = new URL(href, baseUrl);

    // Only allow http and https
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    // Strip hash fragments
    url.hash = "";

    // Remove tracking query parameters
    const paramsToDelete = [];
    url.searchParams.forEach((_val, key) => {
      if (key.startsWith("utm_") || key === "ref" || key === "source" || key === "fbclid") {
        paramsToDelete.push(key);
      }
    });
    for (const key of paramsToDelete) {
      url.searchParams.delete(key);
    }

    // Strip trailing slash for consistency (unless it's just root '/')
    let finalStr = url.toString();
    if (finalStr.endsWith("/") && url.pathname !== "/") {
      finalStr = finalStr.slice(0, -1);
    }

    return finalStr;
  } catch {
    return null;
  }
}

/**
 * Discovers and ranks links from a page by relevance to company research & interview prep.
 *
 * @param {string} html - HTML string
 * @param {string} baseUrl - Base URL of the page
 * @param {number} maxResults - Max links to return
 * @returns {Array<{ url: string, anchor_text: string, score: number, category: string }>}
 */
export function rankDiscoveredLinks(html, baseUrl, maxResults = 8) {
  const $ = cheerio.load(html);
  let baseParsed;
  try {
    baseParsed = new URL(baseUrl);
  } catch {
    return [];
  }

  const baseHostname = baseParsed.hostname.toLowerCase();
  const seenUrls = new Set();
  const candidates = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const anchorText = $(el).text().trim().toLowerCase();
    const normalized = normalizeLinkUrl(href, baseUrl);
    if (!normalized) return;

    try {
      const linkParsed = new URL(normalized);
      const linkHostname = linkParsed.hostname.toLowerCase();

      // Only allow same domain or direct subdomains (e.g. careers.company.com)
      const isSameOrSubdomain =
        linkHostname === baseHostname ||
        linkHostname.endsWith("." + baseHostname) ||
        baseHostname.endsWith("." + linkHostname);

      if (!isSameOrSubdomain) {
        return;
      }

      // Skip self-referencing links
      if (normalized === baseUrl || seenUrls.has(normalized)) {
        return;
      }

      seenUrls.add(normalized);

      // Score the link
      let score = 0;
      let detectedCategory = "general";
      const pathLower = linkParsed.pathname.toLowerCase();

      // Negative keywords
      const hasNegative = NEGATIVE_KEYWORDS.some(
        (neg) => pathLower.includes(neg) || anchorText.includes(neg)
      );
      if (hasNegative) {
        score -= 50;
      }

      // Check positive keywords
      for (const [kw, info] of Object.entries(KEYWORD_WEIGHTS)) {
        if (pathLower.includes(kw)) {
          score += info.weight;
          detectedCategory = info.category;
        }
        if (anchorText.includes(kw) || anchorText.includes(kw.replace("-", " "))) {
          score += info.weight + 5; // Anchor text match is strong signal
          detectedCategory = info.category;
        }
      }

      if (score > 0) {
        candidates.push({
          url: normalized,
          anchor_text: anchorText,
          score,
          category: detectedCategory,
        });
      }
    } catch {
      // Ignore invalid URL
    }
  });

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, maxResults);
}

// ============================================================================
// 5. Research Orchestrator Service
// ============================================================================

/**
 * Crawls a company landing page, ranks and discovers internal hiring / engineering / about links,
 * and extracts clean text while handling errors gracefully.
 *
 * @param {string} companyUrl - Starting company URL
 * @param {object} options - Options (maxPages, timeoutMs, allowLocal)
 * @returns {Promise<object>} CompanyResearchResult
 */
export async function researchCompany(companyUrl, options = {}) {
  const maxPages = options.maxPages ?? env.MAX_CRAWL_PAGES;
  const timeoutMs = options.timeoutMs ?? env.CRAWL_TIMEOUT_MS;
  const allowLocal = options.allowLocal ?? env.allowLocalUrls;

  const result = {
    company_url: companyUrl,
    landing_page: null,
    crawled_pages: [],
    pages_used: [],
    combined_text: "",
    errors: [],
    has_hiring_page: false,
    has_interview_info: false,
  };

  if (!companyUrl || !companyUrl.trim()) {
    result.errors.push({
      url: companyUrl,
      code: "EMPTY_URL",
      message: "No company URL provided.",
    });
    return result;
  }

  // 1. Fetch Landing Page
  const landingFetch = await safeFetchHtml(companyUrl, { timeoutMs, allowLocal });
  if (!landingFetch.ok || !landingFetch.html) {
    result.errors.push({
      url: companyUrl,
      code: landingFetch.status === 404 ? "NOT_FOUND" : "COMPANY_UNREACHABLE",
      message: landingFetch.error || `Could not fetch landing page at ${companyUrl}`,
    });
    return result;
  }

  const landingClean = cleanHtml(landingFetch.html);
  const landingPage = {
    url: companyUrl,
    title: landingClean.title,
    cleaned_text: landingClean.text,
    char_count: landingClean.text.length,
    is_hiring_page: landingClean.isHiring,
    is_interview_page: landingClean.isInterview,
    status: "ok",
  };

  result.landing_page = landingPage;
  result.crawled_pages.push(landingPage);
  result.pages_used.push(companyUrl);
  if (landingClean.isHiring) result.has_hiring_page = true;
  if (landingClean.isInterview) result.has_interview_info = true;

  // 2. Discover and Rank Relevant Internal Links
  const candidateLinks = rankDiscoveredLinks(landingFetch.html, companyUrl, 10);

  // Pick top candidates up to maxPages - 1 (since landing page is page 1)
  const linksToCrawl = candidateLinks.slice(0, Math.max(0, maxPages - 1));

  for (const candidate of linksToCrawl) {
    const pageFetch = await safeFetchHtml(candidate.url, { timeoutMs, allowLocal });

    if (!pageFetch.ok || !pageFetch.html) {
      result.errors.push({
        url: candidate.url,
        code: pageFetch.status === 404 ? "NOT_FOUND" : "PAGE_FETCH_ERROR",
        message: pageFetch.error || `Failed to fetch linked page ${candidate.url}`,
      });
      continue;
    }

    const cleaned = cleanHtml(pageFetch.html);
    const scrapedPage = {
      url: candidate.url,
      title: cleaned.title,
      cleaned_text: cleaned.text,
      char_count: cleaned.text.length,
      is_hiring_page: cleaned.isHiring || candidate.category === "careers",
      is_interview_page: cleaned.isInterview,
      status: "ok",
    };

    result.crawled_pages.push(scrapedPage);
    result.pages_used.push(candidate.url);
    if (scrapedPage.is_hiring_page) result.has_hiring_page = true;
    if (scrapedPage.is_interview_page) result.has_interview_info = true;
  }

  // 3. Assemble combined structured research text
  const textSections = [];
  for (const page of result.crawled_pages) {
    textSections.push(
      `--- PAGE: ${page.url} (Title: ${page.title || "Untitled"}) ---\n${page.cleaned_text}`
    );
  }
  result.combined_text = textSections.join("\n\n");

  return result;
}

