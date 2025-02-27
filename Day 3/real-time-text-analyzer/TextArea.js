export const TextArea = () => {
    const title = document.createElement('h2');
    const textInput = document.createElement('textarea');
    const Rtitle = document.createElement('h2');

    const paraCount = document.createElement('h4');
    const sentCount = document.createElement('h4');
    const wordCount = document.createElement('h4');
    const charCount = document.createElement('h4');
    const numCount = document.createElement('h4');
    const speCount = document.createElement('h4');

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
    paraCount.innerHTML = resultNames.para + resultValue.para;
    sentCount.innerHTML = resultNames.sent + resultValue.sent;
    wordCount.innerHTML = resultNames.word + resultValue.word;
    charCount.innerHTML = resultNames.char + resultValue.char;
    numCount.innerHTML = resultNames.num + resultValue.num;
    speCount.innerHTML = resultNames.spe + resultValue.spe;

    return { title, textInput, Rtitle, paraCount, sentCount, wordCount, charCount, numCount, speCount };
};
