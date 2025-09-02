function productFib(prod){
  let a = 1, b = 0;
  
  while(a * b < prod) {
    let next = a + b;
    a = b
    b = next
  }

  return [a, b, a * b == prod]
}

console.log(productFib(4895)) // Result: [55, 89, true] - 9/2/25 9:41pm