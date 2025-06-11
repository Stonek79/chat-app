'use client';

import { MouseEvent,useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { TextFieldProps } from '@mui/material/TextField';

import { useAuth } from '@/hooks';

interface PasswordFieldProps extends Omit<TextFieldProps, 'name' | 'label' | 'type' | 'slotProps'> {
    id: string; // Парольные поля часто имеют разные id (password, new-password, confirm-password)
    label?: string; // Позволяем кастомизировать label
    autoCompletePolicy?: string; // 'current-password' или 'new-password'
}

export function PasswordField({
    id,
    label = 'Пароль',
    autoCompletePolicy = 'current-password',
    ...props
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const auth = useAuth();

    const handleClickShowPassword = () => setShowPassword(show => !show);
    const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

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
            name="password" // Общее имя для поля пароля, если не переопределено
            label={label}
            type={showPassword ? 'text' : 'password'}
            id={id}
            autoComplete={autoCompletePolicy}
            {...props}
            onChange={handleChange}
            // error={props.error !== undefined ? props.error : !!auth.authError}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="Показать/скрыть пароль"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
