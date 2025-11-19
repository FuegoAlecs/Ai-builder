import { fixAgent } from './agents/fixAgent.js';

// Test 1: Single-file mode (backward compatibility)
async function testSingleFileMode() {
  console.log('\n=== Testing Single-File Mode ===\n');
  
  const code = `import React from 'react';

export default function Button() {
  return <button>Click me</button>;
}`;

  const qualityReport = {
    issues: [
      {
        type: 'a11y',
        severity: 'high',
        description: 'Button missing accessible label',
        fix: 'Add aria-label or text content'
      }
    ],
    needsRevision: true,
    overallQuality: 'fair'
  };

  let chunks = '';
  const onChunk = (chunk) => {
    chunks += chunk;
    process.stdout.write('.');
  };

  try {
    const fixedCode = await fixAgent(code, qualityReport, [], onChunk);
    console.log('\n\n✅ Single-file mode test passed');
    console.log('Fixed code length:', fixedCode.length);
    console.log('Contains aria-label:', fixedCode.includes('aria-label'));
  } catch (error) {
    console.error('\n\n❌ Single-file mode test failed:', error.message);
  }
}

// Test 2: Multi-file mode
async function testMultiFileMode() {
  console.log('\n=== Testing Multi-File Mode ===\n');
  
  const files = [
    {
      path: 'src/App.jsx',
      content: `import React from 'react';
import { router } from './Router.jsx';

export default function App() {
  return <RouterProvider router={router} />;
}`
    },
    {
      path: 'src/router.jsx',
      content: `import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> }
]);`
    }
  ];

  const qualityReport = {
    fileIssues: {
      'src/App.jsx': [
        {
          type: 'bug',
          severity: 'critical',
          description: 'RouterProvider not imported',
          fix: 'Add import { RouterProvider } from "react-router-dom"'
        }
      ]
    },
    crossFileIssues: [
      {
        type: 'bug',
        severity: 'high',
        description: 'Import path case mismatch',
        affectedFiles: ['src/App.jsx', 'src/router.jsx'],
        fix: 'Change ./Router.jsx to ./router.jsx'
      }
    ],
    needsRevision: true,
    overallQuality: 'fair',
    filesWithIssues: ['src/App.jsx']
  };

  const architectureSpec = {
    projectName: 'test-website',
    template: 'vite-react'
  };

  const onFileStart = (filePath) => {
    console.log(`\nFixing: ${filePath}`);
  };

  let currentFile = '';
  const onChunk = (chunk) => {
    currentFile += chunk;
    process.stdout.write('.');
  };

  const onFileComplete = (filePath, content) => {
    console.log(`\n✓ Completed: ${filePath} (${content.length} chars)`);
    currentFile = '';
  };

  try {
    const fixedFiles = await fixAgent(
      files,
      qualityReport,
      architectureSpec,
      [], // conversationHistory
      onFileStart,
      onChunk,
      onFileComplete
    );
    
    console.log('\n\n✅ Multi-file mode test passed');
    console.log('Total files returned:', fixedFiles.length);
    console.log('Files:', fixedFiles.map(f => f.path).join(', '));
    
    const fixedApp = fixedFiles.find(f => f.path === 'src/App.jsx');
    if (fixedApp) {
      console.log('Fixed App.jsx contains RouterProvider import:', 
        fixedApp.content.includes('RouterProvider'));
      console.log('Fixed App.jsx uses correct router path:', 
        fixedApp.content.includes('./router.jsx'));
    }
  } catch (error) {
    console.error('\n\n❌ Multi-file mode test failed:', error.message);
  }
}

// Run tests
(async () => {
  console.log('🧪 Testing Enhanced Fix Agent\n');
  console.log('This test verifies both single-file and multi-file modes.');
  
  await testSingleFileMode();
  await testMultiFileMode();
  
  console.log('\n✨ All tests completed!\n');
})();
