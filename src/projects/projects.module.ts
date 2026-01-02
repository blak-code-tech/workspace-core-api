import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamsService } from 'src/teams/teams.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService, TeamsService],
  exports: [ProjectsService]
})
export class ProjectsModule { }
