function reverseWords(str) {
  const reversed = str.split(" ").map(x => x.split("").reverse().join(""));
  return reversed.join(" ");
}
console.log(reverseWords("This is an example")) // Result: sihT si na elpmaxe - 8/27/25 9:06pm