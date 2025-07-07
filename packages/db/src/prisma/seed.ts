import { ChatParticipantRole,PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Хеширование паролей
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('password456', 10);
    const hashedPasswordAdmin = await bcrypt.hash('adminpassword', 10);

    // 1. Создание пользователей
    const user1 = await prisma.user.create({
        data: {
            username: 'AliceWonder',
            email: 'alice@example.com',
            hashedPassword: hashedPassword1,
            isVerified: true,
            publicKey: 'alice_public_key_example', // Заглушка
        },
    });

    const user2 = await prisma.user.create({
        data: {
            username: 'BobTheBuilder',
            email: 'bob@example.com',
            hashedPassword: hashedPassword2,
            isVerified: true,
            publicKey: 'bob_public_key_example', // Заглушка
        },
    });

    // Предполагаемый администратор
    const adminUser = await prisma.user.create({
        data: {
            username: 'AdminUser',
            email: 'admin@example.com',
            hashedPassword: hashedPasswordAdmin,
            isVerified: true,
            publicKey: 'admin_public_key_example', // Заглушка
            role: 'ADMIN', // Назначаем системную роль ADMIN из enum UserRole
        },
    });

    console.log(`Created users: ${user1.username}, ${user2.username}, ${adminUser.username}`);

    // 2. Создание чатов
    // Групповой чат 1
    const groupChat1 = await prisma.chat.create({
        data: {
            name: 'Проект "Феникс"',
            isGroupChat: true,
            avatarUrl: '/icons/group-avatar1.png', // Пример URL
        },
    });

    // Групповой чат 2
    const groupChat2 = await prisma.chat.create({
        data: {
            name: 'Любители котиков',
            isGroupChat: true,
        },
    });

    // Приватный чат между Alice и Bob
    const privateChat = await prisma.chat.create({
        data: {
            isGroupChat: false,
            // Имя для приватного чата обычно не устанавливается или генерируется на клиенте
        },
    });

    console.log(
        `Created chats: ${groupChat1.name}, ${groupChat2.name}, Private Chat (ID: ${privateChat.id})`
    );

    // 3. Добавление участников в чаты
    // Alice и Admin в "Проект Феникс" (groupChat1)
    // Alice (user1) будет OWNER, а системный adminUser - ADMIN этого чата
    await prisma.chatParticipant.createMany({
        data: [
            { userId: user1.id, chatId: groupChat1.id, role: ChatParticipantRole.OWNER },
            { userId: adminUser.id, chatId: groupChat1.id, role: ChatParticipantRole.ADMIN },
        ],
    });

    // Bob, Alice и Admin в "Любители котиков" (groupChat2)
    // Системный adminUser будет OWNER этого чата, Bob (user2) и Alice (user1) - MEMBER
    await prisma.chatParticipant.createMany({
        data: [
            { userId: adminUser.id, chatId: groupChat2.id, role: ChatParticipantRole.OWNER },
            { userId: user2.id, chatId: groupChat2.id, role: ChatParticipantRole.MEMBER },
            // Запись для user1 (Alice) в groupChat2 была отдельно, объединим для createMany если возможно
            // или оставим отдельным create, если там есть своя логика. Пока предполагаем, что ее можно включить сюда.
            // Если prisma.chatParticipant.create({data: { userId: user1.id, chatId: groupChat2.id, role: 'USER' },}); было важно оставить отдельно, сообщи.
            // Я изменю оригинальный код, чтобы он соответствовал новой логике и был частью createMany
        ],
    });
    await prisma.chatParticipant.create({
        data: { userId: user1.id, chatId: groupChat2.id, role: ChatParticipantRole.MEMBER }, // Alice - участник
    });

    // Alice и Bob в приватном чате (privateChat)
    // Оба участника - MEMBER
    await prisma.chatParticipant.createMany({
        data: [
            { userId: user1.id, chatId: privateChat.id, role: ChatParticipantRole.MEMBER },
            { userId: user2.id, chatId: privateChat.id, role: ChatParticipantRole.MEMBER },
        ],
    });
    console.log('Added participants to chats with new roles.');

    // 4. Создание сообщений
    // Сообщения в "Проект Феникс"
    await prisma.message.create({
        data: {
            chatId: groupChat1.id,
            senderId: user1.id,
            content: 'Всем привет! Как продвигается работа над проектом?',
            contentType: 'TEXT',
        },
    });
    await prisma.message.create({
        data: {
            chatId: groupChat1.id,
            senderId: adminUser.id,
            content: 'Привет, Alice! Идет полным ходом. Дедлайн скоро!',
            contentType: 'TEXT',
        },
    });

    // Сообщения в "Любители котиков"
    await prisma.message.create({
        data: {
            chatId: groupChat2.id,
            senderId: user2.id,
            content: 'Смотрите, какой милый котик!',
            contentType: 'TEXT', // Позже можно добавить contentType: 'image/png' и content: 'url_to_image'
        },
    });
    await prisma.message.create({
        data: {
            chatId: groupChat2.id,
            senderId: user1.id,
            content: 'Ого, прелесть какая!',
            contentType: 'TEXT',
        },
    });

    // Сообщения в приватном чате Alice и Bob
    await prisma.message.create({
        data: {
            chatId: privateChat.id,
            senderId: user1.id,
            content: 'Привет, Bob! Как дела?',
            contentType: 'TEXT',
        },
    });
    await prisma.message.create({
        data: {
            chatId: privateChat.id,
            senderId: user2.id,
            content: 'Привет, Alice! Все отлично, спасибо!',
            contentType: 'TEXT',
        },
    });
    console.log('Created messages.');

    console.log('Seeding finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
