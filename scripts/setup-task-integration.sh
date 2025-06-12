#!/bin/bash

echo "🐳 Setting up HR Task Events Integration"
echo "======================================"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ docker-compose is not installed"
        exit 1
    fi
    echo "✅ docker-compose is available"
}

# Function to start Kafka services
start_kafka() {
    echo ""
    echo "🚀 Starting Kafka and Zookeeper..."
    cd /home/ad/hrm-ms-platform/services/notification
    docker-compose up -d zookeeper kafka
    
    echo "⏳ Waiting for Kafka to be ready..."
    sleep 10
    
    # Check if Kafka is running
    if docker ps | grep -q kafka; then
        echo "✅ Kafka is running"
    else
        echo "❌ Failed to start Kafka"
        exit 1
    fi
}

# Function to build and start notification service
start_notification_service() {
    echo ""
    echo "🔧 Building and starting notification service..."
    cd /home/ad/hrm-ms-platform/services/notification
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Build the project
    echo "🏗️ Building project..."
    npm run build
    
    # Start in development mode
    echo "🚀 Starting notification service in development mode..."
    echo "   (This will run in the background)"
    nohup npm run start:dev > logs/service.log 2>&1 &
    
    # Store the PID
    echo $! > .service.pid
    
    echo "⏳ Waiting for service to start..."
    sleep 5
    
    # Check if service is responding
    for i in {1..10}; do
        if curl -s http://localhost:3000/notifications/health > /dev/null 2>&1; then
            echo "✅ Notification service is running on port 3000"
            return 0
        fi
        echo "   Attempt $i/10 - waiting for service..."
        sleep 2
    done
    
    echo "❌ Service failed to start properly"
    return 1
}

# Function to test the integration
test_integration() {
    echo ""
    echo "🧪 Testing task events integration..."
    cd /home/ad/hrm-ms-platform/services/notification
    
    echo "📤 Sending test task events..."
    npm run kafka:test-tasks
    
    echo ""
    echo "⏳ Waiting for events to be processed..."
    sleep 3
    
    echo "📊 Checking service health and stats..."
    curl -s http://localhost:3000/notifications/health | jq '.' 2>/dev/null || echo "Could not fetch health status"
}

# Function to show service status
show_status() {
    echo ""
    echo "📈 Current Status:"
    echo "=================="
    
    # Docker containers
    echo "🐳 Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(kafka|zookeeper|notification)"
    
    # Service health
    echo ""
    echo "🏥 Service Health:"
    curl -s http://localhost:3000/notifications/health | jq '.status, .kafka.connected, .taskEvents.total' 2>/dev/null || echo "Service not responding"
    
    # Kafka topics
    echo ""
    echo "📋 Kafka Topics:"
    docker exec hrm-ms-platform-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -E "(task|notification)" || echo "Could not list topics"
}

# Function to stop all services
stop_services() {
    echo ""
    echo "🛑 Stopping services..."
    
    # Stop notification service
    if [ -f ".service.pid" ]; then
        PID=$(cat .service.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo "✅ Stopped notification service (PID: $PID)"
        fi
        rm -f .service.pid
    fi
    
    # Stop Docker services
    docker-compose down
    echo "✅ Stopped Docker services"
}

# Create logs directory
mkdir -p logs

# Main execution
case "${1:-start}" in
    "start")
        check_docker
        check_docker_compose
        start_kafka
        start_notification_service
        test_integration
        show_status
        echo ""
        echo "🎉 Setup complete! Use the following commands:"
        echo "   npm run monitor:tasks  - Monitor the system"
        echo "   npm run kafka:test-tasks - Send test events"
        echo "   bash $0 stop - Stop all services"
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "test")
        test_integration
        ;;
    *)
        echo "Usage: $0 {start|stop|status|test}"
        echo "  start  - Start all services and test integration"
        echo "  stop   - Stop all services"
        echo "  status - Show current status"
        echo "  test   - Run integration test"
        ;;
esac
