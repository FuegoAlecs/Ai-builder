import { ARCHITECTURE_PROMPT } from '../prompts/systemPrompts.js';
import { callGroq, parseJSON } from '../utils/groqClient.js';

/**
 * Architecture Agent - Analyzes website requirements and produces project structure plan
 * @param {string} prompt - User's website description
 * @param {string} template - Project template ('vite-react', 'nextjs', 'vite-react-ts')
 * @param {Array} conversationHistory - Previous conversation messages (optional)
 * @returns {Promise<Object>} Architecture specification object
 * @throws {Error} If API call fails or response is invalid
 */
export async function architectureAgent(prompt, template = 'vite-react', conversationHistory = []) {
  try {
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    // Validate template
    const validTemplates = ['vite-react', 'nextjs', 'vite-react-ts'];
    if (!validTemplates.includes(template)) {
      throw new Error(`Invalid template: ${template}. Must be one of: ${validTemplates.join(', ')}`);
    }

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: ARCHITECTURE_PROMPT },
      ...conversationHistory,
      { 
        role: 'user', 
        content: `${prompt}\n\nTarget template: ${template}\n\nPlease create a complete project structure for this website.`
      }
    ];

    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Starting project structure planning...`);
    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Template: ${template}`);
    const startTime = Date.now();

    // Call Groq API with temperature 0.3 for consistent structural planning
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
    const architectureSpec = parseJSON(content);

    // Validate architecture specification structure
    validateArchitectureSpec(architectureSpec, template);

    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Planning complete in ${duration}ms`);
    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Pages: ${architectureSpec.fileStructure.pages.length}`);
    console.log(`[${new Date().toISOString()}] [INFO] [Architecture Agent] Components: ${architectureSpec.fileStructure.components.length}`);

    return architectureSpec;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Architecture Agent] Failed:`, error.message);
    throw new Error(`Architecture Agent failed: ${error.message}`);
  }
}

/**
 * Validate architecture specification structure and required fields
 * @param {Object} spec - Architecture specification to validate
 * @param {string} template - Expected template type
 * @throws {Error} If validation fails
 */
function validateArchitectureSpec(spec, template) {
  // Validate top-level required fields
  const requiredTopFields = ['projectName', 'template', 'fileStructure', 'dependencies', 'features'];
  const missingTopFields = requiredTopFields.filter(field => !(field in spec));

  if (missingTopFields.length > 0) {
    throw new Error(`Missing required fields in architecture specification: ${missingTopFields.join(', ')}`);
  }

  // Validate projectName format (should be kebab-case)
  if (typeof spec.projectName !== 'string' || spec.projectName.length === 0) {
    throw new Error('projectName must be a non-empty string');
  }

  // Validate template matches expected
  const validTemplates = ['vite-react', 'nextjs', 'vite-react-ts'];
  if (!validTemplates.includes(spec.template)) {
    throw new Error(`Invalid template in spec: ${spec.template}. Must be one of: ${validTemplates.join(', ')}`);
  }

  // Validate fileStructure
  if (typeof spec.fileStructure !== 'object' || spec.fileStructure === null) {
    throw new Error('fileStructure must be an object');
  }

  const requiredStructureFields = ['pages', 'layouts', 'components', 'config', 'routing', 'entry'];
  const missingStructureFields = requiredStructureFields.filter(field => !(field in spec.fileStructure));

  if (missingStructureFields.length > 0) {
    throw new Error(`Missing required fields in fileStructure: ${missingStructureFields.join(', ')}`);
  }

  // Validate each fileStructure section is an array
  for (const field of requiredStructureFields) {
    if (!Array.isArray(spec.fileStructure[field])) {
      throw new Error(`fileStructure.${field} must be an array`);
    }
  }

  // Validate pages array has at least one page
  if (spec.fileStructure.pages.length === 0) {
    throw new Error('fileStructure.pages must contain at least one page');
  }

  // Validate page objects have required fields
  for (const page of spec.fileStructure.pages) {
    if (!page.name || !page.path || !page.route) {
      throw new Error(`Invalid page object: ${JSON.stringify(page)}. Must have name, path, and route`);
    }
  }

  // Validate layouts has at least one layout
  if (spec.fileStructure.layouts.length === 0) {
    throw new Error('fileStructure.layouts must contain at least one layout');
  }

  // Validate file objects in each section
  const fileArrays = ['layouts', 'components', 'config', 'routing', 'entry'];
  for (const arrayName of fileArrays) {
    for (const file of spec.fileStructure[arrayName]) {
      if (!file.name || !file.path) {
        throw new Error(`Invalid file object in ${arrayName}: ${JSON.stringify(file)}. Must have name and path`);
      }
    }
  }

  // Validate dependencies is an array
  if (!Array.isArray(spec.dependencies)) {
    throw new Error('dependencies must be an array');
  }

  // Validate required dependencies are present
  const requiredDeps = ['react', 'react-dom'];
  const missingDeps = requiredDeps.filter(dep => !spec.dependencies.includes(dep));
  if (missingDeps.length > 0) {
    throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
  }

  // Validate features object
  if (typeof spec.features !== 'object' || spec.features === null) {
    throw new Error('features must be an object');
  }

  const requiredFeatures = ['routing', 'stateManagement', 'apiIntegration', 'authentication', 'forms'];
  const missingFeatures = requiredFeatures.filter(feature => !(feature in spec.features));

  if (missingFeatures.length > 0) {
    throw new Error(`Missing required features: ${missingFeatures.join(', ')}`);
  }

  // Validate feature values are boolean
  for (const [feature, value] of Object.entries(spec.features)) {
    if (typeof value !== 'boolean') {
      throw new Error(`Feature ${feature} must be a boolean, got ${typeof value}`);
    }
  }

  // Validate file extensions match template
  const expectedExtension = template === 'vite-react-ts' ? '.tsx' : '.jsx';
  const jsxFiles = [
    ...spec.fileStructure.pages,
    ...spec.fileStructure.layouts,
    ...spec.fileStructure.components,
    ...spec.fileStructure.routing,
    ...spec.fileStructure.entry.filter(f => f.path.includes('src/'))
  ];

  for (const file of jsxFiles) {
    if (file.path.includes('.js') && !file.path.endsWith(expectedExtension)) {
      console.warn(`[${new Date().toISOString()}] [WARN] [Architecture Agent] File ${file.path} should use ${expectedExtension} extension for template ${template}`);
    }
  }
}
