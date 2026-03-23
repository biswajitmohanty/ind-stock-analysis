import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import type { OptionsChainData } from "../types/index.js";
import { getNseScraper, getUpstoxApi } from "./data-fetcher.js";
import yahooFinance from "./yahoo-finance.js";

const logger = pino({ name: "options" });

/**
 * Fetch options chain with multi-source fallback:
 *   1. NSE Direct (best for Indian F&O data)
 *   2. Upstox API (if configured)
 *   3. Yahoo Finance (limited for Indian stocks)
 */
export async function getOptionsChain(
	ticker: string,
	expirationDate?: Date,
): Promise<OptionsChainData | null> {
	// Source 1: NSE Direct Scraping (best for Indian options)
	try {
		const nseScraper = getNseScraper();
		const nseData = await nseScraper.getOptionsChain(ticker);

		if (nseData?.records?.data && nseData.records.data.length > 0) {
			logger.info({ ticker, source: "nse" }, "Options chain fetched");
			return convertNseOptions(ticker, nseData);
		}
	} catch (error) {
		logger.warn({ ticker, error }, "NSE options failed");
	}

	// Source 2: Upstox API
	try {
		const upstox = getUpstoxApi();
		if (upstox.isConfigured()) {
			const upstoxData = await upstox.getOptionsChain(ticker);

			if (upstoxData?.data && upstoxData.data.length > 0) {
				logger.info({ ticker, source: "upstox" }, "Options chain fetched");
				return convertUpstoxOptions(ticker, upstoxData);
			}
		}
	} catch (error) {
		logger.warn({ ticker, error }, "Upstox options failed");
	}

	// Source 3: Yahoo Finance (fallback)
	try {
		const options: any = {
			formatted: false,
			lang: "en-IN",
			region: "IN",
		};
		if (expirationDate) {
			options.date = expirationDate;
		}

		const result = await yahooFinance.options(ticker, options);

		if (result?.options && result.options.length > 0) {
			const chain = result.options[0];
			logger.info({ ticker, source: "yahoo" }, "Options chain fetched");

			return {
				ticker,
				expirationDates: (result.expirationDates || []).map((d: any) =>
					new Date(d).toISOString().split("T")[0],
				),
				strikes: result.strikes || [],
				options: {
					calls: (chain.calls || []).map(mapYahooOption),
					puts: (chain.puts || []).map(mapYahooOption),
				},
				underlyingPrice: result.quote?.regularMarketPrice || 0,
				currency: "INR",
			};
		}
	} catch (error) {
		logger.warn({ ticker, error }, "Yahoo options also failed");
	}

	logger.warn({ ticker }, "No options data from any source");
	return null;
}

function mapYahooOption(c: any) {
	return {
		contractSymbol: c.contractSymbol || "",
		strike: c.strike || 0,
		lastPrice: c.lastPrice || 0,
		volume: c.volume || 0,
		openInterest: c.openInterest || 0,
		bid: c.bid || 0,
		ask: c.ask || 0,
		impliedVolatility: c.impliedVolatility || 0,
		inTheMoney: c.inTheMoney || false,
	};
}

function convertNseOptions(ticker: string, nseData: any): OptionsChainData {
	const calls = [];
	const puts = [];
	let underlyingPrice = 0;

	for (const row of nseData.records.data) {
		if (row.CE) {
			underlyingPrice = row.CE.underlyingValue || underlyingPrice;
			calls.push({
				contractSymbol: row.CE.identifier || "",
				strike: row.strikePrice,
				lastPrice: row.CE.lastPrice,
				volume: row.CE.totalTradedVolume,
				openInterest: row.CE.openInterest,
				bid: row.CE.bidprice || 0,
				ask: row.CE.askPrice || 0,
				impliedVolatility: (row.CE.impliedVolatility || 0) / 100,
				inTheMoney: row.CE.underlyingValue > row.strikePrice,
			});
		}
		if (row.PE) {
			underlyingPrice = row.PE.underlyingValue || underlyingPrice;
			puts.push({
				contractSymbol: row.PE.identifier || "",
				strike: row.strikePrice,
				lastPrice: row.PE.lastPrice,
				volume: row.PE.totalTradedVolume,
				openInterest: row.PE.openInterest,
				bid: row.PE.bidprice || 0,
				ask: row.PE.askPrice || 0,
				impliedVolatility: (row.PE.impliedVolatility || 0) / 100,
				inTheMoney: row.PE.underlyingValue < row.strikePrice,
			});
		}
	}

	return {
		ticker,
		expirationDates: nseData.records.expiryDates || [],
		strikes: nseData.records.strikePrices || [],
		options: { calls, puts },
		underlyingPrice,
		currency: "INR",
	};
}

