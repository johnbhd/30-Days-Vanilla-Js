export const TextArea = () => {
    const title = document.createElement('h2');
    const textInput = document.createElement('textarea');
    const Rtitle = document.createElement('h2');

    const paraCount = document.createElement('P');
    const sentCount = document.createElement('P');
    const wordCount = document.createElement('P');
    const charCount = document.createElement('P');
    const numCount = document.createElement('P');
    const speCount = document.createElement('P');

    // Using an object 
    const resultNames = {
        para: "Paragraph Count: ",
        sent: "Sentences Count: ",
        word: "Word Count: ",
        char: "Character Count: ",
        num: "Number Count: ",
        spe: "Special Character: "
    };

    // Result value
    const resultValue = {
        para: 0,
        sent: 3,
        word: 4,
        char: 5,
        num: 8,
        spe: 8
    };


    title.innerHTML = 'Text Analyzer';
    textInput.placeholder = "Add Text here...";

    Rtitle.innerHTML = 'Result';

    // Assign values using the object
    paraCount.innerHTML = `<strong>${resultNames.para}</strong> ${resultValue.para}`;
    sentCount.innerHTML = `<strong>${resultNames.sent}</strong> ${resultValue.sent}`;
    wordCount.innerHTML = `<strong>${resultNames.word}</strong> ${resultValue.word}`;
    charCount.innerHTML = `<strong>${resultNames.char}</strong> ${resultValue.char}`;
    numCount.innerHTML = `<strong>${resultNames.num}</strong> ${resultValue.num}`;
    speCount.innerHTML = `<strong>${resultNames.spe}</strong> ${resultValue.spe}`;

    return { title, textInput, Rtitle, paraCount, sentCount, wordCount, charCount, numCount, speCount };
};
