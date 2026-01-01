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
import { PostsService } from './posts/posts.service';
import { PostsController } from './posts/posts.controller';
import { PostsModule } from './posts/posts.module';
import { ProjectsController } from './projects/projects.controller';
import { AuthController } from './auth/auth.controller';
import { TeamsService } from './teams/teams.service';
import { AuditLogsService } from './audit-logs/audit-logs.service';
import { AuthService } from './auth/auth.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

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
    PostsModule,
    PrismaModule,
    HealthModule
  ],
  controllers: [AppController, TeamsController, AuditLogsController, PostsController, ProjectsController, AuthController],
  providers: [AppService, UsersService, ProjectsService, PostsService, TeamsService, AuditLogsService, AuthService, {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },],
})
export class AppModule { }
