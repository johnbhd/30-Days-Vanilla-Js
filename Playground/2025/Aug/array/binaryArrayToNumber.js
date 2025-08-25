const binaryArrayToNumber = arr => {
  const binary = arr.join("")
  
  return parseInt(binary, 2);
};
console.log(binaryArrayToNumber([0, 0, 0, 1]))