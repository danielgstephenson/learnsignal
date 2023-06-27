const typeProb = [0.2, 0.8]
const certCost = [2, 4]
const buyerEndowment = 10
const quality1 = [
  [18, 18],
  [6, 6]
]
const quality2 = [
  [6, 15],
  [6, 12]
]
let quality = quality1

function sum (a) { return a.reduce((x, y) => x + y, 0) }
function mean (a) {
  if (a.length === 0) return 0
  else return sum(a) / a.length
}

function setTreatment (treatment) {
  if (treatment === 1) quality = quality1
  if (treatment === 2) quality = quality2
}

function getBuyerPayoff (bids, otherBids, certProb) {
  const winProb0 = mean(otherBids.map(b => 1 * (b[0] < bids[0]) + 0.5 * (b[0] === bids[0])))
  const winProb1 = mean(otherBids.map(b => 1 * (b[1] < bids[1]) + 0.5 * (b[1] === bids[1])))
  const pay00 = typeProb[0] * (1 - certProb[0]) * (quality[0][0] - bids[0]) * winProb0
  const pay01 = typeProb[0] * certProb[0] * (quality[0][1] - bids[1]) * winProb1
  const pay10 = typeProb[1] * (1 - certProb[1]) * (quality[1][0] - bids[0]) * winProb0
  const pay11 = typeProb[1] * certProb[1] * (quality[1][1] - bids[1]) * winProb1
  return buyerEndowment + pay00 + pay01 + pay10 + pay11
}

function getSellerPayoff (certProb, price) {
  const pay00 = typeProb[0] * (1 - certProb[0]) * price[0]
  const pay01 = typeProb[0] * certProb[0] * (price[1] - certCost[0])
  const pay10 = typeProb[1] * (1 - certProb[1]) * (price[0])
  const pay11 = typeProb[1] * certProb[1] * (price[1] - certCost[1])
  return pay00 + pay01 + pay10 + pay11
}

export { setTreatment, getBuyerPayoff, getSellerPayoff }
