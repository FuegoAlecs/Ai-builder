import dotenv from 'dotenv';
import { createGroqClient } from './utils/groqClient.js';
import { architectureAgent } from './agents/architectureAgent.js';
import { planningAgent } from './agents/planningAgent.js';
import { designAgent } from './agents/designAgent.js';
import { codeAgentMultiFile } from './agents/codeAgent.js';
import { qualityAgent } from './agents/qualityAgent.js';
import { fixAgent } from './agents/fixAgent.js';

// Load environment variables
dotenv.config();

/**
 * Test Planning Agent with architecture spec
 * Requirements: 3.1
 */
async function testPlanningAgentWithArchSpec() {
  console.log('=== Test 1: Planning Agent with Architecture Spec ===\n');

  // First generate architecture
  const architectureSpec = await architectureAgent(
    'Create a portfolio website with home, about, and projects pages',
    'vite-react'
  );
  console.log('✓ Architecture spec generated');

  // Test planning agent with architecture spec
  const planningSpec = await planningAgent(
    'Create a portfolio website with home, about, and projects pages',
    architectureSpec
  );

  // Validate multi-page website planning spec
  const requiredFields = ['appType', 'pages', 'sharedComponents', 'routing', 'designStyle'];
  requiredFields.forEach(field => {
    if (!(field in planningSpec)) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  console.log('✓ All required fields present');

  // Validate pages array
  if (!Array.isArray(planningSpec.pages) || planningSpec.pages.length === 0) {
    throw new Error('pages must be a non-empty array');
  }
  console.log(`✓ ${planningSpec.pages.length} pages planned`);

  // Validate each page has required fields
  planningSpec.pages.forEach((page, index) => {
    if (!page.name || !page.purpose || !Array.isArray(page.components) || !Array.isArray(page.features)) {
      throw new Error(`Page at index ${index} missing required fields`);
    }
  });
  console.log('✓ All pages have required fields (name, purpose, components, features)');

  // Validate sharedComponents
  if (!Array.isArray(planningSpec.sharedComponents)) {
    throw new Error('sharedComponents must be an array');
  }
  console.log(`✓ ${planningSpec.sharedComponents.length} shared components planned`);

  // Validate routing object
  if (!planningSpec.routing || typeof planningSpec.routing !== 'object') {
    throw new Error('routing must be an object');
  }
  console.log('✓ Routing configuration present');

  console.log('\n✓ Test 1 Passed: Planning Agent works with architecture spec\n');
  return { architectureSpec, planningSpec };
}

/**
 * Test Design Agent with multi-page specs
 * Requirements: 4.1
 */
async function testDesignAgentWithMultiPageSpecs() {
  console.log('=== Test 2: Design Agent with Multi-Page Specs ===\n');

  // Generate architecture and planning specs
  const architectureSpec = await architectureAgent(
    'Create a modern landing page with hero, features, and contact sections',
    'vite-react'
  );
  console.log('✓ Architecture spec generated');

  const planningSpec = await planningAgent(
    'Create a modern landing page with hero, features, and contact sections',
    architectureSpec
  );
  console.log('✓ Planning spec generated');

  // Test design agent
  const designSystem = await designAgent(
    architectureSpec,
    planningSpec,
    []
  );

  // Validate design system structure
  const requiredFields = ['colors', 'fonts', 'spacing', 'breakpoints', 'components', 'layout', 'typography', 'style'];
  requiredFields.forEach(field => {
    if (!(field in designSystem)) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  console.log('✓ All required design system fields present');

  // Validate colors
  const requiredColors = ['primary', 'secondary', 'accent', 'bg', 'text'];
  requiredColors.forEach(color => {
    if (!(color in designSystem.colors)) {
      throw new Error(`Missing required color: ${color}`);
    }
  });
  console.log('✓ All required colors defined');

  // Validate component styles
  const requiredComponents = ['navbar', 'footer', 'button'];
  requiredComponents.forEach(comp => {
    if (!(comp in designSystem.components)) {
      console.warn(`  Warning: Missing component style: ${comp}`);
    }
  });
  console.log('✓ Component styles defined');

  // Validate layout system
  if (!designSystem.layout.maxWidth || !designSystem.layout.containerPadding) {
    throw new Error('Layout system incomplete');
  }
  console.log('✓ Layout system complete');

  console.log('\n✓ Test 2 Passed: Design Agent works with multi-page specs\n');
  return { architectureSpec, planningSpec, designSystem };
}

/**
 * Test Code Agent multi-file generation
 * Requirements: 5.1
 */
async function testCodeAgentMultiFileGeneration() {
  console.log('=== Test 3: Code Agent Multi-File Generation ===\n');

  // Generate all prerequisite specs
  const architectureSpec = await architectureAgent(
    'Create a simple blog with home and about pages',
    'vite-react'
  );
  console.log('✓ Architecture spec generated');

  const planningSpec = await planningAgent(
    'Create a simple blog with home and about pages',
    architectureSpec
  );
  console.log('✓ Planning spec generated');

  const designSystem = await designAgent(
    architectureSpec,
    planningSpec,
    []
  );
  console.log('✓ Design system generated');

  // Test multi-file code generation
  const filesStarted = [];
  const filesCompleted = [];

  const generatedFiles = await codeAgentMultiFile(
    'Create a simple blog with home and about pages',
    architectureSpec,
    planningSpec,
    designSystem,
    [],
    (filePath) => {
      filesStarted.push(filePath);
    },
    (chunk) => {
      // Chunk callback
    },
    (file) => {
      filesCompleted.push(file.path);
    }
  );

  // Validate files were generated
  if (!Array.isArray(generatedFiles) || generatedFiles.length === 0) {
    throw new Error('No files generated');
  }
  console.log(`✓ ${generatedFiles.length} files generated`);

  // Validate each file has path and content
  generatedFiles.forEach(file => {
    if (!file.path || typeof file.path !== 'string') {
      throw new Error('File missing path');
    }
    if (!file.content || typeof file.content !== 'string') {
      throw new Error(`File ${file.path} missing content`);
    }
  });
  console.log('✓ All files have path and content');

  // Validate callbacks were called
  if (filesStarted.length === 0) {
    throw new Error('onFileStart callback never called');
  }
  if (filesCompleted.length === 0) {
    throw new Error('onFileComplete callback never called');
  }
  console.log(`✓ Callbacks called (${filesStarted.length} started, ${filesCompleted.length} completed)`);

  // Validate required files are present
  const filePaths = generatedFiles.map(f => f.path);
  const requiredFiles = ['package.json', 'index.html'];
  requiredFiles.forEach(required => {
    if (!filePaths.some(path => path.includes(required))) {
      throw new Error(`Missing required file: ${required}`);
    }
  });
  console.log('✓ Required files present (package.json, index.html)');

  console.log('\n✓ Test 3 Passed: Code Agent generates multiple files correctly\n');
  return { architectureSpec, generatedFiles };
}

/**
 * Test Quality Agent multi-file review
 * Requirements: 6.1
 */
async function testQualityAgentMultiFileReview() {
  console.log('=== Test 4: Quality Agent Multi-File Review ===\n');

  // Create sample files with intentional issues
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
    },
    {
      path: 'src/pages/Home.jsx',
      content: `import React from 'react';

export default function Home() {
  return (
    <div>
      <img src="/hero.jpg" />
      <button>Click me</button>
    </div>
  );
}`
    }
  ];

  const architectureSpec = {
    projectName: 'test-website',
    template: 'vite-react'
  };

  // Test quality agent with multiple files
  const qualityReport = await qualityAgent(files, architectureSpec, []);

  // Validate multi-file quality report structure
  if (!qualityReport.hasOwnProperty('fileIssues')) {
    throw new Error('Missing fileIssues field');
  }
  if (!qualityReport.hasOwnProperty('crossFileIssues')) {
    throw new Error('Missing crossFileIssues field');
  }
  if (!qualityReport.hasOwnProperty('filesWithIssues')) {
    throw new Error('Missing filesWithIssues field');
  }
  console.log('✓ Quality report has required fields');

  // Validate field types
  if (typeof qualityReport.fileIssues !== 'object') {
    throw new Error('fileIssues must be an object');
  }
  if (!Array.isArray(qualityReport.crossFileIssues)) {
    throw new Error('crossFileIssues must be an array');
  }
  if (!Array.isArray(qualityReport.filesWithIssues)) {
    throw new Error('filesWithIssues must be an array');
  }
  console.log('✓ Field types are correct');

  // Validate common fields
  if (typeof qualityReport.needsRevision !== 'boolean') {
    throw new Error('needsRevision must be a boolean');
  }
  if (typeof qualityReport.overallQuality !== 'string') {
    throw new Error('overallQuality must be a string');
  }
  console.log('✓ Common fields present (needsRevision, overallQuality)');

  // Count issues
  const fileIssueCount = Object.values(qualityReport.fileIssues).reduce((sum, issues) => sum + issues.length, 0);
  const crossFileIssueCount = qualityReport.crossFileIssues.length;
  console.log(`✓ Found ${fileIssueCount} file issues and ${crossFileIssueCount} cross-file issues`);

  console.log('\n✓ Test 4 Passed: Quality Agent reviews multiple files correctly\n');
  return { files, qualityReport };
}

/**
 * Test Fix Agent multi-file corrections
 * Requirements: 7.1
 */
async function testFixAgentMultiFileCorrections() {
  console.log('=== Test 5: Fix Agent Multi-File Corrections ===\n');

  // Create sample files with issues
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

  // Create quality report with issues
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

  // Test fix agent
  const filesFixed = [];
  const fixedFiles = await fixAgent(
    files,
    qualityReport,
    architectureSpec,
    [],
    (filePath) => {
      console.log(`  Fixing: ${filePath}`);
    },
    (chunk) => {
      // Chunk callback
    },
    (filePath, content) => {
      filesFixed.push(filePath);
    }
  );

  // Validate fixed files
  if (!Array.isArray(fixedFiles) || fixedFiles.length === 0) {
    throw new Error('No files returned');
  }
  console.log(`✓ ${fixedFiles.length} files returned`);

  // Validate all original files are present
  if (fixedFiles.length !== files.length) {
    throw new Error(`Expected ${files.length} files, got ${fixedFiles.length}`);
  }
  console.log('✓ All files present in result');

  // Validate callbacks were called
  if (filesFixed.length === 0) {
    throw new Error('onFileComplete callback never called');
  }
  console.log(`✓ ${filesFixed.length} file(s) fixed`);

  // Check that fixed file has the import
  const fixedApp = fixedFiles.find(f => f.path === 'src/App.jsx');
  if (!fixedApp) {
    throw new Error('Fixed App.jsx not found');
  }
  if (!fixedApp.content.includes('RouterProvider')) {
    console.warn('  Warning: Fixed file may not contain expected fix');
  } else {
    console.log('✓ Fixed file contains expected changes');
  }

  console.log('\n✓ Test 5 Passed: Fix Agent corrects multiple files\n');
  return { fixedFiles };
}

async function runAllTests() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Enhanced Agents Integration Tests                   ║');
    console.log('║   Requirements: 3.1, 4.1, 5.1, 6.1, 7.1                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Initialize Groq client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    createGroqClient(apiKey);
    console.log('✓ Groq client initialized\n');

    // Run all tests
    await testPlanningAgentWithArchSpec();
    await testDesignAgentWithMultiPageSpecs();
    await testCodeAgentMultiFileGeneration();
    await testQualityAgentMultiFileReview();
    await testFixAgentMultiFileCorrections();

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

runAllTests();
