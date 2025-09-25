function accum(s) {
	const str = s.split("") 
	const item = [];
	
	for (let i = 0; i < s.length; i++ ) {
	  item.push(str[i].toUpperCase() + str[i].toLowerCase().repeat(i));
	}
	
  return item.join("-");
}
console.log(accum("abcd")) // Result: "A-Bb-Ccc-Dddd" - 9/25/25 10:38pm


// traditional way looping
function accum(s) {
	const str = s.split("") 
	const item = [];
	
	for (let i = 0; i < s.length; i++ ) { 
    let low = ""
    for (let j = 0; j < i; j++) {
      low += str[i].toLowerCase() 
    }
    item.push(str[i].toUpperCase() + low)
	}
	
  return item.join("-");
}
console.log(accum("abcd"))
// Result: "A-Bb-Ccc-Dddd" - 9/25/25 10:38pm