# Teachermate 侧 API 文档

## 获取签到列表

```bash
curl -X GET "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs" \
  -H "openId: ${openId}"
```

成功响应:

```ts
// 200 OK
type resp = Array<{
  courseId: number
  signId: number
  isGPS: number
  isQR: number
  name: string
  code: string // 课程代码
  startYear: number
  term: string
  cover: string
}>
```

异常响应:

```ts
// 401 Unauthorized
interface resp {
  message: '登录信息失效，请退出后重试'
}
```

## 执行普通/GPS签到

```bash
curl -X POST "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in" \
  -H "openId: ${openId}" \
```

成功响应:

```ts
// 200 OK
interface resp {
  signRank: number // 签到总数量
  studentRank: number // 本次签到排名
}
```

异常响应:

```ts
// 200 OK
interface resp {
  errorCode: 305,
  msg: "repeat sign in",
  msgClient: "你已经签到成功",
}
```

```ts
// 401 Unauthorized
interface resp {
  message: '登录信息失效，请退出后重试'
}
```

```ts
// 403 Forbidden
interface resp {
  errorCode: 303,
  msg: 'student did not take this course',
  msgClient: '未加入当前课堂',
}
```

```ts
// 403 Forbidden
interface resp {
  errorCode: 301,
  msg: 'no sign course now',
  msgClient: '当前签到已关闭',
}
```

```ts
// 403 Forbidden
interface resp {
  errorCode: 306,
  msg: 'qrcode sign task',
  msgClient: '当前签到为二维码签到',
}
```

```ts
// 500 Internal Server Error
interface resp {
  errorCode: 302,
  msg: '查询失败',
  msgClient: '查询失败',
}
```
