import { useState } from 'react';
import {
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Checkbox,
    Box,
    CircularProgress,
    Typography,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { ClientUser } from '@chat-app/core';
import { useUserSearch } from '@/hooks/useUserSearch';

interface UserSelectionListProps {
    selectedUserIds: Set<string>;
    onToggleUser: (user: ClientUser) => void;
    excludeUserIds?: string[];
    maxSelection?: number;
    maxHeight?: string | number;
    minHeight?: string | number;
}

export function UserSelectionList({
    selectedUserIds,
    onToggleUser,
    excludeUserIds = [],
    maxSelection,
    maxHeight = 400,
    minHeight = 200,
}: UserSelectionListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { users, isLoading, isError } = useUserSearch(searchQuery, {
        excludeUserIds,
        limit: 50
    });

    // Calculate dynamic height if not provided
    const listMaxHeight = maxHeight;
    const listMinHeight = minHeight;

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />

            {isError && (
                <Typography color="error" variant="caption" sx={{ px: 1 }}>
                    Не удалось загрузить список пользователей
                </Typography>
            )}

            <Box
                sx={{
                    position: 'relative',
                    minHeight: listMinHeight,
                    maxHeight: listMaxHeight,
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                }}
            >
                {isLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            zIndex: 1,
                        }}
                    >
                        <CircularProgress size={32} />
                    </Box>
                )}

                {users.length === 0 && !isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: listMinHeight,
                            p: 2,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" align="center">
                            {searchQuery
                                ? 'Пользователи не найдены'
                                : 'Начните ввод для поиска...'}
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {users.map(user => {
                            const isSelected = selectedUserIds.has(user.id);
                            // Disable if max selection reached and this user is NOT selected
                            const isDisabled =
                                maxSelection !== undefined &&
                                selectedUserIds.size >= maxSelection &&
                                !isSelected;

                            return (
                                <ListItem
                                    key={user.id}
                                    disablePadding
                                    divider
                                    sx={{
                                        opacity: isDisabled ? 0.6 : 1,
                                        pointerEvents: isDisabled ? 'none' : 'auto',
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => onToggleUser(user)}
                                        selected={isSelected}
                                        dense
                                    >
                                        <Checkbox
                                            edge="start"
                                            checked={isSelected}
                                            tabIndex={-1}
                                            disableRipple
                                            size="small"
                                        />
                                        <ListItemAvatar>
                                            <Avatar
                                                src={user.avatarUrl || undefined}
                                                sx={{ width: 32, height: 32 }}
                                            >
                                                {user.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.username}
                                            secondary={user.email}
                                            slotProps={{
                                                primary: {
                                                    variant: 'body2',
                                                    fontWeight: 500,
                                                },
                                                secondary: {
                                                    variant: 'caption',
                                                    noWrap: true,
                                                },
                                            }}
                                        />
                                        {user.isOnline && (
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'success.main',
                                                    ml: 1,
                                                }}
                                            />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Box>
    );
}
