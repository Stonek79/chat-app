const chatUsernameColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FED766', // Yellow
    '#2AB7CA', // Cyan
    '#F0CF65', // Gold
    '#FFD166', // Orange
    '#06D6A0', // Green
    '#118AB2', // Dark Blue
    '#EF476F', // Pink
];

/**
 * Generates a consistent color for a user based on their ID.
 * @param userId The ID of the user.
 * @returns A color string from the predefined palette.
 */
export const getUserColor = (userId: string): string => {
    // A simple hashing function to get an index from the userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % chatUsernameColors.length;
    return chatUsernameColors[index];
};
