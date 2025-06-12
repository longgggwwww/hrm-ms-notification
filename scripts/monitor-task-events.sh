#!/bin/bash

# Task Events Monitoring Script
# This script helps monitor the notification service and Kafka integration

echo "🚀 HR Task Events Monitoring Dashboard"
echo "======================================"

# Function to check if service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if curl -s http://localhost:${port}/notifications/health > /dev/null 2>&1; then
        echo "✅ ${service_name} is running on port ${port}"
        return 0
    else
        echo "❌ ${service_name} is not responding on port ${port}"
        return 1
    fi
}

# Function to get service stats
get_stats() {
    local port=$1
    echo ""
    echo "📊 Service Statistics:"
    curl -s http://localhost:${port}/notifications/stats | jq '.' 2>/dev/null || echo "Could not fetch stats"
}

# Function to get health status
get_health() {
    local port=$1
    echo ""
    echo "🏥 Health Status:"
    curl -s http://localhost:${port}/notifications/health | jq '.' 2>/dev/null || echo "Could not fetch health status"
}

# Function to check Kafka topics
check_kafka_topics() {
    echo ""
    echo "📋 Kafka Topics:"
    if command -v docker &> /dev/null; then
        docker exec hrm-ms-platform-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -E "(task-events|notifications)" || echo "Could not list Kafka topics"
    else
        echo "Docker not available - skipping Kafka topic check"
    fi
}

# Function to monitor logs in real-time
monitor_logs() {
    echo ""
    echo "📝 Real-time Log Monitoring (Press Ctrl+C to stop):"
    echo "Watching for task events..."
    
    # Try to tail Docker logs if available
    if command -v docker &> /dev/null; then
        docker logs -f hrm-ms-platform-notification-1 2>/dev/null | grep -E "(Task|task|Event|event|📝|✅|❌|🎯)" --color=always
    else
        echo "Docker not available - please check service logs manually"
    fi
}

# Function to send test events
send_test_events() {
    echo ""
    echo "🧪 Sending Test Task Events..."
    cd /home/ad/hrm-ms-platform/services/notification
    npm run kafka:test-tasks
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Check service health"
    echo "2) View service statistics"
    echo "3) Check Kafka topics"
    echo "4) Send test task events"
    echo "5) Monitor logs in real-time"
    echo "6) Full dashboard (all checks)"
    echo "7) Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            check_service 3000 "Notification Service"
            get_health 3000
            ;;
        2)
            get_stats 3000
            ;;
        3)
            check_kafka_topics
            ;;
        4)
            send_test_events
            ;;
        5)
            monitor_logs
            ;;
        6)
            echo "🔍 Running full dashboard..."
            check_service 3000 "Notification Service"
            get_health 3000
            get_stats 3000
            check_kafka_topics
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. JSON output will not be formatted."
    echo "   Install with: sudo apt-get install jq"
fi

# Main loop
while true; do
    show_menu
    echo ""
    read -p "Press Enter to continue..."
done
