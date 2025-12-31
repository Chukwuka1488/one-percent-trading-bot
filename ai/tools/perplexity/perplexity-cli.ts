#!/usr/bin/env node

/**
 * Perplexity CLI - Command-line interface for trading research
 *
 * Usage:
 *   ./perplexity search "query"           - General search
 *   ./perplexity news "Bitcoin"           - Get latest news
 *   ./perplexity crypto BTC               - Research a crypto
 *   ./perplexity sentiment ETH -o out.json - Get sentiment and save to file
 */

import { Command } from "commander";
import chalk from "chalk";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { createPerplexityClient } from "./perplexity-client";

const program = new Command();

program
  .name("perplexity")
  .description("Perplexity AI research tool for trading")
  .version("1.0.0");

program
  .command("search <query>")
  .description("Search for information")
  .option("-m, --model <model>", "Model to use (sonar, sonar-pro)", "sonar")
  .action(async (query: string, options: { model: string }) => {
    try {
      const client = createPerplexityClient();
      console.log(chalk.dim(`Searching with ${options.model}...`));

      const result = await client.search(query, options.model as any);

      console.log(chalk.bold("\nAnswer:"));
      console.log(result.answer);

      if (result.citations.length > 0) {
        console.log(chalk.bold("\nSources:"));
        result.citations.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      }

      console.log(chalk.dim(`\nTokens used: ${result.tokens_used}`));
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("news <topic>")
  .description("Get latest news on a topic")
  .option("-t, --timeframe <timeframe>", "Timeframe for news", "last 24 hours")
  .action(async (topic: string, options: { timeframe: string }) => {
    try {
      const client = createPerplexityClient();
      console.log(chalk.dim(`Fetching news for ${topic}...`));

      const result = await client.searchNews(topic, options.timeframe);

      console.log(chalk.bold(`\nNews: ${topic}`));
      console.log(result.answer);

      if (result.citations.length > 0) {
        console.log(chalk.bold("\nSources:"));
        result.citations.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("crypto <symbol>")
  .description("Research a cryptocurrency (e.g., BTC, ETH)")
  .action(async (symbol: string) => {
    try {
      const client = createPerplexityClient();
      console.log(chalk.dim(`Researching ${symbol.toUpperCase()}...`));

      const result = await client.researchCrypto(symbol.toUpperCase());

      console.log(chalk.bold(`\n${symbol.toUpperCase()} Analysis:`));
      console.log(result.answer);

      if (result.citations.length > 0) {
        console.log(chalk.bold("\nSources:"));
        result.citations.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("sentiment <symbol>")
  .description("Get market sentiment for a cryptocurrency (returns JSON)")
  .option("-o, --output <file>", "Save JSON to file (appends to existing signals)")
  .action(async (symbol: string, options: { output?: string }) => {
    try {
      const client = createPerplexityClient();
      console.log(chalk.dim(`Analyzing sentiment for ${symbol.toUpperCase()}...`));

      const result = await client.getMarketSentiment(symbol.toUpperCase());

      // Add timestamp for tracking
      const signalWithTimestamp = {
        ...result,
        timestamp: new Date().toISOString(),
      };

      // Determine sentiment color for display
      let sentimentColor;
      if (result.sentiment === 'bullish') {
        sentimentColor = chalk.green;
      } else if (result.sentiment === 'bearish') {
        sentimentColor = chalk.red;
      } else {
        sentimentColor = chalk.yellow;
      }

      // Display results
      console.log(chalk.bold(`\n${symbol.toUpperCase()} Sentiment:`));
      console.log(`  Sentiment: ${sentimentColor(result.sentiment.toUpperCase())}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Summary: ${result.summary}`);

      if (result.key_factors.length > 0) {
        console.log(chalk.bold("\nKey Factors:"));
        result.key_factors.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
      }

      // Save to file if --output specified
      if (options.output) {
        let signals: any[] = [];

        // Load existing signals if file exists
        if (existsSync(options.output)) {
          try {
            const existing = readFileSync(options.output, 'utf-8');
            signals = JSON.parse(existing);
            if (!Array.isArray(signals)) {
              signals = [signals]; // Convert single object to array
            }
          } catch {
            signals = []; // Start fresh if file is invalid
          }
        }

        // Append new signal
        signals.push(signalWithTimestamp);

        // Write back to file
        writeFileSync(options.output, JSON.stringify(signals, null, 2));
        console.log(chalk.green(`\n✓ Saved to ${options.output} (${signals.length} signals total)`));
      } else {
        console.log(chalk.bold("\nJSON Output:"));
        console.log(JSON.stringify(signalWithTimestamp, null, 2));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
