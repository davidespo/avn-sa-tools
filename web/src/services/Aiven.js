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
}

Aiven.setGlobalClient = (apiKey) => (Aiven.instance = new Aiven(apiKey));
