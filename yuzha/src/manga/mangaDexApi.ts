import type { MangaDexManga, MangaDexChapter, MangaDexPageData } from "./types";

const BASE = "/api/mangadex";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === 429) {
    throw new Error("Rate limited — please wait a moment and try again.");
  }
  if (!res.ok) {
    throw new Error(`MangaDex API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchManga(query: string): Promise<MangaDexManga[]> {
  const qs = [
    `title=${encodeURIComponent(query)}`,
    `limit=20`,
    `contentRating[]=safe`,
    `contentRating[]=suggestive`,
    `includes[]=cover_art`,
  ].join("&");

  const data = await apiFetch<{ data: MangaDexManga[] }>(`/manga?${qs}`);
  return data.data;
}

export async function getMangaChapters(
  mangaId: string,
  lang = "en",
): Promise<MangaDexChapter[]> {
  const parts = [
    `limit=100`,
    `order[chapter]=desc`,
    `includes[]=scanlation_group`,
  ];
  if (lang) parts.push(`translatedLanguage[]=${encodeURIComponent(lang)}`);
  const qs = parts.join("&");

  const data = await apiFetch<{ data: MangaDexChapter[] }>(
    `/manga/${mangaId}/feed?${qs}`,
  );
  return data.data;
}

export async function getChapterPages(
  chapterId: string,
  dataSaver = false,
): Promise<string[]> {
  const data = await apiFetch<MangaDexPageData>(`/at-home/server/${chapterId}`);
  const { baseUrl, chapter } = data;
  const filenames = dataSaver ? chapter.dataSaver : chapter.data;
  const quality = dataSaver ? "data-saver" : "data";
  return filenames.map((f) => `${baseUrl}/${quality}/${chapter.hash}/${f}`);
}

export function getCoverUrl(
  manga: MangaDexManga,
  size: 256 | 512 | null = 256,
): string | null {
  const rel = manga.relationships.find((r) => r.type === "cover_art");
  if (!rel?.attributes?.fileName) return null;
  const base = `https://uploads.mangadex.org/covers/${manga.id}/${rel.attributes.fileName}`;
  return size ? `${base}.${size}.jpg` : base;
}

export function getMangaTitle(manga: MangaDexManga): string {
  const t = manga.attributes.title;
  return t["en"] ?? t["ja-ro"] ?? Object.values(t)[0] ?? "Unknown Title";
}

export function getMangaDescription(manga: MangaDexManga): string {
  const d = manga.attributes.description;
  return d["en"] ?? Object.values(d)[0] ?? "";
}

export function getChapterLabel(chapter: MangaDexChapter): string {
  const num = chapter.attributes.chapter;
  const title = chapter.attributes.title;
  if (num === null) return title ?? "Oneshot";
  return title ? `Ch. ${num} — ${title}` : `Ch. ${num}`;
}

export function getAvailableLanguages(chapters: MangaDexChapter[]): string[] {
  const langs = new Set(chapters.map((c) => c.attributes.translatedLanguage));
  return Array.from(langs).sort();
}

export function getGenreTags(manga: MangaDexManga): string[] {
  return manga.attributes.tags
    .filter((t) => t.attributes.group === "genre")
    .map((t) => t.attributes.name["en"] ?? Object.values(t.attributes.name)[0] ?? "")
    .filter(Boolean);
}

export function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
