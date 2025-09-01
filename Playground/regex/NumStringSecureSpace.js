function alphanumeric(string){
  return string.match("^[A-Za-z0-9]+$") ? true : false
}
// ^ - start string
// [A-Z..] - letter and num this is it only accept
// + means it should not empty value
// $ - end of string

console.log(alphanumeric("hellow_orld08- ")) // Result: false - 9/1/25 - 10:18pm