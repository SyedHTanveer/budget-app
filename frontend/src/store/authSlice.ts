import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { setAccessToken } from './api';

interface UserInfo { id: string; email: string; }

interface AuthState {
  user: UserInfo | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error' | 'checking';
  error?: string;
}

const initialState: AuthState = {
  user: null,
  status: 'idle'
};

export const fetchMe = createAsyncThunk<UserInfo, void, { rejectValue: string }>('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Not authenticated');
    return await res.json();
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

interface LoginResponse { user: UserInfo; token?: string; }

export const initAuth = createAsyncThunk<void, void, { rejectValue: string }>('auth/init', async (_, { dispatch }) => {
  try {
    const refreshRes = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.token) setAccessToken(data.token);
    }
  } catch {}
  await dispatch(fetchMe());
});

export const login = createAsyncThunk<UserInfo, { email: string; password: string }, { rejectValue: string }>('auth/login', async (body, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    if (data.token) setAccessToken(data.token);
    return data.user || data; // support previous shape
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

export const register = createAsyncThunk<UserInfo, { email: string; password: string; firstName?: string; lastName?: string }, { rejectValue: string }>('auth/register', async (body, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    if (data.token) setAccessToken(data.token);
    return data.user || data;
  } catch (e: any) {
    return rejectWithValue(e.message);
  }
});

export const logout = createAsyncThunk<void>('auth/logout', async () => {
  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
  setAccessToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => { state.status = 'checking'; })
      .addCase(fetchMe.pending, (state) => { state.status = 'checking'; })
      .addCase(fetchMe.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => { state.status = 'idle'; state.user = null; })

      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = undefined; })
      .addCase(login.fulfilled, (state, action: PayloadAction<UserInfo>) => { state.status = 'authenticated'; state.user = action.payload; })
      .addCase(login.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; })

      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = undefined; })
      .addCase(register.fulfilled, (state, action: PayloadAction<UserInfo>) => { state.status = 'authenticated'; state.user = action.payload; })
      .addCase(register.rejected, (state, action) => { state.status = 'error'; state.error = action.payload as string; })

      .addCase(logout.fulfilled, (state) => { state.status = 'idle'; state.user = null; });
  }
});

export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export default authSlice.reducer;
