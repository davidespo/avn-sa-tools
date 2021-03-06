import Aiven from '../../services/Aiven';

export const tickets = {
  state: {
    loading: false,
    progress: 0,
    list: [],
  },
  reducers: {
    setLoading(state, payload) {
      return {
        ...state,
        loading: payload,
      };
    },
    setProgress(state, payload) {
      return {
        ...state,
        progress: payload,
      };
    },
    setList(state, payload) {
      return {
        ...state,
        list: payload,
      };
    },
    appendList(state, payload) {
      return {
        ...state,
        list: state.list.concat(payload),
      };
    },
  },
  effects: (dispatch) => ({
    async fetchAllTickets(payload, rootState) {
      dispatch.tickets.setLoading(true);
      dispatch.tickets.setProgress(0);
      dispatch.tickets.setList([]);
      try {
        const projects = rootState.projects.list;
        const avn = Aiven.instance;
        for (let i = 0; i < projects.length; i++) {
          try {
            const tickets = await avn.listTickets(projects[i]);
            dispatch.tickets.appendList(tickets);
          } catch (error) {
            // support not enabled
          } finally {
            dispatch.tickets.setProgress((i + 1) / projects.length);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        dispatch.tickets.setLoading(false);
      }
    },
  }),
};
