import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/shallow';
import { useSocketConnection, useThrottleCallback, useDebounceCallback } from '@/hooks';
import { getSocket, CLIENT_EVENT_TYPING } from '@chat-app/socket-shared';
import { MessageContentType } from '@chat-app/db';
import { getContentTypeFromFile } from '@/utils/fileUtils';
import { useFileUpload } from './useFileUpload';

export interface FormValues {
    message: string;
}

export const useInputBar = () => {
    const { control, handleSubmit, reset, setValue, watch, setFocus } = useForm<FormValues>({
        defaultValues: { message: '' },
    });
    
    // React 19: Use useTransition for async actions to keep UI responsive
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const { activeChatDetails, sendMessage, editMessage, messageToEdit, setMessageToEdit } = useChatStore(
        (state) => ({
            activeChatDetails: state.activeChat.activeChatDetails,
            sendMessage: state.sendMessage,
            editMessage: state.editMessage,
            messageToEdit: state.activeChat.messageToEdit,
            setMessageToEdit: state.setMessageToEdit,
        }),
        shallow
    );

    const { isConnected } = useSocketConnection();
    const chatId = activeChatDetails?.id;
    
    // File Upload Logic
    const {
        fileToUpload,
        isUploading,
        mediaDrawerOpen,
        setMediaDrawerOpen,
        selectedPreviewFile,
        handleFileSelect,
        handleCancelMedia,
        uploadFile,
        setFileToUpload,
        setSelectedPreviewFile
    } = useFileUpload(chatId);

    const messageValue = watch('message');

    // Typing Indicators
    const [emitTypingInfo] = useThrottleCallback(
        (cId: string) => {
            const socket = getSocket();
            if (activeChatDetails && socket.connected) {
                socket.emit(CLIENT_EVENT_TYPING, { chatId: cId, isTyping: true });
            }
        },
        3000
    );

    const [emitStopTyping, cancelStopTyping] = useDebounceCallback(
        (cId: string) => {
            const socket = getSocket();
            if (activeChatDetails && socket.connected) {
                socket.emit(CLIENT_EVENT_TYPING, { chatId: cId, isTyping: false });
            }
        },
        1000
    );

    useEffect(() => {
        if (!chatId) return;
        if (messageValue && messageValue.length > 0) {
            emitTypingInfo(chatId);
            emitStopTyping(chatId);
        }
    }, [messageValue, chatId, emitTypingInfo, emitStopTyping]);

    // Restore focus logic when editing
    useEffect(() => {
        if (messageToEdit) {
            setValue('message', messageToEdit.content);
            // Use setFocus from RHF or ref directly
            // RHF setFocus is cleaner if registered, but we use Controller in InputField usually.
            // Let's use custom ref to be safe as InputField attaches it.
             inputRef.current?.focus();
        } else {
            setValue('message', '');
        }
    }, [messageToEdit, setValue]);

    const handleCancelEdit = useCallback(() => {
        setMessageToEdit(null);
        reset();
    }, [setMessageToEdit, reset]);

    const onSubmit = async (data: FormValues) => {
        const content = data.message.trim();

        if (chatId) {
            cancelStopTyping();
            const socket = getSocket();
            socket.emit(CLIENT_EVENT_TYPING, { chatId, isTyping: false });
        }

        startTransition(async () => {
             if (messageToEdit) {
                if (fileToUpload) {
                    const url = await uploadFile(fileToUpload);
                    if (url) {
                        editMessage(messageToEdit.id, content, url, getContentTypeFromFile(fileToUpload.type));
                    }
                } else {
                    editMessage(messageToEdit.id, content);
                }
            } else {
                if (fileToUpload) {
                    const url = await uploadFile(fileToUpload);
                    if (url) {
                        const type = getContentTypeFromFile(fileToUpload.type);
                        sendMessage(content, type, url);
                    }
                } else if (content) {
                    sendMessage(content, MessageContentType.TEXT);
                }
            }

            setFileToUpload(null);
            setSelectedPreviewFile(null);
            reset();
            setMessageToEdit(null);
        });
    };

    return {
        control,
        handleSubmit: handleSubmit(onSubmit),
        messageToEdit,
        activeChatDetails,
        isConnected,
        isUploading: isUploading || isPending,
        fileToUpload,
        mediaDrawerOpen,
        setMediaDrawerOpen,
        selectedPreviewFile,
        handleFileSelect,
        handleCancelEdit,
        handleCancelMedia,
        inputRef,
    };
};
