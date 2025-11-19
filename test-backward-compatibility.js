/**
 * Backward Compatibility Tests
 * Requirements: 12.1, 12.2, 12.3
 * 
 * This script tests:
 * - /generate-simple endpoint still works
 * - /generate-advanced endpoint still works
 * - Response formats unchanged for existing endpoints
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000';

/**
 * Test 1: /generate-simple endpoint still works
 * Requirements: 12.1
 */
async function testGenerateSimpleEndpoint() {
  console.log('=== Test 1: /generate-simple Endpoint ===\n');
  
  const requestBody = {
    prompt: 'Create a simple button component with primary and secondary variants',
    conversationHistory: []
  };
  
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  console.log('\nSending request to /generate-simple...\n');
  
  return new Promise((resolve, reject) => {
    let codeReceived = false;
    let completeEventReceived = false;
    let fullCode = '';
    
    fetch(`${BASE_URL}/generate-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body;
      let buffer = '';
      
      reader.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              
              // Check for chunk events (streaming code)
              if (event.chunk) {
                codeReceived = true;
                fullCode += event.chunk;
              }
              
              // Check for complete event
              if (event.stage === 'complete') {
                completeEventReceived = true;
                if (event.code) {
                  fullCode = event.code;
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });
      
      reader.on('end', () => {
        console.log('✓ Stream ended');
        
        // Validate response format
        if (!codeReceived && !completeEventReceived) {
          reject(new Error('No code received in response'));
          return;
        }
        console.log('✓ Code received via SSE');
        
        if (!completeEventReceived) {
          reject(new Error('No complete event received'));
          return;
        }
        console.log('✓ Complete event received');
        
        if (!fullCode || fullCode.length === 0) {
          reject(new Error('Generated code is empty'));
          return;
        }
        console.log(`✓ Generated code length: ${fullCode.length} characters`);
        
        // Validate it's React code
        if (!fullCode.includes('import') && !fullCode.includes('export')) {
          console.warn('  Warning: Generated code may not be valid React component');
        } else {
          console.log('✓ Generated code appears to be valid React component');
        }
        
        console.log('\n✓ Test 1 Passed: /generate-simple endpoint works correctly\n');
        resolve({ fullCode });
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
}

/**
 * Test 2: /generate-advanced endpoint still works
 * Requirements: 12.2
 */
async function testGenerateAdvancedEndpoint() {
  console.log('=== Test 2: /generate-advanced Endpoint ===\n');
  
  const requestBody = {
    prompt: 'Create a user profile card with avatar, name, bio, and social links',
    enableQA: true,
    conversationHistory: []
  };
  
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  console.log('\nSending request to /generate-advanced...\n');
  
  return new Promise((resolve, reject) => {
    const stages = [];
    let codeReceived = false;
    let completeEventReceived = false;
    let reviewEventReceived = false;
    let fullCode = '';
    
    fetch(`${BASE_URL}/generate-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body;
      let buffer = '';
      
      reader.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              
              // Track stages
              if (event.stage && !stages.includes(event.stage)) {
                stages.push(event.stage);
                console.log(`[${event.stage.toUpperCase()}] Progress: ${event.progress}%`);
              }
              
              // Check for code chunks
              if (event.chunk) {
                codeReceived = true;
                fullCode += event.chunk;
              }
              
              // Check for review event
              if (event.review) {
                reviewEventReceived = true;
                console.log('  Quality review received');
              }
              
              // Check for complete event
              if (event.stage === 'complete') {
                completeEventReceived = true;
                if (event.code) {
                  fullCode = event.code;
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });
      
      reader.on('end', () => {
        console.log('\n✓ Stream ended');
        
        // Validate pipeline stages
        const expectedStages = ['planning', 'designing', 'generating', 'complete'];
        const missingStages = expectedStages.filter(s => !stages.includes(s));
        
        if (missingStages.length > 0) {
          reject(new Error(`Missing stages: ${missingStages.join(', ')}`));
          return;
        }
        console.log('✓ All expected stages executed:', stages.join(' → '));
        
        // Validate code received
        if (!codeReceived && !completeEventReceived) {
          reject(new Error('No code received'));
          return;
        }
        console.log('✓ Code received');
        
        if (!completeEventReceived) {
          reject(new Error('No complete event received'));
          return;
        }
        console.log('✓ Complete event received');
        
        // Validate QA ran
        if (requestBody.enableQA && !reviewEventReceived) {
          console.warn('  Warning: QA was enabled but no review event received');
        } else if (reviewEventReceived) {
          console.log('✓ Quality review executed');
        }
        
        if (!fullCode || fullCode.length === 0) {
          reject(new Error('Generated code is empty'));
          return;
        }
        console.log(`✓ Generated code length: ${fullCode.length} characters`);
        
        console.log('\n✓ Test 2 Passed: /generate-advanced endpoint works correctly\n');
        resolve({ stages, fullCode });
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
}

/**
 * Test 3: Response formats unchanged
 * Requirements: 12.3
 */
async function testResponseFormatsUnchanged() {
  console.log('=== Test 3: Response Formats Unchanged ===\n');
  
  // Test /generate-simple response format
  console.log('Test 3a: /generate-simple response format');
  const simpleRequest = {
    prompt: 'Create a loading spinner component'
  };
  
  const simpleEvents = [];
  
  await new Promise((resolve, reject) => {
    fetch(`${BASE_URL}/generate-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simpleRequest)
    })
    .then(response => {
      const reader = response.body;
      let buffer = '';
      
      reader.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              simpleEvents.push(event);
            } catch (e) {
              // Ignore
            }
          }
        }
      });
      
      reader.on('end', () => {
        // Validate event structure
        const hasChunkEvents = simpleEvents.some(e => e.chunk !== undefined);
        const hasCompleteEvent = simpleEvents.some(e => e.stage === 'complete' && e.code !== undefined);
        
        if (!hasChunkEvents && !hasCompleteEvent) {
          reject(new Error('/generate-simple: No code in response'));
          return;
        }
        console.log('✓ /generate-simple returns code via chunk or complete event');
        
        // Validate complete event structure
        const completeEvent = simpleEvents.find(e => e.stage === 'complete');
        if (!completeEvent) {
          reject(new Error('/generate-simple: Missing complete event'));
          return;
        }
        
        if (!completeEvent.code || typeof completeEvent.code !== 'string') {
          reject(new Error('/generate-simple: Complete event missing code field'));
          return;
        }
        console.log('✓ /generate-simple complete event has correct structure');
        
        resolve();
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
  
  // Test /generate-advanced response format
  console.log('\nTest 3b: /generate-advanced response format');
  const advancedRequest = {
    prompt: 'Create a simple card component',
    enableQA: false
  };
  
  const advancedEvents = [];
  
  await new Promise((resolve, reject) => {
    fetch(`${BASE_URL}/generate-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advancedRequest)
    })
    .then(response => {
      const reader = response.body;
      let buffer = '';
      
      reader.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              advancedEvents.push(event);
            } catch (e) {
              // Ignore
            }
          }
        }
      });
      
      reader.on('end', () => {
        // Validate stage events
        const stageEvents = advancedEvents.filter(e => e.stage && e.progress !== undefined);
        if (stageEvents.length === 0) {
          reject(new Error('/generate-advanced: No stage events'));
          return;
        }
        console.log('✓ /generate-advanced returns stage events with progress');
        
        // Validate complete event structure
        const completeEvent = advancedEvents.find(e => e.stage === 'complete');
        if (!completeEvent) {
          reject(new Error('/generate-advanced: Missing complete event'));
          return;
        }
        
        if (!completeEvent.code || typeof completeEvent.code !== 'string') {
          reject(new Error('/generate-advanced: Complete event missing code field'));
          return;
        }
        console.log('✓ /generate-advanced complete event has correct structure');
        
        // Validate it returns single component code, not files array
        if (completeEvent.files) {
          reject(new Error('/generate-advanced: Should not return files array (that\'s for /generate-website)'));
          return;
        }
        console.log('✓ /generate-advanced returns single code string (not files array)');
        
        resolve();
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
  
  console.log('\n✓ Test 3 Passed: Response formats are unchanged\n');
}

async function runAllTests() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Backward Compatibility Tests                        ║');
    console.log('║   Requirements: 12.1, 12.2, 12.3                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('NOTE: Server must be running on http://localhost:3000\n');
    
    // Check if server is running
    try {
      const healthCheck = await fetch(`${BASE_URL}/health`);
      if (!healthCheck.ok) {
        throw new Error('Server health check failed');
      }
      console.log('✓ Server is running\n');
    } catch (error) {
      console.error('✗ Server is not running. Please start the server with: node server.js\n');
      process.exit(1);
    }
    
    // Run tests
    await testGenerateSimpleEndpoint();
    await testGenerateAdvancedEndpoint();
    await testResponseFormatsUnchanged();
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   ✓ ALL TESTS PASSED                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('Backward compatibility is maintained for existing endpoints.');
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════╗');
    console.error('║   ✗ TEST FAILED                                        ║');
    console.error('╚════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

runAllTests();
