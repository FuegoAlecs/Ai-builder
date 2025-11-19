import Groq from 'groq-sdk';

let groqClient = null;

/**
 * Initialize Groq SDK client with API key
 * @param {string} apiKey - Groq API key
 * @returns {Groq} Groq client instance
 */
export function createGroqClient(apiKey) {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }
  
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  
  return groqClient;
}

/**
 * Exponential backoff delay function
 * @param {number} attempt - Current attempt number (1-based)
 * @returns {Promise<void>}
 */
export function delay(attempt) {
  const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Parse JSON from API response with error handling
 * @param {string} text - JSON string to parse
 * @returns {Object} Parsed JSON object
 * @throws {Error} If JSON is malformed
 */
export function parseJSON(text) {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}. Text: ${text.substring(0, 100)}...`);
  }
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error should trigger retry
 */
function isRetryableError(error) {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorCode === 'rate_limit_exceeded') {
    return true;
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('econnrefused') || errorMessage.includes('enotfound')) {
    return true;
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorCode === 'etimedout') {
    return true;
  }
  
  // Server errors (5xx)
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
    return true;
  }
  
  return false;
}

/**
 * Make non-streaming Groq API call with retry logic
 * @param {Object} params - API call parameters
 * @param {string} params.model - Model name (default: 'openai/gpt-oss-120b')
 * @param {Array} params.messages - Array of message objects
 * @param {number} params.temperature - Temperature setting
 * @param {number} params.max_tokens - Maximum tokens
 * @param {number} retries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} API response
 * @throws {Error} If all retry attempts fail
 */
export async function callGroq(params, retries = 3) {
  if (!groqClient) {
    throw new Error('Groq client not initialized. Call createGroqClient() first.');
  }
  
  const {
    model = 'openai/gpt-oss-120b',
    messages,
    temperature = 0.3,
    max_tokens = 4096,
  } = params;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required and must not be empty');
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await groqClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream: false,
      });
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`[${new Date().toISOString()}] [ERROR] [Groq API] Attempt ${attempt}/${retries} failed:`, error.message);
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't delay after the last attempt
      if (attempt < retries) {
        console.log(`[${new Date().toISOString()}] [INFO] [Groq API] Retrying in ${Math.pow(2, attempt - 1)}s...`);
        await delay(attempt);
      }
    }
  }
  
  throw new Error(`Groq API call failed after ${retries} attempts: ${lastError.message}`);
}

/**
 * Make streaming Groq API call with retry logic
 * @param {Object} params - API call parameters
 * @param {string} params.model - Model name (default: 'openai/gpt-oss-120b')
 * @param {Array} params.messages - Array of message objects
 * @param {number} params.temperature - Temperature setting
 * @param {number} params.max_tokens - Maximum tokens
 * @param {Function} onChunk - Callback function for each chunk (receives chunk text)
 * @param {number} retries - Maximum retry attempts (default: 3)
 * @returns {Promise<string>} Complete accumulated response
 * @throws {Error} If all retry attempts fail
 */
export async function callGroqStream(params, onChunk, retries = 3) {
  if (!groqClient) {
    throw new Error('Groq client not initialized. Call createGroqClient() first.');
  }
  
  if (typeof onChunk !== 'function') {
    throw new Error('onChunk callback function is required');
  }
  
  const {
    model = 'openai/gpt-oss-120b',
    messages,
    temperature = 0.2,
    max_tokens = 4096,
  } = params;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required and must not be empty');
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const stream = await groqClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }
      
      return fullContent;
    } catch (error) {
      lastError = error;
      console.error(`[${new Date().toISOString()}] [ERROR] [Groq API Stream] Attempt ${attempt}/${retries} failed:`, error.message);
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't delay after the last attempt
      if (attempt < retries) {
        console.log(`[${new Date().toISOString()}] [INFO] [Groq API Stream] Retrying in ${Math.pow(2, attempt - 1)}s...`);
        await delay(attempt);
      }
    }
  }
  
  throw new Error(`Groq API streaming call failed after ${retries} attempts: ${lastError.message}`);
}
