function bouncingBall(h,  bounce,  window) {
  if (h <= 0 || bounce <= 0 || bounce >= 1 || window >= h) {
    return -1
  } 
  
  let count = 1;
  
  while (h * bounce > window) {
    h *= bounce;
    count += 2
  }
  return count
}
console.log(bouncingBall(3.0, 0.66, 1.5));  // Result: 3 - 8/30/25 11:32 am