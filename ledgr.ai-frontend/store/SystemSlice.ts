import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SystemState {
  chatOpen: boolean;
}

const initialState: SystemState = {
  chatOpen: true,
};

export const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        setChatOpen: (state, action: PayloadAction<boolean>) => {
            state.chatOpen = action.payload;
        },
    },
});

export const { setChatOpen } = systemSlice.actions;

// Explicit named export for reducer so store can import it cleanly
export const systemReducer = systemSlice.reducer;

export default systemSlice;