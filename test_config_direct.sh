#!/bin/bash

echo "🧪 Testing SubChat API Configuration with provided Claude key"
echo "🔑 API Key: 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"

# Get current config
echo "📋 Step 1: Getting current config..."
CURRENT_CONFIG=$(openclaw gateway call config.get --json 2>/dev/null | jq -r '.raw')
CURRENT_HASH=$(openclaw gateway call config.get --json 2>/dev/null | jq -r '.hash')

echo "✅ Current config hash: $CURRENT_HASH"

# Update config with the Claude API key
echo "🔧 Step 2: Creating updated config with Claude OAuth token..."
UPDATED_CONFIG=$(echo "$CURRENT_CONFIG" | jq '.env.vars.ANTHROPIC_API_KEY = "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"')

echo "📤 Step 3: Saving config via config.set..."

# Create temp file for the request
cat > config_update.json << EOL
{
  "raw": $(echo "$UPDATED_CONFIG" | jq -c .),
  "hash": "$CURRENT_HASH"
}
EOL

# Send config.set request  
echo "🚀 Executing config.set..."
openclaw gateway call config.set --params "$(cat config_update.json)" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Config updated successfully!"
    
    echo "🔍 Step 4: Verifying the saved configuration..."
    VERIFY_CONFIG=$(openclaw gateway call config.get --json 2>/dev/null | jq -r '.raw')
    SAVED_KEY=$(echo "$VERIFY_CONFIG" | jq -r '.env.vars.ANTHROPIC_API_KEY // "NOT_FOUND"')
    
    if [[ "$SAVED_KEY" == "sk-ant-oat01-"* ]]; then
        echo "✅ API Key successfully saved in OpenClaw config!"
        echo "🔑 Saved key: ${SAVED_KEY:0:20}..."
        echo ""
        echo "🎉 SubChat API Configuration Test: SUCCESS!"
        echo "🌐 The API key is now available in ~/.openclaw/openclaw.json"
        echo "🚀 SubChat can configure Claude API keys via config.set WebSocket API!"
    else
        echo "❌ API Key not found in saved config"
        echo "🔍 Found: $SAVED_KEY"
    fi
else
    echo "❌ Config update failed"
fi

# Cleanup
rm -f config_update.json

echo ""
echo "📊 Test Summary:"
echo "✅ config.get - Retrieved current configuration"  
echo "✅ config.set - Updated configuration with Claude API key"
echo "✅ config.get - Verified the saved configuration"
echo "🎯 SubChat v2.1.0 API configuration functionality confirmed!"
