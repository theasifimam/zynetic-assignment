import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000/v1/ingest';

// Devices
const METER_ID = 'meter-001';
const VEHICLE_ID = 'vehicle-001';

const generateMeterData = (timestamp: Date) => ({
    meterId: METER_ID,
    kwhConsumedAc: Math.random() * 5 + 10, // 10-15 kWh
    voltage: 220 + (Math.random() * 10 - 5), // 215-225 V
    timestamp: timestamp.toISOString(),
});

const generateVehicleData = (timestamp: Date) => ({
    vehicleId: VEHICLE_ID,
    soc: Math.floor(Math.random() * 100),
    kwhDeliveredDc: Math.random() * 4 + 8, // 8-12 kWh
    batteryTemp: 25 + (Math.random() * 10 - 5), // 20-30 C
    timestamp: timestamp.toISOString(),
});

const seed = async () => {
    console.log('Seeding data...');

    const now = new Date();
    const promises = [];

    // Generate 50 records over the last 24 hours
    for (let i = 0; i < 50; i++) {
        const time = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 mins

        // Meter Data
        promises.push(axios.post(API_URL, generateMeterData(time)));

        // Vehicle Data
        promises.push(axios.post(API_URL, generateVehicleData(time)));
    }

    try {
        await Promise.all(promises);
        console.log('Successfully seeded 100 records!');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

seed();
