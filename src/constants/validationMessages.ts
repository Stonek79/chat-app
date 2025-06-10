export const validationMessages = {
    // Общие
    required: 'Это поле обязательно для заполнения',
    invalidEmail: 'Неверный формат email',

    // Пароль
    passwordLength: (minLength: number) => `Пароль должен содержать не менее ${minLength} символов`,
    passwordMismatch: 'Пароли не совпадают',

    // Имя пользователя
    usernameLength: (minLength: number, maxLength: number) =>
        `Имя пользователя должно содержать от ${minLength} до ${maxLength} символов`,
    usernamePattern:
        'Имя пользователя может содержать только латинские буквы, цифры и знаки подчеркивания',

    // Название чата
    chatNameLength: (maxLength: number) =>
        `Название чата не должно превышать ${maxLength} символов`,
};
