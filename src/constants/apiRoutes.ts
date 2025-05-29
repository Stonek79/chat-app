export const API_AUTH_REGISTER_ROUTE = '/api/auth/register';
export const API_AUTH_LOGIN_ROUTE = '/api/auth/login';
export const API_AUTH_LOGOUT_ROUTE = '/api/auth/logout';
export const API_AUTH_ME_ROUTE = '/api/auth/me';
export const API_AUTH_CONFIRM_ROUTE_PREFIX = '/api/auth/confirm';
export const API_AUTH_USER_ROUTE = '/api/auth/user';
export const API_CHATS_ROUTE = '/api/chats';

export const IGNORED_API_PREFIXES = [
    API_AUTH_LOGIN_ROUTE,
    API_AUTH_REGISTER_ROUTE,
    API_AUTH_CONFIRM_ROUTE_PREFIX,
    API_AUTH_ME_ROUTE,
];
