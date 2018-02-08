import { MqttClient, MqttClientConfig } from './lib/MqttClient';
import { FirebaseService } from './lib/FirebaseService';
import * as fs from 'fs';
import { config } from 'dotenv';
import * as process from 'process';

const CMD_RE = /^ba-1\/type\/(.+)\/id\/(.+)\/evt\/(.+)\/fmt\/(.+)$/;

// Load environment i.e .env file
config();

const mqttConfig: MqttClientConfig = {
  clientId: process.env.CLIENTID,
  broker_address: process.env.MQTTS_BROKER_ADDRESS,
  broker_port: parseInt(process.env.MQTTS_BROKER_PORT),
  rejectUnauthorized: false,
  ca: [fs.readFileSync('./dist/ca.crt')]
};

// DB
const fb = new FirebaseService(process.env.FIREBASEURL);
fb.start();

// Handle actuators i.e. set from cloud/spa
// TODO - need to refactor/generalize
fb.addEventListener('sensor/switch0001/level', (val)  => {
  console.log(`event trigger - send mqtt cmd, val:${val}`);
  mqttClient.send('ba-1/type/actuator/id/switch0001/cmd/set/fmt/json', val);
});

// Create MQTT Client Interface
const mqttClient = new MqttClient(mqttConfig);
mqttClient.start();

// Subscribe to top level
mqttClient.subscribe([process.env.TOPIC]);

mqttClient.on('mqtt_request', (topic, message) => {
  console.log(`\n\nmessage received\n - topic=${topic}\n - message=${message}`);

  const match = CMD_RE.exec(topic);
  const pay = JSON.parse(message);

  if (match) {
    console.log(`cmd: type:${match[1]} id:${match[2]}, evt:${match[3]}, evt:${match[4]}`);
    console.log(`payload: level:${pay.level} scale:${pay.scale}, time:${pay.ts}`);
  }
  fb.updateSensorData(match[1], match[2], pay.level, pay.scale ? pay.scale : 'n/a', pay.ts);
});

