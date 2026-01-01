import { ApiProperty } from "@nestjs/swagger";
import { TeamRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export class CreateTeamMemberDto {
    @ApiProperty({ example: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @ApiProperty({ example: 'Team ID' })
    @IsNotEmpty()
    teamId: string

    @ApiProperty({ example: 'Role', enum: TeamRole })
    @IsEnum(TeamRole)
    @IsNotEmpty()
    role: TeamRole
}