import { app, BrowserWindow, ipcMain, dialog, shell, Menu, MenuItem } from "electron";
import path from "path";
import { fileURLToPath } from "node:url";
import { runJob } from "./downloader";
import type { StartJobOpts, JobEvent } from "../../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

const cancelFlags = new Map<string, boolean>();

function emit(event: JobEvent): void {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send("job-event", event);
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
    mainWindow = null;
  });

  // Native context menu (right-click → cut/copy/paste/select-all).
  // Electron renderers do NOT have a default context menu, so paste, copy,
  // etc. are silently ignored on right-click unless this handler is attached.
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
    title: "Choose download folder",
  });
  return filePaths[0] ?? null;
});

ipcMain.handle("open-folder", async (_e, dir: string) => {
  await shell.openPath(dir);
});

ipcMain.handle("cancel-job", (_e, jobId: string) => {
  cancelFlags.set(jobId, true);
});

ipcMain.handle("start-job", async (_e, opts: StartJobOpts): Promise<string> => {
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
