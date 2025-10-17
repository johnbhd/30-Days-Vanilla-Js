export function handleKeyboard(callback) {
  document.addEventListener("keydown", (e) => {
    const portrait = window.innerHeight > window.innerWidth;

    // Landscape 
    if (!portrait) {
      if (e.key === "ArrowUp") callback(-1);
      if (e.key === "ArrowDown") callback(1);
    }
    // Portrait 
    else {
      if (e.key === "ArrowLeft") callback(-1);
      if (e.key === "ArrowRight") callback(1);
    }
  });
}


export function handleTouch(canvas, portrait, callback) {
  const handleDir = (touch) => {
    if (portrait)
      callback(touch.clientX < canvas.width / 2 ? -1 : 1);
    else
      callback(touch.clientY < canvas.height / 2 ? -1 : 1);
  };

  canvas.addEventListener("touchstart", (e) => handleDir(e.touches[0]));
  canvas.addEventListener("touchmove", (e) => handleDir(e.touches[0]));
}
