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
  getService(projectName, serviceName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/service/${serviceName}`,
      'data.service',
      [],
    );
  }
  async getServiceMetrics(projectName, serviceName, period = 'year') {
    const metricsMap = await this._postAt(
      `https://api.aiven.io/v1/project/${projectName}/service/${serviceName}/metrics`,
      { period },
      'data.metrics',
      [],
    );
    return Object.keys(metricsMap).map((key) => ({ key, ...metricsMap[key] }));
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

function processInsights(insightSpec, items) {
  return insightSpec
    .map((spec) => {
      let result = {};
      let error = undefined;
      try {
        result = spec.processor.run(items);
        if (_.isNil(result)) {
          return null;
        }
      } catch (error) {
        console.error(error);
        console.error(spec);
      }
      return {
        key: spec.key,
        text: spec.text,
        kind: spec.processor.kind,
        ...result,
        error,
      };
    })
    .filter((o) => !_.isNil(o));
}

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
    const insights = processInsights(insightSpec, items);
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
      slice.insights = processInsights(insightSpec, slice.list);
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

async function fetchServiceLevelCollection(
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
    const insights = processInsights(insightSpec, items);
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

const insightSpec = (key, text, processor) => ({
  key,
  text,
  kind: processor.kind,
  processor,
});
const processorGen = (kind, run) => ({ kind, run });
const countProcessor = (predicate) =>
  processorGen('COUNT', (list) => {
    const result = {};
    try {
      return {
        count: list.filter(predicate).length,
      };
    } catch (error) {
      console.error(error);
      return {
        error: error.message,
      };
    }
  });
const groupByProcessor = (propertyPath, mapper = (a) => a) =>
  processorGen('GROUP_BY', (list) => {
    const counts = {};
    try {
      for (let i = 0; i < list.length; i++) {
        const prop = mapper(
          _.get(list[i], propertyPath, null),
          list[i],
          list,
          i,
        );
        _.set(counts, prop, _.get(counts, prop, 0) + 1);
      }
      return { counts };
    } catch (error) {
      console.error(error);
      return {
        error: error.message,
      };
    }
  });

const serviceMetricsProcessor = processorGen('METRICS', (list) => {
  const stats = {};
  for (let i = 0; i < list.length; i++) {
    const {
      key,
      data: { rows },
    } = list[i];
    const slice = {
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MIN_SAFE_INTEGER,
      avg: 0,
      count: 0,
    };
    stats[key] = slice;
    // basic stats
    for (let j = 1; j < rows.length; j++) {
      const row = rows[j];
      for (let k = 1; k < row.length; k++) {
        const val = row[k];
        slice.min = Math.min(slice.min, row[k]);
        slice.max = Math.max(slice.max, row[k]);
        slice.avg += row[k];
        slice.count++;
      }
    }
    // slope
    const yBar = rows.length / 2;
    let n = 0;
    let d = 0;
    for (let j = 1; j < rows.length; j++) {
      const row = rows[j];
      for (let k = 1; k < row.length; k++) {
        const val = row[k];
        n += (val - slice.avg) * (j - yBar);
        d += Math.pow(j - yBar, 2);
      }
    }
    slice.rate = n / d;
    slice.avg = slice.avg / slice.count;
  }
  return { stats };
});
const INSIGHT_SPEC_TOTAL_COUNT = insightSpec(
  'total',
  'Total Count',
  countProcessor(() => true),
);

const INTERVAL_MS_30_DAYS = 30 * 86400 * 1000;
const INSIGHT_SPECS = {
  projects: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec(
      'empty',
      'Projects without active services',
      countProcessor(
        (p) => p.estimated_balance === 0 || p.estimated_balance === '0.00',
      ),
    ),
    insightSpec(
      'billingEmail',
      'Project without billing email',
      countProcessor((p) => p.billing_emails.length === 0),
    ),
    insightSpec(
      'techEmail',
      'Project without tech email',
      countProcessor((p) => p.tech_emails.length === 0),
    ),
    insightSpec(
      'account',
      'Account Assignment',
      groupByProcessor('account_name'),
    ),
  ],
  versions: [INSIGHT_SPEC_TOTAL_COUNT],
  tickets: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec(
      'open',
      'Open Tickets',
      countProcessor((t) => t.state !== 'closed'),
    ),
    insightSpec(
      'recent',
      'Tickets in last 30 Days',
      countProcessor(
        (t) =>
          Date.now() - new Date(t.create_time).getTime() < INTERVAL_MS_30_DAYS,
      ),
    ),
    insightSpec('severity', 'Ticket by Severity', groupByProcessor('severity')),
  ],
  alerts: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec('severity', 'Ticket by Severity', groupByProcessor('severity')),
    insightSpec(
      'service',
      'Alerts by Service Type',
      groupByProcessor('service_type'),
    ),
  ],
  vpcs: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec('state', 'VPCs by State', groupByProcessor('state')),
    insightSpec(
      'cloud',
      'VPCs by Cloud',
      groupByProcessor('cloud_name', (region) => region.split('-')[0]),
    ),
  ],
  integrations: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec(
      'kind',
      'Integrations by Type',
      groupByProcessor('endpoint_type'),
    ),
  ],
  services: [
    INSIGHT_SPEC_TOTAL_COUNT,
    insightSpec(
      'active',
      'Active',
      countProcessor((t) => t.state === 'RUNNING'),
    ),
    insightSpec(
      'poweroff',
      'Powered Off',
      countProcessor((t) => t.state === 'POWEROFF'),
    ),
    insightSpec(
      'vpc',
      'Inside VPC',
      countProcessor((t) => !_.isNil(t.project_vpc_id)),
    ),
    insightSpec(
      'onlyAvnadmin',
      'Only Using Default Service Account',
      countProcessor((t) => {
        const hasUserAccounts = t.service_type !== 'kafka_mirrormaker';
        if (!hasUserAccounts) {
          return false;
        }
        const hasSingleUser = t.users.length === 1;
        const firstUserIsAvnAdmin =
          _.get(t, 'users[0].username', '') === 'avnadmin';
        return hasUserAccounts && hasSingleUser && firstUserIsAvnAdmin;
      }),
    ),
    insightSpec(
      'termProtected',
      'Without Termination Protection',
      countProcessor((t) => !t.termination_protection),
    ),
    insightSpec(
      'serviceType',
      'Service Type Counts',
      groupByProcessor('service_type'),
    ),
    insightSpec(
      'planTier',
      'Services by Plan Tier',
      groupByProcessor('plan', (plan) => plan.split('-')[0]),
    ),
    insightSpec(
      'cloud',
      'Services by Cloud',
      groupByProcessor('cloud_name', (region) => region.split('-')[0]),
    ),
    // TODO: by region???
    insightSpec(
      'integrations',
      'Service with Integrations',
      countProcessor((s) => s.service_integrations.length > 0),
    ),
  ],
  service: {
    metrics: [
      insightSpec(
        'metricsStats',
        'Service Metrics Stats',
        serviceMetricsProcessor,
      ),
    ],
  },
};

class AivenReporter {
  /**
   *
   * @param {AivenApi} avn An `AivenApi` client.
   */
  constructor(avn) {
    this.avn = avn;
  }
  async runFullReport(options) {
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
  async runServiceReport(projectName, serviceName, options) {
    const { progressSink } = options;
    const report = {
      running: true,
      service: getTopLevelCollection(),
      metrics: getTopLevelCollection(),
    };
    // TOP LEVEL
    await fetchTopLevelCollection(
      report,
      'service',
      progressSink,
      () => this.avn.getService(projectName, serviceName).then((s) => [s]),
      INSIGHT_SPECS.services,
    );
    // Capacity Planning
    await fetchServiceLevelCollection(
      report,
      'metrics',
      progressSink,
      () => this.avn.getServiceMetrics(projectName, serviceName),
      INSIGHT_SPECS.service.metrics,
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
