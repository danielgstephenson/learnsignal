import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()

const joinDiv = document.getElementById('joinDiv')
const instructionsDiv = document.getElementById('instructionsDiv')
const idInput = document.getElementById('idInput')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')

let id = 0

document.join = function () {
  id = parseInt(idInput.value)
  if (id > 0 && idInput.validity.valid) {
    const msg = { id }
    socket.emit('join', msg)
  } else {
    window.alert('The ID must be a whole number.')
  }
}

idInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') document.join()
})

socket.on('connected', msg => {
  console.log('connected')
})
socket.on('joined', msg => {
  console.log('joined', msg.id)
  joinDiv.style.display = 'none'
  instructionsDiv.style.display = 'block'
})
