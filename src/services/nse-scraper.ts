import axios, { type AxiosInstance } from "axios";
import pino from "pino";
import type { HistoricalPrice } from "../types/index.js";

const logger = pino({ name: "nse-scraper" });

/**
 * NSE India direct scraper.
 *
 * NSE website (nseindia.com) requires:
 * 1. First hit the homepage to get cookies (bm_sv, nsit, nseappid)
 * 2. Use those cookies in subsequent API calls
 * 3. Set proper headers (User-Agent, Referer, Accept)
 *
 * Endpoints:
 * - /api/quote-equity?symbol=RELIANCE          → live quote + fundamentals
 * - /api/historical/cm/equity?symbol=RELIANCE   → historical OHLCV
 * - /api/option-chain-equities?symbol=RELIANCE  → options chain
 * - /api/corporateActions?index=equities&symbol=RELIANCE → dividends/splits
 * - /api/allIndices                             → India VIX + Nifty 50
 */
export class NseScraper {
	private client: AxiosInstance;
	private cookies: string = "";
	private cookieExpiry: number = 0;
	private readonly baseUrl = "https://www.nseindia.com";

	constructor() {
		this.client = axios.create({
			baseURL: this.baseUrl,
			timeout: 15000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				"Accept-Language": "en-US,en;q=0.9",
				"Accept-Encoding": "gzip, deflate, br",
				Connection: "keep-alive",
			},
		});
	}

	/**
	 * Refresh session cookies by hitting the NSE homepage.
	 * Cookies are valid for ~5 minutes.
	 */
	private async refreshCookies(): Promise<void> {
		if (Date.now() < this.cookieExpiry) return;

		try {
			const response = await this.client.get("/", {
				headers: {
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
			});

			const setCookieHeaders = response.headers["set-cookie"];
			if (setCookieHeaders) {
				this.cookies = setCookieHeaders
					.map((c: string) => c.split(";")[0])
					.join("; ");
				// Cookies expire in ~5 minutes
				this.cookieExpiry = Date.now() + 4 * 60 * 1000;
				logger.debug("NSE cookies refreshed");
			}
		} catch (error) {
			logger.error({ error }, "Failed to refresh NSE cookies");
			throw new Error("Failed to establish NSE session");
		}
	}

	/**
	 * Make an authenticated API request to NSE.
	 */
	private async apiRequest<T>(path: string): Promise<T> {
		await this.refreshCookies();

		const response = await this.client.get(path, {
			headers: {
				Cookie: this.cookies,
				Referer: `${this.baseUrl}/get-quotes/equity?symbol=RELIANCE`,
			},
		});

		return response.data;
	}

	/**
	 * Get live quote for a stock.
	 * Symbol should be without exchange suffix (e.g., "RELIANCE" not "RELIANCE.NS").
	 */
	async getQuote(symbol: string): Promise<NseQuoteResponse | null> {
		try {
			const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");
			const data = await this.apiRequest<NseQuoteResponse>(
				`/api/quote-equity?symbol=${encodeURIComponent(cleanSymbol)}`,
			);
			logger.info({ symbol: cleanSymbol }, "NSE quote fetched");
			return data;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch NSE quote");
			return null;
		}
	}

	/**
	 * Get historical OHLCV data from NSE.
	 * NSE provides up to 2 years of historical data.
	 */
	async getHistoricalData(
		symbol: string,
		fromDate: string,
		toDate: string,
	): Promise<HistoricalPrice[]> {
		try {
			const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");

			const data = await this.apiRequest<NseHistoricalResponse>(
				`/api/historical/cm/equity?symbol=${encodeURIComponent(cleanSymbol)}&from=${fromDate}&to=${toDate}`,
			);

			if (!data?.data || data.data.length === 0) {
				logger.warn({ symbol: cleanSymbol }, "No NSE historical data");
				return [];
			}

			const prices: HistoricalPrice[] = data.data.map((row) => ({
				date: new Date(row.CH_TIMESTAMP),
				open: row.CH_OPENING_PRICE,
				high: row.CH_TRADE_HIGH_PRICE,
				low: row.CH_TRADE_LOW_PRICE,
				close: row.CH_CLOSING_PRICE,
				volume: row.CH_TOT_TRADED_QTY,
				adjClose: row.CH_CLOSING_PRICE,
			}));

			// NSE returns newest first, reverse to oldest first
			prices.reverse();

			logger.info(
				{ symbol: cleanSymbol, bars: prices.length },
				"NSE historical data fetched",
			);
			return prices;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch NSE historical data");
			return [];
		}
	}

	/**
	 * Get India VIX directly from NSE.
	 */
	async getIndiaVix(): Promise<number | null> {
		try {
			const data = await this.apiRequest<NseIndicesResponse>("/api/allIndices");

			const vixIndex = data?.data?.find(
				(idx) => idx.indexSymbol === "INDIA VIX" || idx.index === "INDIA VIX",
			);

			if (vixIndex) {
				logger.info({ vix: vixIndex.last }, "India VIX from NSE");
				return vixIndex.last;
			}

			return null;
		} catch (error) {
			logger.warn({ error }, "Failed to fetch India VIX from NSE");
			return null;
		}
	}

	/**
	 * Get Nifty 50 value from NSE.
	 */
	async getNifty50(): Promise<number | null> {
		try {
			const data = await this.apiRequest<NseIndicesResponse>("/api/allIndices");

			const nifty = data?.data?.find(
				(idx) =>
					idx.indexSymbol === "NIFTY 50" || idx.index === "NIFTY 50",
			);

			return nifty?.last ?? null;
		} catch (error) {
			logger.warn({ error }, "Failed to fetch Nifty 50 from NSE");
			return null;
		}
	}

	/**
	 * Get options chain from NSE (much better than Yahoo Finance for Indian options).
	 */
	async getOptionsChain(symbol: string): Promise<NseOptionsResponse | null> {
		try {
			const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");
			const data = await this.apiRequest<NseOptionsResponse>(
				`/api/option-chain-equities?symbol=${encodeURIComponent(cleanSymbol)}`,
			);
			logger.info({ symbol: cleanSymbol }, "NSE options chain fetched");
			return data;
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch NSE options chain");
			return null;
		}
	}

	/**
	 * Get corporate actions (dividends, bonuses, splits) from NSE.
	 */
	async getCorporateActions(symbol: string): Promise<NseCorporateAction[]> {
		try {
			const cleanSymbol = symbol.replace(/\.(NS|BO)$/, "");
			const data = await this.apiRequest<NseCorporateAction[]>(
				`/api/corporateActions?index=equities&symbol=${encodeURIComponent(cleanSymbol)}`,
			);
			return data || [];
		} catch (error) {
			logger.warn({ symbol, error }, "Failed to fetch corporate actions");
			return [];
		}
	}
}

