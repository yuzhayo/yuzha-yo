import { app, BrowserWindow, ipcMain, dialog, shell, Menu, MenuItem } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import { openScraper, runScroll, runHarvest, compileCbz } from "./downloader";
import type { PhaseEvent, HarvestedImage } from "../../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let scraperWin: BrowserWindow | null = null;

function emitPhase(event: PhaseEvent): void {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send("phase-event", event);
  }
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0f0f1a",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    if (scraperWin && !scraperWin.isDestroyed()) scraperWin.destroy();
    scraperWin = null;
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
    } else if (params.selectionText?.trim().length > 0) {
      menu.append(new MenuItem({ role: "copy" }));
    }
    if (menu.items.length > 0 && mainWindow) menu.popup({ window: mainWindow });
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

// ─── Utility handlers ─────────────────────────────────────────────────────────

ipcMain.handle("pick-folder", async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Choose download folder",
  });
  return filePaths[0] ?? null;
});

ipcMain.handle("open-folder", async (_e, dir: string) => {
  await shell.openPath(dir);
});

// ─── Phase handlers ───────────────────────────────────────────────────────────

ipcMain.handle("phase-open", async (_e, url: string): Promise<void> => {
  if (scraperWin && !scraperWin.isDestroyed()) scraperWin.destroy();

  scraperWin = new BrowserWindow({
    show: true,
    width: 850,
    height: 700,
    title: "Manga Scraper",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      offscreen: false,
    },
  });

  // Place scraper to the right of the main window; fall back to OS default if off-screen
  if (mainWindow && !mainWindow.isDestroyed()) {
    const b = mainWindow.getBounds();
    scraperWin.setBounds({ x: b.x + b.width + 4, y: b.y, width: 850, height: b.height });
  }

  scraperWin.on("closed", () => { scraperWin = null; });

  await openScraper(url, scraperWin);
});

ipcMain.handle("phase-scroll", async () => {
  if (!scraperWin || scraperWin.isDestroyed()) throw new Error("No scraper window open. Run Phase 1 first.");
  return runScroll(scraperWin, emitPhase);
});

ipcMain.handle("phase-harvest", async () => {
  if (!scraperWin || scraperWin.isDestroyed()) throw new Error("No scraper window open. Run Phase 1 first.");
  return runHarvest(scraperWin);
});

ipcMain.handle("phase-compile", async (_e, images: HarvestedImage[], outputDir: string) => {
  if (!scraperWin || scraperWin.isDestroyed()) throw new Error("No scraper window open. Run Phase 1 first.");
  return compileCbz(images, outputDir, scraperWin, emitPhase);
});

ipcMain.handle("phase-close", () => {
  if (scraperWin && !scraperWin.isDestroyed()) scraperWin.destroy();
  scraperWin = null;
});
