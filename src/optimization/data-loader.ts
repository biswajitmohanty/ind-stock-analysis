import pino from "pino";
import { getHistoricalPrices } from "../services/data-fetcher.js";
import type { HistoricalPrice } from "../types/index.js";

const logger = pino({ name: "data-loader" });

/**
 * Load historical data for backtesting.
 * Uses the unified multi-source data fetcher (Upstox → NSE → Yahoo Finance).
 * Fetches 730 days (2 years) of data for comprehensive backtesting.
 */
export class DataLoader {
	async loadHistoricalData(
		symbol: string,
		days = 730,
	): Promise<HistoricalPrice[]> {
		const { prices, source } = await getHistoricalPrices(symbol, days);

		logger.info(
			{ symbol, bars: prices.length, source },
			"Historical data loaded for backtesting",
		);

		return prices;
	}
}
