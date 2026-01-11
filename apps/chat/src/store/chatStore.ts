import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/vanilla/shallow';
import { ChatStore } from './types';
import { createUserSlice } from './slices/createUserSlice';
import { createChatSlice } from './slices/createChatSlice';
import { createActiveChatSlice } from './slices/createActiveChatSlice';

const useChatStore = createWithEqualityFn<ChatStore>()(
    (...a) => ({
        ...createUserSlice(...a),
        ...createChatSlice(...a),
        ...createActiveChatSlice(...a),
    }),
    shallow
);

export default useChatStore;
