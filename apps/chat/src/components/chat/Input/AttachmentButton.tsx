import { IconButton } from '@mui/material';
import { AttachFile } from '@mui/icons-material';

interface AttachmentButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export const AttachmentButton = ({ onClick, disabled }: AttachmentButtonProps) => {
    return (
        <IconButton
            onClick={onClick}
            sx={{ p: '10px' }}
            aria-label="attach file"
            disabled={disabled}
        >
            <AttachFile />
        </IconButton>
    );
};
