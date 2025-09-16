import { buildSeqId, voidFunc } from './utils'

const $handshake = (seqId: string) => ({
  channel: '/meta/handshake',
  version: '1.0',
  supportedConnectionTypes: ['websocket', 'eventsource', 'long-polling', 'cross-origin-long-polling', 'callback-polling'],
  id: seqId,
})

const $connect = (clientId: string, seqId: string) => ({
  channel: '/meta/connect',
  clientId,
  connectionType: 'websocket',
  id: seqId,
})

const $subscribe = (clientId: string, courseId: number, signId: number, seqId: string) => ({
  channel: '/meta/subscribe',
  clientId,
  subscription: `/attendance/${courseId}/${signId}/qr`,
  id: seqId,
})

const $ping = () => null

export class TeachermateQrcodeCenter {
  private client: WebSocket | null = null
  private signId: number
  private courseId: number
  private seqId = buildSeqId({ from: 1 })
  private clientId = ''

  private callbacks: {
    open?: () => void
    close?: () => void
    error?: () => void
    qrcode?: (qrUrl: string) => void
    someoneSign?: (student: any) => void
  } = {}

  constructor (courseId: number, signId: number) {
    this.courseId = courseId
    this.signId = signId
  }

  private sendMessage (msg: any) {
    this.client?.send(JSON.stringify(msg ? [msg] : []))
  }

  private onOpen () {
    this.callbacks.open?.()
    this.sendMessage($handshake(this.seqId()))
  }

  private onClose (event: any) {
    this.callbacks.close?.()
  }

  private onError (event: any) {
    this.callbacks.error?.()
  }

  private onMessageHandshake (message: any) {
    console.log(message)
    const { clientId } = message
    this.clientId = clientId
    this.sendMessage($connect(clientId, this.seqId()))
    this.sendMessage($subscribe(clientId, this.courseId, this.signId, this.seqId()))
  }

  private onMessageConnect (message: any) {
    const { advice: { timeout } } = message
    if (!timeout) { return }
    this.sendMessage($ping())
    setTimeout(() => {
      this.sendMessage($ping())
      this.sendMessage($connect(this.clientId, this.seqId()))
    }, timeout)
  }

  private onMessageAttendance (message: any) {
    const { qrUrl } = message.data
    this.callbacks.qrcode?.(qrUrl)
  }

  private onMessage (event: any) {
    const message = JSON.parse(event.data)[0]
    const map = [
      [() => !message, voidFunc],
      [() => message.channel === '/meta/handshake', this.onMessageHandshake.bind(this, message)],
      [() => message.channel === '/meta/connect', this.onMessageConnect.bind(this, message)],
      [() => message.channel === `/attendance/${this.courseId}/${this.signId}/qr`, this.onMessageAttendance.bind(this, message)],
      [() => message?.data?.type === 3, this.callbacks.someoneSign?.bind(this, message?.data?.student)],
    ] as const satisfies Array<[() => boolean, (() => void) | undefined]>
    map.forEach(([condition, action]) => {
      if (condition()) action?.()
    })
  }

  addEventListener<T extends keyof typeof this.callbacks> (event: T, callback: NonNullable<typeof this.callbacks[T]>) {
    this.callbacks[event] = callback
  }

  connect () {
    this.client = new WebSocket('wss://www.teachermate.com.cn/faye')
    this.client.onopen = this.onOpen.bind(this)
    this.client.onclose = this.onClose.bind(this)
    this.client.onerror = this.onError.bind(this)
    this.client.onmessage = this.onMessage.bind(this)
  }
}
