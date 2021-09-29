export const settings = {
  state: {
    apikey: null,
  },
  reducers: {
    setApiKey(state, payload) {
      return {
        ...state,
        apikey: payload,
      };
    },
  },
};
