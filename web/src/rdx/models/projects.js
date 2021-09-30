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
    async fetchProjectList() {
      try {
        const { projects } = await Aiven.instance.me();
        dispatch.projects.setList(projects);
      } catch (error) {
        console.log(error);
      }
    },
  }),
};
