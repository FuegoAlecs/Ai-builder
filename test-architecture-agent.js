import dotenv from 'dotenv';
import { createGroqClient } from './utils/groqClient.js';
import { architectureAgent } from './agents/architectureAgent.js';

// Load environment variables
dotenv.config();

/**
 * Test valid project structure generation
 * Requirements: 2.1, 2.2, 2.3
 */
async function testValidProjectStructure() {
  console.log('=== Test 1: Valid Project Structure Generation ===\n');

  const result = await architectureAgent(
    'Create a portfolio website with home, about, projects, and contact pages',
    'vite-react'
  );
  
  // Validate required top-level fields
  const requiredFields = ['projectName', 'template', 'fileStructure', 'dependencies', 'features'];
  requiredFields.forEach(field => {
    if (!(field in result)) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  console.log('✓ All required top-level fields present');
  
  // Validate fileStructure sections
  const requiredSections = ['pages', 'layouts', 'components', 'config', 'routing', 'entry'];
  requiredSections.forEach(section => {
    if (!Array.isArray(result.fileStructure[section])) {
      throw new Error(`fileStructure.${section} is not an array`);
    }
  });
  console.log('✓ All fileStructure sections are arrays');
  
  // Validate pages have required fields
  if (result.fileStructure.pages.length === 0) {
    throw new Error('No pages generated');
  }
  result.fileStructure.pages.forEach(page => {
    if (!page.name || !page.path || !page.route) {
      throw new Error(`Invalid page object: ${JSON.stringify(page)}`);
    }
  });
  console.log(`✓ All ${result.fileStructure.pages.length} pages have required fields (name, path, route)`);
  
  // Validate layouts
  if (result.fileStructure.layouts.length === 0) {
    throw new Error('No layouts generated');
  }
  console.log(`✓ ${result.fileStructure.layouts.length} layout(s) generated`);
  
  // Validate features object
  const requiredFeatures = ['routing', 'stateManagement', 'apiIntegration', 'authentication', 'forms'];
  requiredFeatures.forEach(feature => {
    if (typeof result.features[feature] !== 'boolean') {
      throw new Error(`Feature ${feature} is not a boolean`);
    }
  });
  console.log('✓ All required features present with boolean values');
  
  console.log('\n✓ Test 1 Passed: Valid project structure generated\n');
  return result;
}

/**
 * Test file path formatting
 * Requirements: 2.2
 */
async function testFilePathFormatting() {
  console.log('=== Test 2: File Path Formatting ===\n');

  const result = await architectureAgent(
    'Create a simple blog with home and blog pages',
    'vite-react'
  );
  
  // Check that all file paths follow expected patterns
  const allFiles = [
    ...result.fileStructure.pages,
    ...result.fileStructure.layouts,
    ...result.fileStructure.components,
    ...result.fileStructure.config,
    ...result.fileStructure.routing,
    ...result.fileStructure.entry
  ];
  
  allFiles.forEach(file => {
    // Validate path exists and is a string
    if (!file.path || typeof file.path !== 'string') {
      throw new Error(`Invalid path for file: ${JSON.stringify(file)}`);
    }
    
    // Check for proper file extensions
    if (file.path.includes('src/')) {
      if (file.path.endsWith('.jsx') || file.path.endsWith('.tsx') || file.path.endsWith('.js') || file.path.endsWith('.ts')) {
        // Valid extension
      } else if (file.path.endsWith('.css')) {
        // Valid CSS file
      } else {
        console.warn(`  Warning: Unexpected extension for ${file.path}`);
      }
    }
  });
  
  console.log(`✓ All ${allFiles.length} file paths are properly formatted`);
  
  // Check that pages use correct extension for template
  const expectedExt = '.jsx';
  result.fileStructure.pages.forEach(page => {
    if (!page.path.endsWith(expectedExt)) {
      throw new Error(`Page ${page.name} has incorrect extension: ${page.path} (expected ${expectedExt})`);
    }
  });
  console.log(`✓ All pages use correct extension (${expectedExt})`);
  
  // Check that routes are properly formatted
  result.fileStructure.pages.forEach(page => {
    if (!page.route.startsWith('/')) {
      throw new Error(`Page ${page.name} has invalid route: ${page.route} (should start with /)`);
    }
  });
  console.log('✓ All routes start with /');
  
  console.log('\n✓ Test 2 Passed: File paths are correctly formatted\n');
  return result;
}

/**
 * Test dependency list completeness
 * Requirements: 2.3
 */
async function testDependencyCompleteness() {
  console.log('=== Test 3: Dependency List Completeness ===\n');

  const result = await architectureAgent(
    'Create an e-commerce website with product listing and shopping cart',
    'vite-react'
  );
  
  // Check required dependencies are present
  const requiredDeps = ['react', 'react-dom'];
  requiredDeps.forEach(dep => {
    if (!result.dependencies.includes(dep)) {
      throw new Error(`Missing required dependency: ${dep}`);
    }
  });
  console.log('✓ Required dependencies (react, react-dom) present');
  
  // Check for routing dependency if routing is enabled
  if (result.features.routing) {
    if (!result.dependencies.includes('react-router-dom')) {
      throw new Error('Routing enabled but react-router-dom not in dependencies');
    }
    console.log('✓ react-router-dom included (routing enabled)');
  }
  
  // Check for Tailwind CSS
  if (result.dependencies.includes('tailwindcss')) {
    console.log('✓ tailwindcss included');
  }
  
  console.log(`✓ Total dependencies: ${result.dependencies.length}`);
  console.log(`  Dependencies: ${result.dependencies.join(', ')}`);
  
  console.log('\n✓ Test 3 Passed: Dependencies are complete\n');
  return result;
}

/**
 * Test TypeScript template
 */
async function testTypeScriptTemplate() {
  console.log('=== Test 4: TypeScript Template ===\n');

  const result = await architectureAgent(
    'Create a dashboard with analytics and settings pages',
    'vite-react-ts'
  );
  
  // Check template is correct
  if (result.template !== 'vite-react-ts') {
    throw new Error(`Expected template vite-react-ts, got ${result.template}`);
  }
  console.log('✓ Template is vite-react-ts');
  
  // Check that pages use .tsx extension
  result.fileStructure.pages.forEach(page => {
    if (!page.path.endsWith('.tsx')) {
      throw new Error(`TypeScript page ${page.name} should use .tsx extension, got ${page.path}`);
    }
  });
  console.log('✓ All pages use .tsx extension');
  
  // Check for TypeScript config files
  const hasTsConfig = result.fileStructure.config.some(f => f.path === 'tsconfig.json');
  if (!hasTsConfig) {
    throw new Error('Missing tsconfig.json in config files');
  }
  console.log('✓ tsconfig.json included in config files');
  
  console.log('\n✓ Test 4 Passed: TypeScript template works correctly\n');
  return result;
}

/**
 * Test Next.js template
 */
async function testNextJsTemplate() {
  console.log('=== Test 5: Next.js Template ===\n');

  const result = await architectureAgent(
    'Create a blog with home and posts pages',
    'nextjs'
  );
  
  // Check template is correct
  if (result.template !== 'nextjs') {
    throw new Error(`Expected template nextjs, got ${result.template}`);
  }
  console.log('✓ Template is nextjs');
  
  // Check for Next.js config
  const hasNextConfig = result.fileStructure.config.some(f => f.path === 'next.config.js');
  if (!hasNextConfig) {
    throw new Error('Missing next.config.js in config files');
  }
  console.log('✓ next.config.js included in config files');
  
  // Check that pages use app directory structure
  const usesAppDir = result.fileStructure.pages.some(p => p.path.startsWith('app/'));
  if (!usesAppDir) {
    console.warn('  Warning: Pages may not be using Next.js App Router structure');
  } else {
    console.log('✓ Pages use Next.js App Router structure');
  }
  
  console.log('\n✓ Test 5 Passed: Next.js template works correctly\n');
  return result;
}

async function runAllTests() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Architecture Agent Integration Tests                ║');
    console.log('║   Requirements: 2.1, 2.2, 2.3                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Initialize Groq client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    createGroqClient(apiKey);
    console.log('✓ Groq client initialized\n');

    // Run all tests
    await testValidProjectStructure();
    await testFilePathFormatting();
    await testDependencyCompleteness();
    await testTypeScriptTemplate();
    await testNextJsTemplate();

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
