"use strict";
let RequestAsync = require(`../lib/requestasync`);
let Promise = require(`bluebird`);
let RestService = require(`../lib/RestService`);
let init = RestService.init;
let reset = RestService.reset;
let RestClient = RestService.RestClient;

let apiUrl = () => {
  return `http://example.com`;
};

describe(`call getOptions method in restFactory`, () => {
  let request;
  let path = `/testUrl`;
  let method = `post`;
  let body = { data: `sadsadsad` };

  beforeEach(() => {
    init({ clients: [{ type: `wongnaiTest`, url: apiUrl() }] });
    request = RestClient.wongnaiTest();
    spyOn(request, `getOptions`).and.callThrough();
  });

  afterEach(() => {
    reset();
  });

  describe("init option", () => {
    beforeEach(() => {
      init({
        clients: [{ type: `highTimeout`, url: apiUrl(), timeout: 40000 }],
      });
      request = RestClient.highTimeout();
      spyOn(request, `getOptions`).and.callThrough();
    });
    it("call with correct timeout", () => {
      let result = request.getOptions(path, method, body);
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        body: body,
        forever: true,
        timeout: 40000,
      };

      expect(result).toEqual(expected);
    });
  });

  describe("dynamic option, url and method cannot be overrided", () => {
    beforeEach(() => {
      let dynaimcOptions = { forever: false, url: "", method: "xx", pool: 5 };
      init({
        clients: [
          {
            type: `highTimeout`,
            url: apiUrl(),
            timeout: 40000,
            options: dynaimcOptions,
          },
        ],
      });
      request = RestClient.highTimeout();
      spyOn(request, `getOptions`).and.callThrough();
    });
    it("call with correct timeout", () => {
      let result = request.getOptions(path, method, body);
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        body: body,
        forever: false,
        timeout: 40000,
        pool: 5,
      };

      expect(result).toEqual(expected);
    });
  });

  describe(`with path, method, and body parameter`, () => {
    it(`should response object include body property`, () => {
      let result = request.getOptions(path, method, body);
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        body: body,
        forever: true,
        timeout: 10000,
      };

      expect(result).toEqual(expected);
    });
  });

  describe(`without body parameter`, () => {
    it(`should response object without body property`, () => {
      let result = request.getOptions(path, method);
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        forever: true,
        timeout: 10000,
      };

      expect(result).toEqual(expected);
    });
  });

  describe(`with multipart`, () => {
    it(`should response body which is array`, () => {
      let result = request.getOptions(path, method, { formData: body });
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        timeout: 10000,
        forever: true,
        formData: body,
      };

      expect(result).toEqual(expected);
    });
  });
});

describe(`RestClient`, () => {
  let headers = {
    "x-forwarded-for": `HeaderValue`,
    blacklist: `xxxxxxx`,
  };
  let RestConfig = {
    defaultHeaders: [`x-forwarded-for`],
    clients: [
      { type: `test1`, url: `testUrl1` },
      { type: `test2`, url: `testUrl2` },
    ],
  };

  afterEach(() => {
    reset();
  });

  it(`init() must create a property in RestClient and return object with some headers in whiteList header`, () => {
    init(RestConfig);
    expect(RestClient.test1).toBeDefined();

    const tmp = RestClient.test1({ headers });
    expect(tmp.getHeaders()).toEqual({ "x-forwarded-for": `HeaderValue` });
    expect(tmp.baseApi).toEqual(RestConfig.clients[0].url);
  });
  it(`defaultHeaders should apply to all client`, () => {
    init(RestConfig);
    const test1 = RestClient.test1({ headers });
    const test2 = RestClient.test2({ headers });
    expect(test1.getHeaders()).toEqual({ "x-forwarded-for": `HeaderValue` });
    expect(test2.getHeaders()).toEqual({ "x-forwarded-for": `HeaderValue` });
  });
  it(`set unique header for each client`, () => {
    init({
      clients: [
        {
          type: `test`,
          url: `testHeaderUrl`,
          headers: [`TEST-HEADER`, { "X-HEADER": 1 }],
        },
      ],
    });
    const tmp = RestClient.test();
    expect(tmp.getHeaders()).toEqual({ "X-HEADER": 1 });
  });
  it(`add header after doing something`, () => {
    init({
      clients: [{ type: `test`, url: `testHeaderUrl`, headers: [`test`] }],
    });
    const tmp = RestClient.test({ headers });
    expect(tmp.getHeaders()).toEqual({ "x-forwarded-for": `HeaderValue` });
    tmp.setHeaders({ authorization: `this is a token` });
    expect(tmp.getHeaders()).toEqual({
      "x-forwarded-for": `HeaderValue`,
      authorization: `this is a token`,
    });
  });
  it(`return correct value from header function`, () => {
    init({
      clients: [
        {
          type: `test`,
          url: `testHeaderUrl`,
          headers: [
            {
              testFunctionHeader: () => {
                return `wongnai`;
              },
            },
          ],
        },
      ],
    });
    const tmp = RestClient.test({ headers });
    expect(tmp.getHeaders()).toEqual({
      "x-forwarded-for": `HeaderValue`,
      testFunctionHeader: `wongnai`,
    });
  });
});

