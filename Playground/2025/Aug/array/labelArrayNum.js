let number = function(array){
  return array.map((arr, i) => `${i+1}: ${arr}`)       
}
console.log(number(["a", "b", "c"]));
// Result: [ '1: a', '2: b', '3: c' ] - 8/26/25 Tuesday 10:43pm