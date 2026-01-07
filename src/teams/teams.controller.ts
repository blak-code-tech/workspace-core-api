import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { TeamRoles } from './decorators/team-roles.decorator';
import { TeamRole } from '@prisma/client';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { DeleteTeamMemberDto } from './dto/delete-team-member.dto';
import { DeleteTeamDto } from './dto/delete-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/pagination/pagination.dto';

@ApiBearerAuth()
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
    @ApiOperation({ summary: 'Get teams by user ID with pagination' })
    @ApiResponse({ status: 200, description: 'Paginated list of teams' })
    async getTeamsByUserId(
        @Query('userId') userId: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return await this.teamsService.getTeamsByUserId(
            userId,
            paginationQuery.cursor,
            paginationQuery.limit,
        );
    }

    @Get('members')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get team members with pagination' })
    @ApiResponse({ status: 200, description: 'Paginated list of team members' })
    async getTeamMembers(
        @Query('teamId') teamId: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return await this.teamsService.getTeamMembers(
            teamId,
            paginationQuery.cursor,
            paginationQuery.limit,
        );
    }

    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getTeamById(@Param('id') id: string) {
        console.log(id);
        return await this.teamsService.getTeamById(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateTeam(@Param('id') id: string, @Body() data: UpdateTeamDto) {
        return await this.teamsService.updateTeam(id, data);
    }
}
