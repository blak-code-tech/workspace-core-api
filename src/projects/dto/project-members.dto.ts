import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ProjectMembersDto {
    @ApiProperty({ example: "Project Id" })
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: "Member Id" })
    @IsString()
    @IsNotEmpty()
    memberId: string;
}