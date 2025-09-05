class Car {
  static company = "Tesla"; // static property

  static compare(car1, car2) {
    return car1.model === car2.model;
  }

  constructor(model) {
    this.model = model;
  }
}

console.log(Car.company); // ✅ Tesla (no "new")

const car1 = new Car("Model S");
const car2 = new Car("Model 3");

console.log(Car.compare(car1, car2)); // false
