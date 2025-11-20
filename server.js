import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { architectureAgent } from './agents/architectureAgent.js';
import { planningAgent } from './agents/planningAgent.js';
import { designAgent } from './agents/designAgent.js';
import { codeAgent, codeAgentMultiFile } from './agents/codeAgent.js';
import { qualityAgent } from './agents/qualityAgent.js';
import { fixAgent } from './agents/fixAgent.js';
import { SIMPLE_GENERATION_PROMPT } from './prompts/systemPrompts.js';
import { createGroqClient, callGroqStream } from './utils/groqClient.js';

// Load environment variables
dotenv.config();

/**
 * Sets up SSE headers for Server-Sent Events streaming
 * @param {express.Response} res - Express response object
 */
function setupSSEHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

/**
 * Sends a Server-Sent Event to the client
 * @param {express.Response} res - Express response object
 * @param {Object} data - Data to send as SSE event
 * @returns {boolean} True if sent successfully, false if connection is closed
 */
function sendSSE(res, data) {
  try {
    // Check if connection is still open
    if (res.writableEnded || res.destroyed) {
      console.warn(`[${new Date().toISOString()}] [WARN] [SSE] Attempted to write to closed connection`);
      return false;
    }
    
    // Format data as SSE event with data: prefix and double newline
    const formattedData = `data: ${JSON.stringify(data)}\n\n`;
    
    // Write to response stream
    res.write(formattedData);
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [SSE] Failed to send SSE event:`, error);
    return false;
  }
}

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
function validateEnvironment() {
  const required = ['GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`[${new Date().toISOString()}] [ERROR] [Environment] ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  // Log configuration (without sensitive values)
  console.log(`[${new Date().toISOString()}] [INFO] [Environment] Configuration validated`);
  console.log(`[${new Date().toISOString()}] [INFO] [Environment] PORT: ${process.env.PORT || 3000}`);
  console.log(`[${new Date().toISOString()}] [INFO] [Environment] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[${new Date().toISOString()}] [INFO] [Environment] FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set (allowing all origins in development)'}`);
  console.log(`[${new Date().toISOString()}] [INFO] [Environment] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '***configured***' : 'missing'}`);
}

/**
 * Creates and configures the Express application
 * @returns {express.Application} Configured Express app
 */
function createApp() {
  const app = express();
  
  // Configure CORS
  const corsOptions = {
    origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : '*'),
    credentials: true
  };
  
  app.use(cors(corsOptions));
  console.log(`[${new Date().toISOString()}] [INFO] [Middleware] CORS configured with origin: ${corsOptions.origin}`);
  
  // Configure JSON parsing
  app.use(express.json());
  console.log(`[${new Date().toISOString()}] [INFO] [Middleware] JSON parser configured`);
  
  // Request logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] [INFO] [Request] ${method} ${path} from ${ip}`);
    next();
  });
  console.log(`[${new Date().toISOString()}] [INFO] [Middleware] Request logging configured`);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    try {
      res.status(200).json({
        status: 'ok',
        model: 'gpt-oss-120b'
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [ERROR] [Health] Health check failed:`, error);
      res.status(500).json({
        status: 'error',
        error: 'Health check failed'
      });
    }
  });
  
  // Simple generation endpoint
  app.post('/generate-simple', async (req, res) => {
    const startTime = Date.now();
    let timeout;
    
    try {
      // Validate request body
      const { prompt, model, conversationHistory } = req.body;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Prompt is required and must be a non-empty string' 
        });
      }
      
      // Validate conversationHistory if provided
      if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
        return res.status(400).json({ 
          error: 'conversationHistory must be an array' 
        });
      }
      
      console.log(`[${new Date().toISOString()}] [INFO] [Simple Generation] Starting generation for prompt: "${prompt.substring(0, 50)}..."`);
      
      // Set SSE response headers
      setupSSEHeaders(res);
      
      // Implement 60-second timeout
      timeout = setTimeout(() => {
        console.error(`[${new Date().toISOString()}] [ERROR] [Simple Generation] Request timeout after 60 seconds`);
        sendSSE(res, { error: 'Request timeout - generation took longer than 60 seconds' });
        res.end();
      }, 60000);
      
      // Initialize Groq client
      createGroqClient(process.env.GROQ_API_KEY);
      
      // Build messages array with system prompt and conversation history
      const messages = [
        { role: 'system', content: SIMPLE_GENERATION_PROMPT }
      ];
      
      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }
      
      // Add current user prompt
      messages.push({ role: 'user', content: prompt });
      
      // Call Groq API with streaming
      const modelName = model || 'openai/gpt-oss-120b';
      
      let fullCode = '';
      
      await callGroqStream(
        {
          model: modelName,
          messages,
          temperature: 0.2,
          max_tokens: 4096
        },
        (chunk) => {
          // Stream code chunks as SSE events
          fullCode += chunk;
          sendSSE(res, { chunk });
        }
      );
      
      // Send completion event
      sendSSE(res, { 
        stage: 'complete', 
        code: fullCode 
      });
      
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] [INFO] [Simple Generation] Completed in ${duration}ms`);
      
      // Clear timeout and close SSE stream
      clearTimeout(timeout);
      res.end();
      
    } catch (error) {
      // Clear timeout on error
      if (timeout) {
        clearTimeout(timeout);
      }
      
      console.error(`[${new Date().toISOString()}] [ERROR] [Simple Generation] Error:`, error);
      
      // Send error event via SSE if headers already sent
      if (res.headersSent) {
        sendSSE(res, { 
          error: error.message || 'An error occurred during code generation' 
        });
        res.end();
      } else {
        // Send JSON error response if headers not sent yet
        res.status(500).json({ 
          error: error.message || 'An error occurred during code generation' 
        });
      }
    }
  });

  // Advanced generation endpoint with multi-agent pipeline
  app.post('/generate-advanced', async (req, res) => {
    const startTime = Date.now();
    let timeout;
    
    try {
      // Validate request body
      const { prompt, conversationHistory, enableQA } = req.body;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Prompt is required and must be a non-empty string' 
        });
      }
      
      // Validate conversationHistory if provided
      if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
        return res.status(400).json({ 
          error: 'conversationHistory must be an array' 
        });
      }
      
      // Set enableQA with default value of true
      const qaEnabled = enableQA !== undefined ? Boolean(enableQA) : true;
      
      console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting pipeline for prompt: "${prompt.substring(0, 50)}..." (QA: ${qaEnabled})`);
      
      // Set SSE response headers
      setupSSEHeaders(res);
      
      // Implement 60-second timeout
      timeout = setTimeout(() => {
        console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Request timeout after 60 seconds`);
        sendSSE(res, { error: 'Request timeout - generation took longer than 60 seconds' });
        res.end();
      }, 60000);
      
      // Initialize Groq client
      createGroqClient(process.env.GROQ_API_KEY);
      
      // PLANNING STAGE
      let technicalSpec;
      try {
        // Send progress event for planning stage
        sendSSE(res, { 
          stage: 'planning', 
          progress: 10 
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting Planning Agent...`);
        const planningStartTime = Date.now();
        
        // Call planningAgent with prompt and conversationHistory
        technicalSpec = await planningAgent(prompt, conversationHistory || []);
        
        const planningDuration = Date.now() - planningStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Planning Agent completed in ${planningDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Technical Spec:`, JSON.stringify(technicalSpec, null, 2));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Planning Agent failed:`, error);
        sendSSE(res, { 
          error: `Planning stage failed: ${error.message}`,
          stage: 'planning'
        });
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // DESIGN STAGE
      let designSystem;
      try {
        // Send progress event for design stage
        sendSSE(res, { 
          stage: 'designing', 
          progress: 30 
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting Design Agent...`);
        const designStartTime = Date.now();
        
        // Call designAgent with technicalSpec and conversationHistory
        designSystem = await designAgent(technicalSpec, conversationHistory || []);
        
        const designDuration = Date.now() - designStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Design Agent completed in ${designDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Design System:`, JSON.stringify(designSystem, null, 2));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Design Agent failed:`, error);
        sendSSE(res, { 
          error: `Design stage failed: ${error.message}`,
          stage: 'designing'
        });
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // CODE GENERATION STAGE
      let generatedCode;
      try {
        // Send progress event for code generation stage
        sendSSE(res, { 
          stage: 'generating', 
          progress: 50 
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting Code Agent...`);
        const codeStartTime = Date.now();
        
        // Call codeAgent with prompt, technicalSpec, designSystem, conversationHistory, and onChunk callback
        generatedCode = await codeAgent(
          prompt,
          technicalSpec,
          designSystem,
          conversationHistory || [],
          (chunk) => {
            // Send code chunk events via SSE
            sendSSE(res, { chunk });
          }
        );
        
        const codeDuration = Date.now() - codeStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Code Agent completed in ${codeDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Generated code length: ${generatedCode.length} characters`);
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Code Agent failed:`, error);
        sendSSE(res, { 
          error: `Code generation stage failed: ${error.message}`,
          stage: 'generating'
        });
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // QUALITY ASSURANCE STAGE
      let qualityReport;
      let finalCode = generatedCode;
      
      if (qaEnabled) {
        try {
          // Send progress event for quality review stage
          sendSSE(res, { 
            stage: 'reviewing', 
            progress: 75 
          });
          
          console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting Quality Agent...`);
          const qualityStartTime = Date.now();
          
          // Call qualityAgent with generated code and conversationHistory
          qualityReport = await qualityAgent(generatedCode, conversationHistory || []);
          
          const qualityDuration = Date.now() - qualityStartTime;
          console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Quality Agent completed in ${qualityDuration}ms`);
          console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Quality Report:`, JSON.stringify(qualityReport, null, 2));
          
          // Send quality review results as SSE event
          sendSSE(res, { 
            review: qualityReport 
          });
          
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Quality Agent failed:`, error);
          sendSSE(res, { 
            error: `Quality review stage failed: ${error.message}`,
            stage: 'reviewing'
          });
          clearTimeout(timeout);
          res.end();
          return;
        }
        
        // FIX STAGE
        // Check if quality report indicates needsRevision is true
        if (qualityReport && qualityReport.needsRevision === true) {
          try {
            // Send progress event for fixing stage
            sendSSE(res, { 
              stage: 'fixing', 
              progress: 85 
            });
            
            console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Starting Fix Agent...`);
            const fixStartTime = Date.now();
            
            // Call fixAgent with code, qualityReport, conversationHistory, and onChunk callback
            const fixedCode = await fixAgent(
              generatedCode,
              qualityReport,
              conversationHistory || [],
              (chunk) => {
                // Send fixed code chunk events via SSE
                sendSSE(res, { chunk });
              }
            );
            
            // Update code variable with fixed code
            finalCode = fixedCode;
            
            const fixDuration = Date.now() - fixStartTime;
            console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Fix Agent completed in ${fixDuration}ms`);
            console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Fixed code length: ${fixedCode.length} characters`);
            
          } catch (error) {
            console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Fix Agent failed:`, error);
            sendSSE(res, { 
              error: `Fix stage failed: ${error.message}`,
              stage: 'fixing'
            });
            clearTimeout(timeout);
            res.end();
            return;
          }
        }
      }
      
      // COMPLETION STAGE
      // Send final progress event with complete status and final code
      sendSSE(res, { 
        stage: 'complete', 
        progress: 100,
        code: finalCode
      });
      
      // Log request completion with total duration
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] [INFO] [Advanced Generation] Pipeline completed successfully in ${duration}ms`);
      
      // Clear timeout and close SSE stream
      clearTimeout(timeout);
      res.end();
      
    } catch (error) {
      // Clear timeout on error
      if (timeout) {
        clearTimeout(timeout);
      }
      
      console.error(`[${new Date().toISOString()}] [ERROR] [Advanced Generation] Pipeline error:`, error);
      
      // Send error event via SSE if headers already sent
      if (res.headersSent) {
        sendSSE(res, { 
          error: error.message || 'An error occurred during advanced generation',
          stage: 'pipeline'
        });
        res.end();
      } else {
        // Send JSON error response if headers not sent yet
        res.status(500).json({ 
          error: error.message || 'An error occurred during advanced generation' 
        });
      }
    }
  });

  // Website generation endpoint with multi-agent pipeline
  app.post('/generate-website', async (req, res) => {
    const startTime = Date.now();
    let timeout;
    
    try {
      // Validate request body
      const { prompt, template, conversationHistory, enableQA } = req.body;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Prompt is required and must be a non-empty string' 
        });
      }
      
      // Validate template if provided
      if (template !== undefined) {
        const validTemplates = ['vite-react', 'nextjs', 'vite-react-ts'];
        if (!validTemplates.includes(template)) {
          return res.status(400).json({ 
            error: `Invalid template: ${template}. Must be one of: ${validTemplates.join(', ')}` 
          });
        }
      }
      
      // Validate conversationHistory if provided
      if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
        return res.status(400).json({ 
          error: 'conversationHistory must be an array' 
        });
      }
      
      // Set template with default value
      const selectedTemplate = template || 'vite-react';
      
      // Set enableQA with default value of true
      const qaEnabled = enableQA !== undefined ? Boolean(enableQA) : true;
      
      console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting pipeline for prompt: "${prompt.substring(0, 50)}..." (Template: ${selectedTemplate}, QA: ${qaEnabled})`);
      
      // Set SSE response headers
      setupSSEHeaders(res);
      
      // Implement 120-second timeout for websites (longer than single components)
      timeout = setTimeout(() => {
        console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Request timeout after 120 seconds`);
        sendSSE(res, { error: 'Request timeout - generation took longer than 120 seconds' });
        res.end();
      }, 120000);
      
      // Initialize Groq client
      createGroqClient(process.env.GROQ_API_KEY);
      
      // ARCHITECTURE STAGE
      let architectureSpec;
      try {
        // Send progress event for architecture stage
        sendSSE(res, { 
          stage: 'architecture', 
          progress: 5,
          message: 'Planning project structure...'
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Architecture Agent...`);
        const architectureStartTime = Date.now();
        
        // Call architectureAgent with prompt, template, and conversationHistory
        architectureSpec = await architectureAgent(prompt, selectedTemplate, conversationHistory || []);
        
        // Validate architecture spec structure
        if (!architectureSpec || typeof architectureSpec !== 'object') {
          throw new Error('Architecture Agent returned invalid specification format');
        }
        
        if (!architectureSpec.fileStructure || typeof architectureSpec.fileStructure !== 'object') {
          throw new Error('Architecture specification missing fileStructure');
        }
        
        const architectureDuration = Date.now() - architectureStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Architecture Agent completed in ${architectureDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Architecture Spec:`, JSON.stringify(architectureSpec, null, 2));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Architecture Agent failed:`, error);
        
        // Send detailed error with stage information
        sendSSE(res, { 
          error: `Architecture planning failed: ${error.message}`,
          stage: 'architecture',
          details: 'Unable to generate project structure. Please try again with a more detailed prompt.'
        });
        
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // PLANNING STAGE
      let planningSpec;
      try {
        // Send progress event for planning stage
        sendSSE(res, { 
          stage: 'planning', 
          progress: 15,
          message: 'Creating technical specifications...'
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Planning Agent...`);
        const planningStartTime = Date.now();
        
        // Call planningAgent with prompt, architectureSpec, and conversationHistory
        planningSpec = await planningAgent(prompt, architectureSpec, conversationHistory || []);
        
        const planningDuration = Date.now() - planningStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Planning Agent completed in ${planningDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Planning Spec:`, JSON.stringify(planningSpec, null, 2));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Planning Agent failed:`, error);
        sendSSE(res, { 
          error: `Planning stage failed: ${error.message}`,
          stage: 'planning'
        });
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // DESIGN STAGE
      let designSystem;
      try {
        // Send progress event for design stage
        sendSSE(res, { 
          stage: 'designing', 
          progress: 25,
          message: 'Creating design system...'
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Design Agent...`);
        const designStartTime = Date.now();
        
        // Call designAgent with architectureSpec, planningSpec, and conversationHistory
        designSystem = await designAgent(architectureSpec, planningSpec, conversationHistory || []);
        
        const designDuration = Date.now() - designStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Design Agent completed in ${designDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Design System:`, JSON.stringify(designSystem, null, 2));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Design Agent failed:`, error);
        sendSSE(res, { 
          error: `Design stage failed: ${error.message}`,
          stage: 'designing'
        });
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // MULTI-FILE CODE GENERATION STAGE
      let generatedFiles = [];
      const fileGenerationErrors = [];
      
      try {
        // Send progress event for code generation stage
        sendSSE(res, { 
          stage: 'generating', 
          progress: 40,
          message: 'Generating website files...'
        });
        
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Multi-File Code Agent...`);
        const codeStartTime = Date.now();
        
        // Calculate total files for progress tracking
        const fileStructure = architectureSpec.fileStructure;
        const totalFiles = 
          (fileStructure.config?.length || 0) +
          (fileStructure.entry?.length || 0) +
          (fileStructure.routing?.length || 0) +
          (fileStructure.layouts?.length || 0) +
          (fileStructure.components?.length || 0) +
          (fileStructure.pages?.length || 0);
        
        let filesCompleted = 0;
        
        // Call codeAgentMultiFile with callbacks for progress tracking
        generatedFiles = await codeAgentMultiFile(
          prompt,
          architectureSpec,
          planningSpec,
          designSystem,
          conversationHistory || [],
          // onFileStart callback
          (filePath) => {
            console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting file: ${filePath}`);
            
            // Calculate progress between 40% and 80% based on files completed
            const fileProgress = 40 + Math.floor((filesCompleted / totalFiles) * 40);
            
            sendSSE(res, {
              stage: 'generating',
              progress: fileProgress,
              currentFile: filePath,
              filesCompleted: filesCompleted,
              totalFiles: totalFiles,
              message: `Generating ${filePath}...`
            });
          },
          // onChunk callback
          (chunk) => {
            // Stream code chunks (optional, can be used for real-time preview)
            // Not sending chunks to reduce SSE traffic for multi-file generation
          },
          // onFileComplete callback
          (file) => {
            filesCompleted++;
            
            // Check if this file has an error marker
            if (file.content && file.content.includes('// Error generating this file:')) {
              fileGenerationErrors.push({
                fileName: file.path,
                error: 'File generation failed'
              });
              
              // Send error event for this specific file
              sendSSE(res, {
                stage: 'generating',
                progress: 40 + Math.floor((filesCompleted / totalFiles) * 40),
                error: `Failed to generate ${file.path}`,
                fileName: file.path,
                filesCompleted: filesCompleted,
                totalFiles: totalFiles
              });
            } else {
              console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Completed file: ${file.path} (${filesCompleted}/${totalFiles})`);
              
              // Calculate progress between 40% and 80% based on files completed
              const fileProgress = 40 + Math.floor((filesCompleted / totalFiles) * 40);
              
              sendSSE(res, {
                stage: 'generating',
                progress: fileProgress,
                filesCompleted: filesCompleted,
                totalFiles: totalFiles,
                fileComplete: {
                  path: file.path,
                  size: file.content.length
                }
              });
            }
          }
        );
        
        const codeDuration = Date.now() - codeStartTime;
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Multi-File Code Agent completed in ${codeDuration}ms`);
        console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Generated ${generatedFiles.length} files`);
        
        // Validate all required files are present
        const missingFiles = validateRequiredFiles(architectureSpec, generatedFiles);
        
        // Check if we have critical failures
        const hasErrors = fileGenerationErrors.length > 0 || missingFiles.length > 0;
        
        if (hasErrors) {
          const errorSummary = [];
          
          if (fileGenerationErrors.length > 0) {
            console.warn(`[${new Date().toISOString()}] [WARN] [Website Generation] ${fileGenerationErrors.length} file(s) failed to generate`);
            errorSummary.push(`${fileGenerationErrors.length} file(s) failed to generate`);
          }
          
          if (missingFiles.length > 0) {
            console.warn(`[${new Date().toISOString()}] [WARN] [Website Generation] Missing required files: ${missingFiles.join(', ')}`);
            errorSummary.push(`${missingFiles.length} required file(s) missing`);
          }
          
          // Send warning event with details
          sendSSE(res, {
            stage: 'generating',
            progress: 80,
            warning: errorSummary.join('; '),
            fileGenerationErrors: fileGenerationErrors,
            missingFiles: missingFiles,
            message: 'Code generation completed with warnings'
          });
          
          // If too many critical files are missing, fail the generation
          const criticalFiles = ['package.json', 'index.html', 'src/main.jsx', 'src/App.jsx'];
          const missingCriticalFiles = missingFiles.filter(f => 
            criticalFiles.some(cf => f.includes(cf))
          );
          
          if (missingCriticalFiles.length > 0) {
            throw new Error(`Critical files missing: ${missingCriticalFiles.join(', ')}. Cannot proceed with website generation.`);
          }
        }
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Multi-File Code Agent failed:`, error);
        
        // Send detailed error with file information if available
        const errorData = { 
          error: `Code generation stage failed: ${error.message}`,
          stage: 'generating'
        };
        
        if (fileGenerationErrors.length > 0) {
          errorData.fileGenerationErrors = fileGenerationErrors;
          errorData.details = `${fileGenerationErrors.length} file(s) failed during generation`;
        }
        
        sendSSE(res, errorData);
        clearTimeout(timeout);
        res.end();
        return;
      }
      
      // QUALITY ASSURANCE STAGE
      let qualityReport;
      let finalFiles = generatedFiles;
      
      if (qaEnabled) {
        try {
          // Send progress event for quality review stage
          sendSSE(res, { 
            stage: 'reviewing', 
            progress: 85,
            message: 'Reviewing code quality...'
          });
          
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Quality Agent...`);
          const qualityStartTime = Date.now();
          
          // Call qualityAgent with generated files, architectureSpec, and conversationHistory
          qualityReport = await qualityAgent(generatedFiles, architectureSpec, conversationHistory || []);
          
          const qualityDuration = Date.now() - qualityStartTime;
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Quality Agent completed in ${qualityDuration}ms`);
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Quality Report:`, JSON.stringify(qualityReport, null, 2));
          
          // Send quality review summary as SSE event
          sendSSE(res, { 
            review: {
              filesWithIssues: qualityReport.filesWithIssues || [],
              totalIssues: (Object.values(qualityReport.fileIssues || {}).reduce((sum, issues) => sum + issues.length, 0)) + (qualityReport.crossFileIssues?.length || 0),
              needsRevision: qualityReport.needsRevision,
              overallQuality: qualityReport.overallQuality
            }
          });
          
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Quality Agent failed:`, error);
          sendSSE(res, { 
            error: `Quality review stage failed: ${error.message}`,
            stage: 'reviewing'
          });
          clearTimeout(timeout);
          res.end();
          return;
        }
        
        // FIX STAGE
        // Check if quality report indicates needsRevision is true
        if (qualityReport && qualityReport.needsRevision === true) {
          try {
            // Send progress event for fixing stage
            sendSSE(res, { 
              stage: 'fixing', 
              progress: 90,
              message: 'Fixing identified issues...'
            });
            
            console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Fix Agent...`);
            const fixStartTime = Date.now();
            
            let filesFixed = 0;
            const filesToFix = qualityReport.filesWithIssues?.length || 0;
            
            // Call fixAgent with files, qualityReport, architectureSpec, conversationHistory, and callbacks
            const fixedFiles = await fixAgent(
              generatedFiles,
              qualityReport,
              architectureSpec,
              conversationHistory || [],
              // onFileStart callback
              (filePath) => {
                console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Fixing file: ${filePath}`);
                sendSSE(res, {
                  stage: 'fixing',
                  progress: 90,
                  currentFile: filePath,
                  message: `Fixing ${filePath}...`
                });
              },
              // onChunk callback
              (chunk) => {
                // Stream fixed code chunks (optional)
                // Not sending chunks to reduce SSE traffic
              },
              // onFileComplete callback
              (filePath, content) => {
                filesFixed++;
                console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Fixed file: ${filePath} (${filesFixed}/${filesToFix})`);
                sendSSE(res, {
                  stage: 'fixing',
                  progress: 90,
                  filesFixed: filesFixed,
                  totalFilesToFix: filesToFix
                });
              }
            );
            
            // Update files with fixed versions
            finalFiles = fixedFiles;
            
            const fixDuration = Date.now() - fixStartTime;
            console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Fix Agent completed in ${fixDuration}ms`);
            console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Fixed ${filesToFix} files`);
            
          } catch (error) {
            console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Fix Agent failed:`, error);
            sendSSE(res, { 
              error: `Fix stage failed: ${error.message}`,
              stage: 'fixing',
              warning: 'Continuing with unfixed files'
            });
            // Continue with unfixed files instead of failing completely
          }
        }
      }
      
      // BACKEND GENERATION STAGE (Optional)
      let backendFiles = [];
      const includeBackend = req.body.includeBackend || false;
      
      if (includeBackend) {
        try {
          // Send progress event for backend generation
          sendSSE(res, {
            stage: 'backend',
            progress: 85,
            message: 'Generating backend code...'
          });
          
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Starting Backend Agent...`);
          const backendStartTime = Date.now();
          
          // Import backend agent
          const { backendAgent } = await import('./agents/backendAgent.js');
          
          // Create backend specification from planning spec
          const backendSpec = {
            type: req.body.backendType || 'express',
            database: req.body.database || 'mongodb',
            authentication: req.body.authentication !== false,
            routes: extractRoutesFromPlanning(planningSpec),
            models: extractModelsFromPlanning(planningSpec),
            features: {
              fileUpload: req.body.fileUpload || false,
              emailService: req.body.emailService || false,
              paymentIntegration: req.body.paymentIntegration || false,
              realtime: req.body.realtime || false,
              caching: req.body.caching || false
            }
          };
          
          // Generate backend files
          backendFiles = await backendAgent(
            backendSpec,
            architectureSpec,
            conversationHistory || [],
            (chunk) => {
              // Stream backend generation progress
              sendSSE(res, { chunk });
            }
          );
          
          const backendDuration = Date.now() - backendStartTime;
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Backend Agent completed in ${backendDuration}ms`);
          console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Generated ${backendFiles.length} backend files`);
          
          // Add backend files to final files
          finalFiles = [...finalFiles, ...backendFiles];
          
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Backend Agent failed:`, error);
          sendSSE(res, {
            warning: `Backend generation failed: ${error.message}`,
            stage: 'backend'
          });
          // Continue without backend files
        }
      }
      
      // COMPLETION STAGE
      // Send final progress event with complete status and files array
      sendSSE(res, { 
        stage: 'complete', 
        progress: 100,
        files: finalFiles,
        backendIncluded: includeBackend,
        backendFilesCount: backendFiles.length,
        message: includeBackend ? 'Full-stack application generation complete!' : 'Website generation complete!'
      });
      
      // Log request completion with total duration
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Pipeline completed successfully in ${duration}ms`);
      console.log(`[${new Date().toISOString()}] [INFO] [Website Generation] Total files: ${finalFiles.length}`);
      
      // Clear timeout and close SSE stream
      clearTimeout(timeout);
      res.end();
      
    } catch (error) {
      // Clear timeout on error
      if (timeout) {
        clearTimeout(timeout);
      }
      
      console.error(`[${new Date().toISOString()}] [ERROR] [Website Generation] Pipeline error:`, error);
      
      // Send error event via SSE if headers already sent
      if (res.headersSent) {
        sendSSE(res, { 
          error: error.message || 'An error occurred during website generation',
          stage: 'pipeline'
        });
        res.end();
      } else {
        // Send JSON error response if headers not sent yet
        res.status(500).json({ 
          error: error.message || 'An error occurred during website generation' 
        });
      }
    }
  });
  
  return app;
}

