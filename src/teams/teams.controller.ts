import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { TeamRoles } from './decorators/team-roles.decorator';
import { TeamRole } from '@prisma/client';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { DeleteTeamMemberDto } from './dto/delete-team-member.dto';
import { DeleteTeamDto } from './dto/delete-team.dto';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createTeam(@Body() data: CreateTeamDto) {
        return await this.teamsService.createTeam(data);
    }

    @TeamRoles(TeamRole.ADMIN, TeamRole.OWNER)
    @Post('add-member')
    @HttpCode(HttpStatus.CREATED)
    async addMember(@Body() data: CreateTeamMemberDto) {
        return await this.teamsService.addMember(data);
    }

    @TeamRoles(TeamRole.ADMIN, TeamRole.OWNER)
    @Patch('update-member-role')
    @HttpCode(HttpStatus.OK)
    async updateMemberRole(@Body() data: UpdateTeamMemberRoleDto) {
        return await this.teamsService.updateTeamMemberRole(data.teamMemberId, data.role, data.actionMemberId);
    }

    @TeamRoles(TeamRole.ADMIN, TeamRole.OWNER)
    @Delete('remove-member')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeMember(@Body() data: DeleteTeamMemberDto) {
        return await this.teamsService.removeTeamMember(data.teamMemberId, data.actionMemberId);
    }

    @TeamRoles(TeamRole.ADMIN, TeamRole.OWNER)
    @Delete('remove')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeTeam(@Body() data: DeleteTeamDto) {
        return await this.teamsService.removeTeam(data.teamId, data.actionMemberId);
    }

    @Get('user-teams')
    @HttpCode(HttpStatus.OK)
    async getTeamsByUserId(@Query('userId') userId: string) {
        return await this.teamsService.getTeamsByUserId(userId);
    }

    @Get('members')
    @HttpCode(HttpStatus.OK)
    async getTeamMembers(@Query('teamId') teamId: string) {
        return await this.teamsService.getTeamMembers(teamId);
    }
}
