import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Audit Logs E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let userToken: string;
    let userId: string;
    let adminId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Create test users
        const adminResponse = await request(app.getHttpServer())
            .post('/auth/sign-up')
            .send({
                email: 'admin@test.com',
                password: 'Admin123!',
                firstName: 'Admin',
                lastName: 'User',
            });

        adminToken = adminResponse.body.access_token;

        // Update user to admin role
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@test.com' },
        });
        adminId = adminUser.id;

        await prisma.user.update({
            where: { id: adminId },
            data: { role: 'ADMIN' },
        });

        // Get new token with admin role
        const adminSignIn = await request(app.getHttpServer())
            .post('/auth/sign-in')
            .send({
                email: 'admin@test.com',
                password: 'Admin123!',
            });
        adminToken = adminSignIn.body.access_token;

        const userResponse = await request(app.getHttpServer())
            .post('/auth/sign-up')
            .send({
                email: 'user@test.com',
                password: 'User123!',
                firstName: 'Regular',
                lastName: 'User',
            });

        userToken = userResponse.body.access_token;
        const regularUser = await prisma.user.findUnique({
            where: { email: 'user@test.com' },
        });
        userId = regularUser.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    describe('Automatic Logging', () => {
        it('should automatically log sign-in action', async () => {
            // Sign in should create an audit log
            await request(app.getHttpServer())
                .post('/auth/sign-in')
                .send({
                    email: 'user@test.com',
                    password: 'User123!',
                })
                .expect(201);

            // Wait a bit for async logging
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Check audit log was created
            const logs = await prisma.auditLog.findMany({
                where: {
                    userId: userId,
                    action: 'SIGN_IN',
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
            });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].action).toBe('SIGN_IN');
            expect(logs[0].userId).toBe(userId);
        });

        it('should log team creation', async () => {
            const response = await request(app.getHttpServer())
                .post('/teams')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Test Team',
                    description: 'A test team',
                })
                .expect(201);

            // Wait for async logging
            await new Promise((resolve) => setTimeout(resolve, 500));

            const logs = await prisma.auditLog.findMany({
                where: {
                    userId: userId,
                    action: 'CREATE_TEAM',
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
            });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].action).toBe('CREATE_TEAM');
            expect(logs[0].entityType).toBe('Team');
            expect(logs[0].entityId).toBe(response.body.id);
        });
    });

    describe('GET /audit-logs', () => {
        it('should allow admin to get all audit logs', async () => {
            const response = await request(app.getHttpServer())
                .get('/audit-logs')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('page');
            expect(response.body.meta).toHaveProperty('limit');
            expect(response.body.meta).toHaveProperty('totalPages');
        });

        it('should forbid regular user from getting all audit logs', async () => {
            await request(app.getHttpServer())
                .get('/audit-logs')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should filter audit logs by action', async () => {
            const response = await request(app.getHttpServer())
                .get('/audit-logs?action=SIGN_IN')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.every((log) => log.action === 'SIGN_IN')).toBe(true);
        });

        it('should paginate audit logs', async () => {
            const response = await request(app.getHttpServer())
                .get('/audit-logs?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(5);
            expect(response.body.meta.limit).toBe(5);
            expect(response.body.meta.page).toBe(1);
        });
    });

    describe('GET /audit-logs/user/:userId', () => {
        it('should allow user to get their own audit logs', async () => {
            const response = await request(app.getHttpServer())
                .get(`/audit-logs/user/${userId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.every((log) => log.userId === userId)).toBe(true);
        });

        it('should forbid user from getting another user\'s audit logs', async () => {
            await request(app.getHttpServer())
                .get(`/audit-logs/user/${adminId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should allow admin to get any user\'s audit logs', async () => {
            const response = await request(app.getHttpServer())
                .get(`/audit-logs/user/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.every((log) => log.userId === userId)).toBe(true);
        });
    });

    describe('GET /audit-logs/stats', () => {
        it('should allow admin to get audit log statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/audit-logs/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('actionStats');
            expect(typeof response.body.total).toBe('number');
            expect(typeof response.body.actionStats).toBe('object');
        });

        it('should forbid regular user from getting statistics', async () => {
            await request(app.getHttpServer())
                .get('/audit-logs/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should filter statistics by user', async () => {
            const response = await request(app.getHttpServer())
                .get(`/audit-logs/stats?userId=${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('actionStats');
        });
    });

    describe('POST /audit-logs', () => {
        it('should allow admin to manually create audit log', async () => {
            const response = await request(app.getHttpServer())
                .post('/audit-logs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userId: adminId,
                    action: 'UPDATE_USER',
                    entityType: 'User',
                    entityId: adminId,
                    ipAddress: '127.0.0.1',
                    meta: {
                        field: 'email',
                        oldValue: 'old@test.com',
                        newValue: 'new@test.com',
                    },
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.action).toBe('UPDATE_USER');
            expect(response.body.userId).toBe(adminId);
        });

        it('should forbid regular user from manually creating audit log', async () => {
            await request(app.getHttpServer())
                .post('/audit-logs')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    userId: userId,
                    action: 'UPDATE_USER',
                })
                .expect(403);
        });
    });
});