/**
 * Extract API routes from planning specification
 * @param {Object} planningSpec - Planning specification
 * @returns {Array} Array of route objects
 */
function extractRoutesFromPlanning(planningSpec) {
  const routes = [];
  
  // Check if planning spec has pages that need APIs
  if (planningSpec.pages) {
    planningSpec.pages.forEach(page => {
      // Look for data-driven pages that need APIs
      if (page.features && page.features.some(f => 
        f.includes('list') || f.includes('crud') || f.includes('data')
      )) {
        const routeName = page.name.toLowerCase();
        routes.push({
          name: routeName,
          path: routeName,
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          protected: true
        });
      }
    });
  }
  
  // Add common routes
  if (!routes.find(r => r.name === 'users')) {
    routes.push({
      name: 'users',
      path: 'users',
      methods: ['GET', 'PUT'],
      protected: true
    });
  }
  
  return routes;
}

/**
 * Extract data models from planning specification
 * @param {Object} planningSpec - Planning specification
 * @returns {Array} Array of model objects
 */
function extractModelsFromPlanning(planningSpec) {
  const models = [];
  
  // Always include User model
  models.push({
    name: 'User',
    fields: [
      { name: 'email', type: 'string', required: true, unique: true },
      { name: 'password', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'role', type: 'string', default: 'user' }
    ]
  });
  
  // Extract models from pages
  if (planningSpec.pages) {
    planningSpec.pages.forEach(page => {
      if (page.features && page.features.some(f => 
        f.includes('list') || f.includes('crud')
      )) {
        const modelName = page.name.charAt(0).toUpperCase() + page.name.slice(1);
        if (!models.find(m => m.name === modelName)) {
          models.push({
            name: modelName,
            fields: [
              { name: 'title', type: 'string', required: true },
              { name: 'description', type: 'string' },
              { name: 'userId', type: 'string', required: true }
            ]
          });
        }
      }
    });
  }
  
  return models;
}

