import express from 'express';
import knex from 'knex';
import knexConfig from './db/knexfile';
import { IngestService } from './services/ingestService';
import { AnalyticsService } from './services/analyticsService';
import { createApiRouter } from './routes/api';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database Connection
const db = knex(knexConfig.development);

// Services
const ingestService = new IngestService(db);
const analyticsService = new AnalyticsService(db);

// Routes
app.use('/v1', createApiRouter(ingestService, analyticsService));

// Health Check
app.get('/health', async (req, res) => {
    try {
        await db.raw('SELECT 1');
        res.status(200).send('OK');
    } catch (e) {
        res.status(503).send('Unhealthy');
    }
});

// Start Server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
