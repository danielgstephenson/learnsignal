import { setTreatment, getBuyerPayoff, getProducerPayoff } from './payoffs.js'
import { io } from './socketIo/socket.io.esm.min.js'
import getInstructions from './instructions.js'
const socket = io()

function range (n) { return [...Array(n).keys()] }

const waitDiv = document.getElementById('waitDiv')
const instructionsDiv = document.getElementById('instructionsDiv')
const gameDiv = document.getElementById('gameDiv')
const feedbackDiv = document.getElementById('feedbackDiv')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const aboveDiv = document.getElementById('aboveDiv')
const belowLeftDiv = document.getElementById('belowLeftDiv')
const belowRightDiv = document.getElementById('belowRightDiv')

const updateInterval = 0.1
const mouse = { x: 0, y: 0, gx: 0, gy: 0 }
const graphSize = 80
const graphOrigin = { x: 13, y: 6 }
const maxBid = 1
const capacity = 10

let message = {}
let state = 'join'
let practice = true
let period = 1
let timer = 0
let joined = false
let id = 0
let treatment = 1
let role = 'buyer'
let type = 0
let showInstructions = false
let action = parseFloat(Math.random().toFixed(2))
let oldAction = 0
let oldPayoff = 0
let oldBids = { 1: 0, 2: 0 }
let oldQuantities = { 1: 0, 2: 0 }
let roundPayoff = 0
let maxAction = 1
let maxPay = 20
let minPay = 0

document.onmousedown = function (event) {
  console.log(message)
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
  practice = msg.practice
  timer = msg.timer
  role = msg.role
  type = msg.type
  showInstructions = msg.showInstructions
  period = msg.period
  timer = msg.timer
  treatment = msg.treatment
  oldAction = msg.oldAction
  oldPayoff = msg.oldPayoff
  oldBids = msg.oldBids
  oldQuantities = msg.oldQuantities
  roundPayoff = msg.roundPayoff
  setTreatment(treatment)
  maxAction = role === 'buyer' ? maxBid : capacity
  instructionsDiv.innerHTML = getInstructions()
})

function update () {
  updateServer()
  waitDiv.style.display = 'none'
  instructionsDiv.style.display = 'none'
  gameDiv.style.display = 'none'
  feedbackDiv.style.display = 'none'
  if (joined && state === 'instructions') {
    if (showInstructions) instructionsDiv.style.display = 'block'
    else waitDiv.style.display = 'block'
  }
  if (joined && state === 'game') {
    gameDiv.style.display = 'flex'
  }
  if (joined && state === 'feedback') {
    feedbackDiv.style.display = 'block'
  }
}

function updateServer () {
  const msg = { id, action }
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
  action = parseFloat(mouse.gx.toFixed(2)) * maxAction
}

function writeGameText () {
  let belowLeftInnerHTML = ''
  let belowRightInnerHTML = ''
  let aboveInnerHTML = ''
  if (role === 'producer') {
    aboveInnerHTML += `You are Producer ${type}.`
  }
  if (role === 'buyer') {
    aboveInnerHTML += 'You are a Buyer.'
  }
  if (period > 1) {
    if (role === 'buyer') {
      belowLeftInnerHTML += `Your Bid: $${oldAction.toFixed(2)}<br>`
      belowRightInnerHTML += `Your Payoff: $${oldPayoff.toFixed(2)}<br>`
    }
    if (role === 'producer') {
      belowLeftInnerHTML += `Your Quantity: ${oldAction.toFixed(1)}<br>`
      belowRightInnerHTML += `Your Payoff: $${oldPayoff.toFixed(2)}<br>`
    }
  } else {
    belowLeftInnerHTML = 'This is the first period.'
    const s = Math.ceil(timer) > 1 ? 's' : ''
    belowRightInnerHTML += `Next period in ${Math.ceil(timer).toFixed(0)} second${s}. <br>`
  }
  belowLeftDiv.innerHTML = belowLeftInnerHTML
  belowRightDiv.innerHTML = belowRightInnerHTML
  aboveDiv.innerHTML = aboveInnerHTML
}

function writeFeedbackText () {
  let feedbackInnerHTML = ''
  if (practice) {
    feedbackInnerHTML += 'This was a practice round. <br><br>'
    feedbackInnerHTML += 'It will not effect your final earnings. <br> <br>'
  }
  feedbackInnerHTML += `Your average payoff in this round was $${roundPayoff.toFixed(2)} <br> <br>`
  const s = Math.ceil(timer) > 1 ? 's' : ''
  if (practice) {
    feedbackInnerHTML += `The instructions will return in ${Math.ceil(timer).toFixed(0)} second${s}. <br>`
  } else {
    feedbackInnerHTML += `The next period will begin in ${Math.ceil(timer).toFixed(0)} second${s}. <br>`
  }
  feedbackDiv.innerHTML = feedbackInnerHTML
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
  writeFeedbackText()
  writeGameText()
  setupCanvas()
  context.clearRect(0, 0, 100, 100)
  drawIndicator()
  if (period > 0) {
    drawPayoffLines()
  }
  drawAxes()
}

