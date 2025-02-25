export const Button = () => {
    const but = document.createElement('button');
    but.innerHTML = "Change Background";
    //style
    but.style.padding = '30px 20px';
    but.style.fontSize = '30px';
    but.style.borderRadius = '50px';
    but.style.backgroundColor = 'blue';
    but.style.color = 'white';
    but.style.cursor = 'pointer';

    const title = document.createElement('h3');
    let colorName = '#ffffff';
    title.innerHTML = "Background: "+colorName;

    // generate random color
    const Color = () => {
        const letter = '0123456789ABCDEF';
        let color = "#";    
        for(let i = 0; i < 6; i++) {
            color += letter[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    // button action
    const ChangeBg = () => {
        colorName = Color();
        title.innerHTML = "Background: "+colorName;
        document.body.style.backgroundColor = colorName ;
    }

    but.addEventListener('click', ChangeBg);

    return {but, title};
}

