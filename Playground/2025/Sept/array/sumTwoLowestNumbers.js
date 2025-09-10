function sumTwoSmallestNumbers(numbers) {  
  let low = numbers[0];
  let ndLow = numbers[1];
  let all = []
  
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] < low) { // iterate every num in array then until it goes the lowest of them all
      ndLow = low 
      low = numbers[i]
      //console.log(ndLow)  43 not include since 2 < 43
    } else if (numbers[i] < ndLow && numbers[i] !== low){
      ndLow = numbers[i] // same goes it just make it 
      // only find lowest aside the first lowest so you 
      // loop skip the lowest and proceed to nd lowest
    }
  }
  
  return low + ndLow
  
}
console.log(sumTwoSmallestNumbers([125, 28, 4, 2, 43])); // Result: 6 - 9/10/25 10:30pm