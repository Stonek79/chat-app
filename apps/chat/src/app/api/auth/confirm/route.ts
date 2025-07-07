// src/app/api/auth/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

/**
 * API маршрут для подтверждения email пользователя.
 * @param {NextRequest} request - Запрос, обычно содержащий токен подтверждения в URL.
 * @returns {Promise<NextResponse>} Ответ сервера.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Токен подтверждения отсутствует' }, { status: 400 });
    }

    // TODO: Поиск пользователя по токену (токен может храниться в отдельной модели или быть частью User)
    // TODO: Если токен валиден и не истек:
    //   - Пометить email пользователя как подтвержденный (например, установить поле emailVerified)
    //   - Удалить или пометить токен как использованный

    // return NextResponse.json({ message: 'Email успешно подтвержден!' });
    return NextResponse.json({ message: 'API подтверждения Email. Замените этот обработчик.', token }, { status: 200 });

  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 