import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import type { DividendRecord, DividendSummary } from "../types/index.js";
import yahooFinance from "./yahoo-finance.js";

const logger = pino({ name: "dividends" });

/**
 * Fetch dividend information for an Indian stock.
 * Indian dividends are expressed as absolute rupee amounts per share.
 */
export async function getDividendInfo(ticker: string): Promise<DividendSummary> {
	try {
		// Summary data
		const summary = await yahooFinance.quoteSummary(ticker, {
			modules: ["summaryDetail"],
		});

		const detail = summary.summaryDetail;

		// Historical dividends (last 3 years)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setFullYear(startDate.getFullYear() - 3);

		let dividendHistory: DividendRecord[] = [];
		try {
			const history = await yahooFinance.historical(ticker, {
				period1: startDate,
				period2: endDate,
				interval: "1d",
				events: "dividends",
			});

			if (Array.isArray(history)) {
				dividendHistory = history.map((entry: any) => ({
					date: new Date(entry.date).toISOString().split("T")[0],
					amount: entry.dividends ?? entry.amount ?? 0,
				}));
			}
		} catch {
			logger.warn({ ticker }, "No dividend history available");
		}

		return {
			ticker,
			dividendYield: detail?.trailingAnnualDividendYield ?? null,
			payoutRatio: detail?.payoutRatio ?? null,
			annualDividendRate: detail?.trailingAnnualDividendRate ?? null,
			trailingAnnualDividendYield: detail?.trailingAnnualDividendYield ?? null,
			lastDividendDate: dividendHistory.length > 0
				? dividendHistory[dividendHistory.length - 1].date
				: null,
			dividendHistory,
		};
	} catch (error) {
		logger.error({ ticker, error }, "Failed to fetch dividend info");
		return {
			ticker,
			dividendYield: null,
			payoutRatio: null,
			annualDividendRate: null,
			trailingAnnualDividendYield: null,
			lastDividendDate: null,
			dividendHistory: [],
		};
	}
}

/**
 * Format dividend data for display (using Indian Rupee).
 */
export function formatDividendInfo(data: DividendSummary): string {
	const lines: string[] = [];
	lines.push(`\n💰 Dividend Info for ${data.ticker}`);
	lines.push("─".repeat(40));

	if (data.dividendYield !== null)
		lines.push(`  Dividend Yield: ${(data.dividendYield * 100).toFixed(2)}%`);
	if (data.annualDividendRate !== null)
		lines.push(`  Annual Dividend Rate: ${CURRENCY_SYMBOL}${data.annualDividendRate.toFixed(2)}/share`);
	if (data.payoutRatio !== null)
		lines.push(`  Payout Ratio: ${(data.payoutRatio * 100).toFixed(2)}%`);
	if (data.lastDividendDate)
		lines.push(`  Last Dividend Date: ${data.lastDividendDate}`);

	if (data.dividendHistory.length > 0) {
		lines.push("\n  Recent Dividend History:");
		for (const entry of data.dividendHistory.slice(-5)) {
			lines.push(`    ${entry.date}: ${CURRENCY_SYMBOL}${entry.amount.toFixed(2)}/share`);
		}
	}

	return lines.join("\n");
}
