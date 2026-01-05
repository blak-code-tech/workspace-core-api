import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class ProjectDocumentDto {
    @ApiProperty({ example: 'Project ID' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;
} 