function doubleChar(str) {
  const double = str.split("").map(x => x + x).join("");
  return double;
}
console.log(doubleChar("String")); // Result: SSttrriinngg - 8/28/25 9:02pm