import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import type { FundamentalData } from "../types/index.js";
import yahooFinance from "./yahoo-finance.js";

const logger = pino({ name: "fundamentals" });

/**
 * Fetch fundamental data for an Indian stock.
 * Works with NSE (.NS) and BSE (.BO) tickers.
 */
export async function getFundamentals(ticker: string): Promise<FundamentalData> {
	try {
		const result = await yahooFinance.quoteSummary(ticker, {
			modules: ["summaryDetail", "price", "calendarEvents", "defaultKeyStatistics", "financialData"],
		});

		const summary = result.summaryDetail;
		const price = result.price;
		const keyStats = result.defaultKeyStatistics;
		const financialData = result.financialData;
		const calendar = result.calendarEvents;

		const earningsDate = calendar?.earnings?.earningsDate?.[0];

		return {
			ticker,
			pe: summary?.trailingPE ?? null,
			dividendYield: summary?.trailingAnnualDividendYield ?? null,
			nextEarningsDate: earningsDate ? new Date(earningsDate).toISOString().split("T")[0] : null,
			marketCap: price?.marketCap ?? null,
			bookValue: keyStats?.bookValue ?? null,
			priceToBook: keyStats?.priceToBook ?? null,
			debtToEquity: financialData?.debtToEquity ?? null,
			roe: financialData?.returnOnEquity ?? null,
		};
	} catch (error) {
		logger.error({ ticker, error }, "Failed to fetch fundamentals");
		return {
			ticker,
			pe: null,
			dividendYield: null,
			nextEarningsDate: null,
			marketCap: null,
			bookValue: null,
			priceToBook: null,
			debtToEquity: null,
			roe: null,
		};
	}
}

/**
 * Format fundamental data for display (using Indian Rupee).
 */
export function formatFundamentals(data: FundamentalData): string {
	const lines: string[] = [];
	lines.push(`\n📊 Fundamentals for ${data.ticker}`);
	lines.push("─".repeat(40));

	if (data.pe !== null) lines.push(`  P/E Ratio: ${data.pe.toFixed(2)}`);
	if (data.dividendYield !== null)
		lines.push(`  Dividend Yield: ${(data.dividendYield * 100).toFixed(2)}%`);
	if (data.marketCap !== null)
		lines.push(`  Market Cap: ${CURRENCY_SYMBOL}${formatMarketCap(data.marketCap)}`);
	if (data.bookValue !== null)
		lines.push(`  Book Value: ${CURRENCY_SYMBOL}${data.bookValue.toFixed(2)}`);
	if (data.priceToBook !== null)
		lines.push(`  Price/Book: ${data.priceToBook.toFixed(2)}`);
	if (data.debtToEquity !== null)
		lines.push(`  Debt/Equity: ${data.debtToEquity.toFixed(2)}`);
	if (data.roe !== null)
		lines.push(`  ROE: ${(data.roe * 100).toFixed(2)}%`);
	if (data.nextEarningsDate)
		lines.push(`  Next Earnings: ${data.nextEarningsDate}`);

	return lines.join("\n");
}

/**
 * Format market cap in Indian notation (Cr = Crore, L Cr = Lakh Crore).
 */
function formatMarketCap(value: number): string {
	const crore = value / 1e7;
	if (crore >= 1e5) {
		return `${(crore / 1e5).toFixed(2)} L Cr`;
	}
	if (crore >= 1) {
		return `${crore.toFixed(2)} Cr`;
	}
	return value.toLocaleString("en-IN");
}
