const getUrlParam = (name) => new URLSearchParams(window.location.search).get(name)

const statusEl = document.querySelector('#status')
const feedEl = document.querySelector('#feed')

let lastText = ''
let lastRow = null

const formatTime = (d = new Date()) =>
  d.toLocaleTimeString('zh-CN', { hour12: false })

const setStatus = (text) => {
  statusEl.textContent = text
}

const print = (text, meta = '') => {
  if (text === lastText && lastRow) {
    const badge = lastRow.querySelector('.repeat') || Object.assign(document.createElement('span'), { className: 'meta repeat' })
    const n = parseInt(badge.dataset.n || '1', 10) + 1
    badge.dataset.n = String(n)
    badge.textContent = `×${n} · ${formatTime()}`
    if (!badge.parentNode) lastRow.appendChild(badge)
    return lastRow
  }
  const row = document.createElement('article')
  row.className = 'row'
  row.appendChild(Object.assign(document.createElement('div'), { textContent: text }))
  if (meta) {
    row.appendChild(Object.assign(document.createElement('span'), { className: 'meta', textContent: meta }))
  }
  feedEl.appendChild(row)
  lastText = text
  lastRow = row
  row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  return row
}

const makeQrPanel = (signItem) => {
  const row = document.createElement('article')
  row.className = 'row'
  const title = Object.assign(document.createElement('div'), { textContent: `二维码 · ${signItem.name}` })
  const meta = Object.assign(document.createElement('span'), {
    className: 'meta',
    textContent: `${signItem.courseId}/${signItem.signId} · 等待推送`,
  })
  const qrWrap = Object.assign(document.createElement('div'), { className: 'qr' })
  row.append(title, meta, qrWrap)
  feedEl.appendChild(row)
  lastText = title.textContent
  lastRow = row

  let refreshCount = 0
  let lastUrl = ''
  let actions = null

  const ensureActions = () => {
    if (actions) return actions
    actions = Object.assign(document.createElement('div'), { className: 'meta actions' })
    const openLink = Object.assign(document.createElement('a'), { textContent: '打开链接' })
    openLink.addEventListener('click', (e) => {
      e.preventDefault()
      if (lastUrl) location.href = lastUrl
    })
    const copyLink = Object.assign(document.createElement('a'), { href: '#', textContent: '复制链接' })
    copyLink.addEventListener('click', (e) => {
      e.preventDefault()
      if (!lastUrl) return
      navigator.clipboard.writeText(lastUrl).then(
        () => { copyLink.textContent = '已复制'; setTimeout(() => { copyLink.textContent = '复制链接' }, 1200) },
        () => { copyLink.textContent = '复制失败'; setTimeout(() => { copyLink.textContent = '复制链接' }, 1200) },
      )
    })
    actions.append(openLink, copyLink)
    meta.after(actions)
    return actions
  }

  return {
    row,
    update(qrUrl, { autoJump = false } = {}) {
      if (qrUrl === lastUrl) return false
      lastUrl = qrUrl
      refreshCount += 1
      qrWrap.replaceChildren()
      new QRCode(qrWrap, qrUrl)
      if (autoJump) {
        meta.textContent = `${signItem.courseId}/${signItem.signId} · 正在跳转`
        actions?.remove()
        actions = null
      } else {
        meta.textContent = `${signItem.courseId}/${signItem.signId} · 第 ${refreshCount} 次`
        ensureActions()
      }
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      return true
    },
  }
}

const API_URL = getUrlParam('api')
const OPENID = getUrlParam('openid')
const autoQrEl = document.querySelector('#autoqr')
const showStuEl = document.querySelector('#showsignstu')
autoQrEl.checked = getUrlParam('autoqr') !== 'false'
showStuEl.checked = getUrlParam('showsignstu') === 'true'

let mainStatus = '准备中…'
let locHint = ''

const refreshStatus = (main) => {
  if (main !== undefined) mainStatus = main
  const parts = [mainStatus]
  if (locHint) parts.push(locHint)
  parts.push(formatTime())
  setStatus(parts.join(' · '))
}

if (!OPENID) {
  refreshStatus('缺少 openid')
  print('无法开始', 'URL 需要带上 openid 参数')
} else {
  refreshStatus()
}

