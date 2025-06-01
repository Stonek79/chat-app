import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LoginForm } from '@/components';

// Тип для searchParams на серверной странице
interface LoginPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    console.log('LoginPage: searchParams', params);
    const returnTo = typeof params?.returnTo === 'string' ? params?.returnTo : undefined;
    const registrationSuccess = params?.registrationSuccess === 'true';

    // Блок для отображения "Перенаправление..." если пользователь уже залогинен,
    // теперь не нужен, так как middleware должен выполнить редирект ДО загрузки этой страницы.
    // if (auth.user && !auth.isLoading) { ... }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: { xs: 4, sm: 6, md: 8 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingX: { xs: 2, sm: 0 },
                }}
            >
                <Typography component="h1" variant="h5" gutterBottom>
                    Вход в систему
                </Typography>
                <LoginForm
                    returnTo={returnTo}
                    registrationSuccess={registrationSuccess}
                    // onLoginSuccess не передаем, так как LoginForm сам редиректит через router.push
                    // или AuthProvider редиректит после успешного вызова auth.login()
                />
            </Box>
        </Container>
    );
}
