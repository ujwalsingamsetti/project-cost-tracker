import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import itemsReducer from './itemsSlice';
import otherCostsReducer from './otherCostsSlice';
import localStorageMiddleware from './localStorageMiddleware';

// Load initial state from localStorage
const preloadedState = {
  items: {
    items: JSON.parse(localStorage.getItem('items')) || [],
  },
  otherCosts: {
    otherCosts: JSON.parse(localStorage.getItem('otherCosts')) || [],
  },
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    items: itemsReducer,
    otherCosts: otherCostsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
  preloadedState,
});