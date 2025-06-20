#!/bin/bash

# Script để test task events với Zalo Group ID integration
# Sử dụng script này để verify rằng notification service có thể nhận và xử lý events với field zalo_gid

echo "🚀 Testing Task Events with Zalo Group ID integration..."
echo "=============================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run this test."
    exit 1
fi

# Check if Kafka is running
echo "🔍 Checking Kafka connection..."
if ! nc -z localhost 9092 2>/dev/null; then
    echo "❌ Kafka is not running on localhost:9092"
    echo "   Please start Kafka before running this test."
    exit 1
fi

echo "✅ Kafka is running"

# Check if kafkajs is available
if ! npm list kafkajs >/dev/null 2>&1; then
    echo "📦 Installing kafkajs..."
    npm install kafkajs
fi

echo "📨 Sending test task events with Zalo Group ID..."
echo ""

# Run the test script
node scripts/test-task-event-with-zalo-gid.js

echo ""
echo "✅ Test completed!"
echo ""
echo "📝 What to check:"
echo "   1. Check notification service logs for Zalo Group ID processing"
echo "   2. Verify that events are processed without errors"
echo "   3. Look for log messages containing 'Zalo Group ID: 3456789012345678901'"
echo "   4. Confirm that Zalo notifications are sent (if Zalo tokens are configured)"
echo ""
echo "🔍 Sample log output you should see:"
echo "   💬 Zalo Group ID: 3456789012345678901"
echo "   📱 Using Zalo Group ID: 3456789012345678901 for task TASK-TEST-2025"
echo "   ✅ Task Event Processed Successfully"
