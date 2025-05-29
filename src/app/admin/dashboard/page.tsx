// src/app/admin/dashboard/page.tsx

// import { getCurrentUser } from '@/lib/auth'; // Пример функции для получения текущего пользователя
// import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  // TODO: Проверка авторизации и роли администратора
  // const user = await getCurrentUser();
  // if (!user || user.role !== 'ADMIN') {
  //   redirect('/login?error=unauthorized');
  // }

  // TODO: Получение данных для дашборда (например, список пользователей для approve/deny)

  return (
    <div>
      <h1>Административная панель</h1>
      <p>Добро пожаловать, администратор!</p>
      {/* <p>Пользователь: {user?.username || 'Не определен'}</p> */}

      <section>
        <h2>Управление пользователями (в разработке)</h2>
        {/* Здесь будет список пользователей с кнопками approve/deny */}
        <p>Функционал approve/deny будет добавлен позже.</p>
      </section>

      {/* Другие секции админ-панели */}
    </div>
  );
} 