import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDocumentDto {
    @ApiProperty({ example: 'Document Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Document Content' })
    @IsString()
    @IsOptional()
    content: string;

    @ApiProperty({ example: 'Project ID' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({ example: 'Author ID' })
    @IsUUID()
    @IsNotEmpty()
    authorId: string;
}