navigator.geolocation.getCurrentPosition(
  (pos) => {
    locHint = `${pos.coords.longitude.toFixed(5)}, ${pos.coords.latitude.toFixed(5)}`
    refreshStatus()
  },
  () => {},
)

const lon = 114.40119710
const lat = 30.51119956

const handlingSign = {}

const listenForActiveSigns = async () => {
  setTimeout(listenForActiveSigns, 3000)
  if (!OPENID) return
  try {
    const json = await fetch(`${API_URL}/api/active_signs?openId=${OPENID}`).then((r) => r.json())
    if (json.message !== undefined) throw new Error(json.message)
    if (!Array.isArray(json)) throw new Error('返回未知数据格式')
    const handling = Object.values(handlingSign).filter(Boolean).length
    const base = json.length === 0 ? '暂无签到' : `${json.length} 个进行中`
    refreshStatus(handling > 0 ? `${base} · 处理 ${handling} 个` : base)
    json.forEach((item) => handleOneSign(item))
  } catch (err) {
    refreshStatus(err.message)
  }
}

const handleOneSign = async (signItem) => {
  const key = signItem.courseId + signItem.signId
  if (handlingSign[key]) return
  handlingSign[key] = true

  if (signItem.isQR === 0) {
    const kind = signItem.isGPS ? 'GPS' : '普通'
    print(`签到 · ${signItem.name}`, `${kind} · ${signItem.courseId}/${signItem.signId}`)
    const res = await fetch(`${API_URL}/api/sign_in?openId=${OPENID}&courseId=${signItem.courseId}&signId=${signItem.signId}&lon=${lon}&lat=${lat}`)
    const json = await res.json()
    if (json.errorCode !== undefined) {
      handlingSign[key] = false
      return print(`${signItem.name} 未成功`, json.msgClient)
    }
    print(`${signItem.name} 已签到`, `排名 ${json.studentRank}`)
    handlingSign[key] = false
    return
  }

  const qrPanel = makeQrPanel(signItem)
  const client = new WebSocket('wss://www.teachermate.com.cn/faye')
  const seqId = (() => {
    let id = 0
    return () => `${id++}`
  })()
  const sendMessage = (msg) => client.send(JSON.stringify(msg ? [msg] : []))

  client.onopen = () => {
    sendMessage({
      channel: '/meta/handshake',
      version: '1.0',
      supportedConnectionTypes: ['websocket', 'eventsource', 'long-polling', 'cross-origin-long-polling', 'callback-polling'],
      id: seqId(),
    })
  }
  client.onclose = () => {
    handlingSign[key] = false
    print('二维码通道关闭', signItem.name)
  }
  client.onerror = () => {
    handlingSign[key] = false
    print('二维码通道错误', signItem.name)
  }

  let cid = ''
  client.onmessage = (event) => {
    console.log('receiveMessage', event.data)
    const message = JSON.parse(event.data)[0]
    if (!message) return
    if (message.channel === '/meta/handshake') {
      const { clientId } = message
      cid = clientId
      sendMessage({ channel: '/meta/connect', clientId, connectionType: 'websocket', id: seqId() })
      sendMessage({
        channel: '/meta/subscribe',
        clientId,
        subscription: `/attendance/${signItem.courseId}/${signItem.signId}/qr`,
        id: seqId(),
      })
    } else if (message.channel === '/meta/connect') {
      const { advice: { timeout } } = message
      if (!timeout) return
      sendMessage()
      setTimeout(() => {
        sendMessage()
        sendMessage({ channel: '/meta/connect', clientId: cid, connectionType: 'websocket', id: seqId() })
      }, timeout / 2)
    } else if (message.channel.startsWith('/attendance/')) {
      if (message.data.type === 1) {
        const { data: { qrUrl } } = message
        if (qrPanel.update(qrUrl, { autoJump: autoQrEl.checked }) && autoQrEl.checked) {
          setTimeout(() => { location.href = qrUrl }, 2000)
        }
      } else if (message.data.type === 3 && showStuEl.checked) {
        const { data: { student: { studentNumber, name, rank } } } = message
        print(`同学已签 · ${name}`, `No.${rank} · ${studentNumber}`)
      }
    }
  }
}

listenForActiveSigns().catch(() => {})
