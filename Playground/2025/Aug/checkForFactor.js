function checkForFactor (base, factor) {
  return (base && factor > 0) ? base % factor === 0 ? true : false : false
}

console.log(checkForFactor(10, 2))
