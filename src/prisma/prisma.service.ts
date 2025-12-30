import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor() {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl || typeof databaseUrl !== 'string') {
            throw new Error('DATABASE_URL environment variable is not set or is not a string');
        }

        // Parse the DATABASE_URL to ensure password is properly handled
        const url = new URL(databaseUrl);

        const pool = new pg.Pool({
            host: url.hostname,
            port: parseInt(url.port || '5432', 10),
            database: url.pathname.slice(1), // Remove leading '/'
            user: url.username,
            password: url.password, // Explicitly set as string
            ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : undefined,
        });

        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log: ["query", "info", "warn", "error"],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
