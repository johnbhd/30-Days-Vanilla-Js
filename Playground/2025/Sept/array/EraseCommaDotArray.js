function EraseCommaArray(str) {
    return str.split(/[,.]/).join("")
}

console.log(EraseCommaArray("Hello, word. Im JB, currently learning MERN STACK. HEHE, have a nce day bro."))

// Result: Hello word Im JB currently learning MERN STACK HEHE have a nce day bro 
// 9/4/25 11:18pm