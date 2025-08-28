function points(games) {
  let total = 0;
  for (let g of games) { // loop the array
    let [x, y] = g.split(":").map(Number) // declare as x and y split : and turn to array number 
    const rules = x > y ? total += 3 
    : x === y ? total += 1 : 0; 
  }
  
  return total;
}
console.log(points(["1:0","2:0","3:0","4:0","2:1","3:1","4:1","3:2","4:2","4:3"]));
// Result: 30 - 8/28/25 9:39pm