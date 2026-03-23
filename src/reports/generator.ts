import { CURRENCY_SYMBOL } from "../constants.js";
import type { TickerResult } from "../types/index.js";

/**
 * Generate a markdown report for a single ticker result.
 */
export function generateMarkdownReport(
	ticker: string,
	result: TickerResult,
): string {
	const sections: string[] = [];

	// Overview
	sections.push(`## ${ticker} Analysis Report`);
	sections.push(`**Date:** ${result.date}`);
	sections.push(`**Opinion:** ${getOpinionEmoji(result.opinion)} ${result.opinion}`);
	sections.push(`**Score:** ${result.score}`);
	sections.push("");

	// Probabilities
	if (result.buyProbability !== undefined) {
		sections.push("### Probability Distribution");
		sections.push(`- Buy: ${result.buyProbability}%`);
		sections.push(`- Sell: ${result.sellProbability}%`);
		sections.push(`- Hold: ${result.holdProbability}%`);
		sections.push(`- Confidence: ${result.confidence}`);
		sections.push("");
	}

	// Price Action
	sections.push("### Price Action");
	sections.push(`- Close: ${CURRENCY_SYMBOL}${result.close.toFixed(2)}`);
	sections.push(`- Volume: ${result.volume.toLocaleString("en-IN")}`);
	sections.push("");

	// Technical Indicators
	sections.push("### Technical Indicators");
	sections.push("| Indicator | Value |");
	sections.push("|-----------|-------|");
	sections.push(`| RSI | ${result.rsi.toFixed(2)} |`);
	sections.push(`| Stochastic %K | ${result.stochasticK.toFixed(2)} |`);
	sections.push(`| Bollinger Lower | ${CURRENCY_SYMBOL}${result.bbLower.toFixed(2)} |`);
	sections.push(`| Bollinger Upper | ${CURRENCY_SYMBOL}${result.bbUpper.toFixed(2)} |`);
	sections.push(`| Donchian Lower | ${CURRENCY_SYMBOL}${result.donchLower.toFixed(2)} |`);
	sections.push(`| Donchian Upper | ${CURRENCY_SYMBOL}${result.donchUpper.toFixed(2)} |`);
	sections.push(`| Williams %R | ${result.williamsR.toFixed(2)} |`);
	sections.push(`| ATR | ${CURRENCY_SYMBOL}${result.atr.toFixed(2)} |`);
	sections.push(`| MACD | ${result.macd.toFixed(4)} |`);
	sections.push(`| MACD Signal | ${result.macdSignal.toFixed(4)} |`);
	sections.push(`| MACD Histogram | ${result.macdHistogram.toFixed(4)} |`);
	sections.push(`| SMA 20 | ${CURRENCY_SYMBOL}${result.sma20.toFixed(2)} |`);
	sections.push(`| EMA 20 | ${CURRENCY_SYMBOL}${result.ema20.toFixed(2)} |`);
	sections.push("");

	// Risk Management
	sections.push("### Risk Management");
	sections.push("| Level | Price |");
	sections.push("|-------|-------|");
	sections.push(`| Stop Loss | ${CURRENCY_SYMBOL}${result.stopLoss.toFixed(2)} |`);
	sections.push(`| Take Profit | ${CURRENCY_SYMBOL}${result.takeProfit.toFixed(2)} |`);
	sections.push(`| Trailing Stop | ${CURRENCY_SYMBOL}${result.trailingStop.toFixed(2)} |`);
	sections.push(`| Trailing Start | ${CURRENCY_SYMBOL}${result.trailingStart.toFixed(2)} |`);
	sections.push("");

	// Patterns
	if (result.patterns) {
		sections.push("### Detected Patterns");
		for (const p of result.patterns.split(", ")) {
			sections.push(`- ${p}`);
		}
		sections.push("");
	}

	// Market Sentiment (based on India VIX)
	sections.push("### Market Sentiment (India VIX)");
	sections.push(`- India VIX: ${result.indiaVix.toFixed(2)}`);
	if (result.indiaVix > 20) {
		sections.push("- Sentiment: **High Volatility / Fearful** (Contrarian Bullish)");
	} else if (result.indiaVix < 13) {
		sections.push("- Sentiment: **Low Volatility / Complacent** (Contrarian Bearish)");
	} else {
		sections.push("- Sentiment: **Normal Range**");
	}
	sections.push("");

	return sections.join("\n");
}

/**
 * Generate a full markdown report combining multiple tickers.
 */
export function generateMarkdownReportFull(results: TickerResult[]): string {
	const header = `# Indian Stock Market Analysis Report\n\n**Generated:** ${new Date().toISOString().split("T")[0]}\n\n---\n\n`;

	const reports = results.map((r) => generateMarkdownReport(r.ticker, r));
	return header + reports.join("\n---\n\n");
}

function getOpinionEmoji(opinion: string): string {
	switch (opinion) {
		case "BUY":
			return "🟢";
		case "SELL":
			return "🔴";
		default:
			return "🟡";
	}
}
