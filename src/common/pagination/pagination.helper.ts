import { BadRequestException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PaginatedResponse } from './pagination.types';

export class PaginationHelper {
    /**
     * Encode a cursor from an ID
     */
    static encodeCursor(id: string): string {
        return Buffer.from(id).toString('base64');
    }

    /**
     * Decode a cursor to get the ID
     */
    static decodeCursor(cursor: string): string {
        try {
            return Buffer.from(cursor, 'base64').toString('utf-8');
        } catch (error) {
            throw new BadRequestException('Invalid cursor format');
        }
    }

    /**
     * Validate and normalize the limit parameter
     */
    static normalizeLimit(limit?: number): number {
        if (!limit || limit < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(limit, MAX_PAGE_SIZE);
    }

    /**
     * Build a paginated response
     * @param items - Array of items (should include one extra item to check for next page)
     * @param limit - The requested limit
     * @param totalCount - Optional total count of all items
     */
    static buildPaginatedResponse<T extends { id: string }>(
        items: T[],
        limit: number,
        totalCount?: number,
    ): PaginatedResponse<T> {
        const hasNextPage = items.length > limit;
        const data = hasNextPage ? items.slice(0, limit) : items;

        const startCursor = data.length > 0 ? this.encodeCursor(data[0].id) : null;
        const endCursor = data.length > 0 ? this.encodeCursor(data[data.length - 1].id) : null;

        return {
            data,
            pageInfo: {
                hasNextPage,
                hasPreviousPage: false, // Can be enhanced for bidirectional pagination
                startCursor,
                endCursor,
                totalCount,
            },
        };
    }
}
