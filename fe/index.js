function getUrlParam (paramName) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(paramName)
}

function print (str) {
  const p = document.createElement('pre')
  p.innerHTML = str
  document.querySelector('#output').appendChild(p)
}

const API_URL = getUrlParam('dev') === 'true' ? "http://localhost:3030" : "http://139.196.47.35"
const OPENID = getUrlParam('openid')

if (!OPENID) {
  print('错误：未获得 openid')
}

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
    print(`当前有 ${json.length} 个签到`)
    json.forEach(item => handleOneSign(item))
  } catch (err) {
    print(err.message)
  }
}

const handlingSign = {}

async function handleOneSign (signItem) {
  const key = signItem.courseId + signItem.signId
  if (handlingSign[key]) { return }
  handlingSign[key] = true
  if (signItem.isQR === 0) {
    print(`\t正在处理签到：${signItem.name} ${signItem.isGPS ? 'GPS签到' : '普通签到'} ${signItem.courseId}/${signItem.signId}`)
    const res = await fetch(`${API_URL}/api/sign_in?openId=${OPENID}&courseId=${signItem.courseId}&signId=${signItem.signId}`)
    const json = await res.json()
    if (json.errorCode !== undefined) {
      handlingSign[key] = false
      return print(`\t\t签到结果：${signItem.name} ${json.msgClient}`)
    }
    print(`\t\t签到成功，排名: ${json.studentRank}`)
    handlingSign[key] = false
  } else { // QRcode
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
    client.onopen = () => { handshake() }
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
          console.log(timeout);
          sendMessage();
          sendMessage({
              channel: '/meta/connect',
              clientId: cid,
              connectionType: 'websocket',
              id: seqId()
          })
        }, timeout / 2)
      } else if (message.channel.startsWith('/attendance/')) {
        const { data: { qrUrl } } = message
        print(`<a href="${qrUrl}" target="_blank">${qrUrl}</a>`)
      }
    }
  }
}

;(async () => {
  listenForActiveSigns().catch(() => {})
})()
