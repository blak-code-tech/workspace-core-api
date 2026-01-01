import { ApiProperty } from "@nestjs/swagger";
import { TeamRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export class CreateTeamMemberDto {
    @ApiProperty({ example: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @ApiProperty({ example: 'Team ID' })
    @IsUUID()
    @IsNotEmpty()
    teamId: string

    @ApiProperty({ example: 'Role', enum: TeamRole })
    @IsEnum(TeamRole, { message: 'Cannot assign OWNER role via this DTO' })
    @IsNotEmpty()
    role: TeamRole

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}