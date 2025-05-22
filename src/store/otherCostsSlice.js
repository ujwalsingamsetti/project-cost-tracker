import { createSlice } from '@reduxjs/toolkit';

const otherCostsSlice = createSlice({
  name: 'otherCosts',
  initialState: {
    otherCosts: [],
  },
  reducers: {
    setOtherCosts: (state, action) => {
      state.otherCosts = action.payload;
    },
    addOtherCost: (state, action) => {
      state.otherCosts.push(action.payload);
    },
    updateOtherCost: (state, action) => {
      const { id, description, amount } = action.payload;
      const index = state.otherCosts.findIndex((cost) => cost.id === id);
      if (index !== -1) {
        state.otherCosts[index] = { id, description, amount };
      }
    },
    deleteOtherCost: (state, action) => {
      state.otherCosts = state.otherCosts.filter((cost) => cost.id !== action.payload);
    },
  },
});

export const { setOtherCosts, addOtherCost, updateOtherCost, deleteOtherCost } = otherCostsSlice.actions;
export default otherCostsSlice.reducer;