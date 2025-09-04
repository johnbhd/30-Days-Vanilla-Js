function getMiddle(s) {
    const mid = Math.floor(s.length/ 2)
    
    if (s.length % 2 === 0) {
      return [s[mid -1], s[mid]].join("")
      
    } else {
      return s[mid]
    }
}
console.log(getMiddle("middle"))  // Result: dd - 9/4/25 10:22pm