function highAndLow(numbers){
  const nums = numbers.trim().split(/\s+/).map(Number)
  const high = Math.max(...nums)
  const low = Math.min(...nums)
  return `${high} ${low}`
}
console.log(highAndLow("1 2 3 4 5"));  // Result: 5 1 - 8/30/25 11:48 am