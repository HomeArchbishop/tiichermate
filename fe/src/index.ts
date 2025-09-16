import QRCode from 'qrcode'
import { Notify } from './modules/notify'
import { getUrlParam, performPolling, buildSeqId } from './modules/utils'
import { UI } from './modules/ui'
import { TiichermateApi } from './modules/request'
import { SignItem } from './interfaces'

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

const handlingSign = new Set()

const listenForActiveSigns = async () => {
  const [data, code, msg] = await TiichermateApi.fetch<SignItem[]>(`${API_URL}/api/active_signs?openId=${OPENID}`).unwrap()
  if (data.code !== 0) { return ui.print(`${data.code} ${data.msg} ${data.result}`) }
  const result = data.result
  if (!Array.isArray(result)) { return ui.print('返回未知数据格式') }
  const isHandlingCnt = handlingSign.size
  ui.print(`当前有 ${result.length} 个签到 ${isHandlingCnt > 0 ? `，正在处理 ${isHandlingCnt} 个` : ''}`)
  if (result.length > 0) {
    notify.doNotify({ title: '签到提醒', body: '有新的签到' })
  }
  result.forEach(handleOneSign)
}

const handleOneSign = async (signItem: SignItem) => {
  const key = signItem.courseId + signItem.signId
  if (handlingSign.has(key)) { return }
  handlingSign.add(key)
  if (signItem.isQR === 0) {
    ui.print(`\t正在处理签到: ${signItem.name} ${signItem.isGPS ? 'GPS签到' : '普通签到'} ${signItem.courseId}/${signItem.signId}`)
    const data = await fetch(new TiichermateRequest(
      `${API_URL}/api/sign_in?openId=${OPENID}&courseId=${signItem.courseId}&signId=${signItem.signId}`),
    ).then(r => r.json())
    if (data.code !== 0) {
      handlingSign.delete(key)
      return ui.print(`\t\t签到结果：${data.code} ${data.msg}`)
    }
    const result = data.result
    if (result.errorCode !== undefined) {
      handlingSign.delete(key)
      return ui.print(`\t\t签到结果：${signItem.name} ${result.errorCode} ${result.msgClient}`)
    }
    handlingSign.delete(key)
    ui.print(`\t\t签到成功，排名: ${result.studentRank}`)
  } else { // QRcode
    ui.print(`\t开始监听签到: ${signItem.name} 二维码签到 ${signItem.courseId}/${signItem.signId}`)
    const client = new WebSocket('wss://www.teachermate.com.cn/faye')
    const seqId = buildSeqId({ from: 1 })
    const sendMessage = (msg: any) => {
      client.send(JSON.stringify(msg ? [msg] : []))
    }
    client.onopen = () => {
      ui.print('\t\t监听二维码 ws 连接成功，等待二维码链接')
      sendMessage({
        channel: '/meta/handshake',
        version: '1.0',
        supportedConnectionTypes: ['websocket', 'eventsource', 'long-polling', 'cross-origin-long-polling', 'callback-polling'],
        id: seqId(),
      })
    }
    client.onclose = () => {
      handlingSign.delete(key)
      ui.print('\t\t监听二维码 ws 连接关闭')
    }
    client.onerror = () => {
      handlingSign.delete(key)
      ui.print('\t\t监听二维码 ws 连接错误')
    }
    let cid = ''
    client.onmessage = async (event: any) => {
      console.log('receiveMessage', event.data)
      const message = JSON.parse(event.data)[0]
      if (!message) return
      if (message.channel === '/meta/handshake') {
        const { clientId } = message
        cid = clientId
        sendMessage({
          channel: '/meta/connect',
          clientId,
          connectionType: 'websocket',
          id: seqId(),
        })
        sendMessage({
          channel: '/meta/subscribe',
          clientId,
          subscription: `/attendance/${signItem.courseId}/${signItem.signId}/qr`,
          id: seqId(),
        })
      } else if (message.channel === '/meta/connect') {
        const { advice: { timeout } } = message
        if (!timeout) { return }
        sendMessage(null)
        setTimeout(() => {
          sendMessage(null)
          sendMessage({
            channel: '/meta/connect',
            clientId: cid,
            connectionType: 'websocket',
            id: seqId(),
          })
        }, timeout / 2)
      } else if (message.channel.startsWith('/attendance/')) {
        if (message.data.type === 1) {
          const { data: { qrUrl } } = message
          ui.print(`\t\t收到[${signItem.name}]二维码 ${signItem.courseId}/${signItem.signId}\n\t\t<a href="${qrUrl}" target="_blank">${qrUrl}</a>`)
          const dataUrl = await QRCode.toDataURL(qrUrl, { width: 200 })
          ui.printImage(dataUrl)
          if (IS_AUTO_QR) {
            setTimeout(() => {
              location.href = qrUrl
            }, 2000)
          }
        } else if (message.data.type === 3 && IS_SHOW_SIGN_STU) {
          const { data: { student: { studentNumber, name, rank } } } = message
          ui.print(`\t\t有同学签到，No.${rank} ${name}(${studentNumber})`)
        }
      }
    }
  }
}

;(async () => {
  performPolling(listenForActiveSigns, 3000)
})()
