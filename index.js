import server from './server.js'

function range (n) { return [...Array(n).keys()] }
/*
function unique (a) {
  const set = new Set(a)
  return [...set]
}
*/
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
const price = [0, 0]
const certProb = [0, 0]

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
    const buyers = Object.values(subjects).filter(b => b.role === 'buyer')
    const otherBuyers = buyers.filter(b => b.id !== subject.id)
    const otherBids = otherBuyers.map(c => c.strategy)
    const reply = {
      id: msg.id,
      treatment,
      state,
      showInstructions,
      role: subject.role,
      oldStrategy: subject.oldStrategy,
      certProb,
      price,
      otherBids
    }
    socket.emit('serverUpdateClient', reply)
  })
})

function createSubject (id) {
  const subject = {
    id,
    role: ' ',
    strategy: [0.5, 0.5],
    oldStrategy: [0.5, 0.5],
    payoff: 0
  }
  subjects[id] = subject
}

function assignRoles () {
  const shuffledSubjects = shuffled(Object.values(subjects))
  shuffledSubjects.forEach((subject, index) => {
    subject.role = index % 2 === 0 ? 'buyer' : 'seller'
  })
  const buyers = shuffledSubjects.filter(subject => subject.role === 'buyer')
  const sellers = shuffledSubjects.filter(subject => subject.role === 'seller')
  buyers.forEach((buyer, index) => { buyer.type = index % 2 })
  sellers.forEach((seller, index) => { seller.type = index % 2 })
}

function calculateAverages () {
  const sellers = Object.values(subjects).filter(s => s.role === 'seller')
  certProb[0] = mean(sellers.map(b => b.strategy[0]))
  certProb[1] = mean(sellers.map(b => b.strategy[1]))
  const buyers = Object.values(subjects).filter(s => s.role === 'buyer')
  const buyerPairs = range(buyers.length).map(i => range(i).map(j => [buyers[i], buyers[j]])).flat()
  const bidPairs0 = buyerPairs.map(pair => [pair[0].strategy[0], pair[1].strategy[0]])
  const bidPairs1 = buyerPairs.map(pair => [pair[0].strategy[1], pair[1].strategy[1]])
  price[0] = mean(bidPairs0.map(bidPair => Math.max(...bidPair)))
  price[1] = mean(bidPairs1.map(bidPair => Math.max(...bidPair)))
}

function update () {
  calculateAverages()
}
