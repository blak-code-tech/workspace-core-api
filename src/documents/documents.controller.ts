import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ProjectDocumentDto } from './dto/project-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DeleteDocumentDto } from './dto/delete-document.dto';

@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
    constructor(private documentsService: DocumentsService) { }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    async createDocument(@Body() data: CreateDocumentDto) {
        return this.documentsService.createDocument(data);
    }

    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getDocumentById(@Param("id") id: string, @Body() data: ProjectDocumentDto) {
        return this.documentsService.getDocumentById(id, data.projectId, data.userId);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async getDocumentsByProjectId(@Body() data: ProjectDocumentDto) {
        return this.documentsService.getDocumentsByProjectId(data.projectId, data.userId);
    }

    @Patch(":id")
    @HttpCode(HttpStatus.OK)
    async updateDocument(@Param("id") id: string, @Body() data: UpdateDocumentDto) {
        return this.documentsService.updateDocument(id, data);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDocument(@Param("id") id: string, @Body() data: DeleteDocumentDto) {
        return this.documentsService.deleteDocument(id, data);
    }
}
