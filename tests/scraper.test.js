process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPrivateOrBlockedIp,
  validateUrl,
  normalizeLinkUrl,
  cleanHtml,
  rankDiscoveredLinks,
  researchCompany,
} from "../src/services/scraper.js";

describe("SSRF Protection & IP Validation", () => {
  it("blocks private and loopback IPs in production (allowLocal = false)", () => {
    // Loopback addresses
    assert.equal(isPrivateOrBlockedIp("127.0.0.1", false), true);
    assert.equal(isPrivateOrBlockedIp("127.0.0.5", false), true);
    assert.equal(isPrivateOrBlockedIp("::1", false), true);

    // RFC 1918 Private ranges
    assert.equal(isPrivateOrBlockedIp("10.0.0.1", false), true);
    assert.equal(isPrivateOrBlockedIp("172.16.5.10", false), true);
    assert.equal(isPrivateOrBlockedIp("192.168.1.100", false), true);

    // Cloud instance metadata (AWS/GCP/Azure link-local: 169.254.169.254)
    assert.equal(isPrivateOrBlockedIp("169.254.169.254", false), true);
  });

  it("allows safe public IPs", () => {
    assert.equal(isPrivateOrBlockedIp("8.8.8.8", false), false);
    assert.equal(isPrivateOrBlockedIp("1.1.1.1", false), false);
  });

  it("allows loopback when allowLocal is true (for local evaluation hosts)", () => {
    assert.equal(isPrivateOrBlockedIp("127.0.0.1", true), false);
    // Link-local cloud metadata remains strictly blocked even when local hosts are allowed
    assert.equal(isPrivateOrBlockedIp("169.254.169.254", true), true);
  });
});

describe("URL Protocol and Structure Validation", () => {
  it("accepts valid HTTP/HTTPS URLs", async () => {
    const res = await validateUrl("https://example.com/about", false);
    assert.equal(res.valid, true);
    assert.equal(res.normalizedUrl, "https://example.com/about");
  });

  it("rejects invalid protocols (file, ftp, javascript)", async () => {
    const fileRes = await validateUrl("file:///etc/passwd", true);
    assert.equal(fileRes.valid, false);
    assert.match(fileRes.error, /Invalid protocol/);

    const ftpRes = await validateUrl("ftp://ftp.example.com", true);
    assert.equal(ftpRes.valid, false);

    const jsRes = await validateUrl("javascript:alert(1)", true);
    assert.equal(jsRes.valid, false);
  });

  it("allows localhost only when allowLocal is true", async () => {
    const blockedRes = await validateUrl("http://127.0.0.1:8099/acme/", false);
    assert.equal(blockedRes.valid, false);

    const allowedRes = await validateUrl("http://localhost:8099/acme/", true);
    assert.equal(allowedRes.valid, true);
  });
});

describe("Link Normalization & Semantic Ranking", () => {
  const base = "https://acme-corp.com";

  it("normalizes relative URLs and strips tracking parameters", () => {
    assert.equal(normalizeLinkUrl("/careers", base), "https://acme-corp.com/careers");
    assert.equal(normalizeLinkUrl("/jobs/", base), "https://acme-corp.com/jobs");
    assert.equal(
      normalizeLinkUrl("/jobs?utm_source=twitter&ref=share", base),
      "https://acme-corp.com/jobs"
    );
    assert.equal(normalizeLinkUrl("/about#our-team", base), "https://acme-corp.com/about");
  });

  it("ranks careers, jobs and interview links higher than privacy or terms", () => {
    const mockHtml = `
      <html>
        <body>
          <a href="/careers">Join our Team</a>
          <a href="/how-we-hire">Interview Process</a>
          <a href="/engineering">Tech Blog</a>
          <a href="/about-us">About Us</a>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms-of-service">Terms</a>
          <a href="https://otherdomain.com/jobs">External Jobs</a>
        </body>
      </html>
    `;

    const ranked = rankDiscoveredLinks(mockHtml, base);

    // External domain must be ignored
    assert.equal(
      ranked.some((r) => r.url.includes("otherdomain.com")),
      false
    );

    // Should rank careers & interview process among the top
    assert.ok(ranked.length >= 3);
    const topCategories = ranked.slice(0, 2).map((r) => r.category);
    assert.ok(topCategories.includes("careers"));

    // Privacy and terms should be filtered out by negative weighting
    assert.equal(
      ranked.some((r) => r.url.includes("privacy")),
      false
    );
  });
});

describe("HTML Content Cleaning", () => {
  it("strips scripts, styles, nav and footer while extracting readable body text", () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Acme Engineering - Careers</title>
          <script>console.log("tracking");</script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <nav><a href="/">Home</a><a href="/menu">Menu</a></nav>
          <header><h1>Welcome to Acme</h1></header>
          <main>
            <h2>Senior Backend Engineer</h2>
            <p>We are hiring! Our interview process involves a system design round and a take-home project.</p>
            <p>Requirements include 5+ years of JavaScript and Node.js.</p>
          </main>
          <footer>Copyright 2026 Acme Corp. All rights reserved.</footer>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(rawHtml);
    assert.match(cleaned.title, /Acme Engineering/);
    assert.match(cleaned.text, /Senior Backend Engineer/);
    assert.match(cleaned.text, /interview process involves a system design round/);
    assert.equal(cleaned.text.includes("console.log"), false);
    assert.equal(cleaned.text.includes("color: red"), false);
    assert.equal(cleaned.text.includes("Copyright 2026"), false);
    assert.equal(cleaned.isHiring, true);
    assert.equal(cleaned.isInterview, true);
  });
});

describe("Scraper Resilience and Error Handling", () => {
  it("handles unreachable domains gracefully without fatal crashes", async () => {
    const result = await researchCompany("https://non-existent-domain-xyz-987654.org", {
      timeoutMs: 1500,
      maxPages: 2,
    });

    assert.equal(result.landing_page, null);
    assert.equal(result.pages_used.length, 0);
    assert.ok(result.errors.length > 0);
    assert.equal(result.errors[0].code, "COMPANY_UNREACHABLE");
  });

  it("handles empty URL input honestly", async () => {
    const result = await researchCompany("");
    assert.equal(result.landing_page, null);
    assert.ok(result.errors.length > 0);
    assert.equal(result.errors[0].code, "EMPTY_URL");
  });
});

