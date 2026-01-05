import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TeamsService } from 'src/teams/teams.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { DeleteProjectMemberDto } from './dto/delete-project-member.dto';
import { ProjectMembersDto } from './dto/project-members.dto';
import safeUserSelect from 'src/users/validators/safe-select.validator';

@Injectable()
export class ProjectsService {
    constructor(private prismaService: PrismaService,
        private teamService: TeamsService
    ) { }

    async createProject(data: CreateProjectDto) {
        const team = await this.teamService.getTeamById(data.teamId);
        if (!team) {
            throw new BadRequestException('Team not found');
        }

        const project = await this.prismaService.project.findFirst({ where: { name: data.name } });
        if (project) {
            throw new BadRequestException('Project already exists');
        }

        // We need to make sure that only the admin and owner of the team can create a project
        const teamMember = await this.prismaService.teamMember.findFirst({ where: { teamId: data.teamId, userId: data.userId } });
        if (!teamMember) {
            throw new UnauthorizedException('You are not a member of the team');
        }

        if (teamMember.role !== 'ADMIN' && teamMember.role !== 'OWNER') {
            throw new UnauthorizedException('You are not authorized to create a project');
        }

        const teamOwner = await this.prismaService.teamMember.findFirst({ where: { teamId: data.teamId, role: 'OWNER' } });

        const listOfInitMembers = [
            {
                userId: data.userId,
                role: 'ADMIN',
                addedBy: data.userId
            }
        ] as any;

        if (teamOwner?.userId !== data.userId) {
            listOfInitMembers.push({
                userId: teamOwner?.userId,
                role: 'ADMIN',
                addedBy: data.userId
            })
        }

        const newProject = await this.prismaService.project.create({
            data: {
                name: data.name,
                teamId: data.teamId,
                description: data.description,
                projectMembers: {
                    createMany: {
                        data: listOfInitMembers
                    }
                }
            }
        });

        return newProject;
    }

    async getProjectById(id: string, memberId: string) {
        // Check if the project exists
        const project = await this.prismaService.project.findFirst({
            where: {
                id, deletedAt: null, projectMembers: { some: { userId: memberId } }
            },
            include: {
                projectMembers: {
                    include: {
                        user: {
                            select: safeUserSelect
                        }
                    }
                },
                _count: {
                    select: {
                        projectMembers: true
                    }
                }
            }
        });
        if (!project) {
            throw new BadRequestException('Project not found');
        }

        return project;
    }

    async getProjectMembers(projectMembersDto: ProjectMembersDto) {
        const project = await this.getProjectById(projectMembersDto.projectId, projectMembersDto.memberId);
        if (!project) {
            throw new BadRequestException('Project not found');
        }

        return this.prismaService.projectMember.findMany({
            where: {
                projectId: projectMembersDto.projectId
            }, include: {
                user: {
                    select: safeUserSelect
                }
            }
        });
    }

    async getProjectsByTeamId(teamId: string, userId: string) {
        // Check if the user is a member of the team
        const teamMember = await this.prismaService.teamMember.findFirst({ where: { teamId, userId } });
        if (!teamMember) {
            throw new UnauthorizedException('You are not a member of the team');
        }

        return this.prismaService.project.findMany({
            where: {
                teamId,
                deletedAt: null,
                projectMembers: { some: { userId } }
            },
            include: {
                _count: {
                    select: {
                        projectMembers: true
                    }
                }
            }
        });
    }

    async updateProject(id: string, data: UpdateProjectDto) {
        const project = await this.getProjectById(id, data.userId);
        if (!project) {
            throw new BadRequestException('Project not found');
        }

        // We need to make sure that only the admin of the project can update a project
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { projectId: project.id, userId: data.userId } });
        if (!projectMember) {
            throw new UnauthorizedException('You are not a member of the project');
        }

        if (projectMember.role !== 'ADMIN') {
            throw new UnauthorizedException('You are not authorized to update a project');
        }

        return this.prismaService.project.update({
            where: { id }, data: {
                name: data.name,
                description: data.description
            }
        });
    }

    async addMemberToProject(data: CreateProjectMemberDto) {
        const project = await this.getProjectById(data.projectId, data.actionMemberId);
        if (!project) {
            throw new BadRequestException('Project not found');
        }

        const projectMember = await this.prismaService.projectMember.findFirst({ where: { projectId: data.projectId, userId: data.userId } });
        if (projectMember) {
            throw new BadRequestException('User is already a member of the project');
        }

        // Make sure the action member is an admin of the project
        const actionMember = await this.prismaService.projectMember.findFirst({ where: { projectId: data.projectId, userId: data.actionMemberId, role: 'ADMIN' } });
        if (!actionMember) {
            throw new BadRequestException('You are not authorized to add a member to the project');
        }

        // we need to make sure that the user is part of the team the project is connected to.
        const teamMember = await this.prismaService.teamMember.findFirst({ where: { teamId: project.teamId, userId: data.userId } });
        if (!teamMember) {
            throw new BadRequestException('User is not a member of the team');
        }

        return this.prismaService.projectMember.create({
            data: {
                projectId: data.projectId,
                userId: data.userId,
                role: data.role,
                addedBy: data.actionMemberId
            } as any
        });
    }

    async removeMemberFromProject(data: DeleteProjectMemberDto) {
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { id: data.projectMemberId } });
        if (!projectMember) {
            throw new UnauthorizedException('User is not a member of the project');
        }

        // Make sure the action member is an admin of the project
        const actionMember = await this.prismaService.projectMember.findFirst({ where: { projectId: projectMember.projectId, userId: data.actionMemberId, role: 'ADMIN' } });
        if (!actionMember) {
            throw new UnauthorizedException('You are not authorized to remove a member from the project');
        }

        return this.prismaService.projectMember.delete({ where: { id: projectMember.id } });
    }

    async updateMemberRole(data: UpdateProjectMemberRoleDto) {
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { id: data.projectMemberId } });
        if (!projectMember) {
            throw new UnauthorizedException('User is not a member of the project');
        }

        // Make sure the action member is an admin of the project
        const actionMember = await this.prismaService.projectMember.findFirst({ where: { projectId: projectMember.projectId, userId: data.actionMemberId, role: 'ADMIN' } });
        if (!actionMember) {
            throw new UnauthorizedException('You are not authorized to update a member role in the project');
        }

        return this.prismaService.projectMember.update({ where: { id: projectMember.id }, data: { role: data.role } });
    }

    async deleteProject(id: string, actionMemberId: string) {
        const project = await this.getProjectById(id, actionMemberId);
        if (!project) {
            throw new BadRequestException('Project not found');
        }

        // We need to make sure that only the admin of the project can delete a project
        const projectMember = await this.prismaService.projectMember.findFirst({ where: { projectId: project.id, userId: actionMemberId } });
        if (!projectMember) {
            throw new UnauthorizedException('You are not a member of the project');
        }

        if (projectMember.role !== 'ADMIN') {
            throw new UnauthorizedException('You are not authorized to delete a project');
        }

        return this.prismaService.project.update({ where: { id }, data: { deletedAt: new Date() } });
    }
}
