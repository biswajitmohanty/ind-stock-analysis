import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { DateTime } from "luxon";
import { orderBy } from "es-toolkit";
import pino from "pino";
import {
	CURRENCY_SYMBOL,
	REWARD_MULTIPLIER,
	RISK_MULTIPLIER,
	TRAILING_ACTIVATION_MULTIPLIER,
	TRAILING_MULTIPLIER,
} from "../constants.js";
import { getOpinion } from "../services/analysis.js";
import { type DataSource, getHistoricalPrices, getIndiaVix } from "../services/data-fetcher.js";
import { getDividendInfo, formatDividendInfo } from "../services/dividends.js";
import { getEarningsData, formatEarningsData } from "../services/earnings.js";
import { getFundamentals, formatFundamentals } from "../services/fundamentals.js";
import { calculateAllIndicators } from "../services/indicators.js";
import { getStockNews, formatNews } from "../services/news.js";
import { getOptionsChain, formatOptionsChain } from "../services/options.js";
import { detectPatterns } from "../services/patterns.js";
import { calculateProbabilities } from "../services/probability.js";
import type {
	CliOptions,
	PredictionRecord,
	TickerResult,
} from "../types/index.js";
import { loadOptimizedConfig } from "../utils/config-loader.js";
import { writeToCsv } from "../utils/csv-writer.js";
import { exportToJson } from "../utils/json-exporter.js";
import { sendSlackNotification } from "../utils/slack.js";

const logger = pino({ name: "predict" });

/**
 * Process a single ticker: fetch data, compute indicators, generate opinion.
 */
async function processTicker(
	ticker: string,
	indiaVix: number,
	config: ReturnType<typeof loadOptimizedConfig>,
): Promise<{ result: TickerResult; source: DataSource } | null> {
	try {
		const { prices, source } = await getHistoricalPrices(ticker, 365);

		if (prices.length < 50) {
			logger.warn({ ticker, bars: prices.length }, "Insufficient data");
			return null;
		}

		const closes = prices.map((p) => p.close);
		const highs = prices.map((p) => p.high);
		const lows = prices.map((p) => p.low);
		const latestPrice = prices[prices.length - 1];
		const close = latestPrice.close;
		const volume = latestPrice.volume;

		// Calculate indicators
		const indicators = calculateAllIndicators(closes, highs, lows);

		// Detect patterns
		const patternResult = detectPatterns(
			highs,
			lows,
			closes,
			config.patternWeights,
		);

		// Get opinion
		const { opinion, buyScore, sellScore } = getOpinion({
			rsi: indicators.rsi,
			stochasticK: indicators.stochasticK,
			close,
			bbLower: indicators.bbLower,
			bbUpper: indicators.bbUpper,
			donchLower: indicators.donchLower,
			donchUpper: indicators.donchUpper,
			williamsR: indicators.williamsR,
			indiaVix,
			patternScore: patternResult.score,
			macdHistogram: indicators.macdHistogram,
			sma20: indicators.sma20,
			ema20: indicators.ema20,
			weights: config.indicatorWeights,
			buyThreshold: config.thresholds.buy,
			sellThreshold: config.thresholds.sell,
		});

		// Calculate probabilities
		const probabilities = calculateProbabilities(
			buyScore,
			sellScore,
			config.calibration,
		);

		// Calculate risk management levels
		const risk = indicators.atr * RISK_MULTIPLIER;
		const reward = risk * REWARD_MULTIPLIER;
		const direction = opinion === "BUY" ? 1 : opinion === "SELL" ? -1 : 0;

		const stopLoss = direction !== 0 ? close - direction * risk : close;
		const takeProfit = direction !== 0 ? close + direction * reward : close;
		const trailingStart =
			direction !== 0
				? close + direction * indicators.atr * TRAILING_ACTIVATION_MULTIPLIER
				: close;
		const trailingStop =
			direction !== 0
				? Math.min(stopLoss, close - direction * indicators.atr * TRAILING_MULTIPLIER)
				: close;

		const score = Math.max(buyScore, sellScore);
		const dateStr = DateTime.now()
			.setZone("Asia/Kolkata")
			.toFormat("yyyy-MM-dd");

		return {
			result: {
				ticker,
				date: dateStr,
				close,
				volume,
				rsi: indicators.rsi,
				stochasticK: indicators.stochasticK,
				bbLower: indicators.bbLower,
				bbUpper: indicators.bbUpper,
				donchLower: indicators.donchLower,
				donchUpper: indicators.donchUpper,
				williamsR: indicators.williamsR,
				indiaVix,
				patterns: patternResult.patterns.join(", "),
				score,
				opinion,
				atr: indicators.atr,
				stopLoss,
				takeProfit,
				trailingStop,
				trailingStart,
				macd: indicators.macd,
				macdSignal: indicators.macdSignal,
				macdHistogram: indicators.macdHistogram,
				sma20: indicators.sma20,
				ema20: indicators.ema20,
				buyProbability: probabilities.buyProbability,
				sellProbability: probabilities.sellProbability,
				holdProbability: probabilities.holdProbability,
				confidence: probabilities.confidence,
			},
			source,
		};
	} catch (error) {
		logger.error({ ticker, error }, "Failed to process ticker");
		return null;
	}
}

/**
 * Main predict command.
 * Fetches data, runs analysis, and outputs results for all tickers.
 */
