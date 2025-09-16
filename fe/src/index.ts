import QRCode from 'qrcode'
import { Notify } from './modules/notify'
import { getUrlParam, performPolling } from './modules/utils'
import { UI } from './modules/ui'
import { TiichermateApi } from './modules/tiichermateRequest'
import { SignItem, SignResult } from './interfaces'
import { TeachermateQrcodeCenter } from './modules/teachermateQr'

const appDOM = document.querySelector<HTMLDivElement>('#app')

if (!appDOM) { throw new Error('appDOM not found') }

const ui = new UI(appDOM)
const notify = new Notify()

const API_URL = getUrlParam('api')
const OPENID = getUrlParam('openId')
const API_KEY = getUrlParam('apiKey') ?? ''
const TOKEN = getUrlParam('token') ?? ''
const IS_SHOW_SIGN_STU = getUrlParam('showsignstu') === 'true'
const IS_AUTO_QR = getUrlParam('autoqr') === 'true'

if (!API_URL) { ui.print('错误：未获得 api base') }
if (!OPENID) { ui.print('错误：未获得 openid') }

TiichermateApi.setApiKey(API_KEY)
TiichermateApi.setToken(TOKEN)

const handlingSign = new Set<number>()

const listenForActiveSigns = async () => {
  const [result, errData] = await TiichermateApi.fetch<SignItem[]>(`${API_URL}/api/active_signs?openId=${OPENID}`).unwrap()
  if (errData) { return ui.print(`${errData.code} ${errData.msg} ${errData.result}`) }
  const isHandlingCnt = handlingSign.size
  ui.print(`当前有 ${result.length} 个签到 ${isHandlingCnt > 0 ? `，正在处理 ${isHandlingCnt} 个` : ''}`)
  if (result.length > 0) {
    notify.doNotify({ title: '签到提醒', body: '有新的签到' })
  }
  result.forEach(handleOneSign)
}

const handleNormalOrGpsSign = async (signItem: SignItem) => {
  ui.print(`\t正在处理签到: ${signItem.name} ${signItem.isGPS ? 'GPS签到' : '普通签到'} ${signItem.courseId}/${signItem.signId}`)
  const [result, errData] = await TiichermateApi.fetch<SignResult>(
      `${API_URL}/api/sign_in?openId=${OPENID}&courseId=${signItem.courseId}&signId=${signItem.signId}`,
  ).unwrap()
  if (errData) {
    handlingSign.delete(signItem.signId)
    return ui.print(`\t\t签到结果：${errData.code} ${errData.msg} ${errData.result}`)
  }
  handlingSign.delete(signItem.signId)
  ui.print(`\t\t签到成功，排名: ${result.studentRank}`)
}

const handleQrSign = async (signItem: SignItem) => { // QRcode
  ui.print(`\t开始监听签到: ${signItem.name} 二维码签到 ${signItem.courseId}/${signItem.signId}`)
  const teachermateQrcodeCenter = new TeachermateQrcodeCenter(signItem.courseId, signItem.signId)
  teachermateQrcodeCenter.addEventListener('open', () => {
    ui.print('\t\t监听二维码 ws 连接成功，等待二维码链接')
  })
  teachermateQrcodeCenter.addEventListener('close', () => {
    handlingSign.delete(signItem.signId)
    ui.print('\t\t监听二维码 ws 连接关闭')
  })
  teachermateQrcodeCenter.addEventListener('error', () => {
    handlingSign.delete(signItem.signId)
    ui.print('\t\t监听二维码 ws 连接错误')
  })
  teachermateQrcodeCenter.addEventListener('qrcode', async (qrUrl: string) => {
    ui.print(`\t\t收到[${signItem.name}]二维码 ${signItem.courseId}/${signItem.signId}\n\t\t<a href="${qrUrl}" target="_blank">${qrUrl}</a>`)
    const dataUrl = await QRCode.toDataURL(qrUrl, { width: 200 })
    ui.printImage(dataUrl)
    if (IS_AUTO_QR) {
      setTimeout(() => {
        location.href = qrUrl
      }, 2000)
    }
  })
  teachermateQrcodeCenter.addEventListener('someoneSign', (student: any) => {
    if (IS_SHOW_SIGN_STU) {
      const { studentNumber, name, rank } = student
      ui.print(`\t\t有同学签到，No.${rank} ${name}(${studentNumber})`)
    }
  })
  teachermateQrcodeCenter.connect()
}

const handleOneSign = async (signItem: SignItem) => {
  if (handlingSign.has(signItem.signId)) { return }
  handlingSign.add(signItem.signId)
  if (signItem.isQR === 0) {
    await handleNormalOrGpsSign(signItem)
  } else {
    await handleQrSign(signItem)
  }
}

;(async () => {
  performPolling(listenForActiveSigns, 3000)
})()
