import { WelcomePageContent } from '@/components';

// MUI компоненты здесь не нужны, они в WelcomePageContent

export default function RootPage() {
    // Эта страница теперь всегда отображает WelcomePageContent.
    // Логика для аутентифицированных пользователей будет в другом месте (например, /(app)/chat).
    // Middleware должен будет обрабатывать редирект аутентифицированных пользователей
    // с '/' на их основную страницу, если это требуется.
    return <WelcomePageContent />;
}