function convertUpstoxOptions(ticker: string, data: any): OptionsChainData {
	const calls = [];
	const puts = [];
	let underlyingPrice = 0;

	for (const row of data.data) {
		underlyingPrice = row.underlying_spot_price || underlyingPrice;

		if (row.call_options?.market_data) {
			const md = row.call_options.market_data;
			const greeks = row.call_options.option_greeks;
			calls.push({
				contractSymbol: row.call_options.instrument_key || "",
				strike: row.strike_price,
				lastPrice: md.ltp,
				volume: md.volume,
				openInterest: md.oi,
				bid: md.bid_price,
				ask: md.ask_price,
				impliedVolatility: (greeks?.iv || 0) / 100,
				inTheMoney: underlyingPrice > row.strike_price,
			});
		}

		if (row.put_options?.market_data) {
			const md = row.put_options.market_data;
			const greeks = row.put_options.option_greeks;
			puts.push({
				contractSymbol: row.put_options.instrument_key || "",
				strike: row.strike_price,
				lastPrice: md.ltp,
				volume: md.volume,
				openInterest: md.oi,
				bid: md.bid_price,
				ask: md.ask_price,
				impliedVolatility: (greeks?.iv || 0) / 100,
				inTheMoney: underlyingPrice < row.strike_price,
			});
		}
	}

	return {
		ticker,
		expirationDates: data.expiry_dates || [],
		strikes: ([...new Set(data.data.map((r: any) => r.strike_price))] as number[]).sort(
			(a, b) => a - b,
		),
		options: { calls, puts },
		underlyingPrice,
		currency: "INR",
	};
}

/**
 * Format options chain for display (using Indian Rupee).
 */
export function formatOptionsChain(data: OptionsChainData): string {
	const lines: string[] = [];
	lines.push(`\n📋 Options Chain for ${data.ticker}`);
	lines.push("─".repeat(60));
	lines.push(`  Underlying Price: ${CURRENCY_SYMBOL}${data.underlyingPrice.toFixed(2)}`);
	lines.push(`  Expiration Dates: ${data.expirationDates.slice(0, 5).join(", ")}`);

	if (data.options.calls.length > 0) {
		lines.push("\n  Top 5 Calls (by volume):");
		const topCalls = [...data.options.calls]
			.sort((a, b) => b.volume - a.volume)
			.slice(0, 5);
		for (const call of topCalls) {
			lines.push(
				`    Strike: ${CURRENCY_SYMBOL}${call.strike} | Last: ${CURRENCY_SYMBOL}${call.lastPrice} | Vol: ${call.volume} | OI: ${call.openInterest} | IV: ${(call.impliedVolatility * 100).toFixed(1)}%`,
			);
		}
	}

	if (data.options.puts.length > 0) {
		lines.push("\n  Top 5 Puts (by volume):");
		const topPuts = [...data.options.puts]
			.sort((a, b) => b.volume - a.volume)
			.slice(0, 5);
		for (const put of topPuts) {
			lines.push(
				`    Strike: ${CURRENCY_SYMBOL}${put.strike} | Last: ${CURRENCY_SYMBOL}${put.lastPrice} | Vol: ${put.volume} | OI: ${put.openInterest} | IV: ${(put.impliedVolatility * 100).toFixed(1)}%`,
			);
		}
	}

	return lines.join("\n");
}