export async function predictCommand(options: CliOptions): Promise<void> {
	const { tickers, sort, format, slackWebhook } = options;

	// Handle special modes
	if (options.fundamentals && options.portfolioTicker) {
		const data = await getFundamentals(options.portfolioTicker);
		console.log(formatFundamentals(data));
		return;
	}
	if (options.news && options.portfolioTicker) {
		const news = await getStockNews(options.portfolioTicker);
		console.log(formatNews(options.portfolioTicker, news));
		return;
	}
	if (options.earnings && options.portfolioTicker) {
		const data = await getEarningsData(options.portfolioTicker);
		console.log(formatEarningsData(data));
		return;
	}
	if (options.dividends && options.portfolioTicker) {
		const data = await getDividendInfo(options.portfolioTicker);
		console.log(formatDividendInfo(data));
		return;
	}
	if (options.options && options.portfolioTicker) {
		const data = await getOptionsChain(options.portfolioTicker);
		if (data) {
			console.log(formatOptionsChain(data));
		} else {
			console.log(`\nNo options data available for ${options.portfolioTicker}`);
		}
		return;
	}

	logger.info({ tickers: tickers.length }, "Starting prediction");

	// Fetch India VIX once (shared across all tickers)
	const { value: indiaVix, source: vixSource } = await getIndiaVix();
	console.log(`\n📊 India VIX: ${indiaVix.toFixed(2)} [source: ${vixSource}]`);

	// Load optimized configuration
	const config = loadOptimizedConfig();

	// Process all tickers in parallel
	const resultPromises = tickers.map((t) =>
		processTicker(t, indiaVix, config),
	);
	const rawResults = await Promise.all(resultPromises);
	const validResults = rawResults.filter(
		(r): r is { result: TickerResult; source: DataSource } => r !== null,
	);
	const results = validResults.map((r) => r.result);

	// Track data sources used
	const sourceCounts = new Map<string, number>();
	for (const r of validResults) {
		sourceCounts.set(r.source, (sourceCounts.get(r.source) || 0) + 1);
	}
	const sourceStr = [...sourceCounts.entries()]
		.map(([s, c]) => `${s}: ${c}`)
		.join(", ");
	if (sourceStr) console.log(`📡 Data sources: ${sourceStr}`);

	if (results.length === 0) {
		console.log("No results to display.");
		return;
	}

	// Sort results
	const sorted = orderBy(
		results,
		[(r) => r.score],
		[sort === "asc" ? "asc" : "desc"],
	);

	// Display results
	console.log("\n" + "═".repeat(80));
	console.log("  INDIAN STOCK MARKET ANALYSIS");
	console.log("═".repeat(80));

	for (const r of sorted) {
		const emoji = r.opinion === "BUY" ? "🟢" : r.opinion === "SELL" ? "🔴" : "🟡";
		console.log(`\n${emoji} ${r.ticker} — ${r.opinion} (Score: ${r.score})`);
		console.log(`  Close: ${CURRENCY_SYMBOL}${r.close.toFixed(2)} | Vol: ${r.volume.toLocaleString("en-IN")}`);
		console.log(`  RSI: ${r.rsi.toFixed(1)} | StochK: ${r.stochasticK.toFixed(1)} | WillR: ${r.williamsR.toFixed(1)}`);
		console.log(`  MACD: ${r.macd.toFixed(4)} | SMA20: ${CURRENCY_SYMBOL}${r.sma20.toFixed(2)} | EMA20: ${CURRENCY_SYMBOL}${r.ema20.toFixed(2)}`);

		if (r.buyProbability !== undefined) {
			console.log(`  Buy: ${r.buyProbability}% | Sell: ${r.sellProbability}% | Hold: ${r.holdProbability}% [${r.confidence}]`);
		}

		if (r.opinion !== "HOLD") {
			console.log(`  SL: ${CURRENCY_SYMBOL}${r.stopLoss.toFixed(2)} | TP: ${CURRENCY_SYMBOL}${r.takeProfit.toFixed(2)}`);
		}

		if (r.patterns) {
			console.log(`  Patterns: ${r.patterns}`);
		}
	}

	console.log("\n" + "═".repeat(80));

	// Write output
	const dateStr = DateTime.now().setZone("Asia/Kolkata").toFormat("yyyyMMdd");

	if (format === "json") {
		const path = exportToJson(sorted, dateStr);
		console.log(`\nResults saved to: ${path}`);
	} else {
		const path = writeToCsv(sorted, dateStr);
		console.log(`\nResults saved to: ${path}`);
	}

	// Send Slack notifications
	if (slackWebhook) {
		await sendSlackNotification(slackWebhook, sorted);
	}

	// Save predictions for learning loop
	savePredictions(sorted);
}

/**
 * Save predictions to data/feedback/ for the learning loop.
 */
function savePredictions(results: TickerResult[]): void {
	const dateStr = DateTime.now()
		.setZone("Asia/Kolkata")
		.toFormat("yyyy-MM-dd");
	const dir = "data/feedback";

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const records: PredictionRecord[] = results.map((r) => ({
		ticker: r.ticker,
		date: r.date,
		opinion: r.opinion,
		score: r.score,
		buyProbability: r.buyProbability ?? 0,
		sellProbability: r.sellProbability ?? 0,
		holdProbability: r.holdProbability ?? 0,
		confidence: r.confidence ?? "low",
		close: r.close,
		indicators: {
			rsi: r.rsi,
			stochasticK: r.stochasticK,
			williamsR: r.williamsR,
			patternScore: r.score,
			macd: r.macd,
			macdSignal: r.macdSignal,
			macdHistogram: r.macdHistogram,
			sma20: r.sma20,
			ema20: r.ema20,
		},
	}));

	const path = `${dir}/predictions_${dateStr}.json`;
	writeFileSync(path, JSON.stringify(records, null, 2));
	logger.info({ path, count: records.length }, "Predictions saved");
}
