'use client';

import { Box, Stack } from '@mui/material';
import { ReplyPreview } from './ReplyPreview';
import { MediaDrawer } from './MediaDrawer';
import { MediaModal } from './MediaModal';
import { MediaPreview } from './MediaPreview';
import { SendMessageButton } from './SendMessageButton';
import { InputField } from './InputField';
import { AttachmentButton } from './AttachmentButton';
import { useInputBar } from '@/hooks/useChat/useInputBar';

export const InputBar = () => {
    const {
        control,
        handleSubmit,
        messageToEdit,
        activeChatDetails,
        isConnected,
        isUploading,
        fileToUpload,
        mediaDrawerOpen,
        setMediaDrawerOpen,
        selectedPreviewFile,
        handleFileSelect,
        handleCancelEdit,
        handleCancelMedia,
        inputRef,
    } = useInputBar();

    return (
        <Stack sx={{ flexShrink: 0 }}>
            <ReplyPreview />
            {selectedPreviewFile && (
                <MediaPreview
                    file={selectedPreviewFile}
                    control={control}
                    onSend={handleSubmit}
                    onCancel={handleCancelMedia}
                />
            )}
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'background.default',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <AttachmentButton onClick={() => setMediaDrawerOpen(true)} />
                <InputField
                    inputRef={inputRef}
                    control={control}
                    messageToEdit={messageToEdit}
                    handleCancelEdit={handleCancelEdit}
                    handleSubmitMessage={handleSubmit}
                />
                <SendMessageButton
                    control={control}
                    isConnected={isConnected}
                    fileToUpload={fileToUpload}
                    isUploading={isUploading}
                />
            </Box>
            <MediaDrawer open={mediaDrawerOpen} onClose={() => setMediaDrawerOpen(false)} onFileSelect={handleFileSelect} />
            <MediaModal open={mediaDrawerOpen} onClose={() => setMediaDrawerOpen(false)} onFileSelect={handleFileSelect} />
        </Stack>
    );
};

