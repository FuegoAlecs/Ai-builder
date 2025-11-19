import { QUALITY_REVIEW_PROMPT } from '../prompts/systemPrompts.js';
import { callGroq, parseJSON } from '../utils/groqClient.js';

/**
 * Quality Agent - Reviews generated code for bugs, performance, accessibility, UX, and security issues
 * Supports both single component review and multi-file website review
 * 
 * @param {string|Array} codeOrFiles - Single component code string OR array of file objects [{path, content}]
 * @param {Object} architectureSpec - Architecture specification (optional, for multi-file review)
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Promise<Object>} Quality review object
 * @throws {Error} If quality review fails
 */
export async function qualityAgent(codeOrFiles, architectureSpec = null, conversationHistory = []) {
  try {
    // Determine if this is single-file or multi-file review
    const isMultiFile = Array.isArray(codeOrFiles);
    
    // Validate input
    if (isMultiFile) {
      if (codeOrFiles.length === 0) {
        throw new Error('Files array cannot be empty');
      }
      
      // Validate each file object
      for (const file of codeOrFiles) {
        if (!file.path || typeof file.path !== 'string') {
          throw new Error('Each file must have a valid path string');
        }
        if (!file.content || typeof file.content !== 'string') {
          throw new Error('Each file must have valid content string');
        }
      }
    } else {
      if (!codeOrFiles || typeof codeOrFiles !== 'string') {
        throw new Error('Code is required and must be a string');
      }
    }
    
    // Build messages array with system prompt
    const messages = [
      {
        role: 'system',
        content: QUALITY_REVIEW_PROMPT
      }
    ];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Build review request based on input type
    let reviewContent;
    if (isMultiFile) {
      // Multi-file review
      reviewContent = 'Please review the following multi-file React website project:\n\n';
      
      // Add architecture spec if provided
      if (architectureSpec) {
        reviewContent += `## Architecture Specification:\n${JSON.stringify(architectureSpec, null, 2)}\n\n`;
      }
      
      // Add all files
      reviewContent += '## Files to Review:\n\n';
      for (const file of codeOrFiles) {
        reviewContent += `### File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      }
      
      reviewContent += '\nPlease check for:\n';
      reviewContent += '1. Issues within each file (bugs, performance, a11y, UX, security)\n';
      reviewContent += '2. Cross-file issues (import paths, routing mismatches, missing dependencies, styling inconsistencies)\n';
      reviewContent += '3. Validate that all imports resolve correctly\n';
      reviewContent += '4. Ensure routing configuration matches page components\n';
      reviewContent += '5. Check package.json includes all required dependencies\n';
      
      console.log(`[${new Date().toISOString()}] [INFO] [Quality Agent] Starting multi-file review for ${codeOrFiles.length} files...`);
    } else {
      // Single component review
      reviewContent = `Please review the following React component code:\n\n${codeOrFiles}`;
      console.log(`[${new Date().toISOString()}] [INFO] [Quality Agent] Starting single component review...`);
    }
    
    messages.push({
      role: 'user',
      content: reviewContent
    });
    
    // Call Groq API with non-streaming mode
    const response = await callGroq({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.3,
      max_tokens: 8192 // Increased for multi-file reviews
    });
    
    // Extract content from response
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from Groq API');
    }
    
    console.log(`[${new Date().toISOString()}] [INFO] [Quality Agent] Received response, parsing JSON...`);
    
    // Parse JSON response
    const qualityReview = parseJSON(content);
    
    // Validate response based on review type
    if (isMultiFile) {
      // Validate multi-file response
      if (!qualityReview.hasOwnProperty('fileIssues')) {
        throw new Error('Multi-file quality review missing required field: fileIssues');
      }
      
      if (!qualityReview.hasOwnProperty('crossFileIssues')) {
        throw new Error('Multi-file quality review missing required field: crossFileIssues');
      }
      
      if (!qualityReview.hasOwnProperty('filesWithIssues')) {
        throw new Error('Multi-file quality review missing required field: filesWithIssues');
      }
      
      if (typeof qualityReview.fileIssues !== 'object' || qualityReview.fileIssues === null) {
        throw new Error('Quality review field "fileIssues" must be an object');
      }
      
      if (!Array.isArray(qualityReview.crossFileIssues)) {
        throw new Error('Quality review field "crossFileIssues" must be an array');
      }
      
      if (!Array.isArray(qualityReview.filesWithIssues)) {
        throw new Error('Quality review field "filesWithIssues" must be an array');
      }
      
      // Count total issues
      const fileIssueCount = Object.values(qualityReview.fileIssues).reduce((sum, issues) => sum + issues.length, 0);
      const crossFileIssueCount = qualityReview.crossFileIssues.length;
      const totalIssues = fileIssueCount + crossFileIssueCount;
      
      console.log(`[${new Date().toISOString()}] [INFO] [Quality Agent] Multi-file review complete. File issues: ${fileIssueCount}, Cross-file issues: ${crossFileIssueCount}, Files with issues: ${qualityReview.filesWithIssues.length}, Needs revision: ${qualityReview.needsRevision}, Quality: ${qualityReview.overallQuality}`);
    } else {
      // Validate single-file response
      if (!qualityReview.hasOwnProperty('issues')) {
        throw new Error('Quality review missing required field: issues');
      }
      
      if (!Array.isArray(qualityReview.issues)) {
        throw new Error('Quality review field "issues" must be an array');
      }
      
      console.log(`[${new Date().toISOString()}] [INFO] [Quality Agent] Single component review complete. Issues found: ${qualityReview.issues.length}, Needs revision: ${qualityReview.needsRevision}, Quality: ${qualityReview.overallQuality}`);
    }
    
    // Validate common fields
    if (!qualityReview.hasOwnProperty('needsRevision')) {
      throw new Error('Quality review missing required field: needsRevision');
    }
    
    if (!qualityReview.hasOwnProperty('overallQuality')) {
      throw new Error('Quality review missing required field: overallQuality');
    }
    
    if (typeof qualityReview.needsRevision !== 'boolean') {
      throw new Error('Quality review field "needsRevision" must be a boolean');
    }
    
    if (typeof qualityReview.overallQuality !== 'string') {
      throw new Error('Quality review field "overallQuality" must be a string');
    }
    
    return qualityReview;
    
  } catch (error) {
    const errorMessage = `Quality Agent failed: ${error.message}`;
    console.error(`[${new Date().toISOString()}] [ERROR] [Quality Agent]`, error);
    throw new Error(errorMessage);
  }
}
