function arrayDiff(a, b) {
  const diff = a.filter((x) => !b.includes(x))
  return diff
}
console.log(arrayDiff([1,2,2,3,2], [2])) // Result: [1, 3] - 9-6-25 10:34pm