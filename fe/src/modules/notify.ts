interface NotifyItem {
  title: string
  body: string
}

export class Notify {
  permission: NotificationPermission | null = null
  queue: Array<{ title: string, body: string }> = []
  constructor () {
    this.requestPermission()
  }

  async requestPermission () {
    const permission = await Notification.requestPermission()
    this.permission = permission
    this.notifyOnce({ title: 'permission', body: '权限已获取' })
    this.notifyQueue()
  }

  notifyQueue () {
    this.queue.forEach(item => {
      this.notifyOnce(item)
    })
  }

  notifyOnce (item: NotifyItem) {
    const notification = new Notification(item.title, {
      body: item.body,
      icon: 'https://www.teachermate.com.cn/favicon.ico',
    })
    return notification
  }

  doNotify (item: NotifyItem) {
    return
    if (this.permission !== 'granted') {
      this.queue.push(item)
      return
    }
    this.notifyOnce(item)
  }
}
