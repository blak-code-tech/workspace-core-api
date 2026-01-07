import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditAction } from './enums/audit-action.enum';
import { PaginationHelper } from 'src/common/pagination/pagination.helper';
import { PaginatedResponse } from 'src/common/pagination/pagination.types';

@Injectable()
export class AuditLogsService {
    constructor(private prismaService: PrismaService) { }

    /**
     * Create a new audit log entry
     */
    async create(createAuditLogDto: CreateAuditLogDto) {
        return this.prismaService.auditLog.create({
            data: {
                userId: createAuditLogDto.userId,
                action: createAuditLogDto.action,
                entityType: createAuditLogDto.entityType,
                entityId: createAuditLogDto.entityId,
                ipAddress: createAuditLogDto.ipAddress,
                meta: createAuditLogDto.meta,
            },
        });
    }

    /**
     * Get all audit logs with filtering and cursor-based pagination
     */
    async findAll(queryDto: QueryAuditLogsDto): Promise<PaginatedResponse<any>> {
        const { userId, action, entityType, entityId, startDate, endDate, cursor, limit = 50 } = queryDto;

        const normalizedLimit = PaginationHelper.normalizeLimit(limit);

        const where: any = {};

        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (cursor) {
            where.id = { lt: PaginationHelper.decodeCursor(cursor) };
        }

        const logs = await this.prismaService.auditLog.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take: normalizedLimit + 1,
        });

        return PaginationHelper.buildPaginatedResponse(logs, normalizedLimit);
    }

    /**
     * Get audit logs for a specific user with cursor-based pagination
     */
    async findByUser(userId: string, queryDto: QueryAuditLogsDto): Promise<PaginatedResponse<any>> {
        return this.findAll({ ...queryDto, userId });
    }

    /**
     * Get audit logs for a specific action
     */
    async findByAction(action: AuditAction, queryDto: QueryAuditLogsDto) {
        return this.findAll({ ...queryDto, action });
    }

    /**
     * Get statistics about audit logs
     */
    async getStats(userId?: string, startDate?: string, endDate?: string) {
        const where: any = {};

        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [total, actionCounts] = await Promise.all([
            this.prismaService.auditLog.count({ where }),
            this.prismaService.auditLog.groupBy({
                by: ['action'],
                where,
                _count: {
                    action: true,
                },
            }),
        ]);

        const actionStats = actionCounts.reduce((acc, curr) => {
            acc[curr.action] = curr._count.action;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            actionStats,
        };
    }
}
