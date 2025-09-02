function sumStrings(a,b) { 
  const [x, y] = (a, b).split(" ").map(Number)

  return x + y.toString()
}
console.log(sumStrings("123", "456")); // Result: "579"