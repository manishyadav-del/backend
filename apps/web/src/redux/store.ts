import { configureStore } from '@reduxjs/toolkit';
import blogsReducer from './blogsSlice';
import authReducer from './reducers/authreducer';

export const store = configureStore({
  reducer: {
    blogs: blogsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
