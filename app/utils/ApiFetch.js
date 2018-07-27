import _ from 'lodash'

function serializeParams(params){
  return _.chain(params).flatMap((val, key) => {
    return _.isNull(val) || _.isUndefined(val) ? '' : (() => {
      if(_.isArray(val)){
        return val.map(v => `${key}=${v}`)
      }
      return `${key}=${val}`
    })()
  }).flattenDeep().value().filter(v => v !== '').join('&')
}

function isHeadOrGet(opts) {
  return  _.isUndefined(opts) ? false : (_.isUndefined(opts.method) || /^get|head$/i.test(opts.method) || (/^put$/i.test(opts.method) && !opts.contentType)) && !_.isUndefined(opts.body)
}
function getOpts(opts) {
  return isHeadOrGet(opts) ? _.chain(opts).omit('body').value() : (() => {
    return _.chain(opts).mapValues((val, key) => {
      if(key === 'body'){
        if(opts.contentType && opts.contentType === 'application/json'){
          return JSON.stringify(opts.body)
        }
        if(opts.contentType && opts.contentType === 'application/x-www-form-urlencoded' && /^put$/i.test(opts.method)){
          return serializeParams(opts.body)
        }
        var data = new FormData();
        _.forEach(val, (v, k) => {
          if(!_.isUndefined(v)) {
            data.append(k, v)
          }
        })
        return data
      }
      return val
    }).value()
  })()
}

function getUrl(url, opts) {
  const queryUrl = `${url}?__vt_param__=${ONEAPM.token}`;
  return isHeadOrGet(opts) ? queryUrl + (/\?/.test(queryUrl) ? '&' : '?') + serializeParams(opts.body) : queryUrl
}

function getHeaders(opts) {
  let myHeaders = new Headers()
  if(opts && opts.contentType === 'application/x-www-form-urlencoded'){
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
  }
  myHeaders.append("X-Requested-With", "XMLHttpRequest")

  //new add by ft
  let cookieParams = JSON.parse(localStorage.getItem('i2-data'));
  if(cookieParams!=null){
    myHeaders.append("authorization", cookieParams.token)
  }
  //end

  return {
    headers: myHeaders,
    mode: 'cors',
    credentials: 'include',
    cache: 'default'
  }
}

function fetchApi(url, options){
  var opts = Object.assign({}, getOpts(options), getHeaders(options))
  var myRequest = new Request(getUrl(url, options), opts);
  return fetch(myRequest).then((res) => {
    if(res.status >= 200 && res.status < 300){
      return res.json()
    }else if(res.status === 400){
      return res.json().then((data) => data)
    }else{
      var error = new Error(res.statusText)
      error.response = res
      return error
    }
  })
}

export { fetchApi as fetch, fetchApi }
