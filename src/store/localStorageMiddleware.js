const localStorageMiddleware = ({ getState }) => (next) => (action) => {
    const result = next(action);
    const state = getState();
    localStorage.setItem('items', JSON.stringify(state.items.items));
    localStorage.setItem('otherCosts', JSON.stringify(state.otherCosts.otherCosts));
    return result;
  };
  
  export default localStorageMiddleware;