import { PLANNING_PROMPT } from '../prompts/systemPrompts.js';
import { callGroq, parseJSON } from '../utils/groqClient.js';

/**
 * Planning Agent - Analyzes user requirements and produces technical specification
 * @param {string} prompt - User's feature request
 * @param {Object|null} architectureSpec - Architecture specification from Architecture Agent (optional, for multi-page websites)
 * @param {Array} conversationHistory - Previous conversation messages (optional)
 * @returns {Promise<Object>} Technical specification object
 * @throws {Error} If API call fails or response is invalid
 */
export async function planningAgent(prompt, architectureSpec = null, conversationHistory = []) {
  try {
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    // Build user message with architecture context if provided
    let userMessage = prompt;
    if (architectureSpec) {
      userMessage = `User Request: ${prompt}\n\nArchitecture Specification:\n${JSON.stringify(architectureSpec, null, 2)}\n\nBased on the architecture specification above, create detailed technical specifications for each page and component.`;
    }

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: PLANNING_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    console.log(`[${new Date().toISOString()}] [INFO] [Planning Agent] Starting analysis...`);
    const startTime = Date.now();

    // Call Groq API with specified parameters
    const response = await callGroq({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.3,
      max_tokens: 4096
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Groq API');
    }

    // Parse JSON response
    const technicalSpec = parseJSON(content);

    // Validate based on whether this is a multi-page website or single component
    if (architectureSpec) {
      // Multi-page website validation
      const requiredFields = ['appType', 'pages', 'sharedComponents', 'routing', 'designStyle'];
      const missingFields = requiredFields.filter(field => !(field in technicalSpec));

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in technical specification: ${missingFields.join(', ')}`);
      }

      // Validate appType for multi-page
      if (!['multi-page-website', 'web-app', 'portfolio', 'blog', 'ecommerce', 'other'].includes(technicalSpec.appType)) {
        throw new Error(`Invalid appType for multi-page website: ${technicalSpec.appType}`);
      }

      // Validate pages array
      if (!Array.isArray(technicalSpec.pages)) {
        throw new Error('pages must be an array');
      }

      // Validate each page has required fields
      technicalSpec.pages.forEach((page, index) => {
        if (!page.name || !page.purpose || !Array.isArray(page.components) || !Array.isArray(page.features)) {
          throw new Error(`Page at index ${index} is missing required fields (name, purpose, components, features)`);
        }
      });

      // Validate sharedComponents array
      if (!Array.isArray(technicalSpec.sharedComponents)) {
        throw new Error('sharedComponents must be an array');
      }

      // Validate routing object
      if (!technicalSpec.routing || typeof technicalSpec.routing !== 'object') {
        throw new Error('routing must be an object');
      }

    } else {
      // Single component validation (original logic)
      const requiredFields = ['appType', 'components', 'features', 'complexity', 'designStyle'];
      const missingFields = requiredFields.filter(field => !(field in technicalSpec));

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in technical specification: ${missingFields.join(', ')}`);
      }

      // Validate field types
      if (!['dashboard', 'landing', 'form', 'tool', 'other'].includes(technicalSpec.appType)) {
        throw new Error(`Invalid appType: ${technicalSpec.appType}. Must be one of: dashboard, landing, form, tool, other`);
      }

      if (!Array.isArray(technicalSpec.components)) {
        throw new Error('components must be an array');
      }

      if (!Array.isArray(technicalSpec.features)) {
        throw new Error('features must be an array');
      }

      if (!['simple', 'medium', 'complex'].includes(technicalSpec.complexity)) {
        throw new Error(`Invalid complexity: ${technicalSpec.complexity}. Must be one of: simple, medium, complex`);
      }

      if (!['modern', 'minimal', 'playful', 'elegant'].includes(technicalSpec.designStyle)) {
        throw new Error(`Invalid designStyle: ${technicalSpec.designStyle}. Must be one of: modern, minimal, playful, elegant`);
      }
    }

    console.log(`[${new Date().toISOString()}] [INFO] [Planning Agent] Analysis complete in ${duration}ms`);
    console.log(`[${new Date().toISOString()}] [INFO] [Planning Agent] Tokens used: ${response.usage?.total_tokens || 'N/A'}`);

    return technicalSpec;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Planning Agent] Failed:`, error.message);
    throw new Error(`Planning Agent failed: ${error.message}`);
  }
}
