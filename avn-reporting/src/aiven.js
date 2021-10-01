const axios = require('axios');
const rateLimit = require('axios-rate-limit');
const _ = require('lodash');

const http = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 1000,
  maxRPS: 1,
});

const get = (url, params) => ({ url, params });
const post = (url, data, params) => ({ url, method: 'POST', data, params });
const at = (path) => (o, defaultValue) => _.get(o, path, defaultValue);

class AivenApi {
  constructor(apikey) {
    this.base = {
      headers: {
        authorization: `aivenv1 ${apikey}`,
      },
    };
  }
  _call(req) {
    req = _.merge({}, this.base, req);
    try {
      return http(req);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
  _getAt(url, path, defaultValue) {
    return this._call(get(url)).then(at(path, defaultValue));
  }
  _postAt(url, data, path, defaultValue) {
    return this._call(post(url, data)).then(at(path, defaultValue));
  }
  me() {
    return this._getAt('https://api.aiven.io/v1/me', 'data.user', {});
  }

  /*
   *
   * TOP LEVEL
   *
   */
  listProjects() {
    return this._getAt('https://api.aiven.io/v1/project', 'data.projects', []);
  }
  listServiceVersions() {
    return this._getAt(
      'https://api.aiven.io/v1/service_versions',
      'data.service_versions',
      [],
    );
  }
  // listAccounts() {
  //   return this._getAt('https://api.aiven.io/v1/account', 'data.accounts', []);
  // }

  /*
   *
   * PROJECT LEVEL
   *
   */
  async listTickets(projectName) {
    try {
      return await this._getAt(
        `https://api.aiven.io/v1/project/${projectName}/tickets`,
        'data.tickets',
        [],
      );
    } catch (error) {
      // not enabled
    }
    return [];
  }
  listAlerts(projectName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/alerts`,
      'data.alerts',
      [],
    );
  }
  listVpcs(projectName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/vpcs`,
      'data.vpcs',
      [],
    );
  }
  listIntegrations(projectName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/integration_endpoint`,
      'data.service_integration_endpoints',
      [],
    );
  }
  listServices(projectName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/service`,
      'data.services',
      [],
    );
  }

  /*
   *
   * SERVICE LEVEL
   *
   */
  /**
   *
   * @param {string} projectName The project name
   * @param {string} serviceName The service name
   * @param {string} period Enum of `"hour"`, `"day"`, `"week"`, `"month"`, `"year"`. Defaults to `"year"`
   * @returns
   */
  getServiceMetrics(projectName, serviceName, period = 'year') {
    return this._postAt(
      `https://api.aiven.io/v1/project/${projectName}/service/${serviceName}/metrics`,
      { period },
      'data.services',
      [],
    );
  }
}

const getTopLevelCollection = () => ({
  loading: false,
  list: [],
  insights: [],
  error: null,
});

const getProjectLevelCollection = () => ({
  loading: false,
  progress: 0.0,
  list: [],
  insights: [],
  error: null,
});

async function fetchTopLevelCollection(
  report,
  path,
  progressSink,
  itemFetcher,
  insightSpec,
) {
  _.set(report, `${path}.loading`, true);
  progressSink(report);
  try {
    const items = await itemFetcher();
    _.set(report, `${path}.list`, items);
    _.set(report, `${path}.error`, null);
    const insights = insightSpec.map((spec) => {
      try {
        const count = items.filter(spec.predicate).length;
        return { spec, count };
      } catch (error) {
        console.error(error);
        return { spec, error: error.message };
      }
    });
    _.set(report, `${path}.insights`, insights);
  } catch (error) {
    console.error(`Fetch failed for ${path} with "${error.message}"`);
    console.error(error);
    _.set(report, `${path}.list`, []);
    _.set(report, `${path}.error`, error);
  }
  _.set(report, `${path}.loading`, false);
  progressSink(report);
}

async function fetchProjectLevelCollection(
  report,
  path,
  progressSink,
  itemFetcher,
  insightSpec,
) {
  const projects = report.projects.list;
  const slice = getProjectLevelCollection();
  slice.loading = true;
  _.set(report, path, slice);
  progressSink(report);
  try {
    for (let i = 0; i < projects.length; i++) {
      const projectName = projects[i].project_name;
      console.log(projectName);
      const items = await itemFetcher(projectName);
      slice.list = slice.list.concat(items);
      slice.insights = insightSpec.map((spec) => {
        try {
          const count = slice.list.filter(spec.predicate).length;
          return { spec, count };
        } catch (error) {
          console.error(error);
          return { spec, error: error.message };
        }
      });
      slice.progress = (i + 1) / projects.length;
      progressSink(report);
    }
  } catch (error) {
    console.error(`Fetch failed for ${path} with "${error.message}"`);
    console.error(error);
    slice.error = error;
  }
  slice.loading = false;
  progressSink(report);
}

