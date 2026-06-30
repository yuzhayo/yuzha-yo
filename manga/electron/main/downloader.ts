import { BrowserWindow } from "electron";
import JSZip from "jszip";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import type { HarvestedImage, PhaseEvent, ScrollResult, HarvestResult, CompileResult } from "../../src/types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PAGE_TIMEOUT_MS = 20_000;
const IMG_TIMEOUT_MS = 15_000;
const IMG_RETRIES = 3;
const IMG_RETRY_DELAYS_MS = [500, 1000, 2000];
const STABLE_NEED = 8;
const SCROLL_MAX_ITER = 80;
const SCROLL_DELAY_MS = 300;

function log(...args: unknown[]): void {
  console.log("[downloader]", ...args);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPage(win: BrowserWindow, url: string): Promise<void> {
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    await Promise.race([
      win.loadURL(url),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Timeout loading ${url}`)),
          PAGE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchImageOnce(url: string, referer: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMG_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Referer: referer,
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function downloadImage(url: string, referer: string): Promise<Buffer> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < IMG_RETRIES; attempt++) {
    try {
      return await fetchImageOnce(url, referer);
    } catch (err) {
      lastErr = err;
      if (attempt < IMG_RETRIES - 1) {
        const delay = IMG_RETRY_DELAYS_MS[attempt] ?? 2000;
        log(`fetch retry ${attempt + 1}/${IMG_RETRIES - 1} in ${delay}ms :: ${String(err)}`);
        await sleep(delay);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function guessExt(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "gif";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "webp";
  return "jpg";
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function extractSeries(title: string): string {
  const parts = title.split(/\s*[-–|·•\/]\s*/);
  return cleanTitle(parts[0] ?? title);
}

function chapterFromUrl(url: string): string {
  const m =
    url.match(/[/\-_]chapter[-_](\d+(?:\.\d+)?)/i) ??
    url.match(/[/\-_]ch[-_]?(\d+(?:\.\d+)?)/i) ??
    url.match(/\/(\d+(?:\.\d+)?)-chapter/i);
  return m ? `Ch.${m[1]}` : "";
}

function resolveTargetPath(seriesDir: string, baseName: string): string {
  const primary = path.join(seriesDir, baseName + ".cbz");
  if (!existsSync(primary)) return primary;
  let i = 2;
  while (i < 10000) {
    const candidate = path.join(seriesDir, `${baseName} (${i}).cbz`);
    if (!existsSync(candidate)) return candidate;
    i++;
  }
  return path.join(seriesDir, `${baseName} (${Date.now()}).cbz`);
}

async function packageCBZ(pages: Buffer[], title: string, series: string, outputDir: string): Promise<string> {
  const zip = new JSZip();
  pages.forEach((buf, i) => {
    const ext = guessExt(buf);
    zip.file(String(i + 1).padStart(3, "0") + "." + ext, buf);
  });
  const content = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
  const seriesDir = path.join(outputDir, cleanTitle(series));
  mkdirSync(seriesDir, { recursive: true });
  const filepath = resolveTargetPath(seriesDir, cleanTitle(title));
  writeFileSync(filepath, content);
  return filepath;
}

// ─── Phase 1: Open scraper window ────────────────────────────────────────────

export async function openScraper(url: string, win: BrowserWindow): Promise<void> {
  win.webContents.setUserAgent(UA);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  log(`phase-open: loading ${url}`);
  await loadPage(win, url);
  log(`phase-open: ready`);
}

// ─── Phase 2: Scroll to end ───────────────────────────────────────────────────

export async function runScroll(
  win: BrowserWindow,
  emit: (e: PhaseEvent) => void,
): Promise<ScrollResult> {
  log("phase-scroll: start");

  await win.webContents.executeJavaScript(`window.scrollTo(0, 0); undefined;`);

  // Suppress popups that freeze the page JS
  await win.webContents.executeJavaScript(`
    (function() {
      try {
        window.alert   = function() {};
        window.confirm = function() { return true; };
        window.prompt  = function() { return null; };
      } catch(e) {}
    })();
    undefined;
  `);
  await sleep(800);

  // Detect the real scrollable container (inner div vs window), store on window
  await win.webContents.executeJavaScript(`
    (function() {
      var best = document.scrollingElement || document.documentElement;
      var bestScore = best.scrollHeight - best.clientHeight;
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var s = getComputedStyle(el);
        var score = el.scrollHeight - el.clientHeight;
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') &&
            score > bestScore && el.clientHeight > 200) {
          best = el;
          bestScore = score;
        }
      }
      window.__scroller = (best === document.scrollingElement || best === document.documentElement)
        ? null : best;
      return window.__scroller ? 'inner' : 'window';
    })()
  `);

  let stableRuns = 0;
  let lastHeight = 0;
  let lastImgCount = 0;
  let iteration = 0;

  while (stableRuns < STABLE_NEED && iteration < SCROLL_MAX_ITER) {
    iteration++;

    await win.webContents.executeJavaScript(`
      (function() {
        var el = window.__scroller;
        var step = Math.max(400, Math.floor((el ? el.clientHeight : window.innerHeight) * 0.8));
        if (el) el.scrollTop += step;
        else window.scrollBy(0, step);
      })();
      undefined;
    `);
    await sleep(SCROLL_DELAY_MS);

    const sample: { height: number; imgs: number; atBottom: boolean } =
      await win.webContents.executeJavaScript(`
      (function() {
        var el = window.__scroller;
        var height     = el ? el.scrollHeight : document.documentElement.scrollHeight;
        var scrollTop  = el ? el.scrollTop    : window.scrollY;
        var clientH    = el ? el.clientHeight  : window.innerHeight;
        var atBottom   = scrollTop + clientH >= height - 10;
        var imgs = Array.from(document.querySelectorAll('img')).filter(function(img) {
          return img.currentSrc || img.src ||
            img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        }).length;
        return { height: height, imgs: imgs, atBottom: atBottom };
      })()
    `);

    emit({ type: "scroll-progress", height: sample.height, images: sample.imgs, stable: stableRuns });

    if (sample.atBottom && sample.height === lastHeight && sample.imgs === lastImgCount) {
      stableRuns++;
    } else {
      stableRuns = 0;
      lastHeight = sample.height;
      lastImgCount = sample.imgs;
    }
  }

  log(`phase-scroll: done at iter=${iteration} stable=${stableRuns} imgs=${lastImgCount}`);
  return { imageCount: lastImgCount };
}

// ─── Phase 3: Harvest images ──────────────────────────────────────────────────

export async function runHarvest(win: BrowserWindow): Promise<HarvestResult> {
  log("phase-harvest: start");

  const images: HarvestedImage[] = await win.webContents.executeJavaScript(`
    (function() {
      function pickSrcsetFirst(s) {
        if (!s) return '';
        var first = s.split(',')[0] || '';
        return first.trim().split(/\\s+/)[0] || '';
      }
      function extractBg(el) {
        try {
          var bg = window.getComputedStyle(el).backgroundImage;
          if (!bg || bg === 'none') return '';
          var m = bg.match(/url\\(['"]?(.*?)['"]?\\)/);
          return m ? m[1] : '';
        } catch(e) { return ''; }
      }

      var seen = new Set();
      var out = [];

      // img tags
      Array.from(document.querySelectorAll('img')).forEach(function(img) {
        var src = img.getAttribute('data-src') ||
                  img.getAttribute('data-lazy-src') ||
                  img.getAttribute('data-original') ||
                  img.getAttribute('data-url') ||
                  pickSrcsetFirst(img.getAttribute('srcset')) ||
                  img.currentSrc || img.src || '';
        if (!src || !/^https?:/i.test(src)) return;
        if (/logo|banner|avatar|icon|emoji|button|spinner/i.test(src)) return;
        // Use rendered rect — more reliable than naturalWidth which is 0 for lazy images
        var rect = img.getBoundingClientRect();
        var rw = rect.width; var rh = rect.height;
        // Skip tiny images (avatars, icons)
        if (rw > 0 && rw < 200) return;
        // Skip near-square images smaller than 300px (profile pics, thumbnails)
        if (rw > 0 && rh > 0 && rw < 300 && (rw / rh) > 0.7 && (rw / rh) < 1.4) return;
        if (seen.has(src)) return;
        seen.add(src);
        out.push({ src: src, top: rect.top + window.scrollY });
      });

      // CSS background-image elements
      Array.from(document.querySelectorAll('div,section,span,figure')).forEach(function(el) {
        var src = extractBg(el);
        if (!src || !/^https?:/i.test(src)) return;
        if (/logo|banner|avatar|icon|emoji/i.test(src)) return;
        if (seen.has(src)) return;
        var w = el.clientWidth || 0;
        var h = el.clientHeight || 0;
        if (w > 0 && w < 200) return;
        if (w > 0 && h > 0 && w < 300 && (w / h) > 0.7 && (w / h) < 1.4) return;
        seen.add(src);
        var rect = el.getBoundingClientRect();
        out.push({ src: src, top: rect.top + window.scrollY });
      });

      return out.sort(function(a, b) { return a.top - b.top; });
    })()
  `);

  log(`phase-harvest: ${images.length} images found`);
  return { images };
}

// ─── Phase 4: Compile CBZ ─────────────────────────────────────────────────────

export async function compileCbz(
  images: HarvestedImage[],
  outputDir: string,
  win: BrowserWindow,
  emit: (e: PhaseEvent) => void,
): Promise<CompileResult> {
  log(`phase-compile: ${images.length} images, outputDir=${outputDir}`);

  const rawTitle: string = await win.webContents.executeJavaScript(`document.title`);
  const referer: string = await win.webContents.executeJavaScript(`location.href`);
  const series = extractSeries(rawTitle);
  const chapTag = chapterFromUrl(referer);
  const title = chapTag ? cleanTitle(`${series} · ${chapTag}`) : cleanTitle(rawTitle);

  const pages: Buffer[] = [];
  let skipped = 0;

  for (let i = 0; i < images.length; i++) {
    try {
      const buf = await downloadImage(images[i].src, referer);
      pages.push(buf);
    } catch (err) {
      skipped++;
      log(`image ${i + 1}/${images.length} failed: ${String(err)}`);
    }
    emit({ type: "fetch-progress", done: i + 1, total: images.length });
  }

  if (pages.length === 0) {
    throw new Error(`All ${images.length} images failed to download.`);
  }

  const file = await packageCBZ(pages, title, series, outputDir);
  log(`phase-compile: done → ${file} (${pages.length} pages, ${skipped} skipped)`);

  const result: CompileResult = { file, pages: pages.length, skipped };
  emit({ type: "compile-done", ...result });
  return result;
}
