import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import pino from "pino";
import { CSV_DIR } from "../constants.js";
import type { TickerResult } from "../types/index.js";

const logger = pino({ name: "csv-writer" });

/**
 * Write ticker results to CSV file.
 * Output path: public/stock_data_YYYYMMDD.csv
 */
export function writeToCsv(results: TickerResult[], dateStr: string): string {
	if (!existsSync(CSV_DIR)) {
		mkdirSync(CSV_DIR, { recursive: true });
	}

	const filename = `${CSV_DIR}/stock_data_${dateStr}.csv`;

	const headers = [
		"Date",
		"Ticker",
		"Close",
		"Volume",
		"RSI",
		"StochK",
		"BBLower",
		"BBUpper",
		"DonchLower",
		"DonchUpper",
		"WilliamsR",
		"IndiaVIX",
		"Patterns",
		"Score",
		"Opinion",
		"ATR",
		"StopLoss",
		"TakeProfit",
		"TrailingStop",
		"TrailingStart",
		"MACD",
		"MACDSignal",
		"MACDHistogram",
		"SMA20",
		"EMA20",
	];

	const rows = results.map((r) =>
		[
			r.date,
			r.ticker,
			r.close.toFixed(2),
			r.volume,
			r.rsi.toFixed(2),
			r.stochasticK.toFixed(2),
			r.bbLower.toFixed(2),
			r.bbUpper.toFixed(2),
			r.donchLower.toFixed(2),
			r.donchUpper.toFixed(2),
			r.williamsR.toFixed(2),
			r.indiaVix.toFixed(2),
			`"${r.patterns}"`,
			r.score,
			r.opinion,
			r.atr.toFixed(2),
			r.stopLoss.toFixed(2),
			r.takeProfit.toFixed(2),
			r.trailingStop.toFixed(2),
			r.trailingStart.toFixed(2),
			r.macd.toFixed(4),
			r.macdSignal.toFixed(4),
			r.macdHistogram.toFixed(4),
			r.sma20.toFixed(2),
			r.ema20.toFixed(2),
		].join(","),
	);

	const csv = [headers.join(","), ...rows].join("\n");
	writeFileSync(filename, csv);
	logger.info({ filename, rows: results.length }, "CSV written");

	return filename;
}
