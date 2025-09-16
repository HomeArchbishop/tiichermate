enum TiichermateApiCode {
  /// 成功
  Success = 0,
  /// 参数错误
  InvalidParams = 40000,
  /// 用户未鉴权
  Unauthorized = 40001,
  /// 系统内部错误
  InternalError = 50000,
  /// 外部API错误
  ExternalApiError = 50001,
}

interface ApiErrorResult {
  [TiichermateApiCode.InvalidParams]: null
  [TiichermateApiCode.Unauthorized]: null
  [TiichermateApiCode.InternalError]: string
  [TiichermateApiCode.ExternalApiError]: string
}

interface ApiSuccessResponse<T> {
  code: TiichermateApiCode.Success
  msg: string
  result: T
}

export interface ApiErrorResponse<K extends keyof ApiErrorResult> {
  code: K
  msg: string
  result: ApiErrorResult[K]
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse<keyof ApiErrorResult>

export interface SignItem {
  courseId: number
  signId: number
  isGPS: number
  isQR: number
  name: string
  code: string // 课程代码
  startYear: number
  term: string
  cover: string
}

export interface SignResult {
  signRank: number // 签到总数量
  studentRank: number // 本次签到排名
}

// Teachermate API 异常响应接口
interface ExternalApiUnauthorizedResult {
  message: '登录信息失效，请退出后重试'
}

interface ExternalApiSignInResult {
  errorCode: 305
  msg: 'repeat sign in'
  msgClient: '你已经签到成功'
}

interface ExternalApiNotInCourseResult {
  errorCode: 303
  msg: 'student did not take this course'
  msgClient: '未加入当前课堂'
}

interface ExternalApiSignClosedResult {
  errorCode: 301
  msg: 'no sign course now'
  msgClient: '当前签到已关闭'
}

interface ExternalApiQrcodeSignTaskResult {
  errorCode: 306
  msg: 'qrcode sign task'
  msgClient: '当前签到为二维码签到'
}

interface ExternalApiQueryFailedResult {
  errorCode: 302
  msg: '查询失败'
  msgClient: '查询失败'
}

export type ExternalApiErrorResult =
  | ExternalApiUnauthorizedResult
  | ExternalApiSignInResult
  | ExternalApiNotInCourseResult
  | ExternalApiSignClosedResult
  | ExternalApiQrcodeSignTaskResult
  | ExternalApiQueryFailedResult
