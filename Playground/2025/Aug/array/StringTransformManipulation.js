function pigIt(str){
  const strPigIt = str.split(" ").map(word => {
    if (/^[a-zA-Z]+$/.test(word)) { // use regex only letter will accept
      return word.slice(1) + word[0] + "ay" // erase first index + first index so it will be at last then add "ay"
    }
    return word // return if not letter
  }).join(" ")
  
  return strPigIt
}
console.log(pigIt("Pig latin is cool !")); // Result: igPay atinlay siay oolcay ! - 8/27/25 10:13pm