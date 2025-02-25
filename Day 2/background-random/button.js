export const Button = () => {

    const but = document.createElement('button');
    but.innerHTML = "Change Background";

    but.style.padding = '40px 70px';
    but.style.fontSize = '50px';
    but.style.borderRadius = '20px';
    but.style.backgroundColor = 'blue';
    but.style.color = 'white';
    but.style.cursor = 'pointer';

    const title = document.createElement('h3');
    title.innerHTML = "Background: ";


    return {but, title};
}

