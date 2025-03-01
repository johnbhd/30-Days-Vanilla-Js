export const Style = (title, textInput, Rtitle,  container, resultDiv, paraCount, sentCount, wordCount, charCount, numCount, speCount, button, resetbut, butDiv) => {
    // body 
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.alignItems = 'center';
    document.body.style.fontFamily = 'calibri';
    document.body.style.justifyContent = 'center';
 
    document.body.style.margin = '0px';
    
    // container
    container.style.width = '80%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    butDiv.style.justifyContent = 'center';
    butDiv.style.alignItems = 'center';

    container.style.marginTop = '5vh';

    // but div
    butDiv.style.width = '80%';
    butDiv.style.justifyContent = 'center';
    butDiv.style.alignItems = 'center';
    butDiv.style.display = 'flex';
    butDiv.style.gap = '3vh';
    butDiv.style.marginTop = '3vh';

    // result div
    resultDiv.style.width = '80%';
    resultDiv.style.marginTop = '5vh';
    resultDiv.style.paddingBottom = '5vh';
   
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
   
    textInput.style.width = '100%';
    textInput.style.height = '40vh';
    textInput.style.fontSize = '24px';
    textInput.style.outline = 'none';
    textInput.style.padding = '20px 20px';
    textInput.style.boxSizing = 'border-box';

    // button
    button.style.padding = '15px 30px';
    button.style.fontSize = '25px';

    button.style.backgroundColor = 'lightblue';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.opacity = '100%';
    button.style.borderRadius = '50px';

    // reset but
    resetbut.style.padding = '15px 30px';
    resetbut.style.fontSize = '25px';

    resetbut.style.backgroundColor = '#e8a39e';
    resetbut.style.border = 'none';
    resetbut.style.cursor = 'pointer';
    resetbut.style.opacity = '100%';
    resetbut.style.borderRadius = '50px';
 
    // button hover
    button.addEventListener('mouseover', () => {
        
        button.style.opacity = '80%';
    })
    button.addEventListener('mouseout', () => {
        button.style.opacity = '100%';
    })
}