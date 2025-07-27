export const defaultAvatarName = (name: string) => {
    if (!name) {
        return { children: 'U' };
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ')[1];

    if (firstName && lastName) {
        return { children: `${firstName.charAt(0)}${lastName.charAt(0)}` };
    }

    if (name.charAt(0) === name.charAt(0).toUpperCase()) {
        const [firstChar, ...chars] = name;
        const secondChar =
            [...chars].find(char => char === char.toUpperCase()) ||
            (chars[0] ? chars[0].toUpperCase() : '');
        return { children: `${firstChar}${secondChar}` };
    }

    return { children: 'U' };
};
