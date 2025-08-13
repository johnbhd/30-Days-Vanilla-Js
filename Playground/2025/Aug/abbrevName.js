function abbrevName(name){
  n = name.split(" ")
  const nickname = n.map(word => word.charAt(0).toUpperCase()) 
  
  nickname.splice(1, 0, ".")
  
  return nickname.join("")
}
console.log(abbrevName("John Benedict"))

// Result: "J.B"
