function filter_list(l) {
  const lists = l.filter(x => typeof x == "number")
  return lists
}
console.log(filter_list([1, 2, "a", "b"])); 
// result: [1, 2] - 8/26/25 Tuesday 10:43pm
