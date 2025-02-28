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

    const button = document.createElement('button');

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
        sent: 0,
        word: 0,
        char: 0,
        num: 0,
        spe: 0
    };

    title.innerHTML = 'Text Analyzer';
    button.innerHTML = 'Count';
    Rtitle.innerHTML = 'Result';
    textInput.placeholder = "Add Text here...";
    textInput.name = 'textinput';

    const ResultUpdate = () => {
        // Assign values using the object
        paraCount.innerHTML = `<strong>${resultNames.para}</strong> ${resultValue.para}`;
        sentCount.innerHTML = `<strong>${resultNames.sent}</strong> ${resultValue.sent}`;
        wordCount.innerHTML = `<strong>${resultNames.word}</strong> ${resultValue.word}`;
        charCount.innerHTML = `<strong>${resultNames.char}</strong> ${resultValue.char}`;
        numCount.innerHTML = `<strong>${resultNames.num}</strong> ${resultValue.num}`;
        speCount.innerHTML = `<strong>${resultNames.spe}</strong> ${resultValue.spe}`;
    }

    // Word count 
    const wordFunc = (inputVal) => {
        resultValue.word = inputVal.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Character count 
    const charFunc = (inputVal) => {
        resultValue.char = inputVal.trim().length;

    }

    // button then all value will change
    button.addEventListener('click', () => {
        const inputVal = textInput.value; // inputs
        charFunc(inputVal);
        wordFunc(inputVal);

        ResultUpdate(); // add funciton then
    });

    ResultUpdate(); // calling it 

    return { title, textInput, Rtitle, paraCount, sentCount, wordCount, charCount, numCount, speCount, button};
};
