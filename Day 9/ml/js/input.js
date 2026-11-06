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
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const style = (typeof window !== "undefined") ? window.getComputedStyle(canvas) : null;
      if (style && style.objectFit === "cover") {
        const canvasAspect = canvas.width / canvas.height;
        const rectAspect = rect.width / rect.height;
        let scale, offsetX = 0, offsetY = 0;
        if (rectAspect < canvasAspect) {
          // Cropped horizontally (e.g. mobile portrait)
          scale = rect.height / canvas.height;
          offsetX = (canvas.width * scale - rect.width) / 2;
        } else {
          // Cropped vertically (e.g. wide mobile landscape)
          scale = rect.width / canvas.width;
          offsetY = (canvas.height * scale - rect.height) / 2;
        }
        this.mouseX = ((clientX - rect.left) + offsetX) / scale;
        this.mouseY = ((clientY - rect.top) + offsetY) / scale;
      } else {
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.mouseX = (clientX - rect.left) * scaleX;
        this.mouseY = (clientY - rect.top) * scaleY;
      }
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
