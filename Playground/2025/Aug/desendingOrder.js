function descendingOrder(n){
  let arr = n.toString().split("")
  return parseInt(arr.sort((a, b) => b - a).join(""))
  
}
console.log(descendingOrder(1021))