import * as admin from 'firebase-admin';

const aserviceAccount = require('../serviceAccountKey.json');
const SMALL_LOG = 5;

export class FirebaseService {

  private db: any;
  private smallLogKey: number;
  private filter: number;

  constructor(dburl: any) {
    admin.initializeApp({
      credential: admin.credential.cert(aserviceAccount),
      databaseURL: dburl
    });

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    this.db = admin.database();
  }

  public start() {
    const ref = this.db.ref('/telemetry/switch0001');

    this.filter = Date.now();

    ref.once('value')
      .then((snapshot) => {
        const numEntries = snapshot.numChildren();
        console.log(`snapshot - ${numEntries}`);
      });

  }

  public updateSensorBAK(id: string, level: string, scale: string, time: string) {
    const ref = this.db.ref();
    const clientsRef = ref.child(`sensor/${id}`);

    clientsRef.update({ 
      level: level,
      scale: scale,
      time: time
    });
  }

  public updateSensorData(id: string, level: string, scale: string, time: string) {
    const ref = this.db.ref();
    const updates = {};

    // filter for id === powermeter0001
    if (id === 'powermeter0001' && (parseInt(time) - this.filter) < 60000) {
      console.log(`filter too early - ${this.filter}`);
      return;
    } else if (id === 'powermeter0001') {
      this.filter = parseInt(time);
      console.log(`filter ok - ${this.filter}`);
    }

    // A sensor entry
    const sensorData = {
      level: level,
      scale: scale,
      time: time
    };

    // A telemetry entry
    const telemetryData = {
      level: level,
      time: time
    };

    // Get a key for the telemetry data
    const newTelemetryKey = ref.child(`telemetry/${id}`).push().key;

    // Update simuntaneously sensor entry and the telemetry log
    updates[`/sensor/${id}`] = sensorData;
    updates[`/telemetry/${id}/${newTelemetryKey}`] = telemetryData;

    ref.update(updates);
  }

}
