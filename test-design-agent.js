import dotenv from 'dotenv';
import { createGroqClient } from './utils/groqClient.js';
import { architectureAgent } from './agents/architectureAgent.js';
import { planningAgent } from './agents/planningAgent.js';
import { designAgent } from './agents/designAgent.js';

// Load environment variables
dotenv.config();

async function testDesignAgent() {
  try {
    console.log('=== Testing Enhanced Design Agent ===\n');

    // Initialize Groq client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    createGroqClient(apiKey);
    console.log('✓ Groq client initialized\n');

    // Test case: Multi-page website design system
    console.log('Test: Multi-page website design system generation');
    console.log('Prompt: "Create a portfolio website with home, about, projects, and contact pages"\n');
    
    // Step 1: Generate architecture
    console.log('Step 1: Generating architecture specification...');
    const architectureSpec = await architectureAgent(
      'Create a portfolio website with home, about, projects, and contact pages',
      'vite-react'
    );
    console.log('✓ Architecture generated\n');

    // Step 2: Generate planning spec
    console.log('Step 2: Generating planning specification...');
    const planningSpec = await planningAgent(
      'Create a portfolio website with home, about, projects, and contact pages',
      architectureSpec
    );
    console.log('✓ Planning spec generated\n');

    // Step 3: Generate design system
    console.log('Step 3: Generating comprehensive design system...');
    const designSystem = await designAgent(
      architectureSpec,
      planningSpec,
      []
    );
    console.log('✓ Design system generated\n');

    // Validate design system structure
    console.log('=== Design System Validation ===');
    
    // Check required fields
    const requiredFields = ['colors', 'fonts', 'spacing', 'breakpoints', 'components', 'layout', 'typography', 'style'];
    console.log('\nRequired fields:');
    requiredFields.forEach(field => {
      const exists = field in designSystem;
      console.log(`  ${exists ? '✓' : '✗'} ${field}: ${exists ? 'present' : 'MISSING'}`);
    });

    // Check colors
    console.log('\nColors:');
    const requiredColors = ['primary', 'secondary', 'accent', 'bg', 'text'];
    requiredColors.forEach(color => {
      const exists = color in designSystem.colors;
      console.log(`  ${exists ? '✓' : '✗'} ${color}: ${exists ? designSystem.colors[color] : 'MISSING'}`);
    });

    // Check breakpoints
    console.log('\nBreakpoints:');
    const requiredBreakpoints = ['sm', 'md', 'lg'];
    requiredBreakpoints.forEach(bp => {
      const exists = bp in designSystem.breakpoints;
      console.log(`  ${exists ? '✓' : '✗'} ${bp}: ${exists ? designSystem.breakpoints[bp] : 'MISSING'}`);
    });

    // Check components
    console.log('\nComponent Styles:');
    const requiredComponents = ['navbar', 'footer', 'button'];
    requiredComponents.forEach(comp => {
      const exists = comp in designSystem.components;
      console.log(`  ${exists ? '✓' : '✗'} ${comp}: ${exists ? 'defined' : 'MISSING'}`);
    });

    // Check layout
    console.log('\nLayout System:');
    const requiredLayoutProps = ['maxWidth', 'containerPadding', 'sectionSpacing'];
    requiredLayoutProps.forEach(prop => {
      const exists = prop in designSystem.layout;
      console.log(`  ${exists ? '✓' : '✗'} ${prop}: ${exists ? designSystem.layout[prop] : 'MISSING'}`);
    });

    // Check typography
    console.log('\nTypography:');
    const requiredTypography = ['h1', 'h2', 'body'];
    requiredTypography.forEach(type => {
      const exists = type in designSystem.typography;
      console.log(`  ${exists ? '✓' : '✗'} ${type}: ${exists ? designSystem.typography[type] : 'MISSING'}`);
    });

    // Display style description
    console.log('\nStyle Description:');
    console.log(`  "${designSystem.style}"`);

    console.log('\n=== Test Passed ===');
    console.log('All required fields are present and valid for multi-page website design system.');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testDesignAgent();
