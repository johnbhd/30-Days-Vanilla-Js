const inputField = document.getElementById('InputField');
const result = document.getElementById('Result');
const copy = document.getElementById('copy');

const InputFunc = () => {
    const inputval = inputField.value;

    if (inputval.trim() !== "") {
        let reversed = inputval.split('').reverse().join('');
        result.textContent = reversed;   
    }

}
const copyBut = () => {
    const copyClip = result.textContent;
   
    navigator.clipboard.writeText(copyClip);
    copy.textContent = "Copy Code✔";

    setTimeout(() => {
        copy.textContent = "Copy Code";
    }, 1000); 

}

inputField.addEventListener('input', InputFunc);
copy.addEventListener('click', copyBut);