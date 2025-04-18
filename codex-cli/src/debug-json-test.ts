/**
 * Debug utility to test JSON parsing with large outputs
 * 
 * Usage:
 * 1. Set DEBUG=1 environment variable
 * 2. Run this script with node: npm run tsx src/debug-json-test.ts
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DebugLogger } from './utils/debug-logger';
import { parseToolCallOutput } from './utils/parsers';

// Directory for logs
const DEBUG_DIR = path.join(process.cwd(), 'debug-logs');

// Create debug directory
async function init() {
  process.env["DEBUG"] = "1";
  await fs.mkdir(DEBUG_DIR, { recursive: true });
  console.log(`Debug logs will be saved to ${DEBUG_DIR}`);
}

// Generate test JSON of varying sizes to check parsing
async function runParsingTests() {
  // Test various sized outputs
  await testParser('small', 1000);
  await testParser('medium', 50000);
  await testParser('large', 100000);
  await testParser('very-large', 200000);
  
  // Test a truncated JSON
  await testCorruptedJson();
}

// Test parser with different sized payloads
async function testParser(size: string, length: number) {
  console.log(`\nTesting ${size} JSON (${length} chars)...`);
  
  // Generate test output (long string with JSON wrapper)
  const output = generateTestOutput(length);
  
  try {
    // Try parsing
    console.log(`Parsing ${size} JSON...`);
    const result = parseToolCallOutput(output);
    console.log(`Successfully parsed ${size} JSON`);
    
    // Write result
    await fs.writeFile(
      path.join(DEBUG_DIR, `test-${size}-result.json`),
      JSON.stringify(result, null, 2)
    );
    
    return true;
  } catch (err) {
    console.error(`Failed to parse ${size} JSON:`, err);
    return false;
  }
}

// Test with corrupted/truncated JSON
async function testCorruptedJson() {
  console.log(`\nTesting corrupted/truncated JSON...`);
  
  // Generate test output with corrupted/truncated content
  const fullJson = generateTestOutput(10000);
  
  // Truncate at different points
  const truncatedPoints = [
    fullJson.length - 1,         // Missing last character
    fullJson.length - 5,         // Missing last few characters
    fullJson.lastIndexOf('}'),   // Missing closing brace
    fullJson.lastIndexOf('"') + 1 // Cut in middle of a string
  ];
  
  for (let i = 0; i < truncatedPoints.length; i++) {
    const truncatedJson = fullJson.substring(0, truncatedPoints[i]);
    console.log(`Testing truncation type ${i+1}...`);
    
    try {
      // Try parsing
      const result = parseToolCallOutput(truncatedJson);
      console.log(`Successfully recovered from truncation type ${i+1}`);
      
      // Write result
      await fs.writeFile(
        path.join(DEBUG_DIR, `test-truncated-${i+1}-result.json`),
        JSON.stringify(result, null, 2)
      );
    } catch (err) {
      console.error(`Failed to parse truncated JSON type ${i+1}:`, err);
    }
    
    // Save raw truncated content for inspection
    await fs.writeFile(
      path.join(DEBUG_DIR, `test-truncated-${i+1}-raw.json`),
      truncatedJson
    );
  }
}

// Generate a test JSON string of the specified length
function generateTestOutput(length: number): string {
  // Generate a long string to simulate command output
  let longOutput = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  // Generate chunks of text to reach desired length
  while (longOutput.length < length - 100) {
    let chunk = '';
    for (let i = 0; i < 80; i++) {
      chunk += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    longOutput += chunk + '\n';
  }
  
  // Wrap in proper JSON format for tool call output
  return JSON.stringify({
    output: longOutput,
    metadata: {
      exit_code: 0,
      duration_seconds: 1.234
    }
  });
}

// Main function
async function main() {
  await init();
  await runParsingTests();
  console.log('\nTests completed. Check the debug-logs directory for results.');
}

main().catch(console.error); 