export const Style = (title, inputs, but, submit) => {
    // body 
    document.body.style.display = 'flex';
    document.body.style.alignItems = 'center';
    document.body.style.fontFamily = 'arial';
    document.body.style.justifyContent = 'center';
    document.body.style.height = '100vh';
    document.body.style.margin = '0px';
    
     // title
     title.style.fontSize = '30px';
     title.style.textAlign = 'center';

    // input
    inputs.style.padding = '10px 10px';
    inputs.style.fontSize = '24px';

    // but
    but.style.padding = '10px 10px';
    but.style.fontSize = '24px';
    but.style.cursor = 'pointer';
    
    // but
    submit.style.padding = '10px 10px';
    submit.style.width = '100%';
    submit.style.fontSize = '24px';
    submit.style.cursor = 'pointer';
    submit.style.marginTop = '20px';


    
}