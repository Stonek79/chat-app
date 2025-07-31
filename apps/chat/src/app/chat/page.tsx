import Container from '@mui/material/Box';
import { NoChatsPage } from '@/components';

/**
 * Страница-заглушка, которая отображается на роуте /chat,
 * когда ни один конкретный чат не выбран (в основном для десктопной версии).
 */
export default function ChatRootPage() {
    return (
        <Container
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                textAlign: 'center',
            }}
        >
            <NoChatsPage />
        </Container>
    );
}
