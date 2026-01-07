import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamRole } from '@prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import safeUserSelect from 'src/users/validators/safe-select.validator';
import { PaginationHelper } from 'src/common/pagination/pagination.helper';
import { PaginatedResponse } from 'src/common/pagination/pagination.types';

@Injectable()
export class TeamsService {
    constructor(private readonly prisma: PrismaService) { }

    async createTeam(data: CreateTeamDto) {
        // Before creating we need to ensure that the team name does not already exist for the user creating it
        const existingTeamsResponse = await this.getTeamsByUserId(data.ownerId);

        if (existingTeamsResponse.data.some((team) => team.name === data.name)) {
            throw new BadRequestException('Team name already exists.');
        }

        const team = await this.prisma.team.create({
            data: {
                name: data.name,
                description: data.description,
                members: {
                    create: {
                        userId: data.ownerId,
                        role: TeamRole.OWNER
                    }
                }
            }
        });

        return team;
    }

    async updateTeam(id: string, data: UpdateTeamDto) {
        const team = await this.getTeamById(id);

        if (!team) {
            throw new BadRequestException('Team not found');
        }

        if (data.name === team.name) {
            throw new BadRequestException('Team name already exists.');
        }

        return await this.prisma.team.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
            }
        });
    }

    async getTeamById(id: string) {
        try {
            return await this.prisma.team.findFirstOrThrow({
                where: { id, deletedAt: null },
                include: {
                    members: {
                        include: {
                            user: {
                                select: safeUserSelect
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
            throw new BadRequestException('Team not found');
        }
    }

    async getTeamsByUserId(
        userId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<PaginatedResponse<any>> {
        const normalizedLimit = PaginationHelper.normalizeLimit(limit);

        const where: any = {
            deletedAt: null,
            members: {
                some: { userId },
            },
            ...(cursor && {
                id: { lt: PaginationHelper.decodeCursor(cursor) },
            }),
        };

        const teams = await this.prisma.team.findMany({
            where,
            include: {
                _count: {
                    select: {
                        members: true
                    }
                },
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take: normalizedLimit + 1,
        });

        return PaginationHelper.buildPaginatedResponse(teams, normalizedLimit);
    }

    async getTeamMembers(
        teamId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<PaginatedResponse<any>> {
        const team = await this.getTeamById(teamId);

        if (!team) {
            throw new BadRequestException('Team not found');
        }

        const normalizedLimit = PaginationHelper.normalizeLimit(limit);

        const where: any = {
            teamId,
            ...(cursor && {
                id: { lt: PaginationHelper.decodeCursor(cursor) },
            }),
        };

        const teamMembers = await this.prisma.teamMember.findMany({
            where,
            include: {
                user: {
                    select: safeUserSelect
                },
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take: normalizedLimit + 1,
        });

        return PaginationHelper.buildPaginatedResponse(teamMembers, normalizedLimit);
    }

    async getTeamMember(teamMemberId: string) {
        const teamMember = await this.prisma.teamMember.findUnique({
            where: { id: teamMemberId }, include: {
                user: {
                    select: safeUserSelect
                }
            }
        });

        if (!teamMember) {
            throw new BadRequestException('Team member not found');
        }

        return teamMember;
    }

    async updateTeamMemberRole(teamMemberId: string, role: TeamRole, actionMemberId: string) {
        // check if the action member is the owner or admin of the team
        const actionMember = await this.getTeamMember(actionMemberId);
        const teamMember = await this.getTeamMember(teamMemberId);

        if (!teamMember) {
            throw new BadRequestException('Team member not found');
        }

        if (!actionMember) {
            throw new BadRequestException('You are not a member of the team and hence cannot change the role of the team member');
        }

        // You cannot update your own role
        if (actionMemberId === teamMemberId) {
            throw new BadRequestException('You cannot update your own role');
        }

        if (actionMember.role !== TeamRole.OWNER && actionMember.role !== TeamRole.ADMIN) {
            throw new BadRequestException('You are not the owner or admin of the team and hence cannot change the role of the team member');
        }

        if (teamMember.role === TeamRole.OWNER) {
            throw new BadRequestException('You cannot change the role of the owner of the team');
        }

        // Also an admin should not be able to change an admins role
        if (teamMember.role === TeamRole.ADMIN && actionMember.role === TeamRole.ADMIN) {
            throw new BadRequestException('You cannot change the role of another admin');
        }

        // Only the owner can make another user the owner
        if (role === TeamRole.OWNER && actionMember.role !== TeamRole.OWNER) {
            throw new BadRequestException('You cannot make another user the owner');
        }

        return await this.prisma.teamMember.update({ where: { id: teamMemberId }, data: { role } });
    }

    async removeTeamMember(teamMemberId: string, actionMemberId: string) {
        const actionMember = await this.getTeamMember(actionMemberId);
        const teamMember = await this.getTeamMember(teamMemberId);

        if (!teamMember) {
            throw new BadRequestException('Team member not found');
        }

        if (!actionMember) {
            throw new BadRequestException('You are not a member of the team and hence cannot remove the team member');
        }

        if (actionMemberId === teamMemberId) {
            throw new BadRequestException('You cannot remove your own team member');
        }

        if (actionMember.role !== TeamRole.OWNER && actionMember.role !== TeamRole.ADMIN) {
            throw new BadRequestException('You are not the owner or admin of the team and hence cannot remove the team member');
        }

        return await this.prisma.teamMember.delete({ where: { id: teamMemberId } });
    }

    async removeTeam(teamId: string, actionMemberId: string) {
        const actionMember = await this.getTeamMember(actionMemberId);
        const team = await this.getTeamById(teamId);

        if (!team) {
            throw new BadRequestException('Team not found');
        }

        if (!actionMember) {
            throw new BadRequestException('You are not a member of the team and hence cannot remove the team');
        }

        if (actionMember.role !== TeamRole.OWNER) {
            throw new BadRequestException('You are not the owner of the team and hence cannot remove the team');
        }

        await this.prisma.$transaction([
            this.prisma.team.update({ where: { id: teamId }, data: { deletedAt: new Date() } }),
            this.prisma.project.updateMany({ where: { teamId }, data: { deletedAt: new Date() } }),
            this.prisma.document.updateMany({ where: { project: { teamId } }, data: { deletedAt: new Date() } }),
        ]);
    }

    async addMember(data: CreateTeamMemberDto) {

        // Find the team
        const team = await this.getTeamById(data.teamId);
        const actionMember = await this.getTeamMember(data.actionMemberId);

        if (!team) {
            throw new BadRequestException('Team not found');
        }

        // we need to make sure the member is not already a member of the team
        const existingMembersResponse = await this.getTeamMembers(data.teamId);

        if (existingMembersResponse.data.some((member) => member.userId === data.userId)) {
            throw new BadRequestException('User is already a member of the team');
        }

        if (data.role === TeamRole.OWNER) {
            throw new BadRequestException('Cannot assign OWNER role via addMember');
        }

        // Optional: only allow assigning ADMIN if caller is OWNER
        if (data.role === TeamRole.ADMIN && actionMember.role !== TeamRole.OWNER) {
            throw new BadRequestException('Only the team OWNER can assign ADMIN role');
        }

        return await this.prisma.teamMember.create({
            data: {
                userId: data.userId,
                teamId: data.teamId,
                role: data.role,
            },
        });
    }
}
