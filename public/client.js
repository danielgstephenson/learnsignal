/* global OffscreenCanvas */
import { setTreatment, getBuyerPayoff, getSellerPayoff } from './payoffs.js'
import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()

function range (n) { return [...Array(n).keys()] }

const joinDiv = document.getElementById('joinDiv')
const idInput = document.getElementById('idInput')
idInput.focus()
const waitDiv = document.getElementById('waitDiv')
const instructionsDiv = document.getElementById('instructionsDiv')
const interfaceDiv = document.getElementById('interfaceDiv')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const leftDiv = document.getElementById('leftDiv')
const rightDiv = document.getElementById('rightDiv')

context.imageSmoothingEnabled = false
const steps = 101
const offscreenCanvas = new OffscreenCanvas(steps, steps)
const offscreenContext = offscreenCanvas.getContext('2d')
offscreenContext.imageSmoothingEnabled = false

const updateInterval = 0.1
const mouse = { x: 0, y: 0, gx: 0, gy: 0 }
const graphSize = 80
const graphOrigin = { x: 13, y: 10 }
const maxBid = 20

let locations = []
let message = {}
let state = 'join'
let joined = false
let id = 0
let treatment = 1
let role = 'buyer'
let showInstructions = false
let certProb = [0.5, 0.5]
let price = [10, 10]
let otherBids = []
const strategy = [0.5, 0.5]
const oldStrategy = [0.5, 0.5]

document.onmousedown = function (event) {
  console.log(message)
  console.log('locations', locations)
}

document.join = function () {
  id = parseInt(idInput.value)
  if (id > 0 && idInput.validity.valid) {
    setInterval(update, updateInterval * 1000)
  } else {
    window.alert('The ID must be a whole number.')
  }
}

idInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') document.join()
})

socket.on('connected', msg => {
  console.log('connected')
  draw()
})
socket.on('serverUpdateClient', msg => {
  message = msg
  joined = true
  state = msg.state
  role = msg.role
  certProb = msg.certProb
  price = msg.price
  otherBids = msg.otherBids
  showInstructions = msg.showInstructions
  treatment = msg.treatment
  oldStrategy[0] = msg.oldStrategy[0]
  oldStrategy[1] = msg.oldStrategy[1]
})

function update () {
  updateServer()
  waitDiv.style.display = 'none'
  joinDiv.style.display = 'none'
  instructionsDiv.style.display = 'none'
  interfaceDiv.style.display = 'none'
  if (!joined) joinDiv.style.display = 'block'
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
  const maxStrategy = role === 'buyer' ? 20 : 1
  const step = 1 / (steps - 1)
  strategy[0] = Math.min(1, step * (Math.floor(mouse.gx * steps))) * maxStrategy
  strategy[1] = Math.min(1, step * (Math.floor(mouse.gy * steps))) * maxStrategy
}

function writeText () {
  let leftInnerHTML = '<br> Previous Period <br> <br>'
  if (role === 'buyer') {
    leftInnerHTML += 'Your Bid <br>'
    leftInnerHTML += `Uncertified: $${oldStrategy[0].toFixed(2)} <br>`
    leftInnerHTML += `Certified: $${oldStrategy[1].toFixed(2)}`
  }
  if (role === 'seller') {
    leftInnerHTML += 'Your Certification<br>'
    leftInnerHTML += `Type 1: ${(oldStrategy[0] * 100).toFixed()}% <br>`
    leftInnerHTML += `Type 2: ${(oldStrategy[1] * 100).toFixed()}%`
  }
  leftDiv.innerHTML = leftInnerHTML
  let rightInnerHTML = '<br> Next Period <br> <br>'
  if (role === 'buyer') {
    rightInnerHTML += 'Your Bid <br>'
    rightInnerHTML += `Uncertified: $${strategy[0].toFixed(2)} <br>`
    rightInnerHTML += `Certified: $${strategy[1].toFixed(2)} <br> <br>`
    const payoff = getBuyerPayoff(strategy, otherBids, certProb).toFixed(2)
    rightInnerHTML += `Your Payoff: $${payoff}<br>`
  }
  if (role === 'seller') {
    rightInnerHTML += 'Your Certification<br>'
    rightInnerHTML += `Type 1: ${(strategy[0] * 100).toFixed()}% <br>`
    rightInnerHTML += `Type 2: ${(strategy[1] * 100).toFixed()}% <br> <br>`
    const payoff = getSellerPayoff(strategy, price).toFixed(2)
    rightInnerHTML += `Your Payoff: $${payoff}<br>`
  }
  rightDiv.innerHTML = rightInnerHTML
}

function setupCanvas () {
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  const xScale = canvas.width
  const yScale = canvas.height
  context.setTransform(yScale / 100, 0, 0, xScale / 100, 0, 0)
  context.imageSmoothingEnabled = false
}

function drawOffscreen () {
  const imageData = offscreenContext.createImageData(steps, steps)
  setTreatment(treatment)
  const points = []
  const payoffs = range(steps * steps).map(i => {
    const x = (i % steps) / (steps - 1)
    const y = (steps - 1 - Math.floor(i / steps)) / (steps - 1)
    points.push([x, y])
    if (role === 'buyer') {
      const bid = [x * maxBid, y * maxBid]
      return getBuyerPayoff(bid, otherBids, certProb)
    } else {
      const certProb = [x, y]
      return getSellerPayoff(certProb, price)
    }
  })
  locations = points
  const maxPayoff = Math.max(...payoffs)
  const minPayoff = Math.min(...payoffs, maxPayoff - 0.1)
  range(steps * steps).forEach(i => {
    const p = role === 'buyer' ? 6 : 2
    const z = ((payoffs[i] - minPayoff) / (maxPayoff - minPayoff)) ** p
    const low = { r: 0, g: 0, b: 0 }
    const high = { r: 0, g: 255, b: 0 }
    imageData.data[i * 4 + 0] = z * high.r + (1 - z) * low.r // red
    imageData.data[i * 4 + 1] = z * high.g + (1 - z) * low.g // green
    imageData.data[i * 4 + 2] = z * high.b + (1 - z) * low.b // blue
    imageData.data[i * 4 + 3] = 255 // alpha
  })
  offscreenContext.putImageData(imageData, 0, 0)
}

function draw () {
  window.requestAnimationFrame(draw)
  setupCanvas()
  writeText()
  drawOffscreen()
  context.clearRect(0, 0, 100, 100)
  context.drawImage(offscreenCanvas, graphOrigin.x, graphOrigin.y, graphSize, graphSize)
  drawAxes()
  const x = Math.max(graphOrigin.x, Math.min(graphOrigin.x + graphSize, mouse.x))
  const y = Math.max(graphOrigin.y, Math.min(graphOrigin.y + graphSize, mouse.y))
  context.beginPath()
  context.fillStyle = 'rgba(0, 0, 255, 0.5)'
  context.arc(x, y, 1, 0, 2 * Math.PI)
  context.fill()
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
  context.lineWidth = 0.3
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
  const maxValue = role === 'buyer' ? 20 : 100
  context.font = '0.3vh sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'top'
  range(nticks + 1).forEach(i => {
    const label = (maxValue * i / nticks).toFixed(0)
    context.fillText(label, graphLeft + graphSize * i / nticks, graphBottom + ticklength + 1)
  })
  context.textAlign = 'right'
  context.textBaseline = 'middle'
  range(nticks + 1).forEach(i => {
    const label = (maxValue * i / nticks).toFixed(0)
    context.fillText(label, graphLeft - ticklength - 1, graphBottom - graphSize * i / nticks)
  })
  context.fill()
}
