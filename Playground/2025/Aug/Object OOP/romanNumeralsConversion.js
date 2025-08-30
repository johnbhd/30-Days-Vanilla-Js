class RomanNumerals {
  static romanMap = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  }
    
  static toRoman(num) {
    let result = ""
    for (let [roman, value] of Object.entries(this.romanMap)) {
      while (num >= value) { // loop num > in value of roman
        result += roman
        num -= value
        
      }
    }
    return result
  }

  static fromRoman(str) {
    let total = 0;
    let i = 0;
    
    while (i < str.length) {
      if (i + 1 < str.length && this.romanMap[str.substring(i, i+2)]) {
        total += this.romanMap[str.substring(i, i+2)]
        i += 2
      } else {
        total += this.romanMap[str[i]]
        i++
      }
    }
    return total;
  }
}

console.log(RomanNumerals.toRoman(1990)) // MCMXC
console.log(RomanNumerals.fromRoman("V")) // 5 

// 8/30/25 12:17 pm