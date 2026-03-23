import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import pino from "pino";
import { CSV_DIR } from "../constants.js";
import type { TickerResult } from "../types/index.js";

const logger = pino({ name: "json-exporter" });

/**
 * Export ticker results to JSON file.
 * Output path: public/stock_data_YYYYMMDD.json
 */
export function exportToJson(results: TickerResult[], dateStr: string): string {
	if (!existsSync(CSV_DIR)) {
		mkdirSync(CSV_DIR, { recursive: true });
	}

	const filename = `${CSV_DIR}/stock_data_${dateStr}.json`;
	writeFileSync(filename, JSON.stringify(results, null, 2));
	logger.info({ filename, rows: results.length }, "JSON exported");

	return filename;
}
