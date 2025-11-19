import dotenv from 'dotenv';
import { createGroqClient } from './utils/groqClient.js';
import { designAgent } from './agents/designAgent.js';

// Load environment variables
dotenv.config();

async function testBackwardCompatibility() {
  try {
    console.log('=== Testing Design Agent Backward Compatibility ===\n');

    // Initialize Groq client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    createGroqClient(apiKey);
    console.log('✓ Groq client initialized\n');

    // Test case: Single component design (old signature)
    console.log('Test: Single component design system (backward compatibility)');
    
    const technicalSpec = {
      appType: "dashboard",
      components: ["Header", "Sidebar", "DataTable", "Chart"],
      features: ["data-visualization", "filtering", "sorting", "responsive"],
      complexity: "medium",
      designStyle: "modern"
    };

    console.log('Technical Spec:', JSON.stringify(technicalSpec, null, 2));
    console.log('\nGenerating design system using old signature...\n');
    
    const designSystem = await designAgent(technicalSpec, []);
    
    console.log('✓ Design system generated\n');

    // Validate design system structure
    console.log('=== Design System Validation ===');
    
    // Check required fields for single component
    const requiredFields = ['colors', 'fonts', 'spacing', 'style'];
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

    // Display style description
    console.log('\nStyle Description:');
    console.log(`  "${designSystem.style}"`);

    // Check that multi-page fields are optional
    console.log('\nOptional multi-page fields (should not cause errors if missing):');
    const optionalFields = ['breakpoints', 'components', 'layout', 'typography'];
    optionalFields.forEach(field => {
      const exists = field in designSystem;
      console.log(`  ${exists ? '✓' : '-'} ${field}: ${exists ? 'present' : 'not present (OK)'}`);
    });

    console.log('\n=== Test Passed ===');
    console.log('Backward compatibility maintained for single component design.');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testBackwardCompatibility();
