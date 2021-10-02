import _ from 'lodash';
import { AivenApi, AivenReporter } from 'avn-reporting';

export const reports = {
  state: AivenReporter.getInitialState(),
  reducers: {
    set(state, payload) {
      return _.cloneDeep(payload);
    },
    setError(state, payload) {
      return {
        ...state,
        error: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async runFullReport(_, rootState) {
      try {
        const { apiKey } = rootState.settings;
        const avn = new AivenApi(apiKey);
        const reporter = new AivenReporter(avn);
        await reporter.runFullReport({
          progressSink: (state) => dispatch.reports.set(state),
        });
      } catch (error) {
        console.log(error);
        dispatch.reports.setError(error.message);
      }
    },
  }),
};
