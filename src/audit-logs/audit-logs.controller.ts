import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PlatformRole } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(AuthGuard)
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    /**
     * Create a new audit log entry (Admin only)
     * POST /audit-logs
     */
    @Post()
    async create(@Body() createAuditLogDto: CreateAuditLogDto, @Request() req) {
        // Only admins can manually create audit logs
        if (req.user.role !== PlatformRole.ADMIN && req.user.role !== PlatformRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can create audit logs');
        }
        return this.auditLogsService.create(createAuditLogDto);
    }

    /**
     * Get all audit logs with filters (Admin only)
     * GET /audit-logs?userId=xxx&action=xxx&startDate=xxx&endDate=xxx&page=1&limit=50
     */
    @Get()
    async findAll(@Query() queryDto: QueryAuditLogsDto, @Request() req) {
        // Only admins can view all audit logs
        if (req.user.role !== PlatformRole.ADMIN && req.user.role !== PlatformRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view all audit logs');
        }
        return this.auditLogsService.findAll(queryDto);
    }

    /**
     * Get audit logs for a specific user
     * GET /audit-logs/user/:userId
     * Users can see their own logs, admins can see all
     */
    @Get('user/:userId')
    async findByUser(
        @Param('userId') userId: string,
        @Query() queryDto: QueryAuditLogsDto,
        @Request() req,
    ) {
        // Users can only view their own logs, admins can view any user's logs
        if (
            req.user.sub !== userId &&
            req.user.role !== PlatformRole.ADMIN &&
            req.user.role !== PlatformRole.SUPER_ADMIN
        ) {
            throw new ForbiddenException('You can only view your own audit logs');
        }
        return this.auditLogsService.findByUser(userId, queryDto);
    }

    /**
     * Get audit log statistics (Admin only)
     * GET /audit-logs/stats?userId=xxx&startDate=xxx&endDate=xxx
     */
    @Get('stats')
    async getStats(
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Request() req?,
    ) {
        // Only admins can view statistics
        if (req.user.role !== PlatformRole.ADMIN && req.user.role !== PlatformRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view audit log statistics');
        }
        return this.auditLogsService.getStats(userId, startDate, endDate);
    }
}
