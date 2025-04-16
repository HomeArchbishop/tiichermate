function getUrlParam (paramName) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(paramName)
}

let lastPrint = ''
let lastPrintCntDOM = null

function print (str) {
  if (str === lastPrint && lastPrintCntDOM !== null) {
    lastPrintCntDOM.innerHTML = '...x' + (parseInt([...lastPrintCntDOM.innerHTML.matchAll(/\d+/g)][0]?.[0] || '1') + 1)
    return
  }
  const p = document.createElement('pre')
  p.innerHTML = str
  lastPrint = str
  const cnt = document.createElement('span')
  cnt.style.marginLeft = '40px'
  lastPrintCntDOM = cnt
  document.querySelector('#output').appendChild(p)
  p.appendChild(cnt)
  window.scrollTo(0, document.body.scrollHeight)
}

const API_URL = getUrlParam('api') ?? 'http://localhost:1357'
const OPENID = getUrlParam('openid')

if (!OPENID) {
  print('错误：未获得 openid')
}

const handlingSign = {}

async function listenForActiveSigns () {
  setTimeout(() => {
    listenForActiveSigns()
  }, 3000)
  try {
    const res = await fetch(`${API_URL}/api/active_signs?openId=${OPENID}`)
    const json = await res.json()
    if (json.message !== undefined) {
      throw new Error(json.message)
    }
    if (!Array.isArray(json)) {
      throw new Error('返回未知数据格式')
    }
    const isHandlingCnt = Object.values(handlingSign).filter(v => v).length
    print(`当前有 ${json.length} 个签到 ${isHandlingCnt > 0 ? `，正在处理 ${isHandlingCnt} 个` : ''}`)
    json.forEach(item => handleOneSign(item))
  } catch (err) {
    print(err.message)
  }
}

async function handleOneSign (signItem) {
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
    let _seqId = 0
    function seqId() {
      return `${_seqId++}`
    }
    const sendMessage = (msg) => {
      const raw = JSON.stringify(msg ? [msg] : [])
      client.send(raw)
    }
    const handshake = () => {
      sendMessage({
        channel: '/meta/handshake',
        version: '1.0',
        supportedConnectionTypes: [
          'websocket',
          'eventsource',
          'long-polling',
          'cross-origin-long-polling',
          'callback-polling'
        ],
        id: seqId()
      })
    }
    client.onopen = () => {
      print('\t\t监听二维码 ws 连接成功，等待二维码链接')
      handshake()
    }
    client.onclose = () => {
      handlingSign[key] = false
      return print('\t\t监听二维码 ws 连接关闭')
    }
    client.onerror = (err) => {
      handlingSign[key] = false
      return print('\t\t监听二维码 ws 连接错误')
    }
    let cid = ''
    client.onmessage = (event) => {
      console.log(`receiveMessage`, event.data);
      const message = JSON.parse(event.data)[0];
      if (!message) return;
      if (message.channel === '/meta/handshake') {
        const { clientId } = message;
        cid = clientId;
        sendMessage({
          channel: '/meta/connect',
          clientId,
          connectionType: 'websocket',
          id: seqId()
        })
        sendMessage({
          channel: '/meta/subscribe',
          clientId: message.clientId,
          subscription: `/attendance/${signItem.courseId}/${signItem.signId}/qr`,
          id: seqId()
        })
      } else if (message.channel === '/meta/connect') {
        const { advice: { timeout } } = message;
        if (!timeout) { return }
        sendMessage()
        setInterval(() => {
          sendMessage()
          sendMessage({
              channel: '/meta/connect',
              clientId: cid,
              connectionType: 'websocket',
              id: seqId()
          })
        }, timeout / 2)
      } else if (message.channel.startsWith('/attendance/')) {
        const { data: { qrUrl } } = message
        print(`\t\t收到[${signItem.name}]二维码 ${signItem.courseId}/${signItem.signId}\n\t\t<a href="${qrUrl}" target="_blank">${qrUrl}</a>`)
      }
    }
  }
}

;(async () => {
  listenForActiveSigns().catch(() => {})
})()
