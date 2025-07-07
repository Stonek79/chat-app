import { NextResponse } from 'next/server';
import { z } from 'zod';

interface ApiErrorOptions {
    status?: number;
    message?: string;
    errors?: Record<string, string[]> | null;
}

export function handleApiError(error: unknown, options: ApiErrorOptions = {}): NextResponse {
    // Логируем ошибку на сервере для отладки
    console.error('[API Error]:', error);

    if (error instanceof z.ZodError) {
        // Дополнительное детальное логгирование для Zod-ошибок
        console.error('[Zod Validation Error Details]:', JSON.stringify(error.flatten(), null, 2));
        return NextResponse.json(
            {
                message: options.message || 'Ошибка валидации данных',
                errors: error.flatten().fieldErrors,
            },
            { status: options.status || 400 }
        );
    }

    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                message: error.message,
                errors: error.errors,
            },
            { status: error.status }
        );
    }

    if (error instanceof Error) {
        // PrismaClientKnownRequestError и другие специфичные ошибки Prisma наследуются от Error
        // Можно добавить более специфичную обработку для кодов ошибок Prisma, если это необходимо
        // например, if (error.code === 'P2002') для уникальных ограничений

        return NextResponse.json(
            {
                message: error.message || options.message || 'Внутренняя ошибка сервера',
                errors: options.errors,
            },
            { status: options.status || 500 }
        );
    }

    // Если это не экземпляр Error и не ZodError
    return NextResponse.json(
        {
            message: options.message || 'Неизвестная внутренняя ошибка сервера',
            errors: options.errors,
        },
        { status: options.status || 500 }
    );
}

// Пример специфичной ошибки для удобства
export class ApiError extends Error {
    public readonly status: number;
    public readonly errors: Record<string, string[]> | null;

    constructor(
        message: string,
        status: number = 500,
        errors: Record<string, string[]> | null = null
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
