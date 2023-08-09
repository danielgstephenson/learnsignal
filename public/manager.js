import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()

const connectingDiv = document.getElementById('connectingDiv')
const interfaceDiv = document.getElementById('interfaceDiv')
const subjectsTable = document.getElementById('subjectsTable')
const stateDiv = document.getElementById('stateDiv')
const treatmentLVLCRadio = document.getElementById('treatmentLVLCRadio')
const treatmentLVHCRadio = document.getElementById('treatmentLVHCRadio')
const treatmentHVLCRadio = document.getElementById('treatmentHVLCRadio')
const treatmentHVHCRadio = document.getElementById('treatmentHVHCRadio')

const updateInterval = 0.1

let message = {}
let subjects = []
let state = ''
let practiceComplete = false

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
  practiceComplete = msg.practiceComplete
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
  tableString += '<td>group</td>'
  tableString += '<td>role</td>'
  tableString += '<td>type</td>'
  tableString += '<td>action</td>'
  tableString += '</tr>'
  subjects.forEach(subject => {
    tableString += '<tr>'
    tableString += `<td>${subject.id}</td>`
    tableString += `<td>${subject.group}</td>`
    tableString += `<td>${subject.role.substr(0, 1)}</td>`
    tableString += `<td>${subject.type}</td>`
    tableString += `<td>${subject.action.toFixed(2)}</td>`
    tableString += '</tr>'
  })
  subjectsTable.innerHTML = tableString
}

function updateServer () {
  let treatment = 'none'
  if (treatmentLVLCRadio.checked) treatment = 'LVLC'
  if (treatmentLVHCRadio.checked) treatment = 'LVHC'
  if (treatmentHVLCRadio.checked) treatment = 'HVLC'
  if (treatmentHVHCRadio.checked) treatment = 'HVHC'
  const msg = { treatment }
  socket.emit('managerUpdateServer', msg)
}

document.showInstructions = function () {
  socket.emit('showInstructions')
}
document.hideInstructions = function () {
  socket.emit('hideInstructions')
}
document.setupGroups = function () {
  if (subjects.length % 4 !== 0) {
    window.alert('The number of subjects must be divisible by 4.')
    return
  }
  const ungrouped = subjects.filter(subject => subject.group === 0)
  if (ungrouped.length > 0) {
    socket.emit('setupGroups')
  }
}
document.startPractice = function () {
  const ungrouped = subjects.filter(subject => subject.group === 0)
  if (ungrouped.length > 0) {
    window.alert('Setup groups before starting the practice.')
    return
  }
  socket.emit('startPractice')
}
document.startPExeperiment = function () {
  if (!practiceComplete) {
    window.alert('Complete the practice before starting the exeperiment.')
    return
  }
  socket.emit('startExperiment')
}
