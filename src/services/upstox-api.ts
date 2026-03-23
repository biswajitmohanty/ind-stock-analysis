import axios, { type AxiosInstance } from "axios";
import pino from "pino";
import type { HistoricalPrice } from "../types/index.js";

const logger = pino({ name: "upstox-api" });

/**
 * Upstox API client for Indian stock market data.
 *
 * Requires:
 * - UPSTOX_API_KEY: API key from Upstox developer portal
 * - UPSTOX_ACCESS_TOKEN: OAuth2 access token (obtained via login flow)
 *
 * API docs: https://upstox.com/developer/api-documentation/
 *
 * Endpoints used:
 * - GET /v2/market-quote/quotes       → live quotes
 * - GET /v2/historical-candle/:instrumentKey/:interval/:toDate/:fromDate → historical OHLCV
 * - GET /v2/option/chain              → options chain
 * - GET /v2/market-quote/ohlc         → OHLC data
 *
 * Instrument key format for NSE equity: NSE_EQ|INE002A01018 (ISIN-based)
 * Simplified format: NSE_EQ|RELIANCE
 */
export class UpstoxApi {
	private client: AxiosInstance;
	private readonly baseUrl = "https://api.upstox.com";
	private accessToken: string;

	constructor(accessToken?: string) {
		this.accessToken = accessToken || process.env.UPSTOX_ACCESS_TOKEN || "";

		this.client = axios.create({
			baseURL: this.baseUrl,
			timeout: 15000,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		// Retry interceptor
		this.client.interceptors.response.use(undefined, async (error) => {
			const config = error.config;
			if (!config || (config._retryCount ?? 0) >= 2) return Promise.reject(error);
			if (error.response?.status === 429) {
				// Rate limited — wait and retry
				config._retryCount = (config._retryCount ?? 0) + 1;
				await new Promise((r) => setTimeout(r, 2000 * config._retryCount));
				return this.client(config);
			}
			return Promise.reject(error);
		});
	}

	/**
	 * Check if the Upstox API is configured and available.
	 */
	isConfigured(): boolean {
		return this.accessToken.length > 0;
	}

	/**
	 * Get auth headers.
	 */
	private getHeaders() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
		};
	}

	/**
	 * Convert ticker symbol to Upstox instrument key.
	 * RELIANCE.NS → NSE_EQ|RELIANCE
	 * RELIANCE.BO → BSE_EQ|RELIANCE
	 */
	private toInstrumentKey(symbol: string): string {
		const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");
		const exchange = symbol.endsWith(".BO") ? "BSE_EQ" : "NSE_EQ";
		return `${exchange}|${cleanSymbol}`;
	}

	/**
	 * Get live market quote.
	 */
	async getQuote(symbol: string): Promise<UpstoxQuote | null> {
		if (!this.isConfigured()) return null;

		try {
			const instrumentKey = this.toInstrumentKey(symbol);
			const response = await this.client.get("/v2/market-quote/quotes", {
				params: { instrument_key: instrumentKey },
				headers: this.getHeaders(),
			});

			const data = response.data?.data;
			if (!data) return null;

			// Response keyed by instrument key
			const quoteData = data[instrumentKey];
			if (!quoteData) return null;

			logger.info({ symbol }, "Upstox quote fetched");
			return quoteData;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch Upstox quote");
			return null;
		}
	}

	/**
	 * Get historical candle data (OHLCV).
	 *
	 * Intervals: 1minute, 30minute, day, week, month
	 * Date format: YYYY-MM-DD
	 */
	async getHistoricalData(
		symbol: string,
		fromDate: string,
		toDate: string,
		interval: "1minute" | "30minute" | "day" | "week" | "month" = "day",
	): Promise<HistoricalPrice[]> {
		if (!this.isConfigured()) return [];

		try {
			const instrumentKey = encodeURIComponent(this.toInstrumentKey(symbol));
			const response = await this.client.get(
				`/v2/historical-candle/${instrumentKey}/${interval}/${toDate}/${fromDate}`,
				{ headers: this.getHeaders() },
			);

			const candles = response.data?.data?.candles;
			if (!candles || candles.length === 0) {
				logger.warn({ symbol }, "No Upstox historical data");
				return [];
			}

			// Candle format: [timestamp, open, high, low, close, volume, oi]
			const prices: HistoricalPrice[] = candles.map((candle: any[]) => ({
				date: new Date(candle[0]),
				open: candle[1],
				high: candle[2],
				low: candle[3],
				close: candle[4],
				volume: candle[5],
				adjClose: candle[4],
			}));

			// Upstox returns newest first, reverse to oldest first
			prices.reverse();

			logger.info(
				{ symbol, bars: prices.length },
				"Upstox historical data fetched",
			);
			return prices;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch Upstox historical data");
			return [];
		}
	}

	/**
	 * Get options chain from Upstox.
	 */
	async getOptionsChain(
		symbol: string,
		expiryDate?: string,
	): Promise<UpstoxOptionsChain | null> {
		if (!this.isConfigured()) return null;

		try {
			const instrumentKey = this.toInstrumentKey(symbol);
			const params: any = { instrument_key: instrumentKey };
			if (expiryDate) params.expiry_date = expiryDate;

			const response = await this.client.get("/v2/option/chain", {
				params,
				headers: this.getHeaders(),
			});

			logger.info({ symbol }, "Upstox options chain fetched");
			return response.data?.data || null;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch Upstox options chain");
			return null;
		}
	}

	/**
	 * Get market OHLC for intraday data.
	 */
	async getOhlc(
		symbol: string,
		interval: "1d" | "I1" | "I30" = "1d",
	): Promise<UpstoxOhlc | null> {
		if (!this.isConfigured()) return null;

		try {
			const instrumentKey = this.toInstrumentKey(symbol);
			const response = await this.client.get("/v2/market-quote/ohlc", {
				params: { instrument_key: instrumentKey, interval },
				headers: this.getHeaders(),
			});

			const data = response.data?.data;
			return data?.[instrumentKey] || null;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch Upstox OHLC");
			return null;
		}
	}
}

// Upstox response types

export interface UpstoxQuote {
	ohlc: {
		open: number;
		high: number;
		low: number;
		close: number;
	};
	depth: {
		buy: Array<{ quantity: number; price: number; orders: number }>;
		sell: Array<{ quantity: number; price: number; orders: number }>;
	};
	timestamp: string;
	instrument_token: string;
	symbol: string;
	last_price: number;
	volume: number;
	average_price: number;
	oi: number;
	net_change: number;
	total_buy_quantity: number;
	total_sell_quantity: number;
	lower_circuit_limit: number;
	upper_circuit_limit: number;
}

export interface UpstoxOptionsChain {
	expiry_dates: string[];
	data: Array<{
		expiry: string;
		pcr: number;
		strike_price: number;
		underlying_key: string;
		underlying_spot_price: number;
		call_options: UpstoxOptionLeg;
		put_options: UpstoxOptionLeg;
	}>;
}

export interface UpstoxOptionLeg {
	instrument_key: string;
	market_data: {
		ltp: number;
		volume: number;
		oi: number;
		close_price: number;
		bid_price: number;
		bid_qty: number;
		ask_price: number;
		ask_qty: number;
		prev_oi: number;
	};
	option_greeks: {
		vega: number;
		theta: number;
		gamma: number;
		delta: number;
		iv: number;
	};
}

export interface UpstoxOhlc {
	ohlc: {
		open: number;
		high: number;
		low: number;
		close: number;
	};
	last_price: number;
	instrument_token: string;
}
