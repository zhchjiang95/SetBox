// Bing translator client with token caching and Google fallback.
// CN-friendly, no API key required.

const HAN_REGEX = /[\u4e00-\u9fa5]/;
const TOKEN_TTL_MS = 25 * 60 * 1000; // refresh every 25 minutes (Bing tokens last ~30m)

let tokenCache = { token: "", key: "", iid: "", expiresAt: 0 };

export const LANG_LABEL = {
  "zh-Hans": "中文",
  en: "英文",
  ja: "日文",
  ko: "韩文",
  fr: "法文",
  de: "德文",
  ru: "俄文",
  auto: "自动",
};

/** Detect language by content. Returns "zh-Hans" or "en" (heuristic). */
export function detectSourceLang(text) {
  return HAN_REGEX.test(text) ? "zh-Hans" : "en";
}

export function flipLang(from) {
  return from === "en" ? "zh-Hans" : "en";
}

async function fetchBingToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache;
  }
  const res = await fetch("https://cn.bing.com/translator?ref=TThis&text=&from=zh-Hans&to=en", {
    credentials: "omit",
  });
  const html = await res.text();

  // params_AbusePreventionHelper = [<key>,"<token>",<expiresMs>]
  const m = html.match(/params_AbusePreventionHelper\s*=\s*\[([^\]]+)\]/);
  if (!m) throw new Error("bing: token block not found");
  const parts = m[1].split(",").map((s) => s.replace(/^"|"$/g, "").trim());
  const key = parts[0];
  const token = parts[1];

  // IG=XXXX in HTML
  const igMatch = html.match(/IG:"([A-F0-9]+)"/);
  const iid = igMatch ? igMatch[1] : "";

  if (!key || !token) throw new Error("bing: token parse failed");

  tokenCache = { key, token, iid, expiresAt: now + TOKEN_TTL_MS };
  return tokenCache;
}

async function bingTranslate(text, { from, to }) {
  const { key, token, iid } = await fetchBingToken();
  const params = new URLSearchParams({
    fromLang: from,
    text,
    to,
    token,
    key,
  });

  const url = `https://cn.bing.com/ttranslatev3?isVertical=1${iid ? `&IG=${iid}` : ""}&IID=translator.5022.5`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    credentials: "omit",
  });
  const json = await res.json();
  const translations = json?.[0]?.translations;
  if (!translations?.length) throw new Error("bing: empty translations");
  return translations.map((t) => t.text);
}

async function bingLookup(text, { from, to }) {
  const { key, token, iid } = await fetchBingToken();
  const params = new URLSearchParams({
    from,
    to,
    text,
    token,
    key,
  });
  const url = `https://cn.bing.com/tlookupv3?isVertical=1${iid ? `&IG=${iid}` : ""}&IID=translator.5022.2`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    credentials: "omit",
  });
  const json = await res.json();
  const translations = json?.[0]?.translations;
  if (!translations?.length) return null;
  return translations.map((t) => t.displayTarget || t.normalizedTarget || "").filter(Boolean);
}

async function googleFallback(text, { from, to }) {
  // Public mobile endpoint, no key.
  const params = new URLSearchParams({
    client: "gtx",
    sl: from === "zh-Hans" ? "zh-CN" : from,
    tl: to === "zh-Hans" ? "zh-CN" : to,
    dt: "t",
    q: text,
  });
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
    credentials: "omit",
  });
  if (!res.ok) throw new Error("google: http " + res.status);
  const data = await res.json();
  const out = (data?.[0] || []).map((row) => row[0]).filter(Boolean).join("");
  if (!out) throw new Error("google: empty");
  return [out];
}

/**
 * Translate text. Returns { results: string[], from, to, source }.
 * Tries Bing dictionary lookup → Bing translate → Google.
 */
export async function translate(text, opts = {}) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return { results: [], from: "", to: "", source: "" };

  const from = opts.from || detectSourceLang(trimmed);
  const to = opts.to || flipLang(from);

  // Short phrases benefit from dictionary results
  if (trimmed.length <= 32) {
    try {
      const dict = await bingLookup(trimmed, { from, to });
      if (dict?.length) return { results: dict, from, to, source: "bing-dict" };
    } catch { /* fall through */ }
  }

  try {
    const results = await bingTranslate(trimmed, { from, to });
    return { results, from, to, source: "bing" };
  } catch (bingErr) {
    try {
      const results = await googleFallback(trimmed, { from, to });
      return { results, from, to, source: "google" };
    } catch (gErr) {
      throw new Error(`translate failed: ${bingErr.message}; google: ${gErr.message}`);
    }
  }
}
