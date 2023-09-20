import server from './server.js'
import { setTreatment, getProducerPayoff, getBuyerPayoff } from './public/payoffs.js'

function range (n) { return [...Array(n).keys()] }
function sum (a) { return a.reduce((x, y) => x + y, 0) }
function mean (a) {
  if (a.length === 0) return 0
  else return sum(a) / a.length
}
function unique (a) {
  return Array.from(new Set(a))
}
function shuffled (a) {
  const indices = range(a.length)
  const randoms = indices.map(i => Math.random())
  indices.sort((i, j) => randoms[i] - randoms[j])
  return indices.map(i => a[i])
}

const subjects = {}
const dt = 0.1
const firstRoundTime = 5
const roundTime = 1
const maxRound = 60
const maxPeriod = 10
const feedbackTime = 10

let state = 'instructions'
let practice = true
let practiceComplete = false
let showInstructions = false
let treatment = 1
let round = 0
let period = 0
let timer = 0

const io = server.start(() => {
  console.log('Server started')
  setInterval(update, dt * 1000)
})

io.on('connection', socket => {
  console.log('connection:', socket.id)
  socket.emit('connected', {})
  socket.on('managerUpdateServer', msg => {
    treatment = msg.treatment
    setTreatment(treatment)
    const reply = {
      subjects: Object.values(subjects),
      state,
      practiceComplete
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
  socket.on('setupGroups', msg => {
    setupGroups()
  })
  socket.on('startPractice', msg => {
    if (state === 'instructions') {
      startPractice()
    }
  })
  socket.on('startExperiment', msg => {
    if (state === 'instructions') {
      startExperiment()
    }
  })
  socket.on('clientUpdateServer', msg => {
    if (!subjects[msg.id]) createSubject(msg.id)
    const subject = subjects[msg.id]
    subject.action = msg.action
    const reply = {
      id: msg.id,
      treatment,
      state,
      practice,
      period,
      timer,
      showInstructions,
      role: subject.role,
      type: subject.type,
      oldAction: subject.oldAction,
      oldPayoff: subject.oldPayoff,
      oldBids: subject.oldBids,
      oldQuantities: subject.oldQuantities,
      roundPayoff: subject.roundPayoff
    }
    socket.emit('serverUpdateClient', reply)
  })
})

function createSubject (id) {
  const subject = {
    id,
    group: 0,
    role: 'none',
    type: 0,
    action: 0.5,
    oldAction: 0.5,
    oldPayoff: 0,
    oldBids: { 1: 0, 2: 0 },
    oldQuantities: { 1: 0, 2: 0 },
    periodPayHist: [],
    roundPayoff: 0,
    roundPayHist: []
  }
  subjects[id] = subject
}

function setupGroups () {
  console.log('setupGroups')
  const shuffledSubjects = shuffled(Object.values(subjects))
  shuffledSubjects.forEach((subject, index) => {
    subject.group = Math.floor(index / 4) + 1
  })
}

function assignRoles () {
  // const shuffledSubjects = shuffled(Object.values(subjects))
  const shuffledSubjects = Object.values(subjects).map(s => s)
  const groups = unique(shuffledSubjects.map(s => s.group))
  groups.forEach(group => {
    const groupSubjects = shuffledSubjects.filter(s => s.group === group)
    groupSubjects.forEach((subject, index) => {
      subject.role = Math.floor(0.5 * index) % 2 === 0 ? 'producer' : 'buyer'
      subject.type = 1 + (index % 2)
    })
  })
}

function getGroupQuantities (group) {
  const groupSubjects = Object.values(subjects).filter(s => s.group === group)
  const producer1 = groupSubjects.filter(s => s.role === 'producer' && s.type === 1)[0]
  const producer2 = groupSubjects.filter(s => s.role === 'producer' && s.type === 2)[0]
  return { 1: producer1.action, 2: producer2.action }
}

function getGroupBids (group) {
  const groupSubjects = Object.values(subjects).filter(s => s.group === group)
  const buyer1 = groupSubjects.filter(s => s.role === 'buyer' && s.type === 1)[0]
  const buyer2 = groupSubjects.filter(s => s.role === 'buyer' && s.type === 2)[0]
  return { 1: buyer1.action, 2: buyer2.action }
}

function startPractice () {
  assignRoles()
  state = 'game'
  practice = true
  round = 0
  startRound()
}

function startExperiment () {
  assignRoles()
  state = 'game'
  practice = false
  round = 1
  startRound()
}

function startRound () {
  period = 1
  timer = firstRoundTime
  assignRoles()
  Object.values(subjects).forEach(subject => {
    subject.periodPayHist = []
  })
}

function endPeriod () {
  Object.values(subjects).forEach(subject => {
    subject.oldAction = subject.action
    subject.oldBids = getGroupBids(subject.group)
    subject.oldQuantities = getGroupQuantities(subject.group)
    const price = Math.max(subject.oldBids[1], subject.oldBids[2])
    if (subject.role === 'producer') {
      subject.oldPayoff = getProducerPayoff(subject.oldAction, subject.type, price)
    }
    if (subject.role === 'buyer') {
      const otherType = subject.type === 1 ? 2 : 1
      const otherBid = subject.oldBids[otherType]
      subject.oldPayoff = getBuyerPayoff(subject.oldAction, otherBid, subject.oldQuantities[1], subject.oldQuantities[2])
    }
    subject.periodPayHist.push(subject.oldPayoff)
  })
}

function endRound () {
  Object.values(subjects).forEach(subject => {
    subject.roundPayoff = mean(subject.periodPayHist)
  })
  if (practice) {
    practiceComplete = true
  } else {
    Object.values(subjects).forEach(subject => {
      subject.roundPayHist.push(subject.periodPayoff)
    })
  }
}

function endGame () {
  //
}

function update () {
  timer = Math.max(0, timer - dt)
  if (state === 'game') {
    if (timer <= 0) {
      endPeriod()
      period += 1
      timer = roundTime
    }
    if (period > maxRound) {
      endRound()
      state = 'feedback'
      timer = feedbackTime
    }
  }
  if (state === 'feedback') {
    if (timer <= 0) {
      if (practice) state = 'instructions'
      else {
        state = 'game'
        round += 1
        if (round > maxPeriod) endGame()
        else startRound()
      }
    }
  }
}
