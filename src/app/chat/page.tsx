import { Box, Typography } from '@mui/material';

export default async function ChatsPage() {
    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 4,
                }}
            >
                <Typography variant="h4">
                    Чаты ещё не созданы или не выбраны
                </Typography>
            </Box>
        </Box>
    );
}
