// 仅匹配签到页即可,例如:
//   https://v18.teachermate.cn/wechat-pro-ssr/student/sign*
// 同域 /wechat-api/* 与 www Faye/二维码不走本脚本

function onRequest(context, request) {
  return request;
}

function onResponse(context, request, response) {
  var HOST = 'v18.teachermate.cn';
  var SIGN_PATH = '/wechat-pro-ssr/student/sign';
  var FRONTEND = __FRONTEND__;

  function pathOnly() {
    var p = request.path || '';
    var i = p.indexOf('?');
    return i >= 0 ? p.slice(0, i) : p;
  }

  function q(key) {
    var v = request.queries ? request.queries[key] : null;
    if (v == null || v === '') return null;
    return v;
  }

  if (request.host !== HOST) return response;
  if (pathOnly() !== SIGN_PATH) return response;
  if (!q('openid')) return response;

  response.statusCode = 200;
  response.headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(FRONTEND.length),
  };
  response.body = FRONTEND;
  return response;
}
