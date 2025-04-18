const { OpenAI } = require('openai');

// Replace with your actual API key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

async function testDeepSeekAPI() {
  if (!DEEPSEEK_API_KEY) {
    console.error('Error: DEEPSEEK_API_KEY environment variable is not set');
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_API_URL
  });

  console.log('Testing DeepSeek API connectivity...');
  console.log(`API URL: ${DEEPSEEK_API_URL}`);
  
  try {
    // List available models
    console.log('Fetching available models...');
    const models = await client.models.list();
    console.log('Available models:');
    for (const model of models.data) {
      console.log(`- ${model.id}`);
    }
    
    // Test simple chat completion
    console.log('\nTesting chat completion with deepseek-chat model...');
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello! What can you do?' }
      ]
    });

    console.log('Chat completion response:');
    console.log(completion.choices[0].message.content);
    
    console.log('\nDeepSeek API test completed successfully!');
  } catch (error) {
    console.error('Error testing DeepSeek API:');
    console.error(error);
    process.exit(1);
  }
}

testDeepSeekAPI(); 