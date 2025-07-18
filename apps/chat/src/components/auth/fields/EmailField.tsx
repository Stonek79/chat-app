'use client';

import TextField, { TextFieldProps } from '@mui/material/TextField';

// Исключаем пропсы, которые мы будем устанавливать по умолчанию или управлять ими изнутри
// type BaseTextFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'error' | 'name' | 'id' | 'label' | 'autoComplete'>;

interface EmailFieldProps extends Omit<TextFieldProps, 'name' | 'label' | 'autoComplete' | 'type'> {
    // value и onChange будут передаваться стандартно
    // error и helperText также могут передаваться для более гранулярного контроля,
    // но по умолчанию можно использовать общую ошибку auth.authError
    // props.id будет доступен из TextFieldProps
}

export function EmailField(props: EmailFieldProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (props.onChange) {
            props.onChange(event);
        }
    };

    return (
        <TextField
            margin="normal"
            required
            fullWidth
            id={props.id || 'email'} // Используем props.id если передан, иначе дефолтный
            label="Email адрес"
            name="email"
            autoComplete="email"
            type="email"
            {...props} // Передаем остальные пропсы, включая value, error, helperText, autoFocus и т.д.
            onChange={handleChange} // Наш кастомный onChange для очистки ошибки
            // Если error не передан явно, можно использовать auth.authError
            // error={props.error !== undefined ? props.error : !!auth.authError}
        />
    );
}
