import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { TeamsService } from 'src/teams/teams.service';

@Module({
  providers: [DocumentsService, PrismaService, ProjectsService, TeamsService],
  controllers: [DocumentsController]
})
export class DocumentsModule { }
