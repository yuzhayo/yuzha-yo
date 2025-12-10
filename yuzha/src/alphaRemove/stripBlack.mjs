#!/usr/bin/env node
/**
 * stripBlack.mjs - Convert black matte to alpha.
 *
 * Usage:
 *   node stripBlack.mjs --input in.png --output out.png [--threshold 25] [--curve 1.4]
 *   node stripBlack.mjs --all --src shared/asset --dest shared/asset_cleaned [--threshold 25] [--curve 1.4]
 *
 * Threshold: 0-255 (higher removes more dark fringe)
 * Curve: >0 (higher sharpens edge)
 */
import { PNG } from "pngjs";
import { promises as fs } from "node:fs";
import path from "node:path";

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

async function loadPng(filePath) {
  const buf = await fs.readFile(filePath);
  return PNG.sync.read(buf);
}

function processPng(png, threshold, curve) {
  const data = png.data;
  const tNorm = clamp(threshold, 0, 255) / 255;
  const c = Math.max(0.01, curve);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const lum = Math.max(r, g, b);
    let a = lum <= tNorm ? 0 : (lum - tNorm) / (1 - tNorm);
    a = Math.pow(clamp(a, 0, 1), c);
    data[i + 3] = Math.round(a * 255);
  }
  return png;
}

async function savePng(png, outPath) {
  const buf = PNG.sync.write(png);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buf);
}

async function processFile(input, output, threshold, curve) {
  const png = await loadPng(input);
  const processed = processPng(png, threshold, curve);
  await savePng(processed, output);
  console.log(`Processed ${input} -> ${output}`);
}

async function processAll(srcDir, destDir, threshold, curve) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      await processAll(full, path.join(destDir, entry.name), threshold, curve);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const out = path.join(destDir, entry.name);
      await processFile(full, out, threshold, curve);
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { threshold: 25, curve: 1.4 };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--input") opts.input = args[++i];
    else if (arg === "--output") opts.output = args[++i];
    else if (arg === "--threshold") opts.threshold = Number(args[++i]);
    else if (arg === "--curve") opts.curve = Number(args[++i]);
    else if (arg === "--all") opts.all = true;
    else if (arg === "--src") opts.src = args[++i];
    else if (arg === "--dest") opts.dest = args[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  if (opts.all) {
    if (!opts.src || !opts.dest) {
      console.error("For --all you must provide --src <dir> and --dest <dir>");
      process.exit(1);
    }
    await processAll(opts.src, opts.dest, opts.threshold, opts.curve);
    return;
  }

  if (!opts.input || !opts.output) {
    console.error("Usage: node stripBlack.mjs --input in.png --output out.png [--threshold 25] [--curve 1.4]");
    process.exit(1);
  }
  await processFile(opts.input, opts.output, opts.threshold, opts.curve);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
