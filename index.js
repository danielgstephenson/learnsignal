import server from './server.js'

const updateInterval = 0.1

const io = server.start(() => {
  console.log('Server started')
  setInterval(update, updateInterval * 1000)
})

io.on('connection', socket => {
  console.log('connection:', socket.id)
  socket.emit('connected', {})
  socket.on('join', function (msg) {
    const id = msg.id
    const reply = { id }
    socket.emit('joined', reply)
  })
})

function update () {
  //
}
