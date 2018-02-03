import { connect, Client } from 'mqtt';
import { EventEmitter } from 'events';

export interface MqttClientConfig {
  clientId: string;
  broker_address: string;
  broker_port: number;
  rejectUnauthorized: boolean;
  ca: any[];
}

export class MqttClient extends EventEmitter {

  private client: Client;

  constructor(private config: MqttClientConfig) {
    super();
    this.config.clientId = config.clientId;
    this.config.broker_address = config.broker_address;
    this.config.broker_port = config.broker_port;
  }

  public start(): void {
    this.client = connect(this.config.broker_address, {
      clientId: this.config.clientId,
      port: this.config.broker_port,
      rejectUnauthorized: this.config.rejectUnauthorized,
      ca: this.config.ca
    });

    this.client.on('connect', () => {
      console.log(`client.on.connect\n`);

      // this.client.subscribe('home/groundfloor/computerroom/switch/value'); 
    });

    this.client.on('close', () => {
      console.log(`client.on.close\n`);
      // this.client.publish('presence/hello', 'Hellloo mqtt from thing-gw-zwave-mqtt client')
    });

    this.client.on('message', (topic, message) => {
      // message is Buffer
      //   console.log('message receieved\n');
      //   console.log(message.toString());
      this.emit('mqtt_request', topic, message.toString());
    });
  }

  public subscribe(topics: string[]) {
    const len = topics.length;
    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < len; i++) {
      console.log('subscribing');
      this.client.subscribe(topics[i]);
    }
  }

  public send(topic: string, data: string): void {
    // console.log(`\n\n jf - sending(${this.client}) \n\n`)
    this.client.publish(topic, data, (err) => {
      console.log(`send publishs - ${topic} - err: ${err}`);
    });
  }

}
