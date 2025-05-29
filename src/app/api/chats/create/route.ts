import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // Пример для NextAuth, или ваша логика получения userId


/**
 * API маршрут для создания нового чата.
 * @param {NextRequest} request - Запрос на создание чата.
 * @returns {Promise<NextResponse>} Ответ сервера.
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Получить ID аутентифицированного пользователя (создателя чата)
    // const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // if (!token || !token.sub) {
    //   return NextResponse.json({ message: 'Неавторизован' }, { status: 401 });
    // }
    // const userId = token.sub;
    const userId = 'temp-user-id'; // Заглушка, замените на реальное получение ID пользователя

    const body = await request.json();
    const { name, participantIds, isGroup } = body; // name для групповых, participantIds для приватных/групповых

    // TODO: Валидация данных (например, с помощью Zod)
    if (isGroup && !name) {
      return NextResponse.json({ message: 'Имя группового чата обязательно' }, { status: 400 });
    }
    if (!isGroup && (!participantIds || participantIds.length !== 1)) {
      return NextResponse.json({ message: 'Для приватного чата нужен один ID участника' }, { status: 400 });
    }
    if (isGroup && (!participantIds || participantIds.length === 0)) {
        return NextResponse.json({ message: 'В групповом чате должны быть участники' }, { status: 400 });
    }

    // TODO: Логика создания чата и его участников в базе данных
    // const newChat = await prisma.chat.create({
    //   data: {
    //     name: isGroup ? name : null,
    //     isGroup,
    //     // creatorId: userId, // Если отслеживаем создателя
    //     participants: {
    //       create: [
    //         { userId: userId }, // Создатель чата также участник
    //         ...participantIds.map((id: string) => ({ userId: id }))
    //       ]
    //     }
    //   },
    //   include: {
    //     participants: true, // Чтобы вернуть участников в ответе
    //   }
    // });

    // return NextResponse.json({ message: 'Чат успешно создан', chat: newChat }, { status: 201 });
    return NextResponse.json({ message: 'API создания чата. Замените этот обработчик.', received: body, creatorId: userId }, { status: 200 });

  } catch (error) {
    console.error('Ошибка создания чата:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 