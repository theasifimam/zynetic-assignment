import axios from 'axios';

const API_URL = 'http://localhost:3000/v1';

async function runVerification() {
    console.log('Starting Verification...');

    // 1. Ingest Meter Data
    console.log('Ingesting Meter Data...');
    const meterData = {
        meterId: 'device-123',
        kwhConsumedAc: 10.5,
        voltage: 230,
        timestamp: new Date().toISOString()
    };

    try {
        await axios.post(`${API_URL}/ingest`, meterData);
        console.log('✅ Meter Data Ingested');
    } catch (e: any) {
        console.error('❌ Meter Ingest Failed:', e.response?.data || e.message);
    }

    // 2. Ingest Vehicle Data
    console.log('Ingesting Vehicle Data...');
    const vehicleData = {
        vehicleId: 'device-123', // Same ID to correlate
        soc: 80,
        kwhDeliveredDc: 8.5, // 8.5 / 10.5 = ~81% efficiency (< 85% fault)
        batteryTemp: 35,
        timestamp: new Date().toISOString()
    };

    try {
        await axios.post(`${API_URL}/ingest`, vehicleData);
        console.log('✅ Vehicle Data Ingested');
    } catch (e: any) {
        console.error('❌ Vehicle Ingest Failed:', e.response?.data || e.message);
    }

    // 3. Get Analytics
    console.log('Fetching Analytics...');
    try {
        const res = await axios.get(`${API_URL}/analytics/performance/device-123`);
        console.log('Analytics Response:', res.data);

        if (res.data.efficiencyRatio > 0 && res.data.vehicleId === 'device-123') {
            console.log('✅ Analytics Verification Passed');
        } else {
            console.error('❌ Analytics Verification Failed: Invalid Payload');
        }
    } catch (e: any) {
        console.error('❌ Analytics Failed:', e.response?.data || e.message);
    }
}

runVerification();
