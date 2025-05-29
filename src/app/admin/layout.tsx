// src/app/admin/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель",
  description: "Управление приложением чата",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Макет для админ-панели.
 * Может содержать специфичную для админки навигацию, сайдбар и т.д.
 * @param {AdminLayoutProps} props - Свойства компонента.
 * @returns {JSX.Element} Макет админ-панели.
 */
export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  return (
    <section>
      {/* Здесь может быть навигация админ-панели */}
      <nav>
        <p>Админ-панель Навигация</p>
        {/* Ссылки на разделы админки */}
      </nav>
      {children}
    </section>
  );
} 