#!/usr/bin/env node

/**
 * Gemini CLI - Command-line interface for AI sentiment analysis
 *
 * This CLI provides access to Google's Gemini AI for sentiment analysis
 * and market reasoning. Works alongside Perplexity for research.
 *
 * Usage:
 *   ./gemini chat "What is Bitcoin?"          - Simple chat
 *   ./gemini analyze BTC "news summary"       - Analyze sentiment
 *   ./gemini research BTC "perplexity output" - Analyze Perplexity research
 */

import { Command } from "commander";
import chalk from "chalk";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { createGeminiClient } from "./gemini-client";

// ============================================================================
// CLI Setup
// ============================================================================

const program = new Command();

program
  .name("gemini")
  .description("Gemini AI sentiment analysis tool for trading")
  .version("1.0.0");

// ============================================================================
// Commands
// ============================================================================

/**
 * Simple chat command
 * Sends a prompt to Gemini and displays the response.
 */
program
  .command("chat <prompt>")
  .description("Chat with Gemini")
  .option("-m, --model <model>", "Model to use (gemini-3-flash-preview, gemini-3-pro-preview, gemini-2.5-flash)", "gemini-3-flash-preview")
  .action(async (prompt: string, options: { model: string }) => {
    try {
      const client = createGeminiClient();
      console.log(chalk.dim(`Chatting with ${options.model}...`));

      const response = await client.chat(prompt, options.model as any);

      console.log(chalk.bold("\nResponse:"));
      console.log(response);
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Analyze sentiment command
 * Takes a symbol and market data, returns structured sentiment analysis.
 */
program
  .command("analyze <symbol>")
  .description("Analyze market sentiment for a cryptocurrency")
  .option("-n, --news <text>", "Recent news to analyze")
  .option("-p, --price <text>", "Price action description")
  .option("-i, --indicators <text>", "Technical indicators")
  .option("-o, --output <file>", "Save JSON to file (appends to existing)")
  .action(async (symbol: string, options: { news?: string; price?: string; indicators?: string; output?: string }) => {
    try {
      const client = createGeminiClient();
      console.log(chalk.dim(`Analyzing sentiment for ${symbol.toUpperCase()}...`));

      const result = await client.analyzeSentiment(symbol.toUpperCase(), {
        news: options.news,
        price_action: options.price,
        indicators: options.indicators,
      });

      // Display results with color-coded sentiment
      const sentimentColor = getSentimentColor(result.sentiment);

      console.log(chalk.bold(`\n${symbol.toUpperCase()} Sentiment Analysis:`));
      console.log(`  Sentiment: ${sentimentColor(result.sentiment.toUpperCase())}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Recommendation: ${getRecommendationColor(result.recommendation)(result.recommendation.toUpperCase())}`);
      console.log(`  Risk Level: ${getRiskColor(result.risk_level)(result.risk_level.toUpperCase())}`);
      console.log(`  Reasoning: ${result.reasoning}`);

      if (result.key_points.length > 0) {
        console.log(chalk.bold("\nKey Points:"));
        result.key_points.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      }

      // Save to file if --output specified
      if (options.output) {
        saveToFile(options.output, result);
      } else {
        console.log(chalk.bold("\nJSON Output:"));
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Research analysis command
 * Takes Perplexity research output and produces trading signals.
 */
program
  .command("research <symbol> <research>")
  .description("Analyze Perplexity research output for trading signals")
  .option("-o, --output <file>", "Save JSON to file (appends to existing)")
  .action(async (symbol: string, research: string, options: { output?: string }) => {
    try {
      const client = createGeminiClient();
      console.log(chalk.dim(`Analyzing research for ${symbol.toUpperCase()}...`));

      const result = await client.analyzeResearch(symbol.toUpperCase(), research);

      // Display results
      const sentimentColor = getSentimentColor(result.sentiment);

      console.log(chalk.bold(`\n${symbol.toUpperCase()} Research Analysis:`));
      console.log(`  Sentiment: ${sentimentColor(result.sentiment.toUpperCase())}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Recommendation: ${getRecommendationColor(result.recommendation)(result.recommendation.toUpperCase())}`);
      console.log(`  Risk Level: ${getRiskColor(result.risk_level)(result.risk_level.toUpperCase())}`);
      console.log(`  Reasoning: ${result.reasoning}`);

      if (result.key_points.length > 0) {
        console.log(chalk.bold("\nKey Points:"));
        result.key_points.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      }

      // Save to file if --output specified
      if (options.output) {
        saveToFile(options.output, result);
      } else {
        console.log(chalk.bold("\nJSON Output:"));
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get chalk color function based on sentiment
 */
function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return chalk.green;
    case "bearish":
      return chalk.red;
    default:
      return chalk.yellow;
  }
}

/**
 * Get chalk color function based on recommendation
 */
function getRecommendationColor(recommendation: string) {
  switch (recommendation) {
    case "buy":
      return chalk.green;
    case "sell":
      return chalk.red;
    default:
      return chalk.yellow;
  }
}

/**
 * Get chalk color function based on risk level
 */
function getRiskColor(risk: string) {
  switch (risk) {
    case "low":
      return chalk.green;
    case "high":
      return chalk.red;
    default:
      return chalk.yellow;
  }
}

/**
 * Save analysis result to JSON file
 * Appends to existing array if file exists.
 */
function saveToFile(filepath: string, data: any) {
  let signals: any[] = [];

  // Load existing signals if file exists
  if (existsSync(filepath)) {
    try {
      const existing = readFileSync(filepath, "utf-8");
      signals = JSON.parse(existing);
      if (!Array.isArray(signals)) {
        signals = [signals];
      }
    } catch {
      signals = [];
    }
  }

  // Append new signal
  signals.push(data);

  // Write back to file
  writeFileSync(filepath, JSON.stringify(signals, null, 2));
  console.log(chalk.green(`\n✓ Saved to ${filepath} (${signals.length} signals total)`));
}

// ============================================================================
// Entry Point
// ============================================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
