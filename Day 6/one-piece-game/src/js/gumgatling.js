const luffy = document.querySelector(".luffy");
const luffyMove1 = document.querySelector(".luffy-move1");
const luffyMove2a = document.querySelector("#lmove-2a");
const luffyMove2b = document.querySelector("#lmove-2b");
const luffyMove3 = document.querySelector(".luffy-move3");


luffyMove1.addEventListener("animationend", function() {
  luffyMove1.style.display = "none";
  luffyMove2a.style.display = "block";
  luffy.style.width = "210px";
  
  setTimeout(() => {
    luffyMove2a.style.display = "none";
    luffyMove2b.style.display = "block";
    luffy.style.width = "310px";
    
    let is2bVisible = true;
    const swapInterval = setInterval(() => {
      if (is2bVisible) {
        luffyMove2b.style.display = "none";
        luffyMove3.style.display = "block";
      } else {
        luffyMove2b.style.display = "block";
        luffyMove3.style.display = "none";
      }
      is2bVisible = !is2bVisible;
    }, 500)
    
    setTimeout(() => {
      clearInterval(swapInterval);
      luffyMove2b.style.display = "none";
      luffyMove3.style.display = "none";
    }, 5000);
  }, 1000);
})