// NSE response types

export interface NseQuoteResponse {
	info: {
		symbol: string;
		companyName: string;
		industry: string;
		isin: string;
	};
	priceInfo: {
		lastPrice: number;
		change: number;
		pChange: number;
		open: number;
		close: number;
		previousClose: number;
		intraDayHighLow: { min: number; max: number; value: number };
		weekHighLow: { min: number; max: number; minDate: string; maxDate: string };
	};
	securityInfo: {
		boardStatus: string;
		tradingStatus: string;
		faceValue: number;
	};
}

export interface NseHistoricalResponse {
	data: Array<{
		CH_SYMBOL: string;
		CH_TIMESTAMP: string;
		CH_OPENING_PRICE: number;
		CH_TRADE_HIGH_PRICE: number;
		CH_TRADE_LOW_PRICE: number;
		CH_CLOSING_PRICE: number;
		CH_LAST_TRADED_PRICE: number;
		CH_PREVIOUS_CLS_PRICE: number;
		CH_TOT_TRADED_QTY: number;
		CH_TOT_TRADED_VAL: number;
		CH_52WEEK_HIGH_PRICE: number;
		CH_52WEEK_LOW_PRICE: number;
	}>;
}

export interface NseIndicesResponse {
	data: Array<{
		index: string;
		indexSymbol: string;
		last: number;
		variation: number;
		percentChange: number;
		open: number;
		high: number;
		low: number;
		previousClose: number;
	}>;
}

export interface NseOptionsResponse {
	records: {
		expiryDates: string[];
		strikePrices: number[];
		data: Array<{
			strikePrice: number;
			expiryDate: string;
			CE?: NseOptionContractData;
			PE?: NseOptionContractData;
		}>;
	};
	filtered: {
		data: Array<{
			strikePrice: number;
			expiryDate: string;
			CE?: NseOptionContractData;
			PE?: NseOptionContractData;
		}>;
		CE: { totOI: number; totVol: number };
		PE: { totOI: number; totVol: number };
	};
}

export interface NseOptionContractData {
	strikePrice: number;
	expiryDate: string;
	underlying: string;
	identifier: string;
	openInterest: number;
	changeinOpenInterest: number;
	pchangeinOpenInterest: number;
	totalTradedVolume: number;
	impliedVolatility: number;
	lastPrice: number;
	change: number;
	pChange: number;
	totalBuyQuantity: number;
	totalSellQuantity: number;
	bidQty: number;
	bidprice: number;
	askQty: number;
	askPrice: number;
	underlyingValue: number;
}

export interface NseCorporateAction {
	symbol: string;
	subject: string;
	exDate: string;
	recordDate: string;
	bcStartDate: string;
	bcEndDate: string;
}
