import { ApiProperty } from "@nestjs/swagger";
import { TeamRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export class UpdateTeamMemberRoleDto {
    @ApiProperty({ example: 'Team Member ID' })
    @IsUUID()
    @IsNotEmpty()
    teamMemberId: string

    @ApiProperty({ example: 'Role', enum: TeamRole })
    @IsEnum(TeamRole)
    @IsNotEmpty()
    role: TeamRole

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}