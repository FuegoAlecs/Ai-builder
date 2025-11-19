import { FIX_PROMPT } from '../prompts/systemPrompts.js';
import { callGroqStream } from '../utils/groqClient.js';

/**
 * Fix Agent - Corrects React component code based on quality review
 * 
 * SINGLE-FILE MODE:
 * @param {string} code - Original React component code with issues
 * @param {Object} qualityReport - Quality review report from Quality Agent
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {Function} onChunk - Callback function for streaming fixed code chunks
 * @returns {Promise<string>} Complete corrected React component code
 * 
 * MULTI-FILE MODE:
 * @param {Array} files - Array of file objects with path and content properties
 * @param {Object} qualityReport - Quality review report with fileIssues and crossFileIssues
 * @param {Object} architectureSpec - Architecture specification for context
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {Function} onFileStart - Callback when starting to fix a file (filePath)
 * @param {Function} onChunk - Callback for streaming code chunks
 * @param {Function} onFileComplete - Callback when file fix is complete (filePath, content)
 * @returns {Promise<Array>} Array of all files (fixed + unchanged)
 * 
 * @throws {Error} If code fixing fails
 */
export async function fixAgent(
  codeOrFiles,
  qualityReport,
  conversationHistoryOrArchSpec,
  onChunkOrConversationHistory,
  onFileStart,
  onChunk,
  onFileComplete
) {
  try {
    // Detect mode: single-file or multi-file
    const isMultiFile = Array.isArray(codeOrFiles);
    
    if (isMultiFile) {
      // Multi-file mode
      return await fixMultipleFiles(
        codeOrFiles, // files array
        qualityReport,
        conversationHistoryOrArchSpec, // architectureSpec
        onChunkOrConversationHistory, // conversationHistory
        onFileStart,
        onChunk,
        onFileComplete
      );
    } else {
      // Single-file mode (backward compatibility)
      return await fixSingleFile(
        codeOrFiles, // code string
        qualityReport,
        conversationHistoryOrArchSpec, // conversationHistory
        onChunkOrConversationHistory // onChunk
      );
    }
    
  } catch (error) {
    const errorMessage = `Fix Agent failed: ${error.message}`;
    console.error(`[${new Date().toISOString()}] [ERROR] [Fix Agent]`, error);
    throw new Error(errorMessage);
  }
}

/**
 * Fix a single React component (backward compatibility)
 */
