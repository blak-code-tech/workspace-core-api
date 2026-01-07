import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { DeleteProjectDto } from './dto/delete-project.dto';
import { DeleteProjectMemberDto } from './dto/delete-project-member.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProjectMembersDto } from './dto/project-members.dto';
import { PaginationQueryDto } from 'src/common/pagination/pagination.dto';

@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createProject(@Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.createProject(createProjectDto);
    }

    @Get('members')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get project members with pagination' })
    @ApiResponse({ status: 200, description: 'Paginated list of project members' })
    async getProjectMembers(
        @Body() projectMembersDto: ProjectMembersDto,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return this.projectsService.getProjectMembers(
            projectMembersDto,
            paginationQuery.cursor,
            paginationQuery.limit,
        );
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get projects by team ID with pagination' })
    @ApiResponse({ status: 200, description: 'Paginated list of projects' })
    async getProjectsByTeamId(
        @Query('teamId') teamId: string,
        @Query('userId') userId: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return this.projectsService.getProjectsByTeamId(
            teamId,
            userId,
            paginationQuery.cursor,
            paginationQuery.limit,
        );
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getProjectById(@Param('id') id: string, @Query('userId') userId: string) {
        return this.projectsService.getProjectById(id, userId);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
        return this.projectsService.updateProject(id, updateProjectDto);
    }

    @Delete('remove')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteProject(@Body() deleteProjectDto: DeleteProjectDto) {
        return this.projectsService.deleteProject(deleteProjectDto.projectId, deleteProjectDto.actionMemberId);
    }

    @Post('add-member')
    @HttpCode(HttpStatus.CREATED)
    async addMemberToProject(@Body() createProjectMemberDto: CreateProjectMemberDto) {
        return this.projectsService.addMemberToProject(createProjectMemberDto);
    }

    @Delete('remove-member')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeMemberFromProject(@Body() deleteProjectMemberDto: DeleteProjectMemberDto) {
        return this.projectsService.removeMemberFromProject(deleteProjectMemberDto);
    }

    @Patch('update-member-role')
    @HttpCode(HttpStatus.OK)
    async updateMemberRole(@Body() updateProjectMemberDto: UpdateProjectMemberRoleDto) {
        return this.projectsService.updateMemberRole(updateProjectMemberDto);
    }
}
