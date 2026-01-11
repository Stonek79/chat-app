import { ConfirmationModal } from '@/components';

interface DeleteChatModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteChatModal = ({ open, onClose, onConfirm }: DeleteChatModalProps) => {
    return (
        <ConfirmationModal
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Удалить чат?"
            description="Вы уверены, что хотите удалить этот чат? Все сообщения будут безвозвратно удалены. Это действие нельзя отменить."
            confirmButtonText="Удалить чат"
        />
    );
};
