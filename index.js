import server from './server.js'

function range (n) { return [...Array(n).keys()] }
function sum (a) { return a.reduce((x, y) => x + y, 0) }
function mean (a) {
  if (a.length === 0) return 0
  else return sum(a) / a.length
}
function shuffled (a) {
  const indices = range(a.length)
  const randoms = indices.map(i => Math.random())
  indices.sort((i, j) => randoms[i] - randoms[j])
  return indices.map(i => a[i])
}

const updateInterval = 0.1
const subjects = {}
const meanEstimates = { 1: 0, 2: 0 }
const meanCertRates = { 1: 0, 2: 0 }

let state = 'instructions'
let showInstructions = false
const treatment = 1

const io = server.start(() => {
  console.log('Server started')
  setInterval(update, updateInterval * 1000)
})

io.on('connection', socket => {
  console.log('connection:', socket.id)
  socket.emit('connected', {})
  socket.on('managerUpdateServer', msg => {
    const reply = {
      subjects: Object.values(subjects),
      state
    }
    socket.emit('serverUpdateManager', reply)
  })
  socket.on('showInstructions', msg => {
    if (state === 'instructions') {
      showInstructions = true
    }
  })
  socket.on('hideInstructions', msg => {
    if (state === 'instructions') {
      showInstructions = false
    }
  })
  socket.on('startPractice', msg => {
    assignRoles()
    if (state === 'instructions') {
      state = 'practice'
    }
  })
  socket.on('endPractice', msg => {
    if (state === 'practice') {
      state = 'instructions'
    }
  })
  socket.on('clientUpdateServer', msg => {
    if (!subjects[msg.id]) createSubject(msg.id)
    const subject = subjects[msg.id]
    subject.strategy = msg.strategy
    const reply = {
      id: msg.id,
      treatment,
      state,
      showInstructions,
      role: subject.role,
      type: subject.type,
      oldStrategy: subject.oldStrategy,
      meanCertRates,
      meanEstimates
    }
    socket.emit('serverUpdateClient', reply)
  })
})

function createSubject (id) {
  const subject = {
    id,
    role: 'buyer',
    type: 0,
    strategy: 0.5,
    oldStrategy: 0.5,
    payoff: 0
  }
  subjects[id] = subject
}

function assignRoles () {
  // const shuffledSubjects = shuffled(Object.values(subjects))
  const shuffledSubjects = Object.values(subjects).map(s => s)
  shuffledSubjects.forEach((subject, index) => {
    subject.role = Math.floor(0.5 * index) % 2 === 0 ? 'sender' : 'receiver'
    subject.type = 1 + (index % 2)
  })
}

function calculateAverages () {
  const senders = Object.values(subjects).filter(s => s.role === 'sender')
  meanCertRates[1] = mean(senders.filter(s => s.type === 1).map(s => s.strategy))
  meanCertRates[2] = mean(senders.filter(s => s.type === 2).map(s => s.strategy))
  const receivers = Object.values(subjects).filter(s => s.role === 'receiver')
  const receivers1 = receivers.filter(b => b.type === 1)
  const receivers2 = receivers.filter(b => b.type === 2)
  meanEstimates[1] = mean(receivers1.map(receiver => receiver.strategy))
  meanEstimates[2] = mean(receivers2.map(receiver => receiver.strategy))
}

function update () {
  calculateAverages()
}
