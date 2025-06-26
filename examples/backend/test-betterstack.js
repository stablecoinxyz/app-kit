#!/usr/bin/env node

/**
 * Quick test script to verify BetterStack connection
 * 
 * Usage:
 * export BETTERSTACK_SOURCE_TOKEN="bt_your_token_here"
 * node test-betterstack.js
 */

const BETTERSTACK_URL = 'https://in.logs.betterstack.com/';

async function testBetterStackConnection() {
  const token = process.env.BETTERSTACK_SOURCE_TOKEN;
  
  if (!token) {
    console.error('❌ BETTERSTACK_SOURCE_TOKEN environment variable is required');
    console.log('Get your token from: https://betterstack.com/logs');
    process.exit(1);
  }

  console.log('🧪 Testing BetterStack connection...');
  
  const testLog = {
    level: 'info',
    message: 'betterstack_connection_test',
    timestamp: new Date().toISOString(),
    source: 'sbc-app-kit-test',
    test: true
  };

  try {
    const response = await fetch(BETTERSTACK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLog)
    });

    if (response.ok) {
      console.log('✅ Successfully connected to BetterStack!');
      console.log('📊 Check your BetterStack dashboard for the test log');
      console.log('🔍 Search for: message:"betterstack_connection_test"');
    } else {
      console.error('❌ Failed to send log:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Response:', errorText);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testBetterStackConnection(); 