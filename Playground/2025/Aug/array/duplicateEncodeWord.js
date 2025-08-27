function duplicateEncode(word){
    const encode = word.toLowerCase().split("") // lower then split
    
    const count = {} // object
    
    for (let x of encode) {
      count[x] = (count[x] || 0) + 1; // assigning value to the letter 
    } // this you count how many letter in the word then you assign value
    
    // if > 1 then should ) then if not then (
    const duplicate = encode.map(c => {
      if (count[c] > 1) return ")";
      else return "("
    })
    return duplicate.join("");
}
console.log(duplicateEncode("success")); // Result: )())()) - 8/27/25 10:13pm