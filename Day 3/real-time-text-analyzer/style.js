export const Style = (title, textInput, Rtitle,  container, resultDiv, paraCount, sentCount, wordCount, charCount, numCount, speCount) => {
    // body 
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.alignItems = 'center';
    document.body.style.fontFamily = 'arial';
    document.body.style.justifyContent = 'center';
 
    document.body.style.margin = '0px';
    
    // container
    container.style.width = '80%';
    container.style.marginTop = '5vh';

    // result div
    resultDiv.style.width = '80%';
    resultDiv.style.marginTop = '5vh';
   
    // title
    title.style.fontSize = '50px';
    title.style.textAlign = 'center';

    // title
    Rtitle.style.fontSize = '50px';
    Rtitle.style.textAlign = 'center';

    const styleH4 = (element) => {
        element.style.fontSize = '30px';
        element.style.textAlign = 'left';
    }
    styleH4(paraCount);
    styleH4(sentCount);
    styleH4(wordCount);
    styleH4(charCount);
    styleH4(numCount);
    styleH4(speCount);

    // input
    textInput.style.padding = '10px 10px';
    textInput.style.width = '100%';
    textInput.style.height = '40vh';
    textInput.style.fontSize = '24px';
}