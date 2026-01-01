import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamRole } from '@prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';

@Injectable()
export class TeamsService {
    constructor(private readonly prisma: PrismaService) { }

    async createTeam(data: CreateTeamDto) {
        // Before creating we need to ensure that the team name does not already exist for the user creating it
        const existingTeams = await this.getTeamsByUserId(data.ownerId);

        if (existingTeams.some((team) => team.name === data.name)) {
            throw new BadRequestException('Team name already exists.');
        }

        const team = await this.prisma.team.create({
            data: {
                name: data.name,
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

    async getTeamById(id: string) {
        try {
            return await this.prisma.team.findFirstOrThrow({ where: { id, deletedAt: null } });
        } catch (error) {
            console.error(error);
            throw new BadRequestException('Team not found');
        }
    }

    async getTeamsByUserId(userId: string) {
        const teams = await this.prisma.team.findMany({
            where: {
                deletedAt: null,
                members: {
                    some: { userId },
                },
            },
        });
        return teams;
    }

    async getTeamMembers(teamId: string) {
        const team = await this.getTeamById(teamId);

        if (!team) {
            throw new BadRequestException('Team not found');
        }

        return await this.prisma.teamMember.findMany({ where: { teamId } });
    }

    async getTeamMember(teamMemberId: string) {
        const teamMember = await this.prisma.teamMember.findUnique({ where: { id: teamMemberId } });

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
        const existingMembers = await this.getTeamMembers(data.teamId);

        if (existingMembers.some((member) => member.userId === data.userId)) {
            throw new BadRequestException('User is already a member of the team');
        }

        if (data.role === TeamRole.OWNER) {
            throw new BadRequestException('Cannot assign OWNER role via addMember');
        }

        // Optional: only allow assigning ADMIN if caller is OWNER
        if (data.role === TeamRole.ADMIN && actionMember.role !== TeamRole.OWNER) {
            throw new BadRequestException('Only the team OWNER can assign ADMIN role');
        }

        return await this.prisma.teamMember.create({ data });
    }

}
