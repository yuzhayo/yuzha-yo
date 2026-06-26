import { BrowserWindow, net, app, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { mkdirSync, writeFileSync } from "fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const CFG = {
  SCROLL_STEP_PX: 2e3,
  SCROLL_DELAY_MS: 400,
  STABLE_NEED: 10,
  PAGE_TIMEOUT_MS: 2e4,
  CONCURRENCY: 3
};
function createHiddenWindow() {
  return new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      offscreen: false
    }
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function loadPage(win, url) {
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
async function scrollAndCollect(win) {
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
    const count = await win.webContents.executeJavaScript(`
      document.querySelectorAll('img[src]').length
    `);
    if (count === lastCount) {
      stableRuns++;
    } else {
      stableRuns = 0;
      lastCount = count;
    }
  }
  const images = await win.webContents.executeJavaScript(`
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
async function findChapterLink(win, direction) {
  const keyword = direction === "next" ? "next" : "prev";
  const result = await win.webContents.executeJavaScript(`
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
async function getPageTitle(win) {
  return win.webContents.executeJavaScript(`document.title`);
}
function cleanTitle(raw) {
  return raw.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
}
function extractSeries(title) {
  const parts = title.split(/[-–|]/);
  return cleanTitle(parts[0] ?? title);
}
async function downloadImage(url, referer) {
  const res = await net.fetch(url, {
    headers: {
      Referer: referer,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}
function guessExt(buf) {
  if (buf[0] === 255 && buf[1] === 216) return "jpg";
  if (buf[0] === 137 && buf[1] === 80) return "png";
  if (buf[0] === 71 && buf[1] === 73) return "gif";
  if (buf[0] === 82 && buf[1] === 73) return "webp";
  return "jpg";
}
async function packageCBZ(pages, title, series, outputDir) {
  const zip = new JSZip();
  pages.forEach((buf, i) => {
    const ext = guessExt(buf);
    const name = String(i + 1).padStart(3, "0") + "." + ext;
    zip.file(name, buf);
  });
  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "STORE"
  });
  const seriesDir = path.join(outputDir, cleanTitle(series));
  mkdirSync(seriesDir, { recursive: true });
  const filename = cleanTitle(title) + ".cbz";
  const filepath = path.join(seriesDir, filename);
  writeFileSync(filepath, content);
  return filepath;
}
async function downloadChapter(chapter, outputDir, onUpdate, isCancelled) {
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
      fetchTotal: images.length
    });
    const pages = [];
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
async function discoverChapters(startUrl, direction, count, onDiscover, isCancelled) {
  const chapters = [];
  const win = createHiddenWindow();
  try {
    let url = startUrl;
    for (let i = 0; i < count; i++) {
      if (!url || isCancelled()) break;
      onDiscover(i + 1, count, url);
      await loadPage(win, url);
      const title = await getPageTitle(win);
      chapters.push({
        url,
        title: cleanTitle(title),
        status: "pending"
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
async function runParallel(chapters, outputDir, onChapter, onProgress, isCancelled) {
  let done = 0;
  const total = chapters.length;
  const queue = [...chapters];
  const inFlight = /* @__PURE__ */ new Set();
  const runOne = async (chapter) => {
    const result = await downloadChapter(chapter, outputDir, onChapter, isCancelled);
    onChapter(result);
    done++;
    onProgress(done, total);
  };
  while (queue.length > 0 || inFlight.size > 0) {
    while (queue.length > 0 && inFlight.size < CFG.CONCURRENCY) {
      const chapter = queue.shift();
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
async function runJob(jobId, opts, isCancelled, emit2) {
  emit2({ type: "phase", jobId, phase: "discovering" });
  const chapters = await discoverChapters(
    opts.startUrl,
    opts.direction,
    opts.count,
    (current, total, url) => {
      emit2({ type: "discover", jobId, current, total, url });
    },
    isCancelled
  );
  if (isCancelled() || chapters.length === 0) {
    emit2({ type: "done", jobId, message: "Cancelled or nothing found.", outputDir: opts.outputDir });
    return;
  }
  emit2({
    type: "phase",
    jobId,
    phase: "downloading",
    chapters: chapters.map((c) => ({ url: c.url, title: c.title }))
  });
  await runParallel(
    chapters,
    opts.outputDir,
    (chapter) => emit2({ type: "chapter", jobId, chapter }),
    (done, total) => emit2({ type: "progress", jobId, done, total }),
    isCancelled
  );
  emit2({
    type: "done",
    jobId,
    message: `Downloaded ${chapters.length} chapter(s).`,
    outputDir: opts.outputDir
  });
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
const cancelFlags = /* @__PURE__ */ new Map();
function emit(event) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send("job-event", event);
  }
}
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0f0f1a",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname$1, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../renderer/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("pick-folder", async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Choose download folder"
  });
  return filePaths[0] ?? null;
});
ipcMain.handle("open-folder", async (_e, dir) => {
  await shell.openPath(dir);
});
ipcMain.handle("cancel-job", (_e, jobId) => {
  cancelFlags.set(jobId, true);
});
ipcMain.handle("start-job", async (_e, opts) => {
  const jobId = `job_${Date.now()}`;
  cancelFlags.set(jobId, false);
  const isCancelled = () => cancelFlags.get(jobId) === true;
  (async () => {
    try {
      await runJob(jobId, opts, isCancelled, emit);
    } catch (err) {
      emit({ type: "error", jobId, message: String(err) });
    } finally {
      cancelFlags.delete(jobId);
    }
  })();
  return jobId;
});
