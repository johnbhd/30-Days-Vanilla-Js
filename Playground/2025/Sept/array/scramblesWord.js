function scramble(str1, str2) {
  const condition = /^[a-z]+$/;

  if (str1.match(condition) && str2.match(condition)) {
    const count = {}
    
    for (let l of str1) {
      count[l] = (count[l] || 0) + 1
    }
    
    for (let l of str2) {
      if (!count[l]) return false
      count[l]--
    }
    return true;
  }
  return false; 
  
}

console.log(scramble("cedewaraaossoqqyt", "codewars")); // Result: True - 9/2/25 10:06pm
// nakakabaliw HAHAHAHHA