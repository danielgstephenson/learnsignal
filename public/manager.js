import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()

const connectingDiv = document.getElementById('connectingDiv')
const interfaceDiv = document.getElementById('interfaceDiv')
const subjectsTable = document.getElementById('subjectsTable')
const stateDiv = document.getElementById('stateDiv')

const updateInterval = 0.1

let message = {}
let subjects = []
let state = ''

setInterval(update, updateInterval * 1000)

document.onmousedown = function (event) {
  console.log(message)
}

socket.on('connected', msg => {
  console.log('connected')
})
socket.on('serverUpdateManager', msg => {
  if (interfaceDiv.style.display !== 'flex') {
    connectingDiv.style.display = 'none'
    interfaceDiv.style.display = 'flex'
  }
  message = msg
  subjects = msg.subjects
  state = msg.state
})

function update () {
  updateServer()
  stateDiv.innerHTML = `state: ${state}`
  updateSubjectsTable()
}

function updateSubjectsTable () {
  let tableString = ''
  tableString += '<tr>'
  tableString += '<td>id</td>'
  tableString += '<td>role</td>'
  tableString += '<td>type</td>'
  tableString += '<td>strategy</td>'
  tableString += '<td>payoff</td>'
  tableString += '</tr>'
  subjects.forEach(subject => {
    tableString += '<tr>'
    tableString += `<td>${subject.id}</td>`
    tableString += `<td>${subject.role.substr(0, 1)}</td>`
    tableString += `<td>${subject.type}</td>`
    tableString += `<td>${subject.strategy.toFixed(2)}</td>`
    tableString += `<td>${subject.payoff.toFixed(2)}</td>`
    tableString += '</tr>'
  })
  subjectsTable.innerHTML = tableString
}

function updateServer () {
  const msg = {}
  socket.emit('managerUpdateServer', msg)
}

document.showInstructions = function () {
  socket.emit('showInstructions')
}
document.hideInstructions = function () {
  socket.emit('hideInstructions')
}
document.startPractice = function () {
  socket.emit('startPractice')
}
document.endPractice = function () {
  socket.emit('endPractice')
}
