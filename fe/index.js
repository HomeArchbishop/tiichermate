const getUrlParam = (paramName) => (new URLSearchParams(window.location.search)).get(paramName)

let lastPrint = ''
let lastPrintCntDOM = null

const print = (str) => {
  if (str === lastPrint && lastPrintCntDOM !== null) {
    lastPrintCntDOM.innerHTML = '...x' + (parseInt([...lastPrintCntDOM.innerHTML.matchAll(/\d+/g)][0]?.[0] || '1') + 1)
    return
  }
  const [p, cnt] = [document.createElement('pre'), document.createElement('span')]
  p.innerHTML = str
  lastPrint = str
  cnt.style.marginLeft = '40px'
  lastPrintCntDOM = cnt
  document.querySelector('#output').appendChild(p).appendChild(cnt)
  window.scrollTo(0, document.body.scrollHeight)
}

const createPrintDiv = () => document.querySelector('#output').appendChild(document.createElement('div'))

const API_URL = getUrlParam('api')
const OPENID = getUrlParam('openid')
const IS_SHOW_SIGN_STU = getUrlParam('showsignstu') === 'true'
const IS_AUTO_QR = getUrlParam('autoqr') === 'true'

if (!OPENID) { print('错误：未获得 openid') }

const handlingSign = {}

const listenForActiveSigns = async () => {
  setTimeout(listenForActiveSigns, 3000)
  try {
    const json = await fetch(`${API_URL}/api/active_signs?openId=${OPENID}`).then(r => r.json())
    if (json.message !== undefined) { throw new Error(json.message) }
    if (!Array.isArray(json)) { throw new Error('返回未知数据格式') }
    const isHandlingCnt = Object.values(handlingSign).filter(v => v).length
    print(`当前有 ${json.length} 个签到 ${isHandlingCnt > 0 ? `，正在处理 ${isHandlingCnt} 个` : ''}`)
    json.forEach(item => handleOneSign(item))
  } catch (err) {
    print(err.message)
  }
}

const handleOneSign = async (signItem) => {
  const key = signItem.courseId + signItem.signId
  if (handlingSign[key]) { return }
  handlingSign[key] = true
  if (signItem.isQR === 0) {
    print(`\t正在处理签到: ${signItem.name} ${signItem.isGPS ? 'GPS签到' : '普通签到'} ${signItem.courseId}/${signItem.signId}`)
    const res = await fetch(`${API_URL}/api/sign_in?openId=${OPENID}&courseId=${signItem.courseId}&signId=${signItem.signId}`)
    const json = await res.json()
    if (json.errorCode !== undefined) {
      handlingSign[key] = false
      return print(`\t\t签到结果：${signItem.name} ${json.msgClient}`)
    }
    print(`\t\t签到成功，排名: ${json.studentRank}`)
    handlingSign[key] = false
  } else { // QRcode
    print(`\t开始监听签到: ${signItem.name} 二维码签到 ${signItem.courseId}/${signItem.signId}`)
    const client = new WebSocket('wss://www.teachermate.com.cn/faye')
    const seqId = (() => {
      let _seqId = 0
      return () => `${_seqId++}`
    })()
    const sendMessage = (msg) => {
      client.send(JSON.stringify(msg ? [msg] : []))
    }
    client.onopen = () => {
      print('\t\t监听二维码 ws 连接成功，等待二维码链接')
      sendMessage({
        channel: '/meta/handshake',
        version: '1.0',
        supportedConnectionTypes: ['websocket', 'eventsource', 'long-polling', 'cross-origin-long-polling', 'callback-polling'],
        id: seqId()
      })
    }
    client.onclose = () => {
      handlingSign[key] = false
      return print('\t\t监听二维码 ws 连接关闭')
    }
    client.onerror = () => {
      handlingSign[key] = false
      return print('\t\t监听二维码 ws 连接错误')
    }
    let cid = ''
    client.onmessage = (event) => {
      console.log(`receiveMessage`, event.data)
      const message = JSON.parse(event.data)[0]
      if (!message) return
      if (message.channel === '/meta/handshake') {
        const { clientId } = message
        cid = clientId
        sendMessage({
          channel: '/meta/connect',
          clientId,
          connectionType: 'websocket',
          id: seqId()
        })
        sendMessage({
          channel: '/meta/subscribe',
          clientId,
          subscription: `/attendance/${signItem.courseId}/${signItem.signId}/qr`,
          id: seqId()
        })
      } else if (message.channel === '/meta/connect') {
        const { advice: { timeout } } = message
        if (!timeout) { return }
        sendMessage()
        setTimeout(() => {
          sendMessage()
          sendMessage({
              channel: '/meta/connect',
              clientId: cid,
              connectionType: 'websocket',
              id: seqId()
          })
        }, timeout / 2)
      } else if (message.channel.startsWith('/attendance/')) {
        if (message.data.type === 1) {
          const { data: { qrUrl } } = message
          print(`\t\t收到[${signItem.name}]二维码 ${signItem.courseId}/${signItem.signId}\n\t\t<a href="${qrUrl}" target="_blank">${qrUrl}</a>`)
          new QRCode(createPrintDiv(), qrUrl)
          if (IS_AUTO_QR) {
            setTimeout(() => {
              location.href = qrUrl
            }, 2000)
          }
        } else if (message.data.type === 3 && IS_SHOW_SIGN_STU) {
          const { data: { student: { studentNumber, name, rank } } } = message
          print(`\t\t有同学签到，No.${rank} ${name}(${studentNumber})`)
        }
      }
    }
  }
}

;(async () => {
  listenForActiveSigns().catch(() => {})
})()
