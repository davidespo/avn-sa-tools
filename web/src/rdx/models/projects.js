import Aiven from '../../services/Aiven';

export const projects = {
  state: {
    list: [],
  },
  reducers: {
    setList(state, payload) {
      return {
        ...state,
        list: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async fetchProjectList(payload, rootState) {
      try {
        const { apiKey } = rootState.settings;
        const { projects } = await new Aiven(apiKey).me();
        dispatch.projects.setList(projects);
      } catch (error) {
        console.log(error);
      }
    },
  }),
};
