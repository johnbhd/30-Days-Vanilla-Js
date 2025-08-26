function oddOrEven(array) {
  let sum = 0;
  
  for (let i = 0; i < array.length; i++) {
    sum += array[i]
  }
  
  return sum = sum % 2 == 0 ?  "even" : "odd"
}
console.log(oddOrEven([2,3])) // Result: odd - 8/26/25 Tuesday 10:43pm