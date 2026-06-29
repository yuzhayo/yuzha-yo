import { BrowserWindow } from "electron";
import JSZip from "jszip";
import { writeFileSync, mkdirSync, existsSync, constants } from "fs";
import path from "path";
import type { Chapter, StartJobOpts, JobEvent } from "../../src/types";

export const CFG = {
  SCROLL_STEP_PX: 2000,
  SCROLL_DELAY_MS: 400,
  STABLE_NEED: 10,
  SCROLL_MAX_ITERATIONS: 60, // safety net: never loop forever
  PAGE_TIMEOUT_MS: 20_000,
  IMG_TIMEOUT_MS: 15_000,
  IMG_RETRIES: 3,
  IMG_RETRY_DELAYS_MS: [500, 1000, 2000],
  CONCURRENCY: 3,
  UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

interface ImageRef {
  src: string;
  top: number;
}

function log(...args: unknown[]): void {
  // Visible in the terminal where `npm run dev` runs.
  console.log("[downloader]", ...args);
}

function createHiddenWindow(visible: boolean): BrowserWindow {
  const win = new BrowserWindow({
    show: visible,
    width: visible ? 1100 : 800,
    height: visible ? 800 : 600,
    title: "Manga Downloader — scraper",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      offscreen: false,
    },
  });
  // Realistic Chrome UA so sites don't serve a bot page to Electron's default UA.
  win.webContents.setUserAgent(CFG.UA);
  // Block popup-ad windows: comix.to (and many manga sites) call window.open()
  // on first interaction. Denying these keeps the scraper page focused and
  // prevents random new windows from appearing on the user's desktop.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return win;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPage(win: BrowserWindow, url: string): Promise<void> {
  // Use webContents.loadURL() — its promise tracks only the MAIN frame, so
  // ad/analytics iframe failures (ERR_ABORTED -3 etc.) don't reject it.
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    await Promise.race([
      win.loadURL(url),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Timeout loading ${url}`)),
          CFG.PAGE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function scrollAndCollect(win: BrowserWindow): Promise<ImageRef[]> {
  log("scroll: reset to top");
  await win.webContents.executeJavaScript(`window.scrollTo(0, 0)`);

  // Suppress popup dialogs (alert/confirm/prompt) that some ad scripts trigger.
  // These pause the page's JS execution and freeze our scroll loop.
  // NOTE: wrapped in an IIFE returning undefined — otherwise the script's
  // completion value is the last-assigned function, which Electron's IPC
  // cannot clone across the renderer→main boundary
  // ("Error: An object could not be cloned.").
  await win.webContents.executeJavaScript(`
    (function () {
      try {
        window.alert   = function () {};
        window.confirm = function () { return true; };
        window.prompt  = function () { return null; };
      } catch (e) {}
    })();
    undefined;
  `);
  await sleep(800);

  let lastHeight = 0;
  let lastImgCount = 0;
  let stableRuns = 0;
  let iteration = 0;

  while (stableRuns < CFG.STABLE_NEED && iteration < CFG.SCROLL_MAX_ITERATIONS) {
    iteration++;

    // Viewport-relative step (~80% of viewport height). Closer to human
    // scrolling, so we don't skip past lazy-load trigger zones with a
    // single jumbo jump. Minimum 400px for very short viewports.
    await win.webContents.executeJavaScript(
      `window.scrollBy(0, Math.max(400, Math.floor(window.innerHeight * 0.8)));`,
    );
    await sleep(CFG.SCROLL_DELAY_MS);

    // Sample page state. Stability now requires (a) being at the bottom
    // AND (b) scrollHeight + img count unchanged. This guarantees we
    // actually reach the end of dynamically-appended content before exiting.
    const sample: { height: number; imgs: number; atBottom: boolean } =
      await win.webContents.executeJavaScript(`
      ({
        height: document.documentElement.scrollHeight,
        imgs: Array.from(document.querySelectorAll('img')).filter(function(img) {
          return img.currentSrc || img.src ||
            img.getAttribute('data-src') ||
            img.getAttribute('data-lazy-src') ||
            img.getAttribute('data-original') ||
            img.getAttribute('srcset');
        }).length,
        atBottom: (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 100)
      })
    `);

    if (
      sample.atBottom &&
      sample.height === lastHeight &&
      sample.imgs === lastImgCount
    ) {
      stableRuns++;
    } else {
      stableRuns = 0;
      lastHeight = sample.height;
      lastImgCount = sample.imgs;
    }
  }

  if (iteration >= CFG.SCROLL_MAX_ITERATIONS) {
    log(`scroll: iteration cap (${iteration}) reached at ${lastImgCount} candidates, height=${lastHeight}px`);
  } else {
    log(`scroll: stable at iter ${iteration}, ${lastImgCount} candidates, height=${lastHeight}px`);
  }

  // Final force pass: scrollIntoView every <img>. This catches images whose
  // IntersectionObserver didn't fire during the ramp scroll (typically
  // images that were appended to DOM only after we'd already scrolled past
  // their final position).
  log("scroll: final pass — scrollIntoView on each image");
  await win.webContents.executeJavaScript(`
    (async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      for (let i = 0; i < imgs.length; i++) {
        try {
          imgs[i].scrollIntoView({ block: 'center' });
          await new Promise(function(r) { setTimeout(r, 60); });
        } catch (e) {}
      }
    })()
  `);
  await sleep(1000);

  const images: ImageRef[] = await win.webContents.executeJavaScript(`
    (() => {
      const pickSrcsetFirst = (s) => {
        if (!s) return '';
        const first = s.split(',')[0] || '';
        return first.trim().split(/\\s+/)[0] || '';
      };
      const seen = new Set();
      const out = [];
      for (const img of Array.from(document.querySelectorAll('img'))) {
        const candidate =
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original') ||
          img.getAttribute('data-url') ||
          pickSrcsetFirst(img.getAttribute('srcset')) ||
          img.currentSrc ||
          img.src ||
          '';
        if (!candidate || !/^https?:/i.test(candidate)) continue;
        if (seen.has(candidate)) continue;
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (w > 0 && h > 0 && w <= 150 && h <= 150) continue;
        seen.add(candidate);
        const rect = img.getBoundingClientRect();
        out.push({ src: candidate, top: rect.top + window.scrollY });
      }
      return out.sort((a, b) => a.top - b.top);
    })()
  `);

  log(`harvest: ${images.length} images after filtering`);
  return images;
}

async function findChapterLink(
  win: BrowserWindow,
  direction: "next" | "prev",
): Promise<string | null> {
  const keyword = direction;
  const result: string | null = await win.webContents.executeJavaScript(`
    (() => {
      const selectors = [
        'a[rel="${keyword}"]',
        '.${keyword}-chapter a',
        'a.${keyword}',
        'a[class*="${keyword}"]',
      ];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el && el.href) return el.href;
      }
      const links = Array.from(document.querySelectorAll('a'));
      const match = links.find(a =>
        a.textContent && a.textContent.toLowerCase().includes('${keyword}') && a.href
      );
      return match ? match.href : null;
    })()
  `);
  return result;
}

async function getPageTitle(win: BrowserWindow): Promise<string> {
  return win.webContents.executeJavaScript(`document.title`);
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function extractSeries(title: string): string {
  const parts = title.split(/[-–|]/);
  return cleanTitle(parts[0] ?? title);
}

/**
 * Fetch one image. Uses Node's global `fetch` (undici) — NOT electron.net.fetch.
 *
 * Why: electron.net.fetch routes through Chromium's network_service_network_delegate,
 * which validates the Referer against the page's referrer policy and CANCELS the
 * request when the policy considers the explicit Referer "invalid" for the
 * cross-origin destination (e.g. comix.to → wowpic4.store). Node's fetch lives in
 * the Node runtime and has no such delegate, so the Referer + UA we send are honored.
 */
async function fetchImageOnce(url: string, referer: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CFG.IMG_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Referer: referer,
        "User-Agent": CFG.UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } finally {
    clearTimeout(timer);
  }
}

async function downloadImage(url: string, referer: string): Promise<Buffer> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < CFG.IMG_RETRIES; attempt++) {
    try {
      return await fetchImageOnce(url, referer);
    } catch (err) {
      lastErr = err;
      if (attempt < CFG.IMG_RETRIES - 1) {
        const delay = CFG.IMG_RETRY_DELAYS_MS[attempt] ?? 2000;
        log(`fetch retry ${attempt + 1}/${CFG.IMG_RETRIES - 1} in ${delay}ms for ${url} :: ${String(err)}`);
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

/**
 * Pick the target path. If onConflict === "overwrite" or the file doesn't
 * exist, return `<base>.cbz`. Otherwise find the next free `<base> (N).cbz`.
 */
function resolveTargetPath(
  seriesDir: string,
  baseName: string,
  onConflict: "rename" | "overwrite",
): string {
  const primary = path.join(seriesDir, baseName + ".cbz");
  if (onConflict === "overwrite") return primary;
  if (!existsSync(primary)) return primary;
  let i = 2;
  // Cap at 9999 to avoid theoretical infinite loop on a hostile filesystem.
  while (i < 10000) {
    const candidate = path.join(seriesDir, `${baseName} (${i}).cbz`);
    if (!existsSync(candidate)) return candidate;
    i++;
  }
  // Fallback: timestamp suffix.
  return path.join(seriesDir, `${baseName} (${Date.now()}).cbz`);
}

async function packageCBZ(
  pages: Buffer[],
  title: string,
  series: string,
  outputDir: string,
  onConflict: "rename" | "overwrite",
): Promise<string> {
  const zip = new JSZip();
  pages.forEach((buf, i) => {
    const ext = guessExt(buf);
    const name = String(i + 1).padStart(3, "0") + "." + ext;
    zip.file(name, buf);
  });

  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "STORE",
  });

  const seriesDir = path.join(outputDir, cleanTitle(series));
  mkdirSync(seriesDir, { recursive: true });
  const filepath = resolveTargetPath(seriesDir, cleanTitle(title), onConflict);
  writeFileSync(filepath, content);
  return filepath;
}

async function downloadChapter(
  chapter: Chapter,
  outputDir: string,
  showScraperWindow: boolean,
  onConflict: "rename" | "overwrite",
  onUpdate: (c: Chapter) => void,
  isCancelled: () => boolean,
): Promise<Chapter> {
  const win = createHiddenWindow(showScraperWindow);
  try {
    log(`chapter: loading ${chapter.url}`);
    onUpdate({ ...chapter, status: "loading" });
    await loadPage(win, chapter.url);
    if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };

    onUpdate({ ...chapter, status: "scrolling" });
    const images = await scrollAndCollect(win);
    if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };

    if (images.length === 0) {
      return {
        ...chapter,
        status: "error",
        error: "No images found — site may require login or use a canvas reader.",
      };
    }

    const title = await getPageTitle(win);
    const series = extractSeries(title);

    onUpdate({
      ...chapter,
      status: "fetching",
      fetchDone: 0,
      fetchTotal: images.length,
    });

    const pages: Buffer[] = [];
    let failures = 0;
    for (let i = 0; i < images.length; i++) {
      if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };
      try {
        const buf = await downloadImage(images[i].src, chapter.url);
        pages.push(buf);
      } catch (err) {
        failures++;
        log(`fetch FAIL ${i + 1}/${images.length}: ${String(err)}`);
      }
      onUpdate({
        ...chapter,
        status: "fetching",
        fetchDone: i + 1,
        fetchTotal: images.length,
      });
    }

    if (pages.length === 0) {
      return {
        ...chapter,
        status: "error",
        error: `All ${images.length} image downloads failed.`,
      };
    }

    onUpdate({ ...chapter, status: "packaging" });
    const file = await packageCBZ(
      pages,
      chapter.title || cleanTitle(title),
      series,
      outputDir,
      onConflict,
    );
    log(`chapter done: ${file} (${pages.length}/${images.length} pages, ${failures} failed)`);

    return {
      ...chapter,
      status: "done",
      pages: pages.length,
      fetchTotal: images.length,
      fetchDone: pages.length,
      file,
      error: failures > 0 ? `${failures} of ${images.length} images failed.` : undefined,
    };
  } catch (err) {
    log(`chapter ERROR: ${String(err)}`);
    return { ...chapter, status: "error", error: String(err) };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

async function discoverChapters(
  startUrl: string,
  direction: "next" | "prev",
  count: number,
  showScraperWindow: boolean,
  onDiscover: (current: number, total: number, url: string) => void,
  isCancelled: () => boolean,
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const win = createHiddenWindow(showScraperWindow);
  try {
    let url: string | null = startUrl;
    for (let i = 0; i < count; i++) {
      if (!url || isCancelled()) break;
      log(`discover ${i + 1}/${count}: ${url}`);
      onDiscover(i + 1, count, url);
      await loadPage(win, url);
      const title = await getPageTitle(win);
      chapters.push({
        url,
        title: cleanTitle(title),
        status: "pending",
      });
      if (i < count - 1) {
        url = await findChapterLink(win, direction);
        if (!url) log(`discover: no ${direction} chapter link found, stopping`);
      }
    }
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
  return chapters;
}

async function runParallel(
  chapters: Chapter[],
  outputDir: string,
  showScraperWindow: boolean,
  onConflict: "rename" | "overwrite",
  onChapter: (c: Chapter) => void,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean,
): Promise<Chapter[]> {
  const results: Chapter[] = [];
  let done = 0;
  const total = chapters.length;
  const queue = [...chapters];
  const inFlight = new Set<Promise<void>>();

  const runOne = async (chapter: Chapter) => {
    const result = await downloadChapter(
      chapter,
      outputDir,
      showScraperWindow,
      onConflict,
      onChapter,
      isCancelled,
    );
    onChapter(result);
    results.push(result);
    done++;
    onProgress(done, total);
  };

  while (queue.length > 0 || inFlight.size > 0) {
    while (queue.length > 0 && inFlight.size < CFG.CONCURRENCY) {
      const chapter = queue.shift()!;
      const p = runOne(chapter).then(() => {
        inFlight.delete(p);
      });
      inFlight.add(p);
    }
    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }
  }
  return results;
}

export async function runJob(
  jobId: string,
  opts: StartJobOpts,
  isCancelled: () => boolean,
  emit: (event: JobEvent) => void,
): Promise<void> {
  const showScraperWindow = !!opts.showScraperWindow;
  const onConflict: "rename" | "overwrite" =
    opts.onConflict === "overwrite" ? "overwrite" : "rename";
  log(`job ${jobId} start: url=${opts.startUrl} dir=${opts.direction} count=${opts.count} showWindow=${showScraperWindow} onConflict=${onConflict}`);

  emit({ type: "phase", jobId, phase: "discovering" });

  const chapters = await discoverChapters(
    opts.startUrl,
    opts.direction,
    opts.count,
    showScraperWindow,
    (current, total, url) => {
      emit({ type: "discover", jobId, current, total, url });
    },
    isCancelled,
  );

  if (isCancelled() || chapters.length === 0) {
    emit({
      type: "done",
      jobId,
      message: isCancelled() ? "Cancelled." : "No chapters found.",
      outputDir: opts.outputDir,
      succeeded: 0,
      failed: 0,
    });
    return;
  }

  emit({
    type: "phase",
    jobId,
    phase: "downloading",
    chapters: chapters.map((c) => ({ url: c.url, title: c.title })),
  });

  const results = await runParallel(
    chapters,
    opts.outputDir,
    showScraperWindow,
    onConflict,
    (chapter) => emit({ type: "chapter", jobId, chapter }),
    (done, total) => emit({ type: "progress", jobId, done, total }),
    isCancelled,
  );

  const succeeded = results.filter((c) => c.status === "done").length;
  const failed = results.length - succeeded;
  log(`job ${jobId} done: ${succeeded} succeeded, ${failed} failed`);

  let message: string;
  if (failed === 0) message = `Downloaded ${succeeded} chapter(s).`;
  else if (succeeded === 0) message = `Failed: ${failed} chapter(s) failed to download.`;
  else message = `Partial: ${succeeded} succeeded, ${failed} failed.`;

  emit({
    type: "done",
    jobId,
    message,
    outputDir: opts.outputDir,
    succeeded,
    failed,
  });
}
