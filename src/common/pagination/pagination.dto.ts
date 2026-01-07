import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.types';

export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Cursor for pagination (use endCursor from previous response)',
        example: 'eyJpZCI6IjEyMyJ9',
    })
    @IsOptional()
    cursor?: string;

    @ApiPropertyOptional({
        description: 'Number of items to return',
        minimum: 1,
        maximum: MAX_PAGE_SIZE,
        default: DEFAULT_PAGE_SIZE,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(MAX_PAGE_SIZE)
    limit?: number = DEFAULT_PAGE_SIZE;

    @ApiPropertyOptional({
        description: 'Direction of pagination',
        enum: ['forward', 'backward'],
        default: 'forward',
    })
    @IsOptional()
    @IsEnum(['forward', 'backward'])
    direction?: 'forward' | 'backward' = 'forward';
}
