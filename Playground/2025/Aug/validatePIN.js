/* for my future referencing,

  ^ = start of a line, 
  \d = [0-9], {4} specifies 4 digits, 
  {6} specifies 6 digits, $ - end of a line
  
  first alternative ^\d{4}$ - equivalent to [0-9], matches exactly 4 digits.
  second alternative ^\d{6}$ - "", matches previous token exactly 6 digits.
  
   use RegEx .test to search for these characters stored.
   
*/ 

function validatePIN(pin) {
  pin = String(pin)
  
  return (/^\d{4}$/.test(pin) || /^\d{6}$/.test(pin)) ? true : false
}
console.log(validatePIN(1234))