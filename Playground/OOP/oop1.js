class Book {
    constructor(title, author, date, category) {
        this.title = title,
        this.author = author,
        this.date = date,
        this.category = category
    }

    displayInfo() {
        console.log(`Books\n\nTitle: ${this.title} \nAuthor: ${this.author} \nDate: ${this.date} \nCategory: ${this.category}`)
    }
}

class Ebook extends Book {
    constructor(title, author, date, size) {
        super(title, author)
        this.date = date,
        this.size = size
    }
    displayInfo() {
        console.log(`\n\nEbooks\n\nTitle: ${this.title} \nAuthor: ${this.author} \nDate: ${this.date} \nSize: ${this.size}`)
    }
}

const HandBooks = new Book("Atomic Habit", "James Clear", "2000", "Self improvent")
const HandBooks1 = new Book("Atomic Habit", "James Clear", "2000", "Self improvent")
const DigitalBook = new Ebook(HandBooks.title, HandBooks.author, "2016", "1.2mb")

HandBooks.displayInfo()
DigitalBook.displayInfo()

// OOP

// 1. Class ✅
// Blueprint for creating objects (Book, Ebook)


// 2. Object ✅
// Real instances of the class (HandBooks, DigitalBook)


// 3. Encapsulation ✅
// Group related data and behavior inside the class using constructor and methods


// 4. Inheritance ✅
// Child class (Ebook) reuses properties and methods from parent class (Book)


// 5. Polymorphism ✅
// Child class overrides method (displayInfo) with its own version


// 6. Abstraction ✅ (basic)
// Only shows useful details using methods (like displayInfo), hides inner details
