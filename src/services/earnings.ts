import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import type { EarningsActual, EarningsData, EarningsEstimate } from "../types/index.js";
import yahooFinance from "./yahoo-finance.js";

const logger = pino({ name: "earnings" });

/**
 * Fetch earnings data for an Indian stock.
 * Note: Indian companies report quarterly results but Yahoo Finance may have
 * limited earnings data for .NS/.BO tickers compared to US stocks.
 */
export async function getEarningsData(ticker: string): Promise<EarningsData> {
	try {
		const result = await yahooFinance.quoteSummary(ticker, {
			modules: ["earnings", "earningsHistory", "earningsTrend", "calendarEvents"],
		});

		const calendar = result.calendarEvents;
		const earningsDate = calendar?.earnings?.earningsDate?.[0];

		// Parse earnings history
		const earningsHistory: EarningsActual[] = [];
		const historyData = result.earningsHistory?.history;
		if (Array.isArray(historyData)) {
			for (const entry of historyData) {
				earningsHistory.push({
					reportDate: entry.quarter
						? new Date(entry.quarter).toISOString().split("T")[0]
						: "",
					epsActual: entry.epsActual ?? null,
					epsEstimate: entry.epsEstimate ?? null,
					epsDifference: entry.epsDifference ?? null,
					surprisePercent: entry.surprisePercent ?? null,
				});
			}
		}

		// Parse earnings trend
		const earningsTrend: EarningsEstimate[] = [];
		const trendData = result.earningsTrend?.trend;
		if (Array.isArray(trendData)) {
			for (const entry of trendData) {
				earningsTrend.push({
					avg: entry.earningsEstimate?.avg ?? null,
					low: entry.earningsEstimate?.low ?? null,
					high: entry.earningsEstimate?.high ?? null,
					yearAgoEps: entry.earningsEstimate?.yearAgoEps ?? null,
					numberOfAnalysts: entry.earningsEstimate?.numberOfAnalysts ?? null,
				});
			}
		}

		return {
			ticker,
			nextEarningsDate: earningsDate
				? new Date(earningsDate).toISOString().split("T")[0]
				: null,
			nextEarningsEstimate: earningsTrend.length > 0 ? earningsTrend[0] : null,
			earningsHistory,
			earningsTrend,
			currentQuarterEstimate: earningsTrend.length > 0 ? earningsTrend[0] : null,
			currentYearEstimate: earningsTrend.length > 1 ? earningsTrend[1] : null,
		};
	} catch (error) {
		logger.error({ ticker, error }, "Failed to fetch earnings data");
		return {
			ticker,
			nextEarningsDate: null,
			nextEarningsEstimate: null,
			earningsHistory: [],
			earningsTrend: [],
			currentQuarterEstimate: null,
			currentYearEstimate: null,
		};
	}
}

/**
 * Format earnings data for display (using Indian Rupee).
 */
export function formatEarningsData(data: EarningsData): string {
	const lines: string[] = [];
	lines.push(`\n📈 Earnings Data for ${data.ticker}`);
	lines.push("─".repeat(40));

	if (data.nextEarningsDate) {
		lines.push(`  Next Earnings Date: ${data.nextEarningsDate}`);
	}

	if (data.earningsHistory.length > 0) {
		lines.push("\n  Recent Earnings History:");
		for (const entry of data.earningsHistory.slice(0, 4)) {
			const surprise = entry.surprisePercent !== null
				? ` (${entry.surprisePercent > 0 ? "+" : ""}${(entry.surprisePercent * 100).toFixed(1)}%)`
				: "";
			lines.push(
				`    ${entry.reportDate}: EPS ${CURRENCY_SYMBOL}${entry.epsActual?.toFixed(2) ?? "N/A"} vs Est ${CURRENCY_SYMBOL}${entry.epsEstimate?.toFixed(2) ?? "N/A"}${surprise}`,
			);
		}
	}

	if (data.currentQuarterEstimate?.avg !== null && data.currentQuarterEstimate) {
		lines.push(`\n  Current Quarter Estimate: ${CURRENCY_SYMBOL}${data.currentQuarterEstimate.avg?.toFixed(2)}`);
		if (data.currentQuarterEstimate.numberOfAnalysts) {
			lines.push(`  Analysts: ${data.currentQuarterEstimate.numberOfAnalysts}`);
		}
	}

	return lines.join("\n");
}
