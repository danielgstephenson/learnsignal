const endowment = 15
const values = { 1: 0, 2: 1 }
const costs = { 1: 0.8, 2: 0.2 }

function setTreatment (treatment) {
  if (treatment === 'LVLC') {
    values[1] = 0
    costs[2] = 0.2
  }
  if (treatment === 'LVHC') {
    values[1] = 0
    costs[2] = 0.7
  }
  if (treatment === 'HVLC') {
    values[1] = 0.4
    costs[2] = 0.2
  }
  if (treatment === 'HVHC') {
    values[1] = 0.4
    costs[2] = 0.7
  }
}

function getShare (myBid, otherBid) {
  if (myBid > otherBid) return 1
  else if (myBid < otherBid) return 0
  else return 0.5
}

function getProducerPayoff (myQuantity, myType, price) {
  return endowment + price * myQuantity - costs[myType] * myQuantity
}

function getBuyerPayoff (myBid, otherBid, quantity1, quantity2) {
  const myShare = getShare(myBid, otherBid)
  const winPay = quantity1 * (values[1] - myBid) + quantity2 * (values[2] - myBid)
  return endowment + myShare * winPay
}

export { setTreatment, getProducerPayoff, getBuyerPayoff }