async function fixSingleFile(code, qualityReport, conversationHistory = [], onChunk) {
  // Validate required parameters
  if (!code || typeof code !== 'string') {
    throw new Error('Code is required and must be a string');
  }
  
  if (!qualityReport || typeof qualityReport !== 'object') {
    throw new Error('Quality report is required and must be an object');
  }
  
  if (!onChunk || typeof onChunk !== 'function') {
    throw new Error('onChunk callback is required and must be a function');
  }
  
  // Build messages array with system prompt, original code, and quality issues
  const messages = [
    {
      role: 'system',
      content: FIX_PROMPT
    },
    {
      role: 'system',
      content: `Original Code:\n\`\`\`jsx\n${code}\n\`\`\`\n\nQuality Review Report:\n${JSON.stringify(qualityReport, null, 2)}`
    }
  ];
  
  // Add conversation history if provided
  if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }
  
  // Add user instruction
  messages.push({
    role: 'user',
    content: 'Please fix all the issues identified in the quality review report while preserving the original functionality and design.'
  });
  
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Starting code correction...`);
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Issues to fix: ${qualityReport.issues?.length || 0}`);
  
  // Call Groq API with streaming enabled
  const fixedCode = await callGroqStream(
    {
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.2,
      max_tokens: 4096
    },
    onChunk
  );
  
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Code correction complete. Length: ${fixedCode.length} characters`);
  
  return fixedCode;
}

/**
 * Fix multiple files in a website project
 */
async function fixMultipleFiles(
  files,
  qualityReport,
  architectureSpec,
  conversationHistory = [],
  onFileStart,
  onChunk,
  onFileComplete
) {
  // Validate required parameters
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('Files array is required and must not be empty');
  }
  
  if (!qualityReport || typeof qualityReport !== 'object') {
    throw new Error('Quality report is required and must be an object');
  }
  
  if (!onFileStart || typeof onFileStart !== 'function') {
    throw new Error('onFileStart callback is required and must be a function');
  }
  
  if (!onChunk || typeof onChunk !== 'function') {
    throw new Error('onChunk callback is required and must be a function');
  }
  
  if (!onFileComplete || typeof onFileComplete !== 'function') {
    throw new Error('onFileComplete callback is required and must be a function');
  }
  
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Starting multi-file correction...`);
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Total files: ${files.length}`);
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Files with issues: ${qualityReport.filesWithIssues?.length || 0}`);
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Cross-file issues: ${qualityReport.crossFileIssues?.length || 0}`);
  
  // Identify files that need fixing
  const filesWithIssues = qualityReport.filesWithIssues || [];
  const fileIssuesMap = qualityReport.fileIssues || {};
  const crossFileIssues = qualityReport.crossFileIssues || [];
  
  // Create a map of files by path for easy lookup
  const fileMap = new Map();
  files.forEach(file => {
    fileMap.set(file.path, file);
  });
  
  // Result array with all files (fixed + unchanged)
  const resultFiles = [];
  
  // Fix files that have issues
  for (const filePath of filesWithIssues) {
    const originalFile = fileMap.get(filePath);
    
    if (!originalFile) {
      console.warn(`[${new Date().toISOString()}] [WARN] [Fix Agent] File not found: ${filePath}`);
      continue;
    }
    
    try {
      // Notify that we're starting to fix this file
      onFileStart(filePath);
      
      console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Fixing file: ${filePath}`);
      
      // Get issues for this specific file
      const fileSpecificIssues = fileIssuesMap[filePath] || [];
      
      // Get cross-file issues that affect this file
      const relevantCrossFileIssues = crossFileIssues.filter(issue => 
        issue.affectedFiles && issue.affectedFiles.includes(filePath)
      );
      
      // Build context about other files for cross-file fixes
      const relatedFiles = getRelatedFiles(filePath, files, relevantCrossFileIssues);
      
      // Build messages for fixing this file
      const messages = [
        {
          role: 'system',
          content: FIX_PROMPT
        },
        {
          role: 'system',
          content: buildMultiFileFixContext(
            originalFile,
            fileSpecificIssues,
            relevantCrossFileIssues,
            relatedFiles,
            architectureSpec
          )
        }
      ];
      
      // Add conversation history if provided
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }
      
      // Add user instruction
      messages.push({
        role: 'user',
        content: 'Please fix all the issues identified in the quality review report. Pay special attention to cross-file issues like import paths, routing configuration, and component references. Ensure consistency with other files in the project.'
      });
      
      // Call Groq API with streaming enabled
      const fixedContent = await callGroqStream(
        {
          model: 'openai/gpt-oss-120b',
          messages,
          temperature: 0.2,
          max_tokens: 8192 // Increased for larger files
        },
        onChunk
      );
      
      console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Fixed file: ${filePath} (${fixedContent.length} characters)`);
      
      // Add fixed file to results
      const fixedFile = {
        path: filePath,
        content: fixedContent
      };
      resultFiles.push(fixedFile);
      
      // Notify that file fix is complete
      onFileComplete(filePath, fixedContent);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [ERROR] [Fix Agent] Failed to fix file: ${filePath}`, error);
      // Keep original file if fix fails
      resultFiles.push(originalFile);
      onFileComplete(filePath, originalFile.content);
    }
  }
  
  // Add unchanged files to results
  files.forEach(file => {
    if (!filesWithIssues.includes(file.path)) {
      resultFiles.push(file);
    }
  });
  
  console.log(`[${new Date().toISOString()}] [INFO] [Fix Agent] Multi-file correction complete. Fixed ${filesWithIssues.length} files, kept ${files.length - filesWithIssues.length} unchanged.`);
  
  return resultFiles;
}

/**
 * Build context for fixing a file with cross-file awareness
 */
function buildMultiFileFixContext(file, fileIssues, crossFileIssues, relatedFiles, architectureSpec) {
  let context = `File to Fix: ${file.path}\n\n`;
  context += `Original Code:\n\`\`\`jsx\n${file.content}\n\`\`\`\n\n`;
  
  // Add file-specific issues
  if (fileIssues.length > 0) {
    context += `File-Specific Issues:\n${JSON.stringify(fileIssues, null, 2)}\n\n`;
  }
  
  // Add cross-file issues
  if (crossFileIssues.length > 0) {
    context += `Cross-File Issues Affecting This File:\n${JSON.stringify(crossFileIssues, null, 2)}\n\n`;
  }
  
  // Add related files for context
  if (relatedFiles.length > 0) {
    context += `Related Files (for cross-file fixes):\n`;
    relatedFiles.forEach(relatedFile => {
      context += `\n${relatedFile.path}:\n\`\`\`jsx\n${relatedFile.content}\n\`\`\`\n`;
    });
    context += '\n';
  }
  
  // Add architecture context if available
  if (architectureSpec) {
    context += `Architecture Context:\n${JSON.stringify(architectureSpec, null, 2)}\n\n`;
  }
  
  return context;
}

/**
 * Get related files that are referenced in cross-file issues
 */
function getRelatedFiles(filePath, allFiles, crossFileIssues) {
  const relatedPaths = new Set();
  
  // Extract related file paths from cross-file issues
  crossFileIssues.forEach(issue => {
    if (issue.affectedFiles) {
      issue.affectedFiles.forEach(path => {
        if (path !== filePath) {
          relatedPaths.add(path);
        }
      });
    }
  });
  
  // Get the actual file objects
  const relatedFiles = [];
  allFiles.forEach(file => {
    if (relatedPaths.has(file.path)) {
      relatedFiles.push(file);
    }
  });
  
  return relatedFiles;
}
