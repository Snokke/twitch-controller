import streamDeck from "@elgato/streamdeck";

let cachedUrl = "";
let cachedBase64 = "";

export async function getAvatarBase64(url: string): Promise<string> {
  if (!url) {
    streamDeck.logger.debug("No avatar URL provided");
    return "";
  }
  if (url === cachedUrl && cachedBase64) return cachedBase64;

  try {
    streamDeck.logger.info(`Fetching avatar: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      streamDeck.logger.warn(`Avatar fetch failed: ${res.status}`);
      return "";
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    cachedUrl = url;
    cachedBase64 = `data:${contentType};base64,${base64}`;
    return cachedBase64;
  } catch (e) {
    streamDeck.logger.warn(`Failed to fetch avatar: ${e}`);
    return "";
  }
}