describe(`create request with header`, () => {
  let headers = { "x-forwarded-for": `HeaderValue` };
  let path = `/testUrl`;
  let method = `get`;
  let baseUrl = apiUrl();
  let request;

  beforeEach(() => {
    init({
      clients: [
        { type: `wongnai`, url: baseUrl, headerCfg: ["x-forwarded-for"] },
      ],
    });
    request = RestClient.wongnai({ headers });
    spyOn(request, `getOptions`).and.callThrough();
  });

  afterEach(() => {
    reset();
  });

  it(`should response object with headers property when getOptions have been called`, () => {
    let expected = {
      url: `${apiUrl()}${path}`,
      method: method,
      json: true,
      headers: headers,
      forever: true,
      timeout: 10000,
    };

    let result = request.getOptions(path, method);

    expect(result).toEqual(expected);
  });
  it(`should request to RequestAsync method with headers parameter when get have been called`, () => {
    let response = {
      statusCode: 200,
      body: `res`,
    };
    let option = request.getOptions(path, `get`); // getOptions is call #1
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.get(path); // getOptions is call #2

    expect(RequestAsync.request).toHaveBeenCalledWith(option);
    expect(RequestAsync.request).toHaveBeenCalledTimes(1);
    expect(request.getOptions).toHaveBeenCalledTimes(2);
  });
});

describe(`create new request with createRequest factory`, () => {
  let path = `/testUrl`;
  let response = {
    statusCode: 200,
    body: `res`,
  };
  let request;

  beforeEach(() => {
    init({ clients: [{ type: `wongnai`, url: `testUrl` }] });
    request = RestClient.wongnai();
  });

  afterEach(() => {
    reset();
  });

  it(`should call get method, and RequestAsync with correct options parameter`, () => {
    let option = request.getOptions(path, `get`);
    spyOn(request, `get`).and.callThrough();
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.get(path);

    expect(RequestAsync.request).toHaveBeenCalledWith(option);
    expect(RequestAsync.request).toHaveBeenCalledTimes(1);
    expect(request.get).toHaveBeenCalledWith(path);
    expect(request.get).toHaveBeenCalledTimes(1);
  });
  it(`should call post method, and RequestAsync with correct option parameter`, () => {
    let body = { test: `TEXT` };
    let option = request.getOptions(path, `post`, body);
    spyOn(request, `post`).and.callThrough();
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.post(path, body);

    expect(RequestAsync.request).toHaveBeenCalledWith(option);
    expect(RequestAsync.request).toHaveBeenCalledTimes(1);
    expect(request.post).toHaveBeenCalledWith(path, body);
    expect(request.post).toHaveBeenCalledTimes(1);
  });
});

