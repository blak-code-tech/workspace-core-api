import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDocumentDto {
    @ApiProperty({
        description: 'Document title',
        example: 'Sample Document'
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Document content',
        example: 'Document Content'
    })
    @IsString()
    @IsOptional()
    content: string;

    @ApiProperty({
        description: 'Project ID',
        example: 'Project ID'
    })
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({
        description: 'Author ID',
        example: 'Author ID'
    })
    @IsUUID()
    @IsNotEmpty()
    authorId: string;
}