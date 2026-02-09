import { z } from 'zod';

// Schema for Meter Data (AC input)
export const MeterPayloadSchema = z.object({
    meterId: z.string(),
    kwhConsumedAc: z.number(),
    voltage: z.number(),
    timestamp: z.string().datetime(),
});

// Schema for Vehicle Data (DC output + Battery)
export const VehiclePayloadSchema = z.object({
    vehicleId: z.string(),
    soc: z.number().min(0).max(100), // State of Charge (0-100%)
    kwhDeliveredDc: z.number(),
    batteryTemp: z.number(),
    timestamp: z.string().datetime(),
});

export type MeterPayload = z.infer<typeof MeterPayloadSchema>;
export type VehiclePayload = z.infer<typeof VehiclePayloadSchema>;

// Unified schema for ingestion (can be either Meter or Vehicle)
export const IngestPayloadSchema = z.union([MeterPayloadSchema, VehiclePayloadSchema]);
