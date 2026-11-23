const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/**
 * Safely extracts an 11-character YouTube video ID from standard watch URLs,
 * youtu.be short links, Shorts links, live links, or embed links.
 * Returns null for invalid or non-YouTube URLs.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  let candidate: string | null = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const firstSegment = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    candidate = firstSegment;
  } else {
    const vParam = parsed.searchParams.get("v");
    if (vParam) {
      candidate = vParam;
    } else {
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (
        segments.length >= 2 &&
        (segments[0] === "shorts" ||
          segments[0] === "embed" ||
          segments[0] === "live" ||
          segments[0] === "v")
      ) {
        candidate = segments[1];
      }
    }
  }

  if (candidate && YOUTUBE_ID_REGEX.test(candidate)) {
    return candidate;
  }

  return null;
}

/**
 * Builds a privacy-enhanced YouTube embed URL for a validated video ID.
 */
export function buildYouTubeNoCookieEmbedUrl(videoId: string): string | null {
  if (!YOUTUBE_ID_REGEX.test(videoId)) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
