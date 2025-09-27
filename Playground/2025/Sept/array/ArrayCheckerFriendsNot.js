function friend(friends){
  return friends.filter(x => x.length == 4 ) 
}

console.log(friend(["Ryan", "Kieran", "Jason", "Yous"]))  // Result: [ 'Ryan', 'Yous' ] - 9/26/25 8:35pm
