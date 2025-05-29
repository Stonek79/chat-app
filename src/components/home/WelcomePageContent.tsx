import { LOGIN_PAGE_ROUTE, REGISTER_PAGE_ROUTE } from '@/constants';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import NextLink from 'next/link';

export function WelcomePageContent() {
    return (
        <Container component="main" maxWidth="md">
            <Box
                sx={{
                    paddingTop: { xs: 4, sm: 8 },
                    paddingBottom: { xs: 4, sm: 8 },
                    minHeight: 'calc(100vh - 120px)', // Примерная высота для центрирования контента
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Добро пожаловать в Наш Чат!
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    Общайтесь с друзьями, коллегами и присоединяйтесь к тематическим каналам.
                    Быстро, удобно и безопасно.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button
                        component={NextLink}
                        href={LOGIN_PAGE_ROUTE}
                        variant="contained"
                        size="large"
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Войти
                    </Button>
                    <Button
                        component={NextLink}
                        href={REGISTER_PAGE_ROUTE}
                        variant="outlined"
                        size="large"
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Зарегистрироваться
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
}
