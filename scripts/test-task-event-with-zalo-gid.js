const { Kafka } = require('kafkajs');

async function sendTaskEventWithZaloGid() {
  const kafka = new Kafka({
    clientId: 'test-producer-zalo-gid',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer();

  try {
    await producer.connect();
    console.log('✅ Connected to Kafka');

    const taskEvent = {
      event_id: 'test-event-' + Date.now(),
      event_type: 'task.created',
      timestamp: new Date().toISOString(),
      source: 'hrm-ms-hr',
      task_id: 12345,
      task_code: 'TASK-TEST-2025',
      task_name: 'Test Task with Zalo Group Integration',
      description: 'This is a test task to verify Zalo Group ID integration',
      project_id: 1,
      project_name: 'Test Project',
      department_id: 5,
      creator_id: 101,
      updater_id: 101,
      status: 'pending',
      type: 'feature',
      process: 0,
      start_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee_ids: [201, 202, 203],
      label_ids: [301, 302],
      org_id: 1,
      zalo_gid: '3456789012345678901', // Test Zalo Group ID
    };

    const message = {
      key: `task_${taskEvent.task_id}`,
      value: JSON.stringify(taskEvent),
      timestamp: Date.now().toString(),
    };

    await producer.send({
      topic: 'task-events',
      messages: [message],
    });

    console.log('📨 Task event with Zalo GID sent successfully:');
    console.log(JSON.stringify(taskEvent, null, 2));

    // Send another event with task update
    const taskUpdateEvent = {
      ...taskEvent,
      event_id: 'test-update-' + Date.now(),
      event_type: 'task.updated',
      process: 50,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    };

    await producer.send({
      topic: 'task-events',
      messages: [
        {
          key: `task_${taskUpdateEvent.task_id}`,
          value: JSON.stringify(taskUpdateEvent),
        },
      ],
    });

    console.log('📨 Task update event with Zalo GID sent successfully:');
    console.log(JSON.stringify(taskUpdateEvent, null, 2));
  } catch (error) {
    console.error('❌ Error sending task events:', error);
  } finally {
    await producer.disconnect();
    console.log('🔌 Disconnected from Kafka');
  }
}

// Run the test
sendTaskEventWithZaloGid().catch(console.error);
