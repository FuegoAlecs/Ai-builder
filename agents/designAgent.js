import { DESIGN_PROMPT } from '../prompts/systemPrompts.js';
import { callGroq, parseJSON } from '../utils/groqClient.js';

/**
 * Design Agent - Creates design system based on technical specification
 * @param {Object} technicalSpec - Technical specification from Planning Agent (for backward compatibility)
 * @param {Array|Object} conversationHistoryOrArchitectureSpec - Conversation history OR architecture spec for multi-page websites
 * @param {Object} planningSpec - Planning specification (optional, for multi-page websites)
 * @param {Array} conversationHistory - Previous conversation messages (optional, for multi-page websites)
 * @returns {Promise<Object>} Design system object
 * @throws {Error} If API call fails or response is invalid
 */
export async function designAgent(technicalSpec, conversationHistoryOrArchitectureSpec = [], planningSpec = null, conversationHistory = []) {
  try {
    // Determine if this is a multi-page website call or single component call
    const isMultiPage = planningSpec !== null && typeof conversationHistoryOrArchitectureSpec === 'object' && !Array.isArray(conversationHistoryOrArchitectureSpec);
    
    let architectureSpec = null;
    let actualConversationHistory = [];
    let actualPlanningSpec = technicalSpec;

    if (isMultiPage) {
      // New signature: designAgent(architectureSpec, planningSpec, conversationHistory)
      architectureSpec = conversationHistoryOrArchitectureSpec;
      actualPlanningSpec = planningSpec;
      actualConversationHistory = conversationHistory;
    } else {
      // Old signature: designAgent(technicalSpec, conversationHistory)
      actualConversationHistory = Array.isArray(conversationHistoryOrArchitectureSpec) ? conversationHistoryOrArchitectureSpec : [];
    }

    // Validate input
    if (!actualPlanningSpec || typeof actualPlanningSpec !== 'object') {
      throw new Error('Technical/Planning specification is required and must be an object');
    }

    // Build context message with specifications
    let contextMessage = '';
    
    if (isMultiPage && architectureSpec) {
      contextMessage = `Architecture Specification:
${JSON.stringify(architectureSpec, null, 2)}

Planning Specification:
${JSON.stringify(actualPlanningSpec, null, 2)}

Based on these specifications, create a comprehensive design system for the entire website with component-specific styling guidelines, layout system, breakpoints, and global styles.`;
    } else {
      contextMessage = `Technical Specification:
${JSON.stringify(actualPlanningSpec, null, 2)}

Based on this technical specification, create a cohesive design system.`;
    }

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: DESIGN_PROMPT },
      ...actualConversationHistory,
      { role: 'user', content: contextMessage }
    ];

    console.log(`[${new Date().toISOString()}] [INFO] [Design Agent] Creating design system${isMultiPage ? ' for multi-page website' : ''}...`);
    const startTime = Date.now();

    // Call Groq API with specified parameters
    const response = await callGroq({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.7,
      max_tokens: 4096
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Groq API');
    }

    // Parse JSON response
    const designSystem = parseJSON(content);

    // Validate required fields
    const requiredFields = ['colors', 'fonts', 'spacing', 'style'];
    const missingFields = requiredFields.filter(field => !(field in designSystem));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in design system: ${missingFields.join(', ')}`);
    }

    // Validate colors object structure
    if (typeof designSystem.colors !== 'object') {
      throw new Error('colors must be an object');
    }

    const requiredColors = ['primary', 'secondary', 'accent', 'bg', 'text'];
    const missingColors = requiredColors.filter(color => !(color in designSystem.colors));

    if (missingColors.length > 0) {
      throw new Error(`Missing required colors: ${missingColors.join(', ')}`);
    }

    // Validate fonts object structure
    if (typeof designSystem.fonts !== 'object') {
      throw new Error('fonts must be an object');
    }

    const requiredFonts = ['heading', 'body'];
    const missingFonts = requiredFonts.filter(font => !(font in designSystem.fonts));

    if (missingFonts.length > 0) {
      throw new Error(`Missing required fonts: ${missingFonts.join(', ')}`);
    }

    // Validate spacing (can be array or object)
    if (!Array.isArray(designSystem.spacing) && typeof designSystem.spacing !== 'object') {
      throw new Error('spacing must be an array or object');
    }

    // Validate style description
    if (typeof designSystem.style !== 'string' || designSystem.style.trim().length === 0) {
      throw new Error('style must be a non-empty string');
    }

    // For multi-page websites, validate additional fields
    if (isMultiPage) {
      // Validate breakpoints (required for responsive design)
      if (!designSystem.breakpoints || typeof designSystem.breakpoints !== 'object') {
        throw new Error('breakpoints are required for multi-page websites and must be an object');
      }
      
      const requiredBreakpoints = ['sm', 'md', 'lg'];
      const missingBreakpoints = requiredBreakpoints.filter(bp => !(bp in designSystem.breakpoints));
      if (missingBreakpoints.length > 0) {
        throw new Error(`Missing required breakpoints: ${missingBreakpoints.join(', ')}`);
      }
      
      // Validate components (required for component-specific styling)
      if (!designSystem.components || typeof designSystem.components !== 'object') {
        throw new Error('components are required for multi-page websites and must be an object');
      }
      
      // Check for essential navigation components
      const requiredComponents = ['navbar', 'footer', 'button'];
      const missingComponents = requiredComponents.filter(comp => !(comp in designSystem.components));
      if (missingComponents.length > 0) {
        throw new Error(`Missing required component styles: ${missingComponents.join(', ')}`);
      }
      
      // Validate layout system (required for consistent structure)
      if (!designSystem.layout || typeof designSystem.layout !== 'object') {
        throw new Error('layout is required for multi-page websites and must be an object');
      }
      
      const requiredLayoutProps = ['maxWidth', 'containerPadding', 'sectionSpacing'];
      const missingLayoutProps = requiredLayoutProps.filter(prop => !(prop in designSystem.layout));
      if (missingLayoutProps.length > 0) {
        throw new Error(`Missing required layout properties: ${missingLayoutProps.join(', ')}`);
      }
      
      // Validate typography (required for text hierarchy)
      if (!designSystem.typography || typeof designSystem.typography !== 'object') {
        throw new Error('typography is required for multi-page websites and must be an object');
      }
      
      const requiredTypography = ['h1', 'h2', 'body'];
      const missingTypography = requiredTypography.filter(type => !(type in designSystem.typography));
      if (missingTypography.length > 0) {
        throw new Error(`Missing required typography styles: ${missingTypography.join(', ')}`);
      }
      
      // Validate effects (optional but recommended)
      if (designSystem.effects && typeof designSystem.effects !== 'object') {
        throw new Error('effects must be an object');
      }
    }

    console.log(`[${new Date().toISOString()}] [INFO] [Design Agent] Design system created in ${duration}ms`);
    console.log(`[${new Date().toISOString()}] [INFO] [Design Agent] Tokens used: ${response.usage?.total_tokens || 'N/A'}`);

    return designSystem;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Design Agent] Failed:`, error.message);
    throw new Error(`Design Agent failed: ${error.message}`);
  }
}
