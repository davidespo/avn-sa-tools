import axios from 'axios';
import _ from 'lodash';

const get = (url, params) => ({ url, params });
const at = (path) => (o, defaultValue) => _.get(o, path, defaultValue);
const NOOP_MAPPER = (a) => a;

const arrayMapperWith =
  (itemMapper) =>
  (items = []) =>
    items.map(itemMapper);

const userMapper = (u) => ({
  name: u.real_name,
  email: u.user,
  id: u.user_id,
  projects: u.projects,
  features: u.features,
});

const projectMapper = (p) => {
  return {
    accountId: p.account_id,
    accountName: p.account_name,
    billingGroupId: p.billing_group_id,
    billingGroupName: p.billing_group_name,
    billingEmails: p.billing_emails,
    techEmails: p.tech_emails,
    defaultCloud: p.default_cloud,
    features: p.features,
    name: p.project_name,
    company: p.company,
  };
};

export default class Aiven {
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
      return axios(req);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
  _getAt(url, path, defaultValue, mapper = NOOP_MAPPER) {
    return this._call(get(url)).then(at(path, defaultValue)).then(mapper);
  }
  me() {
    return this._getAt(
      'https://api.aiven.io/v1/me',
      'data.user',
      {},
      userMapper,
    );
  }
  listProjects() {
    return this._getAt(
      'https://api.aiven.io/v1/project',
      'data.projects',
      [],
      arrayMapperWith(projectMapper),
    );
  }
  listTickets(projectName) {
    return this._getAt(
      `https://api.aiven.io/v1/project/${projectName}/tickets`,
      'data.tickets',
      [],
    );
  }
  async _fetchByProject(projects, itemFetcher) {
    const data = {
      byProject: {},
      list: [],
    };
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      let list = [];
      let error = undefined;
      try {
        list = await itemFetcher(project);
      } catch (error) {
        // not enabled
        console.error(error.message);
      }
      data.byProject[project] = { list, error };
      data.list = data.list.concat(list);
    }
    return data;
  }
  fetchAllTickets(projects) {
    return this._fetchByProject(projects, this.listTickets);
  }
}

Aiven.setGlobalClient = (apiKey) => (Aiven.instance = new Aiven(apiKey));
