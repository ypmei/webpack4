/*global YPMEI_LOGIN_URL:true*/

const YPMEI = Object.assign({
  server: {
    loginPath: YPMEI_LOGIN_URL
  }
}, window.YPMEI_CONFIG || {})
export default YPMEI
