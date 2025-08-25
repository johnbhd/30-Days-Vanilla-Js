function strCount(str, letter){  
  return str.split("").filter(x => x === letter).join("").length
}
console.log(strCount("Hello", 'l')) // 8/25/25 10:31pm monday swimming diamond