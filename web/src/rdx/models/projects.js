import Aiven from '../../services/Aiven';

export const projects = {
  state: {
    list: [],
    details: [],
  },
  reducers: {
    setList(state, payload) {
      return {
        ...state,
        list: payload,
      };
    },
    setDetails(state, payload) {
      return {
        ...state,
        details: payload,
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
    async fetchProjectDetails() {
      try {
        const projects = await Aiven.instance.listProjects();
        dispatch.projects.setDetails(projects);
      } catch (error) {
        console.log(error);
      }
    },
  }),
};
