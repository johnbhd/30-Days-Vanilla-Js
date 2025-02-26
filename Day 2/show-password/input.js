export const Input = () => {
    const title = document.createElement('h2');
    const inputs = document.createElement('input');
    const but = document.createElement('button');
    const submit = document.createElement('button');
    
    let pass = "password";
    let yourpass = "";

    title.innerHTML = `Your Password: ${yourpass}`;
    but.innerHTML = "Show";
    submit.innerHTML = "Submit";

    inputs.setAttribute('type', pass); // setting attribute in the inputs

    // show password in inputs
    const ShowPass = () => {
        pass = pass === "password" ? "text" : "password";
        inputs.setAttribute('type', pass); 
    }
    // show pass in the title
    const SubmitPass = () => {
        yourpass = inputs.value;
        title.innerHTML = `Your Password: ${yourpass}`;
    }

    but.addEventListener('click', ShowPass);
    submit.addEventListener('click', SubmitPass);

    return { title, inputs, but, submit};
}