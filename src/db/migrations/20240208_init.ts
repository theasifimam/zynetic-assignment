import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // 1. Hot Table: devices_hot
    // Purpose: Stores ONLY the latest state of each device for real-time dashboards.
    await knex.schema.createTable("devices_hot", (table) => {
        table.string("device_id").primary(); // Unique ID (meterId or vehicleId)
        table.string("type").notNullable(); // 'meter' or 'vehicle'
        table.jsonb("latest_data").notNullable(); // The full latest JSON payload
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    // 2. Cold Table: telemetry_cold
    // Purpose: Stores EVERY single reading ever received for historical analytics.
    await knex.schema.createTable("telemetry_cold", (table) => {
        table.string("device_id").notNullable();
        table.timestamp("timestamp").notNullable();
        table.string("type").notNullable(); // 'meter' or 'vehicle'
        table.jsonb("data").notNullable(); // The full JSON payload

        // Composite Primary Key: Ensures uniqueness per device + timestamp
        // Also creates an index on (device_id, timestamp) for fast range queries.
        table.primary(["device_id", "timestamp"]);
    });

    // Index for analytics queries on cold data
    // (device_id, timestamp) is already the PK, so it's indexed.
    // We might want an index on just timestamp for global queries if needed, 
    // but the requirement is device-specific analytics.
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("telemetry_cold");
    await knex.schema.dropTableIfExists("devices_hot");
}
