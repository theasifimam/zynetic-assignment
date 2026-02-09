import { Knex } from 'knex';
import { MeterPayload, VehiclePayload } from '../schemas/telemetry';

export class IngestService {
    constructor(private knex: Knex) { }

    async ingest(data: MeterPayload | VehiclePayload) {
        const isMeter = 'meterId' in data;
        const deviceId = isMeter ? (data as MeterPayload).meterId : (data as VehiclePayload).vehicleId;
        const type = isMeter ? 'meter' : 'vehicle';

        // Transaction to ensure atomicity
        await this.knex.transaction(async (trx) => {
            // 1. Cold Storage (Append Only) -> Stores EVERY reading for history/analytics
            await trx('telemetry_cold').insert({
                device_id: deviceId,
                timestamp: data.timestamp,
                type: type,
                data: JSON.stringify(data),
            });

            // 2. Hot Storage (Upsert) -> Stores ONLY the LATEST reading per device for real-time dashboard
            await trx('devices_hot')
                .insert({
                    device_id: deviceId,
                    type: type,
                    latest_data: JSON.stringify(data),
                    updated_at: new Date(),
                })
                .onConflict('device_id') // If device already exists...
                .merge(['latest_data', 'updated_at']); // ...update its data instead of inserting
        });
    }
}
