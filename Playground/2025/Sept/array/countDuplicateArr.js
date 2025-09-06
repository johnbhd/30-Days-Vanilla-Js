function duplicateCount(text){
  const str = text.toLowerCase()
  const count = {}
  let double = 0

  for (let i = 0; i < str.length; i++) {
    count[str[i]] = (count[str[i]] || 0) + 1
  }
  
  // loop object
  for (let chars in count) {
    if (count[chars] > 1) {
      double++
    }
  }

  return double
  
}
console.log(duplicateCount("aabBde")) // Result: 2 - 9-6-25 11:9-6-25pm