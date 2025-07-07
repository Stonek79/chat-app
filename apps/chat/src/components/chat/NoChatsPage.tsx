import { Button, Container, Typography } from "@mui/material";

export const NoChatsPage = () => {
    return (
        <Container sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            height: '100%',
        }}>
            <Typography sx={{ textAlign: 'center', fontSize: '2rem' }} variant="h4">У вас пока нет чатов</Typography>
            <Typography sx={{ textAlign: 'center', fontSize: '1.2rem' }} variant="body1">Создайте новый чат, чтобы начать общение.</Typography>
            <Button sx={{ width: '100%', mt: 2, maxWidth: 'fit-content' }} variant="contained" color="primary">
                Создать чат
            </Button>
        </Container>
    );
};
