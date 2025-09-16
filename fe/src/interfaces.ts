export interface ApiResponse<T> {
  code: number
  msg: string
  result: T | null
}

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
