import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [AuditLogsService, PrismaService]
})
export class AuditLogsModule { }
