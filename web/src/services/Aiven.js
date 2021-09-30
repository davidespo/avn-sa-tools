import axios from 'axios';
import _ from 'lodash';

const get = (url, params) => ({ url, params });
const at = (path) => (o, defaultValue) => _.get(o, path, defaultValue);

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
  me() {
    return this._call(get('https://api.aiven.io/v1/me')).then(at('data.user'));
  }
  listTickets(projectName) {
    return this._call(
      get(`https://api.aiven.io/v1/project/${projectName}/tickets`),
    ).then(at('data.tickets'), []);
  }
  async fetchAllTickets(projects) {
    let byProject = {};
    let count = 0;
    for (let i = 0; i < projects.length; i++) {
      let tickets = [];
      let enabled = false;
      try {
        tickets = await this.listTickets(projects[i]);
        count += tickets.length;
        enabled = true;
      } catch (error) {
        // not enabled
      }
      byProject[projects[i]] = { tickets, enabled };
    }
    byProject._count = count;
    return byProject;
  }
}

Aiven.setGlobalClient = (apiKey) => (Aiven.instance = new Aiven(apiKey));
