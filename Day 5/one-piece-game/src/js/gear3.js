const luffy = document.querySelector(".luffy");
const Gear3Move1 = document.querySelector(".gear3-move1");
const Gear3Move2 = document.querySelector(".gear3-move2");
const Gear3Move3 = document.querySelector(".gear3-move3");

setTimeout(() => {
  Gear3Move1.style.display = "none";
  Gear3Move2.style.display = "block"
  
  Gear3Move2.addEventListener("animationend", function() {
    this.style.display = "none";
    Gear3Move3.style.display = "block";
    luffy.style.width = "165px";
  })
  
}, 500);