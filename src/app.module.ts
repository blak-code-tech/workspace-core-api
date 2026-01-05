import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { TeamsController } from './teams/teams.controller';
import { TeamsModule } from './teams/teams.module';
import { ProjectsService } from './projects/projects.service';
import { ProjectsModule } from './projects/projects.module';
import { AuditLogsController } from './audit-logs/audit-logs.controller';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ProjectsController } from './projects/projects.controller';
import { AuthController } from './auth/auth.controller';
import { TeamsService } from './teams/teams.service';
import { AuditLogsService } from './audit-logs/audit-logs.service';
import { AuthService } from './auth/auth.service';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentsService } from './documents/documents.service';
import { DocumentsController } from './documents/documents.controller';
import { AuditLogInterceptor } from './audit-logs/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    TeamsModule,
    ProjectsModule,
    AuditLogsModule,
    PrismaModule,
    HealthModule,
    DocumentsModule
  ],
  controllers: [AppController, TeamsController, AuditLogsController, ProjectsController, AuthController, DocumentsController],
  providers: [
    AppService,
    UsersService,
    ProjectsService,
    DocumentsService,
    TeamsService,
    AuditLogsService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule { }
