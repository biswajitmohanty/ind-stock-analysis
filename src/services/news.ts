import axios from "axios";
import pino from "pino";
import type { NewsItem } from "../types/index.js";

const logger = pino({ name: "news" });

// Retry interceptor for axios
const newsClient = axios.create({ timeout: 10000 });
newsClient.interceptors.response.use(undefined, async (error) => {
	const config = error.config;
	if (!config || (config._retryCount ?? 0) >= 3) return Promise.reject(error);
	config._retryCount = (config._retryCount ?? 0) + 1;
	await new Promise((r) => setTimeout(r, 1000 * config._retryCount));
	return newsClient(config);
});

/**
 * Fetch recent stock news from Google News RSS.
 * Queries with NSE/BSE context for Indian stocks.
 */
export async function getStockNews(
	ticker: string,
	limit = 5,
): Promise<NewsItem[]> {
	try {
		// Strip exchange suffix for search query
		const baseTicker = ticker.replace(/\.(NS|BO)$/, "");
		const query = encodeURIComponent(`${baseTicker} NSE stock`);
		const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

		const response = await newsClient.get(url, {
			headers: { "User-Agent": "Mozilla/5.0" },
		});

		const xml = response.data as string;
		const items: NewsItem[] = [];

		// Parse RSS XML manually
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		let match: RegExpExecArray | null;

		while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
			const itemXml = match[1];
			const title = extractTag(itemXml, "title");
			const link = extractTag(itemXml, "link");
			const pubDate = extractTag(itemXml, "pubDate");
			const description = extractTag(itemXml, "description");

			if (title && link) {
				items.push({
					title: decodeHtmlEntities(title),
					url: link,
					publishedAt: pubDate || "",
					summary: description ? decodeHtmlEntities(description).slice(0, 200) : "",
				});
			}
		}

		return items;
	} catch (error) {
		logger.error({ ticker, error }, "Failed to fetch news");
		return [];
	}
}

function extractTag(xml: string, tag: string): string | null {
	const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
	const match = regex.exec(xml);
	return match?.[1] ?? match?.[2] ?? null;
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/**
 * Format news items for display.
 */
export function formatNews(ticker: string, news: NewsItem[]): string {
	if (news.length === 0) return `\n📰 No recent news for ${ticker}`;

	const lines: string[] = [];
	lines.push(`\n📰 Recent News for ${ticker}`);
	lines.push("─".repeat(50));

	for (const item of news) {
		lines.push(`  • ${item.title}`);
		if (item.publishedAt) lines.push(`    ${item.publishedAt}`);
		lines.push(`    ${item.url}`);
		lines.push("");
	}

	return lines.join("\n");
}
