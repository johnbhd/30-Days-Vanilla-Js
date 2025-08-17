export class Computer {
    constructor() {}

    getMove(playerMoves, computerMoves) {
        const allMoves = [...playerMoves, ...computerMoves]
        const allCells = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const available = allCells.filter(cel => !allMoves.includes(cel))

        console.log(available)

        if (available.length === 0) return null;

        return available[Math.floor(Math.random() * available.length)]
    }
}




// task - make old code as OOP practice clean code architecture
// score localstorage
// localstorage player icon
// local storage player or computer
// computer moves
// Done
// change character 
// GOAL 8-9-25
// use oop approach 
// make name clickable for the player or computer



// 8-17-25 
// AI MOVES AUTO