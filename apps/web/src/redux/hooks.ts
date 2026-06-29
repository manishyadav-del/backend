import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store'; // adjust path if needed

export const useAppDispatch = () => useDispatch<AppDispatch>();
