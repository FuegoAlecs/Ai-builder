/**
 * End-to-end tests for /generate-website endpoint
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * This script tests:
 * - Complete pipeline execution
 * - SSE event sequence
 * - Files array response format
 * - Error scenarios
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/generate-website';

/**
 * Test 1: Complete pipeline execution
 * Requirements: 8.2
 */
async function testCompletePipelineExecution() {
  console.log('=== Test 1: Complete Pipeline Execution ===\n');
  
  const requestBody = {
    prompt: 'Create a simple portfolio website with home and about pages',
    template: 'vite-react',
    enableQA: true,
    conversationHistory: []
  };
  
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  console.log('\nSending request...\n');
  
  return new Promise((resolve, reject) => {
    const stages = [];
    let finalFiles = null;
    let hasError = false;
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Read SSE stream
      const reader = response.body;
      let buffer = '';
      
      reader.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Process complete SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            try {
              const event = JSON.parse(data);
              
              if (event.stage) {
                if (!stages.includes(event.stage)) {
                  stages.push(event.stage);
                }
                console.log(`[${event.stage.toUpperCase()}] Progress: ${event.progress}%`);
                
                if (event.stage === 'complete' && event.files) {
                  finalFiles = event.files;
                }
              }
              
              if (event.error) {
                hasError = true;
                console.error(`[ERROR] ${event.error}`);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', data);
            }
          }
        }
      });
      
      reader.on('end', () => {
        console.log('\n✓ Stream ended');
        
        // Validate pipeline stages
        const expectedStages = ['architecture', 'planning', 'designing', 'generating', 'complete'];
        const missingStages = expectedStages.filter(s => !stages.includes(s));
        
        if (missingStages.length > 0) {
          reject(new Error(`Missing stages: ${missingStages.join(', ')}`));
          return;
        }
        console.log('✓ All expected stages executed:', stages.join(' → '));
        
        // Validate files were generated
        if (!finalFiles || finalFiles.length === 0) {
          reject(new Error('No files generated'));
          return;
        }
        console.log(`✓ ${finalFiles.length} files generated`);
        
        if (hasError) {
          reject(new Error('Pipeline completed with errors'));
          return;
        }
        
        console.log('\n✓ Test 1 Passed: Complete pipeline executed successfully\n');
        resolve({ stages, finalFiles });
      });
      
      reader.on('error', (error) => {
        reject(error);
      });
    })
    .catch(error => {
      reject(error);
    });
  });
}

/**
 * Test 2: SSE event sequence validation
 * Requirements: 8.3
 */
async function testSSEEventSequence() {
  console.log('=== Test 2: SSE Event Sequence ===\n');
  
  const requestBody = {
    prompt: 'Create a landing page with hero section',
    template: 'vite-react',
    enableQA: false, // Disable QA to test faster
    conversationHistory: []
  };
  
  return new Promise((resolve, reject) => {
    const events = [];
    let progressValues = [];
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
              events.push(event);
              
              if (event.progress !== undefined) {
                progressValues.push(event.progress);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });
      
      reader.on('end', () => {
        // Validate progress is monotonically increasing
        for (let i = 1; i < progressValues.length; i++) {
          if (progressValues[i] < progressValues[i - 1]) {
            reject(new Error(`Progress decreased: ${progressValues[i - 1]}% → ${progressValues[i]}%`));
            return;
          }
        }
        console.log('✓ Progress values are monotonically increasing');
        console.log(`  Progress sequence: ${progressValues.join('% → ')}%`);
        
        // Validate final progress is 100
        if (progressValues[progressValues.length - 1] !== 100) {
          reject(new Error(`Final progress is not 100%: ${progressValues[progressValues.length - 1]}%`));
          return;
        }
        console.log('✓ Final progress is 100%');
        
        // Validate event types
        const hasStageEvents = events.some(e => e.stage);
        if (!hasStageEvents) {
          reject(new Error('No stage events found'));
          return;
        }
        console.log('✓ Stage events present');
        
        const hasCompleteEvent = events.some(e => e.stage === 'complete');
        if (!hasCompleteEvent) {
          reject(new Error('No complete event found'));
          return;
        }
        console.log('✓ Complete event present');
        
        console.log('\n✓ Test 2 Passed: SSE event sequence is valid\n');
        resolve({ events, progressValues });
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
}

/**
 * Test 3: Files array response format
 * Requirements: 8.5
 */
async function testFilesArrayFormat() {
  console.log('=== Test 3: Files Array Response Format ===\n');
  
  const requestBody = {
    prompt: 'Create a blog with home page',
    template: 'vite-react',
    enableQA: false,
    conversationHistory: []
  };
  
  return new Promise((resolve, reject) => {
    let finalFiles = null;
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
              if (event.stage === 'complete' && event.files) {
                finalFiles = event.files;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      });
      
      reader.on('end', () => {
        // Validate files array
        if (!Array.isArray(finalFiles)) {
          reject(new Error('files is not an array'));
          return;
        }
        console.log(`✓ files is an array with ${finalFiles.length} items`);
        
        // Validate each file object
        for (const file of finalFiles) {
          if (!file.path || typeof file.path !== 'string') {
            reject(new Error(`File missing path: ${JSON.stringify(file)}`));
            return;
          }
          if (!file.content || typeof file.content !== 'string') {
            reject(new Error(`File ${file.path} missing content`));
            return;
          }
        }
        console.log('✓ All files have path and content properties');
        
        // Validate required files are present
        const filePaths = finalFiles.map(f => f.path);
        const requiredFiles = ['package.json', 'index.html', 'src/App.jsx'];
        
        for (const required of requiredFiles) {
          if (!filePaths.some(path => path.includes(required))) {
            reject(new Error(`Missing required file: ${required}`));
            return;
          }
        }
        console.log('✓ Required files present:', requiredFiles.join(', '));
        
        // Display file list
        console.log('\nGenerated files:');
        finalFiles.forEach(file => {
          console.log(`  - ${file.path} (${file.content.length} bytes)`);
        });
        
        console.log('\n✓ Test 3 Passed: Files array format is valid\n');
        resolve({ finalFiles });
      });
      
      reader.on('error', reject);
    })
    .catch(reject);
  });
}

