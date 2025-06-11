import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RegisterForm } from '@/components/auth';

export default async function RegisterPage() {
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
                    Регистрация
                </Typography>
                <RegisterForm />
            </Box>
        </Container>
    );
}