describe(`call request method but got 4xx response`, () => {
  let restClient;

  beforeEach(() => {
    init({ clients: [{ type: `TEST`, url: `URL` }] });
    restClient = RestClient.TEST();
  });

  afterEach(() => {
    reset();
  });

  it(`400 should create Error element`, (done) => {
    let response = {
      statusCode: 400,
      body: `body`,
    };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.post(`/testUrl`, { data: "1" }).error((e) => {
      expect(e.isOperational).toEqual(true);
      expect(e.request.url).toEqual("URL/testUrl");
      expect(e.request.method).toEqual("post");
      expect(e.request.body).toEqual({ data: "1" });
      expect(e.body).toEqual(response.body);
      expect(e.message).toBeUndefined();
      expect(e).toEqual(jasmine.any(Error));
      done();
    });
  });

  it(`400 with message should create Error element with message`, (done) => {
    let response = {
      statusCode: 400,
      body: {
        message: `message`,
      },
    };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.post(`/testUrl`, { data: "1" }).error((e) => {
      expect(e.isOperational).toEqual(true);
      expect(e.request.url).toEqual("URL/testUrl");
      expect(e.request.method).toEqual("post");
      expect(e.request.body).toEqual({ data: "1" });
      expect(e.body).toEqual(response.body);
      expect(e.message).toEqual("message");
      expect(e).toEqual(jasmine.any(Error));
      done();
    });
  });

  it(`403 without body should return correct Error elements`, (done) => {
    let response = {
      statusCode: 403,
    };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.post(`/testUrl`, { data: "1" }).error((e) => {
      expect(e.isOperational).toEqual(true);
      expect(e.request.url).toEqual("URL/testUrl");
      expect(e.request.method).toEqual("post");
      expect(e.request.body).toEqual({ data: "1" });
      expect(e.body).toBeUndefined();
      expect(e.message).toEqual("unsuccessful response");
      expect(e).toEqual(jasmine.any(Error));
      done();
    });
  });
});

describe(`partial interceptor`, () => {
  let restClient;

  beforeEach(() => {
    init({
      clients: [
        {
          type: `TEST`,
          url: `URL`,
          interceptor: {
            success: jasmine.createSpy(`success`),
          },
        },
      ],
    });
    restClient = RestClient.TEST();
  });

  afterEach(() => {
    reset();
  });

  it(`should call interceptor.success function when request is success`, (done) => {
    let response = { statusCode: 200, body: `body` };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.get(`/test`).then((r) => {
      expect(restClient.interceptor.success).toHaveBeenCalledTimes(1);
      expect(restClient.interceptor.success).toHaveBeenCalledWith(
        jasmine.objectContaining({ url: `URL/test` }),
        response
      );
      done();
    });
  });
});

describe(`create rest client with interceptor`, () => {
  let restClient;

  beforeEach(() => {
    init({
      clients: [
        {
          type: `TEST`,
          url: `URL`,
          interceptor: {
            success: jasmine.createSpy(`success`),
            error: jasmine.createSpy(`error`),
            before: jasmine.createSpy(`before`),
          },
        },
      ],
    });
    restClient = RestClient.TEST();
  });

  afterEach(() => {
    reset();
  });

  it(`should call interceptor.success function when request is success`, (done) => {
    let response = { statusCode: 200, body: `body` };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.get(`/test`).then((r) => {
      expect(restClient.interceptor.before).toHaveBeenCalledTimes(1);
      expect(restClient.interceptor.success).toHaveBeenCalledTimes(1);
      expect(restClient.interceptor.success).toHaveBeenCalledWith(
        jasmine.objectContaining({ url: `URL/test` }),
        response
      );
      expect(restClient.interceptor.error).not.toHaveBeenCalled();
      done();
    });
  });

  it(`should call interceptor.error function when request is error`, (done) => {
    let response = { statusCode: 400, body: `body` };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.get(`/test`).error((e) => {
      expect(restClient.interceptor.error).toHaveBeenCalledTimes(1);
      expect(restClient.interceptor.error).toHaveBeenCalledWith(
        jasmine.objectContaining({ url: `URL/test` }),
        e
      );
      expect(restClient.interceptor.success).not.toHaveBeenCalled();
      done();
    });
  });

  it(`should throw an error when init interceptor type is incorrect`, (done) => {
    let initBindUndefinedSuccessAndError = init.bind(null, {
      clients: [{ type: `TEST`, url: `URL`, interceptor: "123" }],
    });
    let initBindInvalidSuccessAndErrorType = init.bind(null, {
      clients: [
        {
          type: `TEST`,
          url: `URL`,
          interceptor: { success: `123123`, error: `123123123` },
        },
      ],
    });
    expect(initBindUndefinedSuccessAndError).toThrowError(Error);
    expect(initBindInvalidSuccessAndErrorType).toThrowError(Error);
    done();
  });
});

