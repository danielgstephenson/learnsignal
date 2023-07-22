import { setTreatment, getReceiverPayoff, getSenderPayoff } from './payoffs.js'
import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()

function range (n) { return [...Array(n).keys()] }

const waitDiv = document.getElementById('waitDiv')
const instructionsDiv = document.getElementById('instructionsDiv')
const interfaceDiv = document.getElementById('interfaceDiv')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const aboveDiv = document.getElementById('aboveDiv')
const belowLeftDiv = document.getElementById('belowLeftDiv')
const belowRightDiv = document.getElementById('belowRightDiv')

const updateInterval = 0.1
const mouse = { x: 0, y: 0, gx: 0, gy: 0 }
const graphSize = 80
const graphOrigin = { x: 13, y: 6 }
const maxEstimate = 20

let message = {}
let state = 'join'
let joined = false
let id = 0
let treatment = 1
let role = 'buyer'
let type = 0
let showInstructions = false
let meanCertRates = { 1: 0.5, 2: 0.5 }
let meanEstimates = { 1: 10, 2: 10 }
let strategy = Math.random()
let payoff = 0
let oldStrategy = 0
let maxPay = 20
let minPay = 0

document.onmousedown = function (event) {
  console.log(message)
  console.log('minpay', minPay)
  console.log('minpay', maxPay)
}

function join () {
  id = parseInt(window.location.pathname.substring(7))
  if (id > 0) {
    setInterval(update, updateInterval * 1000)
  } else {
    window.alert('The ID must be a whole number.')
  }
}

socket.on('connected', msg => {
  console.log('connected')
  join()
  draw()
})
socket.on('serverUpdateClient', msg => {
  message = msg
  joined = true
  state = msg.state
  role = msg.role
  type = msg.type
  meanCertRates = msg.meanCertRates
  meanEstimates = msg.meanEstimates
  showInstructions = msg.showInstructions
  treatment = msg.treatment
  oldStrategy = msg.oldStrategy
  setTreatment(treatment)
})

function update () {
  updateServer()
  waitDiv.style.display = 'none'
  instructionsDiv.style.display = 'none'
  interfaceDiv.style.display = 'none'
  if (joined && state === 'instructions') {
    if (showInstructions) instructionsDiv.style.display = 'block'
    else waitDiv.style.display = 'block'
  }
  if (joined && state === 'practice') {
    interfaceDiv.style.display = 'flex'
  }
}

function updateServer () {
  const msg = { id, strategy }
  socket.emit('clientUpdateServer', msg)
}

document.onmousemove = function (event) {
  const rect = canvas.getBoundingClientRect()
  const relativeX = event.clientX - rect.left
  const relativeY = event.clientY - rect.top
  mouse.x = 100 * Math.max(0, Math.min(1, relativeX / rect.width))
  mouse.y = 100 * Math.max(0, Math.min(1, relativeY / rect.height))
  mouse.gx = Math.max(0, Math.min(1, (mouse.x - graphOrigin.x) / graphSize))
  mouse.gy = 1 - Math.max(0, Math.min(1, (mouse.y - graphOrigin.y) / graphSize))
  const maxStrategy = role === 'receiver' ? maxEstimate : 1
  strategy = parseFloat(mouse.gx.toFixed(2)) * maxStrategy
}

function writeText () {
  let belowLeftInnerHTML = ''
  let belowRightInnerHTML = ''
  let aboveInnerHTML = ''
  aboveInnerHTML += `You are a type ${type} ${role}`
  belowLeftInnerHTML += 'Previous Round<br><span></span>'
  belowRightInnerHTML += 'Next Round <br><span></span>'
  if (role === 'receiver') {
    belowLeftInnerHTML += `Your Estimate: $${oldStrategy.toFixed(2)}<br>`
    belowLeftInnerHTML += `Your Payoff: $${(10).toFixed(2)}<br>`
    belowRightInnerHTML += `Your Estimate: $${strategy.toFixed(2)}<br>`
    belowRightInnerHTML += `Your Payoff: $${payoff.toFixed(2)}<br>`
  }
  if (role === 'sender') {
    belowLeftInnerHTML += `Your Certification Rate: ${(oldStrategy * 100).toFixed()}% <br>`
    belowLeftInnerHTML += `Your Payoff: $${(10).toFixed(2)}<br>`
    belowRightInnerHTML += `Your Certification Rate: ${(strategy * 100).toFixed()}%<br>`
    belowRightInnerHTML += `Your Payoff: $${payoff.toFixed(2)}<br>`
  }
  belowLeftDiv.innerHTML = belowLeftInnerHTML
  belowRightDiv.innerHTML = belowRightInnerHTML
  aboveDiv.innerHTML = aboveInnerHTML
}

function setupCanvas () {
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  const xScale = canvas.width
  const yScale = canvas.height
  context.setTransform(yScale / 100, 0, 0, xScale / 100, 0, 0)
  context.imageSmoothingEnabled = true
}

