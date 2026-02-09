import { Router, Request, Response } from 'express';
import { IngestService } from '../services/ingestService';
import { AnalyticsService } from '../services/analyticsService';
import { IngestPayloadSchema } from '../schemas/telemetry';
import { z } from 'zod';

export const createApiRouter = (ingestService: IngestService, analyticsService: AnalyticsService) => {
    const router = Router();

    // POST /ingest
    // Receives telemetry data from devices (Meters or Vehicles)
    router.post('/ingest', async (req: Request, res: Response) => {
        try {
            // 1. Strict Validation: Ensure data matches our Zod schema
            const payload = IngestPayloadSchema.parse(req.body);

            // 2. Ingest: Handoff to service for storage (Cold + Hot)
            await ingestService.ingest(payload);

            res.status(202).json({ status: 'accepted' });
        } catch (error) {
            // Error Handling: Return 400 for bad data, 500 for server crash
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: 'Invalid payload', details: error.issues });
            } else {
                console.error("Ingest Error:", error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    });

    // GET /analytics/performance/:vehicleId
    // Returns aggregated stats (Efficiency, Avg Temp) for the last 24 hours
    router.get('/analytics/performance/:vehicleId', async (req: Request<{ vehicleId: string }>, res: Response) => {
        try {
            const { vehicleId } = req.params;

            const stats = await analyticsService.getPerformance(vehicleId);

            res.json(stats);
        } catch (error) {
            console.error("Analytics Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
