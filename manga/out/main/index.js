import { BrowserWindow, app, ipcMain, dialog, shell, Menu, MenuItem } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { mkdirSync, writeFileSync, existsSync, constants } from "fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const CFG = {
  SCROLL_STEP_PX: 2e3,
  SCROLL_DELAY_MS: 400,
  STABLE_NEED: 10,
  SCROLL_MAX_ITERATIONS: 60,
  // safety net: never loop forever
  PAGE_TIMEOUT_MS: 2e4,
  IMG_TIMEOUT_MS: 15e3,
  IMG_RETRIES: 3,
  IMG_RETRY_DELAYS_MS: [500, 1e3, 2e3],
  CONCURRENCY: 3,
  UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};
function log(...args) {
  console.log("[downloader]", ...args);
}
function createHiddenWindow(visible) {
  const win = new BrowserWindow({
    show: visible,
    width: visible ? 1100 : 800,
    height: visible ? 800 : 600,
    title: "Manga Downloader — scraper",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      offscreen: false
    }
  });
  win.webContents.setUserAgent(CFG.UA);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return win;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function loadPage(win, url) {
  let timeoutId = null;
  try {
    await Promise.race([
      win.loadURL(url),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Timeout loading ${url}`)),
          CFG.PAGE_TIMEOUT_MS
        );
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
async function scrollAndCollect(win) {
  log("scroll: reset to top");
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
  await win.webContents.executeJavaScript(`
    (function () {
      try {
        const all = document.querySelectorAll('*');
        let best = document.scrollingElement || document.documentElement;
        let bestScore = best.scrollHeight - best.clientHeight;
        for (const el of all) {
          const style = getComputedStyle(el);
          const overflowY = style.overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') &&
              el.scrollHeight - el.clientHeight > bestScore &&
              el.clientHeight > 200) {
            best = el;
            bestScore = el.scrollHeight - el.clientHeight;
          }
        }
        window.__scrapeScroller = best;
        window.__scrapeIsWindowScroll = (best === document.scrollingElement || best === document.documentElement);
      } catch (e) {
        window.__scrapeScroller = document.scrollingElement || document.documentElement;
        window.__scrapeIsWindowScroll = true;
      }
    })();
    undefined;
  `);
  const scrollerInfo = await win.webContents.executeJavaScript(`
    ({ isWindowScroll: !!window.__scrapeIsWindowScroll })
  `);
  log(`scroll: target = ${scrollerInfo.isWindowScroll ? "window/document" : "inner scrollable element"}`);
  await win.webContents.executeJavaScript(`
    (function () {
      if (window.__scrapeIsWindowScroll) {
        window.scrollTo(0, 0);
      } else if (window.__scrapeScroller) {
        window.__scrapeScroller.scrollTop = 0;
      }
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
    await win.webContents.executeJavaScript(`
      (function () {
        const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
        if (window.__scrapeIsWindowScroll) {
          window.scrollBy(0, step);
        } else if (window.__scrapeScroller) {
          window.__scrapeScroller.scrollTop += step;
        }
      })();
      undefined;
    `);
    await sleep(CFG.SCROLL_DELAY_MS);
    const sample = await win.webContents.executeJavaScript(`
      (function () {
        const el = window.__scrapeIsWindowScroll
          ? document.documentElement
          : window.__scrapeScroller;
        const scrollTop = window.__scrapeIsWindowScroll ? window.scrollY : el.scrollTop;
        const clientHeight = window.__scrapeIsWindowScroll ? window.innerHeight : el.clientHeight;
        return {
          height: el.scrollHeight,
          imgs: Array.from(document.querySelectorAll('img')).filter(function(img) {
            return img.currentSrc || img.src ||
              img.getAttribute('data-src') ||
              img.getAttribute('data-lazy-src') ||
              img.getAttribute('data-original') ||
              img.getAttribute('srcset');
          }).length,
          atBottom: (scrollTop + clientHeight) >= (el.scrollHeight - 100)
        };
      })()
    `);
    if (sample.atBottom && sample.height === lastHeight && sample.imgs === lastImgCount) {
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
  await sleep(1e3);
  await win.webContents.executeJavaScript(`
    (function () {
      if (window.__scrapeIsWindowScroll) {
        window.scrollTo(0, 0);
      } else if (window.__scrapeScroller) {
        window.__scrapeScroller.scrollTop = 0;
      }
    })();
    undefined;
  `);
  const images = await win.webContents.executeJavaScript(`
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
async function findChapterLink(win, direction) {
  const keyword = direction;
  const result = await win.webContents.executeJavaScript(`
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
async function fetchImageOnce(url, referer) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CFG.IMG_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Referer: referer,
        "User-Agent": CFG.UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
      },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } finally {
    clearTimeout(timer);
  }
}
async function downloadImage(url, referer) {
  let lastErr;
  for (let attempt = 0; attempt < CFG.IMG_RETRIES; attempt++) {
    try {
      return await fetchImageOnce(url, referer);
    } catch (err) {
      lastErr = err;
      if (attempt < CFG.IMG_RETRIES - 1) {
        const delay = CFG.IMG_RETRY_DELAYS_MS[attempt] ?? 2e3;
        log(`fetch retry ${attempt + 1}/${CFG.IMG_RETRIES - 1} in ${delay}ms for ${url} :: ${String(err)}`);
        await sleep(delay);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
function guessExt(buf) {
  if (buf[0] === 255 && buf[1] === 216) return "jpg";
  if (buf[0] === 137 && buf[1] === 80) return "png";
  if (buf[0] === 71 && buf[1] === 73) return "gif";
  if (buf[0] === 82 && buf[1] === 73) return "webp";
  return "jpg";
}
function resolveTargetPath(seriesDir, baseName, onConflict) {
  const primary = path.join(seriesDir, baseName + ".cbz");
  if (onConflict === "overwrite") return primary;
  if (!existsSync(primary)) return primary;
  let i = 2;
  while (i < 1e4) {
    const candidate = path.join(seriesDir, `${baseName} (${i}).cbz`);
    if (!existsSync(candidate)) return candidate;
    i++;
  }
  return path.join(seriesDir, `${baseName} (${Date.now()}).cbz`);
}
async function packageCBZ(pages, title, series, outputDir, onConflict) {
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
  const filepath = resolveTargetPath(seriesDir, cleanTitle(title), onConflict);
  writeFileSync(filepath, content);
  return filepath;
}
async function downloadChapter(chapter, outputDir, showScraperWindow, onConflict, onUpdate, isCancelled) {
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
        error: "No images found — site may require login or use a canvas reader."
      };
    }
    const title = await getPageTitle(win);
    const series = extractSeries(title);
    onUpdate({
      ...chapter,
      status: "fetching",
      fetchDone: 0,
      fetchTotal: images.length
    });
    const pages = [];
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
        fetchTotal: images.length
      });
    }
    if (pages.length === 0) {
      return {
        ...chapter,
        status: "error",
        error: `All ${images.length} image downloads failed.`
      };
    }
    onUpdate({ ...chapter, status: "packaging" });
    const file = await packageCBZ(
      pages,
      chapter.title || cleanTitle(title),
      series,
      outputDir,
      onConflict
    );
    log(`chapter done: ${file} (${pages.length}/${images.length} pages, ${failures} failed)`);
    return {
      ...chapter,
      status: "done",
      pages: pages.length,
      fetchTotal: images.length,
      fetchDone: pages.length,
      file,
      error: failures > 0 ? `${failures} of ${images.length} images failed.` : void 0
    };
  } catch (err) {
    log(`chapter ERROR: ${String(err)}`);
    return { ...chapter, status: "error", error: String(err) };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}
async function discoverChapters(startUrl, direction, count, showScraperWindow, onDiscover, isCancelled) {
  const chapters = [];
  const win = createHiddenWindow(showScraperWindow);
  try {
    let url = startUrl;
    for (let i = 0; i < count; i++) {
      if (!url || isCancelled()) break;
      log(`discover ${i + 1}/${count}: ${url}`);
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
        if (!url) log(`discover: no ${direction} chapter link found, stopping`);
      }
    }
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
  return chapters;
}
async function runParallel(chapters, outputDir, showScraperWindow, onConflict, onChapter, onProgress, isCancelled) {
  const results = [];
  let done = 0;
  const total = chapters.length;
  const queue = [...chapters];
  const inFlight = /* @__PURE__ */ new Set();
  const runOne = async (chapter) => {
    const result = await downloadChapter(
      chapter,
      outputDir,
      showScraperWindow,
      onConflict,
      onChapter,
      isCancelled
    );
    onChapter(result);
    results.push(result);
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
  return results;
}
async function runJob(jobId, opts, isCancelled, emit2) {
  const showScraperWindow = !!opts.showScraperWindow;
  const onConflict = opts.onConflict === "overwrite" ? "overwrite" : "rename";
  log(`job ${jobId} start: url=${opts.startUrl} dir=${opts.direction} count=${opts.count} showWindow=${showScraperWindow} onConflict=${onConflict}`);
  emit2({ type: "phase", jobId, phase: "discovering" });
  const chapters = await discoverChapters(
    opts.startUrl,
    opts.direction,
    opts.count,
    showScraperWindow,
    (current, total, url) => {
      emit2({ type: "discover", jobId, current, total, url });
    },
    isCancelled
  );
  if (isCancelled() || chapters.length === 0) {
    emit2({
      type: "done",
      jobId,
      message: isCancelled() ? "Cancelled." : "No chapters found.",
      outputDir: opts.outputDir,
      succeeded: 0,
      failed: 0
    });
    return;
  }
  emit2({
    type: "phase",
    jobId,
    phase: "downloading",
    chapters: chapters.map((c) => ({ url: c.url, title: c.title }))
  });
  const results = await runParallel(
    chapters,
    opts.outputDir,
    showScraperWindow,
    onConflict,
    (chapter) => emit2({ type: "chapter", jobId, chapter }),
    (done, total) => emit2({ type: "progress", jobId, done, total }),
    isCancelled
  );
  const succeeded = results.filter((c) => c.status === "done").length;
  const failed = results.length - succeeded;
  log(`job ${jobId} done: ${succeeded} succeeded, ${failed} failed`);
  let message;
  if (failed === 0) message = `Downloaded ${succeeded} chapter(s).`;
  else if (succeeded === 0) message = `Failed: ${failed} chapter(s) failed to download.`;
  else message = `Partial: ${succeeded} succeeded, ${failed} failed.`;
  emit2({
    type: "done",
    jobId,
    message,
    outputDir: opts.outputDir,
    succeeded,
    failed
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
  mainWindow.webContents.on("context-menu", (_e, params) => {
    const menu = new Menu();
    if (params.isEditable) {
      menu.append(new MenuItem({ role: "undo" }));
      menu.append(new MenuItem({ role: "redo" }));
      menu.append(new MenuItem({ type: "separator" }));
      menu.append(new MenuItem({ role: "cut" }));
      menu.append(new MenuItem({ role: "copy" }));
      menu.append(new MenuItem({ role: "paste" }));
      menu.append(new MenuItem({ role: "selectAll" }));
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      menu.append(new MenuItem({ role: "copy" }));
    }
    if (menu.items.length > 0 && mainWindow) {
      menu.popup({ window: mainWindow });
    }
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
