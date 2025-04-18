#!/bin/bash

# DeepSeek Integration Setup Script for Codex CLI
echo "==== DeepSeek Integration Setup for Codex CLI ===="
echo

# Check if OpenAI SDK is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install OpenAI SDK if needed
if ! npm list -g | grep -q "@openai/codex"; then
    echo "Installing Codex CLI..."
    npm install -g @openai/codex
else
    echo "Codex CLI is already installed."
fi

# Prompt for DeepSeek API key
echo
echo "Please enter your DeepSeek API key (from https://platform.deepseek.com/):"
read -p "> " DEEPSEEK_API_KEY

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "Error: DeepSeek API key is required."
    exit 1
fi

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
DEEPSEEK_API_URL=https://api.deepseek.com
EOF

echo ".env file created successfully!"

# Install required dependencies for test script
echo "Installing required dependencies for test script..."
npm install --no-save openai

# Create test configuration
echo "Testing DeepSeek API connection..."
source .env
node deepseek-test.js

if [ $? -eq 0 ]; then
    echo
    echo "==== Setup Complete ===="
    echo "To use DeepSeek with Codex CLI:"
    echo "1. Run 'source .env' in your terminal before using the Codex CLI"
    echo "2. Or add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo "   export DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}"
    echo "   export DEEPSEEK_API_URL=https://api.deepseek.com"
    echo
    echo "You can now run 'codex' to start using DeepSeek AI models!"
else
    echo
    echo "Setup failed. Please check the error messages above and try again."
    exit 1
fi 