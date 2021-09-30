import Aiven from '../../services/Aiven';

const kv = (key, value) => ({ key, value });

export const settings = {
  state: {
    apiKey: null,
    apiUser: null,
    apiError: null,
  },
  reducers: {
    set(state, payload) {
      const { key, value } = payload;
      return {
        ...state,
        [key]: value,
      };
    },
  },
  effects: (dispatch) => ({
    async setApiKey(payload) {
      dispatch.settings.set(kv('apiKey', payload));
      try {
        const {
          user: email,
          real_name: name,
          projects,
        } = await new Aiven(payload).me();
        Aiven.setGlobalClient(payload);
        dispatch.settings.set(kv('apiError', null));
        dispatch.settings.set(kv('apiUser', { email, name }));
        dispatch.projects.setList(projects);
      } catch (error) {
        console.log(error);
        dispatch.settings.set(kv('apiError', error.message));
        dispatch.settings.set(kv('apiUser', null));
      }
    },
  }),
};
