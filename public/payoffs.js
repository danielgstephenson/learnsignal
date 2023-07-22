const senderTypeProbs = { 1: 0.8, 2: 0.2 }
const senderEndowment = 15
const receiverEndowment = 15
const alpha = 0
const beta = 10
const gamma = 0.75
const delta1 = 3
const delta2 = 9
const certCosts = { 1: beta, 2: beta * gamma }
const value1 = {
  1: { 1: alpha, 2: alpha + beta - delta1 },
  2: { 1: alpha, 2: alpha + beta + delta1 }
}
const value2 = {
  1: { 1: alpha, 2: alpha + beta - delta2 },
  2: { 1: alpha, 2: alpha + beta + delta2 }
}
let value = value2

function setTreatment (treatment) {
  if (treatment === 1) value = value1
  if (treatment === 2) value = value2
}

function getBeliefs (receiverType, meanCertRates) {
  const x1m = receiverType === 2 ? meanCertRates[1] : (1 - meanCertRates[1])
  const x2m = receiverType === 2 ? meanCertRates[2] : (1 - meanCertRates[2])
  const weight1 = senderTypeProbs[1] * x1m
  const weight2 = senderTypeProbs[2] * x2m
  const denominator = weight1 + weight2
  if (denominator <= 0) return { 1: 1, 2: 0 }
  return { 1: weight1 / denominator, 2: weight2 / denominator }
}

function getReceiverPayoff (estimate, receiverType, meanCertRates) {
  const m = receiverType
  const beliefs = getBeliefs(receiverType, meanCertRates)
  // console.log('values', value[1][m], value[2][m])
  // console.log('beliefs', beliefs[1], beliefs[2])
  // console.log('meanValue', beliefs[1] * value[1][m] + beliefs[2] + value[2][m])
  const sqrDist1 = (estimate - value[1][m]) ** 2
  const sqrDist2 = (estimate - value[2][m]) ** 2
  const pay = receiverEndowment - 0.03 * (beliefs[1] * sqrDist1 + beliefs[2] * sqrDist2)
  return pay
}

function getSenderPayoff (certRate, senderType, meanEstimates) {
  console.log()
  return senderEndowment + certRate * (meanEstimates[2] - certCosts[senderType]) + (1 - certRate) * meanEstimates[1]
}

export { setTreatment, getReceiverPayoff, getSenderPayoff, value }
