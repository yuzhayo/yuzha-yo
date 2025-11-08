#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ----------------------------------------------------------------------------
// Types and exports used at runtime within the app
// ----------------------------------------------------------------------------
let cachedRegistry = null;
export async function loadImageRegistry() {
  if (!cachedRegistry) {
    cachedRegistry = JSON.parse(await fs.readFile(registryPath, "utf8"));
  }
  return cachedRegistry;
}

export async function getImagePath(id) {
  const registry = await loadImageRegistry();
  return registry.find((entry) => entry.id === id)?.path;
}

export async function hasImage(id) {
  const registry = await loadImageRegistry();
  return registry.some((entry) => entry.id === id);
}

// ----------------------------------------------------------------------------
// Generation logic shared by the CLI entry point
// ----------------------------------------------------------------------------
const repoRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const assetDir = path.join(repoRoot, "shared", "asset");
const registryPath = path.join(repoRoot, "shared", "asset", "ImageRegistry.json");

function toForwardSlash(value) {
  return value.split(path.sep).join("/");
}

async function collectPngFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPngFiles(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function syncImageRegistry() {
  const files = await collectPngFiles(assetDir);
  const entries = files
    .map((absolutePath) => {
      const relativePath = toForwardSlash(path.relative(assetDir, absolutePath));
      return {
        id: relativePath.replace(/\.png$/i, ""),
        path: `shared/asset/${relativePath}`,
      };
    })
    // Keep registry sorted by ID so git diffs stay stable when assets change.
    .sort((a, b) => a.id.localeCompare(b.id));

  const json = `${JSON.stringify(entries, null, 2)}\n`;
  await fs.writeFile(registryPath, json, "utf8");
  cachedRegistry = entries;
}

// ----------------------------------------------------------------------------
// CLI entry point for manual/CI usage
// ----------------------------------------------------------------------------
const invokedDirectly = (() => {
  if (process.argv.length < 2) return false;
  try {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  syncImageRegistry().catch((error) => {
    console.error("Failed to sync ImageRegistry", error);
    process.exitCode = 1;
  });
}
