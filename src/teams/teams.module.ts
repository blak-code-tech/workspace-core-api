import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamsController } from './teams.controller';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, PrismaService],
  exports: [TeamsService]
})
export class TeamsModule { }
