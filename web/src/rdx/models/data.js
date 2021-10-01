import Aiven from '../../services/Aiven';
import _ from 'lodash';

const getCollectionBase = () => ({
  loading: false,
  progress: 0,
  list: [],
  byId: {},
  byParent: {},
});

const at = (path, value) => ({ path, value });

const toCollection = (path, fetchItems, keyPropertyName) => ({
  path,
  fetchItems,
  keyPropertyName,
});

const fetchCollection = async (dispatch, collection) => {
  const { path, fetchItems, keyPropertyName } = collection;
  dispatch.data.set(at(`${path}.loading`, true));
  const updateProgress = (value) =>
    dispatch.data.set(at(`${path}.progress`, value));
  updateProgress(1.0);
  const items = await fetchItems(updateProgress);
  dispatch.data.set(
    at(path, {
      loading: false,
      list: items,
      byId: _.keyBy(items, keyPropertyName),
    }),
  );
};

export const data = {
  state: {
    running: false,
    projects: getCollectionBase(),
    tickets: getCollectionBase(),
    services: getCollectionBase(),
  },
  reducers: {
    set(state, payload) {
      state = _.cloneDeep(state);
      const { path, value } = payload;
      _.set(state, path, value);
      return state;
    },
    setRunning(state, payload) {
      return {
        ...state,
        running: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async fetch() {
      try {
        dispatch.data.setRunning(true);
        const avn = Aiven.instance;
        await fetchCollection(
          dispatch,
          toCollection('projects', avn.listProjects),
        );
      } catch (error) {
        console.log(error);
      }
      dispatch.data.setRunning(false);
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
