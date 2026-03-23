import { DateTime } from "luxon";
import pino from "pino";
import type { HistoricalPrice } from "../types/index.js";
import { NseScraper } from "./nse-scraper.js";
import { UpstoxApi } from "./upstox-api.js";
import yahooFinance from "./yahoo-finance.js";

const logger = pino({ name: "data-fetcher" });

/** Data source used for the fetch */
export type DataSource = "upstox" | "nse" | "yahoo";

/** Singleton instances */
const nseScraper = new NseScraper();
const upstoxApi = new UpstoxApi();

/**
 * Fetch historical prices with multi-source fallback chain:
 *   1. Upstox API (if configured with access token)
 *   2. NSE Direct Scraping (free, no API key needed)
 *   3. Yahoo Finance (fallback, always available)
 *
 * Returns data from the first source that succeeds.
 */
export async function getHistoricalPrices(
	symbol: string,
	days = 365,
): Promise<{ prices: HistoricalPrice[]; source: DataSource }> {
	const endDate = DateTime.now().setZone("Asia/Kolkata");
	const startDate = endDate.minus({ days });
	const fromStr = startDate.toFormat("dd-MM-yyyy");
	const toStr = endDate.toFormat("dd-MM-yyyy");
	const fromIso = startDate.toFormat("yyyy-MM-dd");
	const toIso = endDate.toFormat("yyyy-MM-dd");

	// Source 1: Upstox API
	if (upstoxApi.isConfigured()) {
		try {
			const prices = await upstoxApi.getHistoricalData(
				symbol,
				fromIso,
				toIso,
				"day",
			);
			if (prices.length > 0) {
				logger.info({ symbol, source: "upstox", bars: prices.length }, "Data fetched");
				return { prices, source: "upstox" };
			}
		} catch (error) {
			logger.warn({ symbol, error }, "Upstox failed, trying NSE");
		}
	}

	// Source 2: NSE Direct Scraping
	try {
		const prices = await nseScraper.getHistoricalData(symbol, fromStr, toStr);
		if (prices.length > 0) {
			logger.info({ symbol, source: "nse", bars: prices.length }, "Data fetched");
			return { prices, source: "nse" };
		}
	} catch (error) {
		logger.warn({ symbol, error }, "NSE scraping failed, trying Yahoo Finance");
	}

	// Source 3: Yahoo Finance (fallback)
	try {
		const result = await yahooFinance.historical(symbol, {
			period1: startDate.toJSDate(),
			period2: endDate.toJSDate(),
			interval: "1d",
			events: "history",
			includeAdjustedClose: true,
		});

		if (result && result.length > 0) {
			const prices: HistoricalPrice[] = result.map((row: any) => ({
				date: row.date,
				open: row.open,
				high: row.high,
				low: row.low,
				close: row.close,
				volume: row.volume,
				adjClose: row.adjClose,
			}));
			logger.info({ symbol, source: "yahoo", bars: prices.length }, "Data fetched");
			return { prices, source: "yahoo" };
		}
	} catch (error) {
		logger.error({ symbol, error }, "Yahoo Finance also failed");
	}

	logger.error({ symbol }, "All data sources failed");
	return { prices: [], source: "yahoo" };
}

/**
 * Fetch India VIX with multi-source fallback:
 *   1. NSE Direct (most reliable for VIX)
 *   2. Yahoo Finance (^INDIAVIX)
 *   3. Default neutral value (15)
 */
export async function getIndiaVix(): Promise<{ value: number; source: DataSource }> {
	// Source 1: NSE Direct
	try {
		const vix = await nseScraper.getIndiaVix();
		if (vix !== null) {
			logger.info({ vix, source: "nse" }, "India VIX fetched");
			return { value: vix, source: "nse" };
		}
	} catch (error) {
		logger.warn({ error }, "NSE VIX failed, trying Yahoo");
	}

	// Source 2: Yahoo Finance
	try {
		const result = await yahooFinance.quote("^INDIAVIX");
		if (result?.regularMarketPrice) {
			logger.info({ vix: result.regularMarketPrice, source: "yahoo" }, "India VIX fetched");
			return { value: result.regularMarketPrice, source: "yahoo" };
		}
	} catch (error) {
		logger.warn({ error }, "Yahoo VIX also failed");
	}

	// Fallback: neutral default
	logger.warn("All VIX sources failed, using neutral default (15)");
	return { value: 15, source: "yahoo" };
}

/**
 * Fetch Nifty 50 index price with multi-source fallback.
 */
export async function getNifty50Price(): Promise<{
	value: number | null;
	source: DataSource;
}> {
	// Source 1: NSE Direct
	try {
		const nifty = await nseScraper.getNifty50();
		if (nifty !== null) {
			return { value: nifty, source: "nse" };
		}
	} catch {
		// fall through
	}

	// Source 2: Yahoo Finance
	try {
		const result = await yahooFinance.quote("^NSEI");
		if (result?.regularMarketPrice) {
			return { value: result.regularMarketPrice, source: "yahoo" };
		}
	} catch {
		// fall through
	}

	return { value: null, source: "yahoo" };
}

/**
 * Get the NSE scraper instance (for direct use in options/corporate actions).
 */
export function getNseScraper(): NseScraper {
	return nseScraper;
}

/**
 * Get the Upstox API instance (for direct use in options).
 */
export function getUpstoxApi(): UpstoxApi {
	return upstoxApi;
}
