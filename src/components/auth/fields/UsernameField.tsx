'use client';

import TextField, { TextFieldProps } from '@mui/material/TextField';

import { useAuth } from '@/hooks';

interface UsernameFieldProps
    extends Omit<TextFieldProps, 'name' | 'label' | 'autoComplete' | 'type'> {
    // value и onChange будут передаваться стандартно
    // props.id будет доступен
}

export function UsernameField(props: UsernameFieldProps) {
    const auth = useAuth();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        auth.clearAuthError?.();
        if (props.onChange) {
            props.onChange(event);
        }
    };

    return (
        <TextField
            margin="normal"
            required
            fullWidth
            id={props.id || 'username'}
            label="Имя пользователя"
            name="username"
            autoComplete="username"
            {...props}
            onChange={handleChange}
            // error={props.error !== undefined ? props.error : !!auth.authError}
        />
    );
}
