// Цвета для имен пользователей в чатах
export const chatUsernameColors = [
    '#e91e63', // розовый
    '#9c27b0', // фиолетовый
    '#673ab7', // глубокий фиолетовый
    '#3f51b5', // индиго
    '#2196f3', // синий
    '#03a9f4', // светло-синий
    '#00bcd4', // циан
    '#009688', // бирюзовый
    '#4caf50', // зеленый
    '#8bc34a', // светло-зеленый
    '#cddc39', // лайм
    '#ffc107', // янтарный
    '#ff9800', // оранжевый
    '#ff5722', // глубокий оранжевый
    '#795548', // коричневый
    '#607d8b', // сине-серый
];

/**
 * Получает цвет для имени пользователя на основе его ID
 * @param userId - Уникальный идентификатор пользователя
 * @returns Цвет в формате hex
 */
export function getUsernameColor(userId: string): string {
    // Простой алгоритм хэширования для получения индекса
    const hash = userId.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const index = Math.abs(hash) % chatUsernameColors.length;
    const color = chatUsernameColors[index];

    // Fallback на случай если индекс выходит за границы массива
    return color ?? chatUsernameColors[0] ?? '#e91e63';
}
