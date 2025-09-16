export const getUrlParam = (paramName: string) => (new URLSearchParams(window.location.search)).get(paramName)

export const performPolling = (fn: () => void, interval: number) => {
  let isRunning = true
  ;(function task () {
    if (!isRunning) return
    setTimeout(task.bind(this), interval)
    fn()
  })()
  return () => {
    isRunning = false
  }
}

export const buildSeqId = ({ from = 0 }) => (() => {
  let _seqId = from
  return () => `${_seqId++}`
})()
