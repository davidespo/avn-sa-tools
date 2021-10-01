require('dotenv').config();
const _ = require('lodash');
const { AivenApi, AivenReporter } = require('./aiven');

const TOKEN = process.env.TOKEN;

const avn = new AivenApi(TOKEN);
const reporter = new AivenReporter(avn);

reporter
  .runReport({
    progressSink: (state) => {
      const summary = { running: state.running };
      Object.keys(state)
        .filter((k) => k !== 'running')
        .forEach((k) => {
          const slice = state[k];
          if (!!slice && !_.isNil(slice.loading)) {
            summary[k] = _.pick(slice, ['loading', 'progress']);
          }
        });
      console.log(summary);
    },
  })
  .then((report) => {
    console.log('DONE');
    const summary = {};
    Object.keys(report)
      .filter((k) => k !== 'running')
      .forEach((k) => {
        const slice = report[k];
        if (!!slice && !_.isNil(slice.loading)) {
          summary[k] = slice.insights;
        }
      });
    console.log(JSON.stringify(summary, null, 2));
  });
