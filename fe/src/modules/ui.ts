export class UI {
  appDOM: HTMLDivElement
  lastPrint = ''
  lastPrintCntDOM: HTMLSpanElement | null = null

  indentLevel = 0

  constructor (appDOM: HTMLDivElement) {
    this.appDOM = appDOM
  }

  print (str: string) {
    if (str === this.lastPrint && this.lastPrintCntDOM !== null) {
      this.lastPrintCntDOM.innerHTML = '...x' + (parseInt([...this.lastPrintCntDOM.innerHTML.matchAll(/\d+/g)][0]?.[0] || '1') + 1)
      return
    }
    const [p, cnt] = [document.createElement('pre'), document.createElement('span')]
    p.innerHTML = str
    this.lastPrint = str
    cnt.style.marginLeft = '40px'
    this.lastPrintCntDOM = cnt
    this.appDOM?.appendChild(p).appendChild(cnt)
    window.scrollTo(0, document.body.scrollHeight)
  }

  printImage (src: string) {
    const img = document.createElement('img')
    img.src = src
    img.style.width = '200px'
    img.style.height = '200px'
    this.appDOM.appendChild(img)
  }

  indent () {
    this.indentLevel++
  }

  outdent () {
    this.indentLevel--
  }
}
