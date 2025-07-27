import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Страница-заглушка, которая отображается на роуте /chat,
 * когда ни один конкретный чат не выбран (в основном для десктопной версии).
 */
export default function ChatRootPage() {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                textAlign: 'center',
            }}
        >
            <Typography variant="h6" color="text.secondary">
                Выберите чат, чтобы начать общение.
            </Typography>
        </Box>
    );
}
