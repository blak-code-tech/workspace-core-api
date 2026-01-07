import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs.service';
import { AuditAction } from '../enums/audit-action.enum';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { user, method, url, body, ip, headers } = request;

        // Skip logging if no user (public endpoints)
        if (!user) {
            return next.handle();
        }

        // Determine action based on route and method
        const action = this.determineAction(method, url);

        // Skip if action cannot be determined
        if (!action) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: (response) => {
                    // Log asynchronously to not block the response
                    this.logAction(user, action, url, body, ip, headers, response).catch(
                        (error) => {
                            console.error('Failed to create audit log:', error);
                        },
                    );
                },
                error: (error) => {
                    // Log errors too
                    this.logAction(user, action, url, body, ip, headers, null, error).catch(
                        (logError) => {
                            console.error('Failed to create audit log for error:', logError);
                        },
                    );
                },
            }),
        );
    }

    private async logAction(
        user: any,
        action: AuditAction,
        url: string,
        body: any,
        ip: string,
        headers: any,
        response?: any,
        error?: any,
    ) {
        const meta: any = {
            url,
            userAgent: headers['user-agent'],
        };

        // Extract entity information from response or body
        let entityType: string | undefined;
        let entityId: string | undefined;

        if (response?.id) {
            entityId = response.id;
            entityType = this.extractEntityType(url);
        } else if (body?.id) {
            entityId = body.id;
            entityType = this.extractEntityType(url);
        }

        // Add error info if present
        if (error) {
            meta.error = {
                message: error.message,
                status: error.status,
            };
        }

        // Sanitize sensitive data from body
        const sanitizedBody = this.sanitizeBody(body);
        if (sanitizedBody && Object.keys(sanitizedBody).length > 0) {
            meta.body = sanitizedBody;
        }

        await this.auditLogsService.create({
            userId: user.sub,
            action,
            entityType,
            entityId,
            ipAddress: ip,
            meta,
        });
    }

    private determineAction(method: string, url: string): AuditAction | null {
        // Auth routes
        if (url.includes('/auth/sign-in')) return AuditAction.SIGN_IN;
        if (url.includes('/auth/sign-up')) return AuditAction.SIGN_UP;
        if (url.includes('/auth/refresh')) return AuditAction.REFRESH_TOKEN;
        if (url.includes('/auth/logout-all')) return AuditAction.SIGN_OUT_ALL;
        if (url.includes('/auth/logout')) return AuditAction.SIGN_OUT;

        // Team routes
        if (url.match(/\/teams$/) && method === 'POST') return AuditAction.CREATE_TEAM;
        if (url.match(/\/teams\/[^/]+$/) && method === 'PATCH') return AuditAction.UPDATE_TEAM;
        if (url.match(/\/teams\/[^/]+$/) && method === 'DELETE') return AuditAction.DELETE_TEAM;
        if (url.includes('/teams/') && url.includes('/members') && method === 'POST')
            return AuditAction.ADD_TEAM_MEMBER;
        if (url.includes('/teams/') && url.includes('/members') && method === 'DELETE')
            return AuditAction.REMOVE_TEAM_MEMBER;
        if (url.includes('/teams/') && url.includes('/members/') && url.includes('/role'))
            return AuditAction.UPDATE_TEAM_MEMBER_ROLE;

        // Project routes
        if (url.match(/\/projects$/) && method === 'POST') return AuditAction.CREATE_PROJECT;
        if (url.match(/\/projects\/[^/]+$/) && method === 'PATCH') return AuditAction.UPDATE_PROJECT;
        if (url.match(/\/projects\/[^/]+$/) && method === 'DELETE') return AuditAction.DELETE_PROJECT;
        if (url.includes('/projects/') && url.includes('/members') && method === 'POST')
            return AuditAction.ADD_PROJECT_MEMBER;
        if (url.includes('/projects/') && url.includes('/members') && method === 'DELETE')
            return AuditAction.REMOVE_PROJECT_MEMBER;
        if (url.includes('/projects/') && url.includes('/members/') && url.includes('/role'))
            return AuditAction.UPDATE_PROJECT_MEMBER_ROLE;

        // Document routes
        if (url.match(/\/documents$/) && method === 'POST') return AuditAction.CREATE_DOCUMENT;
        if (url.match(/\/documents\/[^/]+$/) && method === 'PATCH') return AuditAction.UPDATE_DOCUMENT;
        if (url.match(/\/documents\/[^/]+$/) && method === 'DELETE') return AuditAction.DELETE_DOCUMENT;
        if (url.match(/\/documents\/[^/]+$/) && method === 'GET') return AuditAction.VIEW_DOCUMENT;

        // User routes
        if (url.match(/\/users\/[^/]+$/) && method === 'PATCH') return AuditAction.UPDATE_USER;
        if (url.match(/\/users\/[^/]+$/) && method === 'DELETE') return AuditAction.DELETE_USER;

        return null;
    }

    private extractEntityType(url: string): string | undefined {
        if (url.includes('/teams')) return 'Team';
        if (url.includes('/projects')) return 'Project';
        if (url.includes('/documents')) return 'Document';
        if (url.includes('/users')) return 'User';
        return undefined;
    }

    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') return null;

        const sanitized = { ...body };

        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken'];
        sensitiveFields.forEach((field) => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }
}
