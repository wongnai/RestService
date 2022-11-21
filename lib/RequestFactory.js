"use strict";
let Promise = require(`bluebird`);
let RequestAsync = require(`./requestasync`);
let NotSuccessfulResponseError = require(`./NotSuccessfulResponseError`);
let _ = require("lodash");

class RequestFactory {
  constructor(baseApi, options, interceptor, circuitBreaker) {
    this.options = options || {};
    this.baseApi = baseApi;
    this.interceptor = interceptor;
    this.circuitBreaker = circuitBreaker;
  }

  get(path, customOptions) {
    const defaultOptions = this.getOptions(path, `get`);
    const options = this.combineOption(customOptions || {}, defaultOptions);
    return doRequest.call(this, options);
  }

  post(path, body, customOptions) {
    const defaultOptions = this.getOptions(path, `post`, body);
    const options = this.combineOption(customOptions || {}, defaultOptions);
    return doRequest.call(this, options);
  }

  put(path, body, customOptions) {
    const defaultOptions = this.getOptions(path, `put`, body);
    const options = this.combineOption(customOptions || {}, defaultOptions);
    return doRequest.call(this, options);
  }

  patch(path, body, customOptions) {
    const defaultOptions = this.getOptions(path, `patch`, body);
    const options = this.combineOption(customOptions || {}, defaultOptions);
    return doRequest.call(this, options);
  }

  delete(path, customOptions) {
    const defaultOptions = this.getOptions(path, `delete`);
    const options = this.combineOption(customOptions || {}, defaultOptions);
    return doRequest.call(this, options);
  }

  combineOption(option, defaultOption) {
    return _.defaultsDeep({}, option, defaultOption);
  }

  getOptions(path, method, body) {
    body = body || {};
    let result = Object.assign(
      {
        timeout: 10000,
        forever: true,
      },
      this.options,
      {
        url: `${this.baseApi}${path}`,
        method: method,
      }
    );

    if (body.formData) {
      result = Object.assign(result, { formData: body.formData });
    } else if (Object.keys(body).length !== 0) {
      result = Object.assign(result, { body: body, json: true });
    } else {
      result.json = true;
    }
    return result;
  }

  get headers() {
    //Backward compatible
    return this.getHeaders();
  }

  getHeaders() {
    return this.options.headers;
  }

  setHeaders(headers) {
    Object.assign(this.options.headers, headers);
  }
}

let doRequest = function (options) {
  const startTime = process.hrtime();
  doInterceptor.call(this, `before`, options);

  const httpCall = () =>
    RequestAsync.request(options)
      .then((r) => {
        const diff = process.hrtime(startTime);
        const responseTime = diff[0] * 1e9 + diff[1];
        r.responseTime = responseTime;
        return r;
      })
      .then(checkStatusCode);

  const respProm = this.circuitBreaker
    ? this.circuitBreaker(httpCall, options)
    : httpCall();

  return respProm
    .then(doInterceptor.bind(this, `success`, options))
    .then((obj) => obj.body)
    .catch((e) => {
      doInterceptor.call(this, `error`, options, e);
      e.request = options;
      throw e;
    });
};

let doInterceptor = function (type, options, result) {
  if (this.interceptor && this.interceptor[type]) {
    this.interceptor[type](options, result);
  }
  return result;
};

let checkStatusCode = function (res) {
  return Promise.try(() => {
    if (res.statusCode >= 400) {
      throw new NotSuccessfulResponseError(res);
    }
    return res;
  });
};

module.exports = RequestFactory;
