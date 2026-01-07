export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pageInfo: PageInfo;
}

export interface PaginationParams {
    cursor?: string;
    limit?: number;
    direction?: 'forward' | 'backward';
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
