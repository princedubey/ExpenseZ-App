import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createTransactionSlice } from './slices/transactionSlice';
import { createUserSlice } from './slices/userSlice';
import { createNewsSlice } from './slices/newsSlice';
import { StoreState } from './types';

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createTransactionSlice(...a),
  ...createUserSlice(...a),
  ...createNewsSlice(...a),
})); 