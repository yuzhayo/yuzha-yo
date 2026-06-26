import { BrowserWindow, net } from "electron";
import JSZip from "jszip";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import type { Chapter, StartJobOpts, JobEvent } from "../../src/types";

export const CFG = {
  SCROLL_STEP_PX: 2000,
  SCROLL_DELAY_MS: 400,
  STABLE_NEED: 10,
  PAGE_TIMEOUT_MS: 20_000,
  CONCURRENCY: 3,
} as const;

interface ImageRef {
  src: string;
  top: number;
}

function createHiddenWindow(): BrowserWindow {
  return new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      offscreen: false,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPage(win: BrowserWindow, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timeout loading ${url}`)),
      CFG.PAGE_TIMEOUT_MS
    );
    win.webContents.once("did-finish-load", () => {
      clearTimeout(timeout);
      resolve();
    });
    win.webContents.once("did-fail-load", (_e, code, desc) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load ${url}: ${desc} (${code})`));
    });
    win.loadURL(url);
  });
}

async function scrollAndCollect(win: BrowserWindow): Promise<ImageRef[]> {
  let lastCount = 0;
  let stableRuns = 0;

  while (stableRuns < CFG.STABLE_NEED) {
    await win.webContents.executeJavaScript(`
      (() => {
        const selectors = [
          '.reader-container', '.chapter-reader', '.manga-reader',
          '.page-container', 'main', 'article'
        ];
        let el = document.documentElement;
        for (const s of selectors) {
          const found = document.querySelector(s);
          if (found) { el = found; break; }
        }
        el.scrollBy(0, ${CFG.SCROLL_STEP_PX});
      })()
    `);
    await sleep(CFG.SCROLL_DELAY_MS);

    const count: number = await win.webContents.executeJavaScript(`
      document.querySelectorAll('img[src]').length
    `);

    if (count === lastCount) {
      stableRuns++;
    } else {
      stableRuns = 0;
      lastCount = count;
    }
  }

  const images: ImageRef[] = await win.webContents.executeJavaScript(`
    Array.from(document.querySelectorAll('img[src]'))
      .map(img => ({
        src: img.src,
        top: img.getBoundingClientRect().top + window.scrollY
      }))
      .filter(i => i.src.startsWith('http'))
      .sort((a, b) => a.top - b.top)
  `);

  return images;
}

async function findChapterLink(
  win: BrowserWindow,
  direction: "next" | "prev"
): Promise<string | null> {
  const keyword = direction === "next" ? "next" : "prev";
  const result: string | null = await win.webContents.executeJavaScript(`
    (() => {
      const selectors = [
        'a[rel="${keyword === "next" ? "next" : "prev"}"]',
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
        a.textContent?.toLowerCase().includes('${keyword}') && a.href
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

async function downloadImage(url: string, referer: string): Promise<Buffer> {
  const res = await net.fetch(url, {
    headers: {
      Referer: referer,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

function guessExt(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "gif";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "webp";
  return "jpg";
}

async function packageCBZ(
  pages: Buffer[],
  title: string,
  series: string,
  outputDir: string
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
  const filename = cleanTitle(title) + ".cbz";
  const filepath = path.join(seriesDir, filename);
  writeFileSync(filepath, content);
  return filepath;
}

async function downloadChapter(
  chapter: Chapter,
  outputDir: string,
  onUpdate: (c: Chapter) => void,
  isCancelled: () => boolean
): Promise<Chapter> {
  const win = createHiddenWindow();
  try {
    onUpdate({ ...chapter, status: "loading" });
    await loadPage(win, chapter.url);
    if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };

    onUpdate({ ...chapter, status: "scrolling" });
    const images = await scrollAndCollect(win);
    if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };

    const title = await getPageTitle(win);
    const series = extractSeries(title);

    onUpdate({
      ...chapter,
      status: "fetching",
      fetchDone: 0,
      fetchTotal: images.length,
    });

    const pages: Buffer[] = [];
    for (let i = 0; i < images.length; i++) {
      if (isCancelled()) return { ...chapter, status: "error", error: "Cancelled" };
      const buf = await downloadImage(images[i].src, chapter.url);
      pages.push(buf);
      onUpdate({ ...chapter, status: "fetching", fetchDone: i + 1, fetchTotal: images.length });
    }

    onUpdate({ ...chapter, status: "packaging" });
    const file = await packageCBZ(pages, chapter.title || cleanTitle(title), series, outputDir);

    return { ...chapter, status: "done", pages: pages.length, file };
  } catch (err) {
    return { ...chapter, status: "error", error: String(err) };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

async function discoverChapters(
  startUrl: string,
  direction: "next" | "prev",
  count: number,
  onDiscover: (current: number, total: number, url: string) => void,
  isCancelled: () => boolean
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const win = createHiddenWindow();
  try {
    let url: string | null = startUrl;
    for (let i = 0; i < count; i++) {
      if (!url || isCancelled()) break;
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
  onChapter: (c: Chapter) => void,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean
): Promise<void> {
  let done = 0;
  const total = chapters.length;
  const queue = [...chapters];
  const inFlight = new Set<Promise<void>>();

  const runOne = async (chapter: Chapter) => {
    const result = await downloadChapter(chapter, outputDir, onChapter, isCancelled);
    onChapter(result);
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
}

export async function runJob(
  jobId: string,
  opts: StartJobOpts,
  isCancelled: () => boolean,
  emit: (event: JobEvent) => void
): Promise<void> {
  emit({ type: "phase", jobId, phase: "discovering" });

  const chapters = await discoverChapters(
    opts.startUrl,
    opts.direction,
    opts.count,
    (current, total, url) => {
      emit({ type: "discover", jobId, current, total, url });
    },
    isCancelled
  );

  if (isCancelled() || chapters.length === 0) {
    emit({ type: "done", jobId, message: "Cancelled or nothing found.", outputDir: opts.outputDir });
    return;
  }

  emit({
    type: "phase",
    jobId,
    phase: "downloading",
    chapters: chapters.map((c) => ({ url: c.url, title: c.title })),
  });

  await runParallel(
    chapters,
    opts.outputDir,
    (chapter) => emit({ type: "chapter", jobId, chapter }),
    (done, total) => emit({ type: "progress", jobId, done, total }),
    isCancelled
  );

  emit({
    type: "done",
    jobId,
    message: `Downloaded ${chapters.length} chapter(s).`,
    outputDir: opts.outputDir,
  });
}
