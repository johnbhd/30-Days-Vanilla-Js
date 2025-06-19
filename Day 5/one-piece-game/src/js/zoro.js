const zoro = document.querySelector(".zoro");
const moves = [
  document.querySelector(".zoro-move1"),
  document.querySelector(".zoro-move2"),
  document.querySelector(".zoro-move3"),
  document.querySelector(".zoro-move4"),
  document.querySelector(".zoro-move5"),
  document.querySelector(".zoro-move6"),
  document.querySelector(".zoro-move7"),
  document.querySelector(".zoro-move8"),
  document.querySelector(".zoro-move9"), 
  document.querySelector(".zoro-move10")
];
const sizeCon = [
  { height: "190px" },
  { height: "180px", width: "267px" },
  { width: "270px", height: "190px" },
  { width: "225px", height: "190px" },  
  { width: "260px", height: "190px" },
  { width: "190px", height: "170px" },
  { width: "270px", height: "198px"},
  { width: "190px", height: "248px" },
  { width: "150px", height: "240px" },
  { width: "297px", height: "200px" },
];

let current = 0;
moves[current].addEventListener("animationend", movements);

function movements() {
  moves[current].style.display = "none";
  current++;

  if (moves[current]) {
    moves[current].style.display = "block";
    void moves[current].offsetWidth; 
    
    if (sizeCon[current]) {
      Object.assign(zoro.style, sizeCon[current])
    }
    
    moves[current].addEventListener("animationend", movements, { once: true });
  }
}
