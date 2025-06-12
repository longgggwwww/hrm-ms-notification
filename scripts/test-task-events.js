const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-task-producer',
  brokers: ['localhost:9092'], // Update this to match your Kafka broker
});

const producer = kafka.producer();

async function publishTaskEvent() {
  await producer.connect();
  console.log('🚀 Connected to Kafka');

  // Sample task created event (matching the Go service structure)
  const taskCreatedEvent = {
    event_type: 'task_created',
    task_id: 123,
    task_code: '#123',
    task_name: 'Implement user authentication system',
    project_id: 456,
    project_name: 'HR Management Platform',
    assignee_ids: [101, 102],
    creator_id: 100,
    org_id: 1,
    timestamp: new Date().toISOString(),
    metadata: {
      priority: 'high',
      type: 'feature',
    },
  };

  // Sample task assigned event
  const taskAssignedEvent = {
    event_type: 'task_assigned',
    task_id: 124,
    task_code: '#124',
    task_name: 'Fix login bug in mobile app',
    project_id: 456,
    project_name: 'HR Management Platform',
    assignee_ids: [103, 104],
    creator_id: 100,
    org_id: 1,
    timestamp: new Date().toISOString(),
    metadata: {
      priority: 'urgent',
      type: 'bug',
    },
  };

  // Sample task completed event
  const taskCompletedEvent = {
    event_type: 'task_completed',
    task_id: 125,
    task_code: '#125',
    task_name: 'Update project documentation',
    project_id: 456,
    project_name: 'HR Management Platform',
    assignee_ids: [105],
    creator_id: 105,
    org_id: 1,
    timestamp: new Date().toISOString(),
    metadata: {
      priority: 'low',
      type: 'task',
    },
  };

  try {
    // Send task created event
    console.log('📝 Sending task created event...');
    await producer.send({
      topic: 'task-events',
      messages: [
        {
          key: taskCreatedEvent.task_id.toString(),
          value: JSON.stringify(taskCreatedEvent),
        },
      ],
    });
    console.log('✅ Task created event sent');

    // Wait a bit before sending next event
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send task assigned event
    console.log('👤 Sending task assigned event...');
    await producer.send({
      topic: 'task-events',
      messages: [
        {
          key: taskAssignedEvent.task_id.toString(),
          value: JSON.stringify(taskAssignedEvent),
        },
      ],
    });
    console.log('✅ Task assigned event sent');

    // Wait a bit before sending next event
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send task completed event
    console.log('✅ Sending task completed event...');
    await producer.send({
      topic: 'task-events',
      messages: [
        {
          key: taskCompletedEvent.task_id.toString(),
          value: JSON.stringify(taskCompletedEvent),
        },
      ],
    });
    console.log('✅ Task completed event sent');

    console.log('🎉 All test events sent successfully!');
  } catch (error) {
    console.error('❌ Error sending events:', error);
  } finally {
    await producer.disconnect();
    console.log('👋 Disconnected from Kafka');
  }
}

publishTaskEvent().catch(console.error);