function draw () {
  window.requestAnimationFrame(draw)
  setupCanvas()
  writeText()
  context.clearRect(0, 0, 100, 100)
  drawPayoffLines()
  drawAxes()
  /*
  context.beginPath()
  context.lineWidth = 0.3
  context.strokeStyle = 'rgba(0, 100, 255, 1)'
  context.moveTo(graphOrigin.x, y)
  context.lineTo(x, y)
  context.moveTo(x, graphOrigin.y + graphSize)
  context.lineTo(x, y)
  context.stroke()
  */
}

function drawAxes () {
  context.fillStyle = 'black'
  context.strokeStyle = 'black'
  context.lineWidth = 0.5
  context.lineCap = 'round'
  context.beginPath()
  context.rect(graphOrigin.x, graphOrigin.y, graphSize, graphSize)
  const nticks = 4
  const ticklength = 2
  const graphLeft = graphOrigin.x
  const graphBottom = graphOrigin.y + graphSize
  range(nticks + 1).forEach(i => {
    context.moveTo(graphLeft + graphSize * i / nticks, graphBottom)
    context.lineTo(graphLeft + graphSize * i / nticks, graphBottom + ticklength)
  })
  range(nticks + 1).forEach(i => {
    context.moveTo(graphLeft, graphBottom - graphSize * i / nticks)
    context.lineTo(graphLeft - ticklength, graphBottom - graphSize * i / nticks)
  })
  context.stroke()
  context.beginPath()
  const xMax = role === 'receiver' ? maxEstimate : 100
  context.font = '0.3vh sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'top'
  range(nticks + 1).forEach(i => {
    const label = (xMax * i / nticks).toFixed(0)
    context.fillText(label, graphLeft + graphSize * i / nticks, graphBottom + ticklength + 1)
  })
  context.textAlign = 'right'
  context.textBaseline = 'middle'
  range(nticks + 1).forEach(i => {
    const label = `$${(minPay + (maxPay - minPay) * i / nticks).toFixed(2)}`
    context.fillText(label, graphLeft - ticklength - 1, graphBottom - graphSize * i / nticks)
  })
  context.fill()
}

function drawPayoffLines () {
  if (role === 'sender') drawSenderPayoffLines()
  if (role === 'receiver') drawReceiverPayoffLines()
}

function drawSenderPayoffLines () {
  const steps = 100
  const certRateVec = range(steps + 1).map(i => i / steps)
  const payVec = certRateVec.map(certRate => getSenderPayoff(certRate, type, meanEstimates))
  maxPay = Math.ceil(Math.max(...payVec) + 0.5)
  minPay = Math.floor(Math.max(0, Math.min(...payVec) - 0.5))
  payoff = getSenderPayoff(strategy, type, meanEstimates)
  context.lineWidth = 1
  context.lineCap = 'round'
  context.strokeStyle = 'rgb(0,100,255)'
  const graphLeft = graphOrigin.x
  const graphBottom = graphOrigin.y + graphSize
  context.beginPath()
  const x = graphLeft + graphSize * strategy
  const y = graphBottom - graphSize * (payoff - minPay) / (maxPay - minPay)
  context.moveTo(x, graphBottom)
  context.lineTo(x, y)
  context.stroke()
  context.strokeStyle = 'rgb(0,200,0)'
  context.beginPath()
  context.moveTo(graphLeft, graphBottom - graphSize * (payVec[0] - minPay) / (maxPay - minPay))
  range(steps).map(i => i + 1).forEach(i => {
    const x = graphLeft + graphSize * certRateVec[i]
    const y = graphBottom - graphSize * (payVec[i] - minPay) / (maxPay - minPay)
    context.lineTo(x, y)
  })
  context.stroke()
}

function drawReceiverPayoffLines () {
  const steps = 100
  const estimateVec = range(steps + 1).map(i => i * maxEstimate / steps)
  const payVec = estimateVec.map(estimate => getReceiverPayoff(estimate, type, meanCertRates))
  maxPay = Math.ceil(Math.max(...payVec) + 0.01)
  minPay = Math.floor(Math.max(0, Math.min(...payVec) - 0.01))
  payoff = getReceiverPayoff(strategy, type, meanCertRates)
  context.lineWidth = 1
  context.lineCap = 'round'
  context.strokeStyle = 'rgb(0,100,255)'
  const graphLeft = graphOrigin.x
  const graphBottom = graphOrigin.y + graphSize
  context.beginPath()
  const x = graphLeft + graphSize * strategy / maxEstimate
  const y = graphBottom - graphSize * (payoff - minPay) / (maxPay - minPay)
  context.moveTo(x, graphBottom)
  context.lineTo(x, y)
  context.stroke()
  context.strokeStyle = 'rgb(0,200,0)'
  context.beginPath()
  context.moveTo(graphLeft, graphBottom - graphSize * (payVec[0] - minPay) / (maxPay - minPay))
  range(steps).map(i => i + 1).forEach(i => {
    const x = graphLeft + graphSize * estimateVec[i] / maxEstimate
    const y = graphBottom - graphSize * (payVec[i] - minPay) / (maxPay - minPay)
    context.lineTo(x, y)
  })
  context.stroke()
}
