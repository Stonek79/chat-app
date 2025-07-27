import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { LoginForm } from '@/components';

interface LoginPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const registrationSuccess = params?.registrationSuccess === 'true';

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
                <LoginForm registrationSuccess={registrationSuccess} />
            </Box>
        </Container>
    );
}