describe("custom options", () => {
  let request;
  let path = `/testUrl`;
  let response = {
    statusCode: 200,
    body: `res`,
  };
  const body = {
    data: "some-data",
  };

  const customOption = {
    headers: {
      apiToken: "test",
    },
  };

  beforeEach(() => {
    init({ clients: [{ type: `wongnaiTest`, url: apiUrl() }] });
    request = RestClient.wongnaiTest();
  });

  afterEach(() => {
    reset();
  });

  it("should combine two option objects", () => {
    const defaultOption = {
      url: `${apiUrl()}${path}`,
      method: "get",
      json: true,
      forever: true,
      timeout: 10000,
    };
    expect(request.combineOption(customOption, defaultOption)).toEqual({
      url: `${apiUrl()}${path}`,
      method: "get",
      json: true,
      forever: true,
      timeout: 10000,
      headers: {
        apiToken: "test",
      },
    });
  });

  it("should perform get with custom option", () => {
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.get(path, customOption);

    expect(RequestAsync.request).toHaveBeenCalledWith({
      url: `${apiUrl()}${path}`,
      method: "get",
      json: true,
      forever: true,
      timeout: 10000,
      headers: {
        apiToken: "test",
      },
    });
  });

  it("should perform post with custom option", () => {
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.post(path, body, customOption);

    expect(RequestAsync.request).toHaveBeenCalledWith({
      url: `${apiUrl()}${path}`,
      method: "post",
      json: true,
      forever: true,
      timeout: 10000,
      body: {
        data: "some-data",
      },
      headers: {
        apiToken: "test",
      },
    });
  });

  it("should perform patch with custom option", () => {
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.patch(path, body, customOption);

    expect(RequestAsync.request).toHaveBeenCalledWith({
      url: `${apiUrl()}${path}`,
      method: "patch",
      json: true,
      forever: true,
      timeout: 10000,
      body: {
        data: "some-data",
      },
      headers: {
        apiToken: "test",
      },
    });
  });

  it("should perform put with custom option", () => {
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.put(path, body, customOption);

    expect(RequestAsync.request).toHaveBeenCalledWith({
      url: `${apiUrl()}${path}`,
      method: "put",
      json: true,
      forever: true,
      timeout: 10000,
      body: {
        data: "some-data",
      },
      headers: {
        apiToken: "test",
      },
    });
  });

  it("should perform delete with custom option", () => {
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    request.delete(path, customOption);

    expect(RequestAsync.request).toHaveBeenCalledWith({
      url: `${apiUrl()}${path}`,
      method: "delete",
      json: true,
      forever: true,
      timeout: 10000,
      headers: {
        apiToken: "test",
      },
    });
  });
});

describe(`circuit breaker`, () => {
  let restClient;

  beforeEach(() => {
    init({
      clients: [
        {
          type: `TEST`,
          url: `URL`,
          circuitBreaker: jasmine.createSpy(`circuitBreaker`, (fn, opt) => {
            console.log('called', fn, opt)
            return fn()
          }).and.callThrough(),
        },
      ],
    });
    restClient = RestClient.TEST();
  });

  afterEach(() => {
    reset();
  });

  it(`should call circuitBreaker`, (done) => {
    let response = { statusCode: 200, body: `body` };
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response));

    restClient.get(`/test`).then((r) => {
      expect(restClient.circuitBreaker).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
