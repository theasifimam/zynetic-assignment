import { Knex } from 'knex';
import { VehiclePayload, MeterPayload } from '../schemas/telemetry';

export class AnalyticsService {
    constructor(private knex: Knex) { }

    async getPerformance(vehicleId: string) {
        // 24-hour window
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Fetch data from Cold Storge for the last 24h
        // We use the composite index (device_id, timestamp) for speed
        const rows = await this.knex('telemetry_cold')
            .where('device_id', vehicleId)
            .where('timestamp', '>=', twentyFourHoursAgo)
            .where('timestamp', '<=', now)
            .select('type', 'data');

        let totalAc = 0;
        let totalDc = 0;
        let tempSum = 0;
        let tempCount = 0;

        for (const row of rows) {
            let data = row.data;
            // Postgres JSONB is auto-parsed by Knex,
            // but for assurity lets parse it again
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            if (row.type === 'meter') {
                // Meter: Sum up Energy Consumed (AC)
                totalAc += (data as MeterPayload).kwhConsumedAc || 0;

            } else if (row.type === 'vehicle') {
                // Vehicle: Sum up Energy Delivered (DC)
                totalDc += (data as VehiclePayload).kwhDeliveredDc || 0;

                // Vehicle: Track Battery Temp for Average calculation
                if ((data as VehiclePayload).batteryTemp !== undefined) {
                    tempSum += (data as VehiclePayload).batteryTemp;
                    tempCount++;
                }
            }
        }

        const efficiency = totalAc > 0 ? totalDc / totalAc : 0;
        const avgBatteryTemp = tempCount > 0 ? tempSum / tempCount : 0;

        return {
            vehicleId,
            period: '24h',
            totalkwhConsumedAc: totalAc,
            totalkwhDeliveredDc: totalDc,
            efficiencyRatio: efficiency,
            avgBatteryTemp: avgBatteryTemp
        };
    }
}
