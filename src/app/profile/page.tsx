import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { UserProfileEditForm } from '@/components';
import { LOGIN_PAGE_ROUTE } from '@/constants';
import { getCurrentUserFromSessionCookie } from '@/lib';
import { ClientUser } from '@/types';

export default async function ProfilePage() {
    const userData: ClientUser | null = await getCurrentUserFromSessionCookie();

    if (!userData) {
        // Пользователь не аутентифицирован, редирект на страницу входа
        // Параметр returnTo добавится автоматически middleware, если он настроен на это
        redirect(LOGIN_PAGE_ROUTE + '?returnTo=/profile');
    }

    // userData здесь точно не null благодаря проверке выше

    return (
        <Container component="main" maxWidth="md">
            <Box
                sx={{
                    marginTop: { xs: 4, sm: 6, md: 8 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingX: { xs: 2, sm: 0 },
                }}
            >
                <Typography component="h1" variant="h4" gutterBottom>
                    Профиль пользователя
                </Typography>

                {/* Блок отображения информации остается здесь, т.к. он не интерактивен */}
                <Box sx={{ mt: 2, mb: 2, width: '100%', maxWidth: '600px' }}>
                    <Typography variant="h6">Информация о пользователе:</Typography>
                    <TextField
                        label="Email (только для чтения)"
                        value={userData.email}
                        fullWidth
                        margin="normal"
                        slotProps={{
                            input: { readOnly: true },
                        }}
                        variant="filled"
                        // Для серверных компонентов, если value приходит, оно будет отображено.
                        // Атрибуты value/onChange для интерактивности не нужны здесь.
                    />
                    <TextField
                        label="Роль (только для чтения)"
                        value={userData.role}
                        fullWidth
                        margin="normal"
                        slotProps={{
                            input: { readOnly: true },
                        }}
                        variant="filled"
                    />
                </Box>

                <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4 }}>
                    Редактировать профиль
                </Typography>

                {/* Клиентский компонент для формы редактирования */}
                <UserProfileEditForm initialUserData={userData} />
            </Box>
        </Container>
    );
}
