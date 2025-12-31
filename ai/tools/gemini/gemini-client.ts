/**
 * Gemini API Client for Trading Sentiment Analysis
 *
 * This client provides an interface to Google's Gemini AI for sentiment
 * analysis and market reasoning. Works alongside Perplexity for research.
 *
 * Available Models:
 * - gemini-1.5-flash: Fast, good for quick analysis
 * - gemini-1.5-pro: Better reasoning, more accurate
 * - gemini-2.0-flash-exp: Latest experimental model
 *
 * Usage:
 *   const client = createGeminiClient();
 *   const sentiment = await client.analyzeSentiment('BTC', newsData);
 *
 * @see https://ai.google.dev/api
 */

// ============================================================================
// Types - Define the shape of data we work with
// ============================================================================

/** Available Gemini models (as of Dec 2025) */
export type GeminiModel =
  | 'gemini-3-pro-preview'   // Newest, best reasoning (preview)
  | 'gemini-3-flash-preview' // Newest flash (preview)
  | 'gemini-2.5-pro'         // Best stable for complex reasoning
  | 'gemini-2.5-flash'       // Fast and capable (recommended)
  | 'gemini-2.5-flash-lite'  // Cheapest, high-frequency tasks
  | 'gemini-2.0-flash';      // Legacy, still available

/** Configuration for the Gemini client */
export interface GeminiConfig {
  apiKey: string;                // Your Gemini API key
  defaultModel?: GeminiModel;    // Default model to use
}

/** Content part in a Gemini message */
export interface ContentPart {
  text: string;
}

/** A message in Gemini format */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: ContentPart[];
}

/** Raw response from Gemini API */
export interface GeminiResponse {
  candidates: {
    content: {
      parts: ContentPart[];
      role: string;
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/** Structured sentiment analysis result */
export interface SentimentAnalysis {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;           // 0.0 to 1.0
  reasoning: string;            // Explanation of the analysis
  recommendation: 'buy' | 'sell' | 'hold';
  risk_level: 'low' | 'medium' | 'high';
  key_points: string[];
  timestamp: string;
}

/** Input data for sentiment analysis */
export interface MarketData {
  news?: string;           // Recent news summary
  price_action?: string;   // Price movement description
  indicators?: string;     // Technical indicators
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * Gemini API Client
 *
 * Handles communication with Google's Gemini AI API.
 * Use the factory function `createGeminiClient()` to create instances.
 */
export class GeminiClient {
  private apiKey: string;
  private defaultModel: GeminiModel;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || 'gemini-3-flash-preview';
  }

  /**
   * Generate content using Gemini
   *
   * This is the low-level method for direct API access.
   *
   * @param prompt - The prompt to send
   * @param options - Model and generation settings
   * @returns Raw API response
   */
  async generate(
    prompt: string,
    options: {
      model?: GeminiModel;
      temperature?: number;
      systemInstruction?: string;
    } = {}
  ): Promise<GeminiResponse> {
    const model = options.model || this.defaultModel;

    // Build request body
    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        topP: 0.95,
        topK: 40,
      },
    };

    // Add system instruction if provided
    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    // Make the API request
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle errors
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Simple text generation
   *
   * @param prompt - What to ask Gemini
   * @param model - Which model to use
   * @returns Generated text
   */
  async chat(prompt: string, model?: GeminiModel): Promise<string> {
    const response = await this.generate(prompt, { model });
    return response.candidates[0]?.content.parts[0]?.text || '';
  }

  /**
   * Analyze market sentiment for a cryptocurrency
   *
   * Takes market data (news, price action, indicators) and returns
   * structured sentiment analysis that can be used by trading bots.
   *
   * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH')
   * @param marketData - News, price action, and indicators
   * @returns Structured sentiment analysis
   */
  async analyzeSentiment(
    symbol: string,
    marketData: MarketData
  ): Promise<SentimentAnalysis> {
    // Build context from market data
    const context = [
      marketData.news ? `Recent News:\n${marketData.news}` : '',
      marketData.price_action ? `Price Action:\n${marketData.price_action}` : '',
      marketData.indicators ? `Technical Indicators:\n${marketData.indicators}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const systemInstruction = `You are a professional crypto market analyst. Analyze the provided market data and respond ONLY with valid JSON in this exact format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation",
  "recommendation": "buy" | "sell" | "hold",
  "risk_level": "low" | "medium" | "high",
  "key_points": ["point1", "point2", "point3"]
}

Be objective and data-driven. Consider both short-term and medium-term outlook.`;

    const prompt = `Analyze the current market sentiment for ${symbol}:

${context || 'No specific market data provided. Analyze based on your general knowledge of current market conditions.'}

Provide your analysis as JSON.`;

    const response = await this.generate(prompt, {
      model: 'gemini-3-flash-preview',  // Flash has better rate limits
      temperature: 0.2,                 // Low temp for consistent output
      systemInstruction,
    });

    const content = response.candidates[0]?.content.parts[0]?.text || '{}';

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || content);

      return {
        symbol,
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
        recommendation: parsed.recommendation || 'hold',
        risk_level: parsed.risk_level || 'medium',
        key_points: parsed.key_points || [],
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        symbol,
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: content.slice(0, 300),
        recommendation: 'hold',
        risk_level: 'medium',
        key_points: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Combine Perplexity research with Gemini analysis
   *
   * Takes raw research from Perplexity and produces trading signals.
   *
   * @param symbol - Crypto symbol
   * @param perplexityResearch - Raw research text from Perplexity
   * @returns Trading-ready sentiment analysis
   */
  async analyzeResearch(
    symbol: string,
    perplexityResearch: string
  ): Promise<SentimentAnalysis> {
    return this.analyzeSentiment(symbol, { news: perplexityResearch });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Gemini client instance
 *
 * Reads API key from environment if not provided.
 *
 * @param apiKey - Optional API key (defaults to GEMINI_API_KEY env var)
 * @returns Configured GeminiClient instance
 * @throws Error if no API key is available
 *
 * @example
 *   // Using environment variable
 *   const client = createGeminiClient();
 *
 *   // Or pass key directly
 *   const client = createGeminiClient('your-api-key');
 */
export function createGeminiClient(apiKey?: string): GeminiClient {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('GEMINI_API_KEY is required. Set it in .envrc or pass it directly.');
  }

  return new GeminiClient({ apiKey: key });
}
