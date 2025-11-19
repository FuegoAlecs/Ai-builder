/**
 * Template variation tests
 * Requirements: 9.2, 9.3, 9.4
 * 
 * This script tests:
 * - Vite React template generation
 * - Vite React TypeScript template generation
 * - Next.js template generation
 * - Verify generated projects structure
 */

import { architectureAgent } from './agents/architectureAgent.js';
import { planningAgent } from './agents/planningAgent.js';
import { designAgent } from './agents/designAgent.js';
import { codeAgentMultiFile } from './agents/codeAgent.js';
import { createGroqClient } from './utils/groqClient.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test 1: Vite React template generation
 * Requirements: 9.2
 */
async function testViteReactTemplate() {
  console.log('=== Test 1: Vite React Template ===\n');
  
  const testPrompt = 'Create a simple portfolio website with home and about pages';
  
  // Generate architecture
  const architectureSpec = await architectureAgent(testPrompt, 'vite-react', []);
  
  // Validate template
  if (architectureSpec.template !== 'vite-react') {
    throw new Error(`Expected template vite-react, got ${architectureSpec.template}`);
  }
  console.log('✓ Template is vite-react');
  
  // Validate file extensions
  const pages = architectureSpec.fileStructure.pages;
  pages.forEach(page => {
    if (!page.path.endsWith('.jsx')) {
      throw new Error(`Page ${page.name} should use .jsx extension, got ${page.path}`);
    }
  });
  console.log('✓ All pages use .jsx extension');
  
  // Validate config files
  const configFiles = architectureSpec.fileStructure.config.map(f => f.path);
  const requiredConfigs = ['package.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'];
  requiredConfigs.forEach(config => {
    if (!configFiles.includes(config)) {
      throw new Error(`Missing required config: ${config}`);
    }
  });
  console.log('✓ All required config files present');
  
  // Validate dependencies
  if (!architectureSpec.dependencies.includes('react')) {
    throw new Error('Missing react dependency');
  }
  if (!architectureSpec.dependencies.includes('react-router-dom')) {
    throw new Error('Missing react-router-dom dependency');
  }
  console.log('✓ Required dependencies present');
  
  // Validate routing
  if (architectureSpec.fileStructure.routing.length === 0) {
    throw new Error('No routing files generated');
  }
  console.log('✓ Routing configuration present');
  
  console.log('\n✓ Test 1 Passed: Vite React template works correctly\n');
  return architectureSpec;
}

/**
 * Test 2: Vite React TypeScript template generation
 * Requirements: 9.3
 */
async function testViteReactTypeScriptTemplate() {
  console.log('=== Test 2: Vite React TypeScript Template ===\n');
  
  const testPrompt = 'Create a dashboard with analytics and settings pages';
  
  // Generate architecture
  const architectureSpec = await architectureAgent(testPrompt, 'vite-react-ts', []);
  
  // Validate template
  if (architectureSpec.template !== 'vite-react-ts') {
    throw new Error(`Expected template vite-react-ts, got ${architectureSpec.template}`);
  }
  console.log('✓ Template is vite-react-ts');
  
  // Validate file extensions
  const pages = architectureSpec.fileStructure.pages;
  pages.forEach(page => {
    if (!page.path.endsWith('.tsx')) {
      throw new Error(`TypeScript page ${page.name} should use .tsx extension, got ${page.path}`);
    }
  });
  console.log('✓ All pages use .tsx extension');
  
  // Validate TypeScript config files
  const configFiles = architectureSpec.fileStructure.config.map(f => f.path);
  if (!configFiles.includes('tsconfig.json')) {
    throw new Error('Missing tsconfig.json');
  }
  if (!configFiles.includes('tsconfig.node.json')) {
    console.warn('  Warning: Missing tsconfig.node.json (optional)');
  } else {
    console.log('✓ TypeScript config files present');
  }
  
  // Validate TypeScript dependencies
  if (!architectureSpec.dependencies.includes('typescript')) {
    console.warn('  Warning: typescript not in dependencies list');
  }
  console.log('✓ TypeScript template configured');
  
  console.log('\n✓ Test 2 Passed: Vite React TypeScript template works correctly\n');
  return architectureSpec;
}

/**
 * Test 3: Next.js template generation
 * Requirements: 9.4
 */
