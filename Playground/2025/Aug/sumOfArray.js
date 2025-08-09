function betterThanAverage1(classPoints, yourPoints) {
  let sum = 0
  for (let i = 0; i < classPoints.length; i++) {
    sum += classPoints[i]
  } 
  
  return sum / classPoints.length < yourPoints ? true : false
}
function betterThanAverage(classPoints, yourPoints) {
  let sum = classPoints.reduce((a, b) => a + b, 0)
  
  return sum / classPoints.length < yourPoints ? true : false
}


console.log(betterThanAverage([100, 40, 34, 57, 29, 72, 57, 88], 75))