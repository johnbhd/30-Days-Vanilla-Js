/**
 * Input handling - click to move
 */

const Input = {
  mouseX: 0,
  mouseY: 0,
  targetX: null,
  targetY: null,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,

  init(canvas, camera) {
    const updateCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouseX = (clientX - rect.left) * scaleX;
      this.mouseY = (clientY - rect.top) * scaleY;
    };

    // Click to set move target or attack target
    canvas.addEventListener("mousedown", (e) => {
      updateCoords(e.clientX, e.clientY);
      this.isDragging = true;
      this.dragStartX = this.mouseX;
      this.dragStartY = this.mouseY;

      // Set move target in world coords
      this.targetX = this.mouseX + camera.x;
      this.targetY = this.mouseY + camera.y;
    });

    canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      updateCoords(e.clientX, e.clientY);
      if (this.isDragging) {
        this.targetX = this.mouseX + camera.x;
        this.targetY = this.mouseY + camera.y;
      }
    });

    // Touch support for mobile
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      updateCoords(touch.clientX, touch.clientY);
      this.targetX = this.mouseX + camera.x;
      this.targetY = this.mouseY + camera.y;
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      updateCoords(touch.clientX, touch.clientY);
      this.targetX = this.mouseX + camera.x;
      this.targetY = this.mouseY + camera.y;
    }, { passive: false });
  },

  resetTarget() {
    this.targetX = null;
    this.targetY = null;
  }
};