/**
 * Validate that all required files from architecture spec are present in generated files
 * @param {Object} architectureSpec - Architecture specification
 * @param {Array} generatedFiles - Array of generated file objects
 * @returns {Array} Array of missing file paths
 */
function validateRequiredFiles(architectureSpec, generatedFiles) {
  const missingFiles = [];
  const generatedPaths = new Set(generatedFiles.map(f => f.path));
  
  // Check all file categories
  const fileStructure = architectureSpec.fileStructure;
  const allRequiredFiles = [
    ...(fileStructure.config || []),
    ...(fileStructure.entry || []),
    ...(fileStructure.routing || []),
    ...(fileStructure.layouts || []),
    ...(fileStructure.components || []),
    ...(fileStructure.pages || [])
  ];
  
  // Check each required file
  for (const fileSpec of allRequiredFiles) {
    if (!generatedPaths.has(fileSpec.path)) {
      missingFiles.push(fileSpec.path);
    }
  }
  
  return missingFiles;
}

/**
 * Sets up graceful shutdown handlers for SIGTERM and SIGINT signals
 * @param {import('http').Server} server - HTTP server instance
 */
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`[${new Date().toISOString()}] [INFO] [Server] Received ${signal} signal, starting graceful shutdown...`);
    
    // Set a timeout to force exit after 10 seconds
    const forceExitTimeout = setTimeout(() => {
      console.error(`[${new Date().toISOString()}] [ERROR] [Server] Graceful shutdown timeout, forcing exit`);
      process.exit(1);
    }, 10000);
    
    // Close server and exit
    server.close((err) => {
      clearTimeout(forceExitTimeout);
      
      if (err) {
        console.error(`[${new Date().toISOString()}] [ERROR] [Server] Error during shutdown:`, err);
        process.exit(1);
      }
      
      console.log(`[${new Date().toISOString()}] [INFO] [Server] Server closed successfully`);
      process.exit(0);
    });
  };
  
  // Handle SIGTERM signal (e.g., from Railway, Docker, Kubernetes)
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle SIGINT signal (e.g., Ctrl+C in terminal)
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Starts the Express server
 * @returns {Promise<import('http').Server>} HTTP server instance
 */
