import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export class CreateProjectMemberDto {
    @ApiProperty({ example: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @ApiProperty({ example: 'Project ID' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string

    @ApiProperty({ example: 'Role', enum: ProjectRole })
    @IsEnum(ProjectRole, { message: 'Cannot assign ADMIN role via this DTO' })
    @IsNotEmpty()
    role: ProjectRole

    @ApiProperty({ example: 'Action Member ID' })
    @IsUUID()
    @IsNotEmpty()
    actionMemberId: string
}