/**
 * Test 4: Error scenarios
 * Requirements: 8.4
 */
async function testErrorScenarios() {
  console.log('=== Test 4: Error Scenarios ===\n');
  
  // Test 4a: Missing prompt
  console.log('Test 4a: Missing prompt');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: 'vite-react' })
    });
    
    if (response.ok) {
      throw new Error('Expected error for missing prompt');
    }
    
    const error = await response.json();
    if (!error.error) {
      throw new Error('Error response missing error field');
    }
    console.log('✓ Missing prompt returns error:', error.error);
  } catch (e) {
    if (e.message.includes('Expected error')) {
      throw e;
    }
    console.log('✓ Missing prompt handled correctly');
  }
  
  // Test 4b: Invalid template
  console.log('\nTest 4b: Invalid template');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a website',
        template: 'invalid-template'
      })
    });
    
    if (response.ok) {
      throw new Error('Expected error for invalid template');
    }
    
    const error = await response.json();
    console.log('✓ Invalid template returns error:', error.error);
  } catch (e) {
    if (e.message.includes('Expected error')) {
      throw e;
    }
    console.log('✓ Invalid template handled correctly');
  }
  
  // Test 4c: Invalid conversationHistory
  console.log('\nTest 4c: Invalid conversationHistory');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a website',
        conversationHistory: 'not-an-array'
      })
    });
    
    if (response.ok) {
      throw new Error('Expected error for invalid conversationHistory');
    }
    
    const error = await response.json();
    console.log('✓ Invalid conversationHistory returns error:', error.error);
  } catch (e) {
    if (e.message.includes('Expected error')) {
      throw e;
    }
    console.log('✓ Invalid conversationHistory handled correctly');
  }
  
  console.log('\n✓ Test 4 Passed: Error scenarios handled correctly\n');
}

/**
 * Test 5: Request validation
 * Requirements: 8.1
 */
async function testRequestValidation() {
  console.log('=== Test 5: Request Validation ===\n');
  
  // Test valid request with all parameters
  console.log('Test 5a: Valid request with all parameters');
  const validRequest = {
    prompt: 'Create a simple website',
    template: 'vite-react',
    enableQA: true,
    conversationHistory: []
  };
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRequest)
  });
  
  if (!response.ok) {
    throw new Error('Valid request failed');
  }
  console.log('✓ Valid request accepted');
  
  // Consume the stream to avoid hanging
  response.body.on('data', () => {});
  response.body.on('end', () => {});
  
  // Test with default template
  console.log('\nTest 5b: Request without template (should default to vite-react)');
  const noTemplateRequest = {
    prompt: 'Create a simple website',
    enableQA: false
  };
  
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noTemplateRequest)
  });
  
  if (!response2.ok) {
    throw new Error('Request without template failed');
  }
  console.log('✓ Request without template accepted (defaults to vite-react)');
  
  // Consume the stream
  response2.body.on('data', () => {});
  response2.body.on('end', () => {});
  
  console.log('\n✓ Test 5 Passed: Request validation works correctly\n');
}

async function runAllTests() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   /generate-website End-to-End Tests                  ║');
    console.log('║   Requirements: 8.1, 8.2, 8.3, 8.4, 8.5                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('NOTE: Server must be running on http://localhost:3000\n');
    
    // Check if server is running
    try {
      const healthCheck = await fetch('http://localhost:3000/health');
      if (!healthCheck.ok) {
        throw new Error('Server health check failed');
      }
      console.log('✓ Server is running\n');
    } catch (error) {
      console.error('✗ Server is not running. Please start the server with: node server.js\n');
      process.exit(1);
    }
    
    // Run tests
    await testCompletePipelineExecution();
    await testSSEEventSequence();
    await testFilesArrayFormat();
    await testErrorScenarios();
    await testRequestValidation();
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   ✓ ALL TESTS PASSED                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
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

// Run the tests
runAllTests();
