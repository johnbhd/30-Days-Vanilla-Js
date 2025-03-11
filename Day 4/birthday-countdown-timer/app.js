document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const wrapper = document.getElementById('wrapper');
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal');
    const form = document.getElementById('myForm');

    const storeData = (name, bday) => {
        // localstorage
        localStorage.setItem('name', name);
        localStorage.setItem('bday', bday);
    }

    const myFunc = () => {
        const nameVal = localStorage.getItem('name');
        const bdayVal = localStorage.getItem('bday');
        const spanName = document.getElementById('nameSpan');
        const age = document.getElementById('age');

        if (nameVal && bdayVal) {
            spanName.textContent = nameVal;
            age.textContent = bdayVal;
            
            overlay.style.display = 'none';
            modal.style.display = 'none'; 
        }
    }
    
    const MyForm = (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const bday = document.getElementById('bday').value;

        storeData(name, bday);
        myFunc();
    }
    window.onload = myFunc;
    form.addEventListener('submit', MyForm);
})