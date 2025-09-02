function ipsBetween(start, end){
  const startNum = ipConvert(start)
  const endNum = ipConvert(end)
  
  return endNum - startNum
}

function ipConvert(ip) {
  const [a, b, c, d] = ip.split(".").map(Number)
  
  return a * 256 ** 3 + b * 256 ** 2 + c * 256 + d 
  
}
console.log(ipsBetween("10.0.0.0","10.0.0.50")) // Result: 50 - 9/1/25 9:48pm

function ipsBetween(start, end){
  const toNum = ip => ip
    .split(".")
    .map(Number)
    .reduce((x, val) =>  x * 256 + val, 0)
  
  return toNum(end) - toNum(start)
}