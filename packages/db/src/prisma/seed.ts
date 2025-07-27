import { ChatParticipantRole, PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- СЛОВАРЬ ДЛЯ ГЕНЕРАЦИИ СООБЩЕНИЙ ---
const dictionary = [
    'привет',
    'как',
    'дела',
    'что',
    'нового',
    'отлично',
    'супер',
    'круто',
    'идея',
    'проект',
    'задача',
    'встреча',
    'сегодня',
    'завтра',
    'вечером',
    'утром',
    'работа',
    'дом',
    'отдых',
    'кофе',
    'чай',
    'пицца',
    'погода',
    'солнечно',
    'дождь',
    'хорошо',
    'плохо',
    'думаю',
    'знаю',
    'может быть',
];

/**
 * Генерирует случайное сообщение из словаря.
 * @returns Случайная строка.
 */
function generateRandomMessage(): string {
    const messageLength = Math.floor(Math.random() * 5) + 3; // от 3 до 7 слов
    let message = '';
    for (let i = 0; i < messageLength; i++) {
        message += dictionary[Math.floor(Math.random() * dictionary.length)] + ' ';
    }
    return message.trim() + (Math.random() > 0.5 ? '!' : '?');
}

/**
 * Генерирует сообщения для указанного чата.
 * @param chatId - ID чата.
 * @param participants - Массив участников чата.
 * @param count - Количество сообщений для генерации.
 */
async function generateMessagesForChat(chatId: string, participants: User[], count: number) {
    if (participants.length === 0) {
        console.warn(`Skipping message generation for chat ${chatId} due to no participants.`);
        return;
    }
    console.log(`Generating ${count} messages for chat ${chatId}...`);
    for (let i = 0; i < count; i++) {
        // Выбираем случайного отправителя из участников чата
        const sender = participants[Math.floor(Math.random() * participants.length)];
        if (!sender) continue; // Защита от случайного undefined

        await prisma.message.create({
            data: {
                chatId,
                senderId: sender.id,
                content: generateRandomMessage(),
                contentType: 'TEXT',
            },
        });
    }
}

async function main() {
    console.log('Start seeding ...');

    // --- 1. ОЧИСТКА СТАРЫХ ДАННЫХ ---
    console.log('Clearing old data...');
    // Правильный порядок удаления для соблюдения foreign key constraints
    await prisma.messageAction.deleteMany();
    await prisma.messageReadReceipt.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chatParticipant.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.user.deleteMany();

    // --- 2. СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ---
    console.log('Creating users...');
    const usersData = [
        {
            username: 'AliceWonder',
            email: 'alice@example.com',
            password: 'password123',
            role: UserRole.USER,
        },
        {
            username: 'BobTheBuilder',
            email: 'bob@example.com',
            password: 'password456',
            role: UserRole.USER,
        },
        {
            username: 'CharlieChoco',
            email: 'charlie@example.com',
            password: 'password789',
            role: UserRole.USER,
        },
        {
            username: 'DianaPrince',
            email: 'diana@example.com',
            password: 'password101',
            role: UserRole.USER,
        },
        {
            username: 'AdminUser',
            email: 'admin@example.com',
            password: 'adminpassword',
            role: UserRole.ADMIN,
        },
    ];

    const createdUsers = await Promise.all(
        usersData.map(async u => {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            return prisma.user.create({
                data: {
                    username: u.username,
                    email: u.email,
                    hashedPassword,
                    isVerified: true,
                    role: u.role,
                },
            });
        })
    );
    console.log(`Created ${createdUsers.length} users.`);
    const [alice, bob, charlie, diana, admin] = createdUsers;

    if (!alice || !bob || !charlie || !diana || !admin) {
        throw new Error('Failed to create one or more users.');
    }

    // --- 3. СОЗДАНИЕ ЧАТОВ И УЧАСТНИКОВ ---
    console.log('Creating chats and participants...');

    const groupChat1 = await prisma.chat.create({
        data: {
            name: 'Проект "Феникс"',
            isGroupChat: true,
            participants: {
                create: [
                    { userId: alice.id, role: ChatParticipantRole.OWNER },
                    { userId: admin.id, role: ChatParticipantRole.ADMIN },
                    { userId: charlie.id, role: ChatParticipantRole.MEMBER },
                ],
            },
        },
    });

    const groupChat2 = await prisma.chat.create({
        data: {
            name: 'Любители котиков',
            isGroupChat: true,
            participants: {
                create: [
                    { userId: bob.id, role: ChatParticipantRole.OWNER },
                    { userId: alice.id, role: ChatParticipantRole.MEMBER },
                    { userId: diana.id, role: ChatParticipantRole.MEMBER },
                ],
            },
        },
    });

    const privateChat = await prisma.chat.create({
        data: {
            isGroupChat: false,
            participants: {
                create: [
                    { userId: alice.id, role: ChatParticipantRole.MEMBER },
                    { userId: bob.id, role: ChatParticipantRole.MEMBER },
                ],
            },
        },
    });
    console.log('Created 3 chats with participants.');

    // --- 4. ГЕНЕРАЦИЯ СООБЩЕНИЙ ---
    await generateMessagesForChat(groupChat1.id, [alice, admin, charlie], 50);
    await generateMessagesForChat(groupChat2.id, [bob, alice, diana], 70);
    await generateMessagesForChat(privateChat.id, [alice, bob], 40);

    // --- 5. ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ (Редактирование, Закрепление) ---
    console.log('Adding special actions (edit, pin)...');
    const lastMessageInGroupChat1 = await prisma.message.findFirst({
        where: { chatId: groupChat1.id },
        orderBy: { createdAt: 'desc' },
    });

    if (lastMessageInGroupChat1) {
        await prisma.message.update({
            where: { id: lastMessageInGroupChat1.id },
            data: { isPinned: true },
        });
        await prisma.messageAction.create({
            data: {
                messageId: lastMessageInGroupChat1.id,
                actorId: admin.id,
                type: 'PINNED',
            },
        });
    }

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
