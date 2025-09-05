// public
class Person {
  constructor(name) {
    this.name = name; // public
  }

  greet() { // public
    console.log(`Hi, I’m ${this.name}`);
  }
}

const jb = new Person("JB");
console.log(jb.name); // ✅ JB
jb.greet();           // ✅ Hi, I’m JB

// private - #

class BankAccount {
  #balance = 0; // private

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const acc = new BankAccount();
acc.deposit(1000);
console.log(acc.getBalance()); // ✅ 1000
// console.log(acc.#balance);  ❌ ERROR

// protected - _
class Animal {
  constructor(name) {
    this._name = name; // "protected" by convention
  }

  _makeSound() {
    console.log(`${this._name} makes a sound`);
  }
}

class Dog extends Animal {
  bark() {
    this._makeSound(); // ✅ allowed inside subclass
    console.log(`${this._name} barks`);
  }
}

const dog = new Dog("Buddy");
dog.bark();
// Buddy makes a sound
// Buddy barks

console.log(dog._name); // ⚠️ technically works, but bad practice
