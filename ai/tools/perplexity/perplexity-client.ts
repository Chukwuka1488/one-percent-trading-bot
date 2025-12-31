/**
 * Perplexity API Client for Trading Research
 *
 * This client provides a simple interface to Perplexity's AI search API.
 * It's designed for trading research - fetching news, analyzing crypto,
 * and getting market sentiment.
 *
 * Available Models:
 * - sonar: Fast and cheap, good for quick lookups ($0.001/1K tokens)
 * - sonar-pro: Better reasoning, larger context ($0.003/1K input, $0.015/1K output)
 * - sonar-reasoning: Multi-step analysis (higher cost)
 * - sonar-deep-research: Comprehensive reports (highest cost)
 *
 * Usage:
 *   const client = createPerplexityClient();
 *   const result = await client.searchNews('Bitcoin');
 *
 * @see https://docs.perplexity.ai/
 */

// ============================================================================
// Types - Define the shape of data we work with
// ============================================================================

/** Available Perplexity models - use sonar for speed, sonar-pro for quality */
export type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-deep-research';

/** Configuration for the Perplexity client */
export interface PerplexityConfig {
  apiKey: string;                    // Your Perplexity API key
  defaultModel?: PerplexityModel;    // Default model to use (defaults to 'sonar')
}

/** A single message in a chat conversation */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';  // Who is speaking
  content: string;                         // The message text
}

/** Raw response from the Perplexity API */
export interface PerplexityResponse {
  id: string;                        // Unique response ID
  model: string;                     // Model that generated the response
  choices: {                         // Array of response choices (usually 1)
    message: {
      role: string;
      content: string;               // The actual response text
    };
    finish_reason: string;           // Why the response ended
  }[];
  usage: {                           // Token usage for billing
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];              // Source URLs for the information
}

/** Simplified result from a research query */
export interface ResearchResult {
  query: string;           // The original query
  answer: string;          // The AI's response
  citations: string[];     // Source URLs
  model: string;           // Model used
  tokens_used: number;     // Total tokens consumed
}

/** Structured market sentiment analysis */
export interface MarketSentiment {
  symbol: string;                                  // e.g., 'BTC', 'ETH'
  sentiment: 'bullish' | 'bearish' | 'neutral';   // Overall market view
  confidence: number;                              // 0.0 to 1.0
  summary: string;                                 // One-sentence summary
  key_factors: string[];                           // Factors driving sentiment
  citations: string[];                             // Source URLs
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * Perplexity API Client
 *
 * Handles all communication with the Perplexity API.
 * Use the factory function `createPerplexityClient()` to create instances.
 */
export class PerplexityClient {
  private apiKey: string;
  private defaultModel: PerplexityModel;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(config: PerplexityConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || 'sonar';
  }

  /**
   * Send a chat completion request to Perplexity
   *
   * This is the low-level method - use search(), searchNews(), etc. for convenience.
   *
   * @param messages - Array of conversation messages
   * @param options - Model and temperature settings
   * @returns Raw API response
   */
  async chat(
    messages: ChatMessage[],
    options: { model?: PerplexityModel; temperature?: number } = {}
  ): Promise<PerplexityResponse> {
    const model = options.model || this.defaultModel;

    // Make the API request
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,  // Low temp = more focused answers
      }),
    });

    // Handle errors
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Simple search query
   *
   * @param query - What to search for
   * @param model - Which model to use (optional)
   * @returns Simplified research result
   */
  async search(query: string, model?: PerplexityModel): Promise<ResearchResult> {
    const response = await this.chat(
      [{ role: 'user', content: query }],
      { model }
    );

    return {
      query,
      answer: response.choices[0]?.message.content || '',
      citations: response.citations || [],
      model: response.model,
      tokens_used: response.usage.total_tokens,
    };
  }

  /**
   * Search for latest news on a topic
   *
   * Uses the fast 'sonar' model for quick news lookups.
   *
   * @param topic - What to search news for (e.g., 'Bitcoin', 'Ethereum DeFi')
   * @param timeframe - How far back to look (default: 'last 24 hours')
   * @returns News summary with sources
   */
  async searchNews(topic: string, timeframe: string = 'last 24 hours'): Promise<ResearchResult> {
    const query = `What are the latest news and developments about ${topic} in the ${timeframe}?
    Focus on market-moving events, price action, and significant announcements.
    Be concise and factual.`;

    return this.search(query, 'sonar');
  }

  /**
   * Research a cryptocurrency
   *
   * Uses 'sonar-pro' for better analysis quality.
   *
   * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH', 'SOL')
   * @returns Market analysis with price trends, news, and sentiment
   */
  async researchCrypto(symbol: string): Promise<ResearchResult> {
    const query = `Provide a brief current market analysis for ${symbol} cryptocurrency:
    1. Current price trend and recent movement
    2. Key news or events affecting price
    3. Market sentiment (bullish/bearish/neutral)
    4. Any upcoming events or catalysts
    Be concise and data-driven.`;

    return this.search(query, 'sonar-pro');
  }

  /**
   * Get structured market sentiment
   *
   * Returns a structured JSON object that can be used by trading bots.
   * Uses 'sonar-pro' with low temperature for consistent output.
   *
   * @param symbol - Crypto symbol (e.g., 'BTC')
   * @returns Structured sentiment data with confidence score
   */
  async getMarketSentiment(symbol: string): Promise<MarketSentiment> {
    // System prompt instructs the AI to return JSON
    const systemPrompt = `You are a market analyst. Analyze the given cryptocurrency and respond ONLY with valid JSON in this exact format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "summary": "one sentence summary",
  "key_factors": ["factor1", "factor2", "factor3"]
}`;

    const userPrompt = `Analyze the current market sentiment for ${symbol}. Consider recent news, price action, and market conditions.`;

    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: 'sonar-pro', temperature: 0.1 }  // Very low temp for consistent JSON
    );

    const content = response.choices[0]?.message.content || '{}';

    try {
      // Extract JSON from response (AI sometimes wraps in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || content);

      return {
        symbol,
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.5,
        summary: parsed.summary || '',
        key_factors: parsed.key_factors || [],
        citations: response.citations || [],
      };
    } catch {
      // Fallback if JSON parsing fails - return neutral with raw content
      return {
        symbol,
        sentiment: 'neutral',
        confidence: 0.5,
        summary: content.slice(0, 200),
        key_factors: [],
        citations: response.citations || [],
      };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Perplexity client instance
 *
 * Reads API key from environment if not provided.
 *
 * @param apiKey - Optional API key (defaults to PERPLEXITY_API_KEY env var)
 * @returns Configured PerplexityClient instance
 * @throws Error if no API key is available
 *
 * @example
 *   // Using environment variable
 *   const client = createPerplexityClient();
 *
 *   // Or pass key directly
 *   const client = createPerplexityClient('pplx-xxx...');
 */
export function createPerplexityClient(apiKey?: string): PerplexityClient {
  const key = apiKey || process.env.PERPLEXITY_API_KEY;

  if (!key) {
    throw new Error('PERPLEXITY_API_KEY is required. Set it in .envrc or pass it directly.');
  }

  return new PerplexityClient({ apiKey: key });
}