async function startServer() {
  try {
    // Validate environment variables and exit if validation fails
    validateEnvironment();
    
    // Create Express app
    const app = createApp();
    
    // Get configured PORT
    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Start Express server on configured PORT
    const server = app.listen(PORT, () => {
      // Log startup message with port and environment
      console.log(`[${new Date().toISOString()}] [INFO] [Server] ========================================`);
      console.log(`[${new Date().toISOString()}] [INFO] [Server] AI Builder Backend started successfully`);
      console.log(`[${new Date().toISOString()}] [INFO] [Server] Port: ${PORT}`);
      console.log(`[${new Date().toISOString()}] [INFO] [Server] Environment: ${NODE_ENV}`);
      console.log(`[${new Date().toISOString()}] [INFO] [Server] Model: gpt-oss-120b`);
      console.log(`[${new Date().toISOString()}] [INFO] [Server] ========================================`);
    });
    
    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
    
    return server;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [Server] Failed to start server:`, error);
    process.exit(1);
  }
}

// Export app and utilities for testing purposes
export { createApp, validateEnvironment, setupSSEHeaders, sendSSE, setupGracefulShutdown, startServer };

// Call startServer() at module execution if running directly (not imported as module)
// Check if this module is the main entry point
// Start server immediately
startServer().catch(error => {
  console.error(`[${new Date().toISOString()}] [FATAL] [Server] Startup failed:`, error);
  process.exit(1);
});