const insightSpec = (key, text, predicate) => ({ key, text, predicate });
const INSIGHT_SPEC_TOTAL_COUNT = insightSpec(
  'total',
  'Total Count',
  () => true,
);

const INSIGHT_SPECS = {
  projects: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec(
      'empty',
      'Projects without active services',
      (p) => p.estimated_balance === 0 || p.estimated_balance === '0.00',
    ),
    insightSpec(
      'billingEmail',
      'Project without billing email',
      (p) => p.billing_emails.length === 0,
    ),
    insightSpec(
      'techEmail',
      'Project without tech email',
      (p) => p.tech_emails.length === 0,
    ),
  ],
  versions: [INSIGHT_SPEC_TOTAL_COUNT],
  tickets: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec('open', 'Open Tickets', (t) => t.state !== 'closed'),
    // TODO: recent
    // TODO: by severity
  ],
  alerts: [
    INSIGHT_SPEC_TOTAL_COUNT,
    // TODO: per service
  ],
  vpcs: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec('active', 'Active VPCs', (t) => t.state === 'ACTIVE'),
    // TODO: per cloud
  ],
  integrations: [
    INSIGHT_SPEC_TOTAL_COUNT,
    // TODO: by endpoint type
  ],
  services: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec('active', 'Active', (t) => t.state === 'RUNNING'),
    insightSpec('poweroff', 'Powered Off', (t) => t.state === 'POWEROFF'),
    insightSpec('vpc', 'Inside VPC', (t) => !_.isNil(t.project_vpc_id)),
    insightSpec(
      'onlyAvnadmin',
      'Only Using Default Service Account',
      // TODO: validate predicate logic
      (t) => {
        const hasUserAccounts = t.service_type !== 'kafka_mirrormaker';
        if (!hasUserAccounts) {
          return false;
        }
        const hasSingleUser = t.users.length === 1;
        const firstUserIsAvnAdmin =
          _.get(t, 'users[0].username', '') === 'avnadmin';
        return hasUserAccounts && hasSingleUser && firstUserIsAvnAdmin;
      },
    ),
    insightSpec(
      'termProtected',
      'Without Termination Protection',
      (t) => !t.termination_protection,
    ),
    // TODO: per service_type
    // TODO: per plan??
    // TODO: by cloud
    // TODO: with service_integrations
  ],
};

class AivenReporter {
  /**
   *
   * @param {AivenApi} avn An `AivenApi` client.
   */
  constructor(avn) {
    this.avn = avn;
  }
  async runReport(options) {
    const { progressSink } = options;
    const report = {
      running: true,
      projects: getTopLevelCollection(),
      versions: getTopLevelCollection(),
      tickets: getProjectLevelCollection(),
      alerts: getProjectLevelCollection(),
      vpcs: getProjectLevelCollection(),
      integrations: getProjectLevelCollection(),
      services: getProjectLevelCollection(),
    };
    // TOP LEVEL
    await fetchTopLevelCollection(
      report,
      'projects',
      progressSink,
      this.avn.listProjects.bind(this.avn),
      INSIGHT_SPECS.projects,
    );
    // await fetchTopLevelCollection(
    //   report,
    //   'versions',
    //   progressSink,
    //   this.avn.listServiceVersions.bind(this.avn),
    //   INSIGHT_SPECS.versions,
    // );

    // PROJECT LEVEL
    // await fetchProjectLevelCollection(
    //   report,
    //   'tickets',
    //   progressSink,
    //   this.avn.listTickets.bind(this.avn),
    //   INSIGHT_SPECS.tickets,
    // );
    // await fetchProjectLevelCollection(
    //   report,
    //   'alerts',
    //   progressSink,
    //   this.avn.listAlerts.bind(this.avn),
    //   INSIGHT_SPECS.alerts,
    // );
    // await fetchProjectLevelCollection(
    //   report,
    //   'vpcs',
    //   progressSink,
    //   this.avn.listVpcs.bind(this.avn),
    //   INSIGHT_SPECS.vpcs,
    // );
    // await fetchProjectLevelCollection(
    //   report,
    //   'integrations',
    //   progressSink,
    //   this.avn.listIntegrations.bind(this.avn),
    //   INSIGHT_SPECS.integrations,
    // );
    await fetchProjectLevelCollection(
      report,
      'services',
      progressSink,
      this.avn.listServices.bind(this.avn),
      INSIGHT_SPECS.services,
    );
    report.running = false;
    progressSink(report);
    return report;
  }
}

module.exports = {
  AivenApi,
  AivenReporter,
};
