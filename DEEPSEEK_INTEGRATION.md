# DeepSeek Integration Guide

This guide explains how to use DeepSeek's AI models with the Codex CLI instead of OpenAI.

## Setup

1. Install the Codex CLI:

```bash
npm install -g @openai/codex
```

2. Get a DeepSeek API key:
   - Sign up at https://platform.deepseek.com/
   - Go to the API Keys section
   - Generate a new API key

3. Set the required environment variables:

```bash
# Required: Your DeepSeek API key
export DEEPSEEK_API_KEY=your_api_key_here

# Optional: Override the API URL if needed
export DEEPSEEK_API_URL=https://api.deepseek.com
```

## Available Models

DeepSeek currently offers the following models that are compatible with the Codex CLI:

| OpenAI Model | DeepSeek Equivalent |
|--------------|---------------------|
| gpt-4, gpt-4.1, o3, o4-mini | deepseek-chat (DeepSeek-V3) |
| gpt-4o | deepseek-reasoner (DeepSeek-R1) |

## Testing Your Setup

You can test your DeepSeek integration using the included test script:

```bash
node deepseek-test.js
```

This will verify connectivity to the DeepSeek API and test a simple chat completion.

## Troubleshooting

If you encounter issues, check the following:

1. **404 Error**: Ensure you're using the correct API URL (`https://api.deepseek.com` without the `/v1` suffix) and a valid model name.

2. **Authentication Error**: Verify your API key is correctly set in the environment variable.

3. **Model Not Found**: Use only the officially supported models: `deepseek-chat` or `deepseek-reasoner`.

## Usage Notes

- The models support the same capabilities as OpenAI models but performance may vary
- The DeepSeek API is rate-limited; check the [documentation](https://api-docs.deepseek.com/) for current limits
- Pricing information is available on the [DeepSeek website](https://platform.deepseek.com)

## Example Configuration

Create a `.env` file in your project directory:

```bash
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com
```

Then source it before running the CLI:

```bash
source .env
codex
``` 