async function testNextJsTemplate() {
  console.log('=== Test 3: Next.js Template ===\n');
  
  const testPrompt = 'Create a blog with home and posts pages';
  
  // Generate architecture
  const architectureSpec = await architectureAgent(testPrompt, 'nextjs', []);
  
  // Validate template
  if (architectureSpec.template !== 'nextjs') {
    throw new Error(`Expected template nextjs, got ${architectureSpec.template}`);
  }
  console.log('✓ Template is nextjs');
  
  // Validate Next.js config
  const configFiles = architectureSpec.fileStructure.config.map(f => f.path);
  if (!configFiles.includes('next.config.js')) {
    throw new Error('Missing next.config.js');
  }
  console.log('✓ next.config.js present');
  
  // Validate app directory structure
  const pages = architectureSpec.fileStructure.pages;
  const usesAppDir = pages.some(p => p.path.startsWith('app/'));
  if (!usesAppDir) {
    console.warn('  Warning: Pages may not be using Next.js App Router structure');
  } else {
    console.log('✓ Pages use Next.js App Router structure (app/ directory)');
  }
  
  // Validate no separate routing file (Next.js uses file-based routing)
  if (architectureSpec.fileStructure.routing.length > 0) {
    console.warn('  Warning: Next.js should use file-based routing, not separate router file');
  } else {
    console.log('✓ No separate routing file (uses Next.js file-based routing)');
  }
  
  // Validate Next.js dependencies
  if (!architectureSpec.dependencies.includes('next')) {
    throw new Error('Missing next dependency');
  }
  console.log('✓ Next.js dependency present');
  
  console.log('\n✓ Test 3 Passed: Next.js template works correctly\n');
  return architectureSpec;
}

/**
 * Test 4: Verify generated project structure
 * Requirements: 9.2, 9.3, 9.4
 */
async function testGeneratedProjectStructure() {
  console.log('=== Test 4: Generated Project Structure ===\n');
  
  const testPrompt = 'Create a landing page with hero section';
  
  // Generate full project for Vite React
  console.log('Generating Vite React project...');
  const architectureSpec = await architectureAgent(testPrompt, 'vite-react', []);
  const planningSpec = await planningAgent(testPrompt, architectureSpec, []);
  const designSystem = await designAgent(architectureSpec, planningSpec, []);
  
  const generatedFiles = await codeAgentMultiFile(
    testPrompt,
    architectureSpec,
    planningSpec,
    designSystem,
    [],
    (filePath) => { /* onFileStart */ },
    (chunk) => { /* onChunk */ },
    (file) => { /* onFileComplete */ }
  );
  
  console.log(`✓ Generated ${generatedFiles.length} files`);
  
  // Validate project structure
  const filePaths = generatedFiles.map(f => f.path);
  
  // Check for essential files
  const essentialFiles = [
    'package.json',
    'index.html',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'src/main.jsx',
    'src/App.jsx',
    'src/router.jsx'
  ];
  
  essentialFiles.forEach(file => {
    if (!filePaths.some(path => path === file)) {
      throw new Error(`Missing essential file: ${file}`);
    }
  });
  console.log('✓ All essential files present');
  
  // Validate package.json content
  const packageJson = generatedFiles.find(f => f.path === 'package.json');
  if (!packageJson) {
    throw new Error('package.json not found');
  }
  
  const pkg = JSON.parse(packageJson.content);
  if (!pkg.scripts || !pkg.scripts.dev || !pkg.scripts.build) {
    throw new Error('package.json missing required scripts');
  }
  console.log('✓ package.json has required scripts (dev, build)');
  
  if (!pkg.dependencies || !pkg.dependencies.react) {
    throw new Error('package.json missing react dependency');
  }
  console.log('✓ package.json has required dependencies');
  
  // Validate index.html
  const indexHtml = generatedFiles.find(f => f.path === 'index.html');
  if (!indexHtml || !indexHtml.content.includes('<div id="root">')) {
    throw new Error('index.html missing root div');
  }
  console.log('✓ index.html has root div');
  
  // Validate main.jsx
  const mainJsx = generatedFiles.find(f => f.path === 'src/main.jsx');
  if (!mainJsx || !mainJsx.content.includes('ReactDOM')) {
    throw new Error('main.jsx missing ReactDOM');
  }
  console.log('✓ main.jsx has ReactDOM setup');
  
  // Validate router.jsx
  const routerJsx = generatedFiles.find(f => f.path === 'src/router.jsx');
  if (!routerJsx || !routerJsx.content.includes('createBrowserRouter')) {
    throw new Error('router.jsx missing createBrowserRouter');
  }
  console.log('✓ router.jsx has routing setup');
  
  // Display project structure
  console.log('\nProject structure:');
  const sortedPaths = [...filePaths].sort();
  sortedPaths.forEach(path => {
    const indent = '  '.repeat((path.match(/\//g) || []).length);
    const fileName = path.split('/').pop();
    console.log(`${indent}${fileName}`);
  });
  
  console.log('\n✓ Test 4 Passed: Generated project structure is valid\n');
  return { generatedFiles };
}

async function runAllTests() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Template Variation Tests                            ║');
    console.log('║   Requirements: 9.2, 9.3, 9.4                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Initialize Groq client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    createGroqClient(apiKey);
    console.log('✓ Groq client initialized\n');

    // Run all tests
    await testViteReactTemplate();
    await testViteReactTypeScriptTemplate();
    await testNextJsTemplate();
    await testGeneratedProjectStructure();

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

runAllTests().catch(console.error);
