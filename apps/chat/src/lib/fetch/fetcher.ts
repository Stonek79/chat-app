import { ERROR_MESSAGES, HTTP_STATUS } from '@chat-app/core';

/**
 * Универсальный фетчер для SWR. Выполняет GET-запрос и возвращает данные в формате JSON.
 * @template T - Ожидаемый тип данных.
 * @param url - URL для запроса.
 * @returns Распарсенный JSON-ответ или null.
 * @throws {Error} - Если ответ не 'ok' (кроме статуса 401).
 */
export const fetcher = async <T>(url: string): Promise<T | null> => {
    const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
    });

    if (!response.ok) {
        if (response.status === HTTP_STATUS.UNAUTHORIZED) {
            // Не считаем 401 ошибкой для SWR, т.к. это ожидаемое состояние (не залогинен)
            return null;
        }
        try {
            const errorData = await response.json();
            // Создаем настоящий объект Error для SWR
            const error = new Error(errorData.message || ERROR_MESSAGES.INTERNAL_ERROR);
            throw error;
        } catch (e) {
            if (e instanceof Error) {
                throw e; // Перебрасываем уже созданную ошибку
            }
            // Если .json() упал (например, пустой ответ), создаем ошибку из статуса
            const error = new Error(`Request failed with status ${response.status}`);
            throw error;
        }
    }

    // Если ответ 204 No Content, тело будет пустым, .json() вызовет ошибку
    if (response.status === HTTP_STATUS.NO_CONTENT) {
        return null;
    }

    const data: T = await response.json();

    return data;
};
