console.log("oop c# ni kuya duandev, nads - js dev / sir willson flutter dev"); // 9-5-24 - 11:37pm
// sir willson abad flutter
/**
 * 🟢 Normal Class
 * - Blueprint to create objects (instances) using `new`.
 * - Each object has its own copy of data (stored in heap).
 * - Members can be instance OR static.
 * - Example: var p1 = new Person("Alice"); var p2 = new Person("Bob");
 *
 * 🟢 Static Class
 * - Declared with `static` keyword.
 * - Cannot be instantiated (no `new`).
 * - All members must be static.
 * - Stored in static/global memory → lives for entire program lifetime.
 * - Great for utilities (Math, helpers). Too many static fields = memory bloat.
 * - Example: int result = Math.Max(5, 10);
 *
 * 🟢 Method Overloading
 * - Same method name, different parameter signatures (type/number/order).
 * - Compiler decides which one to call at compile time.
 * - Example: Add(int a, int b), Add(double a, double b), Add(int a, int b, int c).
 *
 * 🟢 Constructor Overloading
 * - Same idea as method overloading, but for constructors.
 * - Allows multiple ways to create an object.
 * - Example:
 *   Person(), Person(string name), Person(string name, int age)
 * - Rule: Must differ in parameters, NOT just return type.
 *
 * 🟢 Nullable vs Optional Parameters
 * - Nullable: `string? name` → parameter can be null.
 * - Optional: `string name = "Guest"` → you can skip passing argument, defaults used.
 * - Can combine: `string? name = null`
 *
 * 🟢 Empty vs Null
 * - Empty string ("") → container exists but has no content.
 * - Null → no container at all.
 *
 * ✅ Summary:
 * - Normal class = per object state (heap).
 * - Static class = shared/global (static memory).
 * - Overloading = flexibility, same name but different parameters.
 * - Constructors can be overloaded too.
 * - Nullable vs Optional = nullability vs skipping argument.
 */
//duandev .net 
/**
 * 🟢 Access Modifiers
 *
 * public
 * - Can be accessed anywhere (inside or outside the class).
 * - Example: obj.Name  ✅
 *
 * private
 * - Can only be accessed inside the same class.
 * - Hides details from outside use (encapsulation).
 * - Example: obj.secret ❌ (error)
 *
 * protected
 * - (extra) Can be accessed inside the class and subclasses.
 *
 * ✅ Summary:
 * - public = open to everyone
 * - private = only inside the class
 * - protected = only inside + subclasses
 */