function drawAxes () {
  context.fillStyle = 'black'
  context.strokeStyle = 'black'
  context.lineWidth = 0.5
  context.lineCap = 'round'
  context.beginPath()
  context.rect(graphOrigin.x, graphOrigin.y, graphSize, graphSize)
  const nticks = 10
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
  context.font = '0.25vh sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'top'
  range(nticks + 1).forEach(i => {
    const label = role === 'producer'
      ? (maxAction * i / nticks).toFixed(0)
      : '$' + (maxAction * i / nticks).toFixed(2)
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
  if (period > 1) {
    if (role === 'producer') drawProducerPayoffLines()
    if (role === 'buyer') drawBuyerPayoffLines()
  }
}

function drawIndicator () {
  context.lineWidth = 2
  context.lineCap = 'flat'
  context.strokeStyle = 'rgb(210,210,210)'
  const graphLeft = graphOrigin.x
  const graphBottom = graphOrigin.y + graphSize
  context.beginPath()
  const x = graphLeft + graphSize * action / maxAction
  context.moveTo(x, graphBottom)
  context.lineTo(x, graphBottom - graphSize)
  context.stroke()
}

function drawProducerPayoffLines () {
  const oldPrice = Math.max(oldBids[1], oldBids[2])
  const leftPay = 15
  const rightPay = getProducerPayoff(maxAction, type, oldPrice)
  maxPay = Math.max(leftPay, rightPay) + 1
  minPay = Math.min(leftPay, rightPay) - 1
  context.lineWidth = 1
  context.lineJoin = 'round'
  context.lineCap = 'round'
  const graphLeft = graphOrigin.x
  const graphRight = graphLeft + graphSize
  const graphBottom = graphOrigin.y + graphSize
  context.strokeStyle = 'rgb(0,200,0)'
  context.beginPath()
  context.moveTo(graphLeft, graphBottom - graphSize * (leftPay - minPay) / (maxPay - minPay))
  context.lineTo(graphRight, graphBottom - graphSize * (rightPay - minPay) / (maxPay - minPay))
  context.stroke()
  context.strokeStyle = 'rgb(0,100,255)'
  context.beginPath()
  const x = graphLeft + graphSize * oldAction / maxAction
  const y = graphBottom - graphSize * (oldPayoff - minPay) / (maxPay - minPay)
  context.moveTo(x, graphBottom)
  context.lineTo(x, y)
  context.stroke()
}

function drawBuyerPayoffLines () {
  const otherType = type === 1 ? 2 : 1
  const otherBid = oldBids[otherType]
  const underBid = Math.max(0, otherBid - 0.01)
  const outBid = Math.min(maxBid, otherBid + 0.01)
  const leftPay = getBuyerPayoff(0, otherBid, oldQuantities[1], oldQuantities[2])
  const tiePay = getBuyerPayoff(otherBid, otherBid, oldQuantities[1], oldQuantities[2])
  const outPay = getBuyerPayoff(outBid, otherBid, oldQuantities[1], oldQuantities[2])
  const rightPay = getBuyerPayoff(maxBid, otherBid, oldQuantities[1], oldQuantities[2])
  maxPay = Math.ceil(Math.max(leftPay, tiePay, outPay, rightPay) + 1)
  minPay = Math.floor(Math.min(leftPay, tiePay, outPay, rightPay) - 1)
  context.lineWidth = 1
  context.lineJoin = 'round'
  context.lineCap = 'round'
  const graphLeft = graphOrigin.x
  const graphRight = graphLeft + graphSize
  const graphBottom = graphOrigin.y + graphSize
  context.strokeStyle = 'rgb(0,200,0)'
  context.beginPath()
  context.moveTo(graphLeft, graphBottom - graphSize * (leftPay - minPay) / (maxPay - minPay))
  context.lineTo(graphLeft + graphSize * underBid / maxBid, graphBottom - graphSize * (leftPay - minPay) / (maxPay - minPay))
  context.lineTo(graphLeft + graphSize * otherBid / maxBid, graphBottom - graphSize * (tiePay - minPay) / (maxPay - minPay))
  context.lineTo(graphLeft + graphSize * outBid / maxBid, graphBottom - graphSize * (outPay - minPay) / (maxPay - minPay))
  context.lineTo(graphRight, graphBottom - graphSize * (rightPay - minPay) / (maxPay - minPay))
  context.stroke()
  context.strokeStyle = 'rgb(0,100,255)'
  context.beginPath()
  const x = graphLeft + graphSize * oldAction / maxAction
  const y = graphBottom - graphSize * (oldPayoff - minPay) / (maxPay - minPay)
  context.moveTo(x, graphBottom)
  context.lineTo(x, y)
  context.stroke()
}
