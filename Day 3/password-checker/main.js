const eye = document.getElementById('eye');
let strength = document.getElementById('strength-bar');
let pass = document.getElementById('password');

// Show Password
eye.addEventListener('click', () => {
    pass.type = pass.type === 'password' ? 'text' : 'password';
    eye.classList.toggle('fa-eye');
    eye.classList.toggle('fa-eye-slash');
});

// Strength Password 
const strengthPass = () => {
    let passVal = pass.value;
    let strengthVal = 0;

    const level = document.getElementById('level'); 
    const length = document.getElementById('length');
    const uppercase = document.getElementById('uppercase');
    const number = document.getElementById('number');
    const special = document.getElementById('special');

    length.innerHTML = passVal.length >= 6 ? "✅ At least 6 characters" : "❌ At least 6 characters";
    if (passVal.length > 6) strengthVal++;
    
    uppercase.innerHTML = /[A-Z]/.test(passVal) ? "✅ At least 1 uppercase letter" : "❌ At least 1 uppercase letter";
    if (/[A-Z]/.test(passVal)) strengthVal++;

    number.innerHTML = /[0-9]/.test(passVal) ? "✅ At least 1 number" : "❌ At least 1 number";
    if (/[0-9]/.test(passVal)) strengthVal++;

    special.innerHTML = /[@$!%*?&#]/.test(passVal) ? "✅ At least 1 special character" : "❌ At least 1 special character";
    if (/[@$!%*?&#]/.test(passVal)) strengthVal++;
    
    // strength 
    if (strengthVal <= 1) {
        strength.style.width = '25%';
        level.innerHTML = 'Weak';
        strength.style.backgroundColor = 'red';
    } else if (strengthVal === 2 || strengthVal === 3) {
        strength.style.width = '50%';
        level.innerHTML = 'Moderate';
        strength.style.backgroundColor = 'orange';
    } else {
        strength.style.width = '100%';
        level.innerHTML = 'Strong'; 
        strength.style.backgroundColor = 'green';
    }
}
pass.addEventListener('input', strengthPass);