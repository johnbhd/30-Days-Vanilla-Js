const form = document.getElementById('myForm');
const container = document.getElementById('container');
const loginDiv = document.getElementById('login');
const spanDiv = document.getElementById('spanDiv');
const logout = document.getElementById('logout');

const checkLoginStatus = () => {
    const saveUser = localStorage.getItem('LoggedUser');
    if (saveUser) {
        container.style.display = 'none';
        loginDiv.style.display = 'block';

        spanDiv.textContent = `Welcome ${saveUser}`;
    }
}

const getData = async (Inputusername, Inputpass) => {
    try {
        const response = await fetch('user.json');
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();

        let userData = json.users.find(user => user.username === Inputusername && user.password === Inputpass);

        if (userData) {
            localStorage.setItem('LoggedUser', userData.username);
            container.style.display = 'none';
            loginDiv.style.display = 'block';
    
            spanDiv.textContent = `Welcome ${userData.username}`;
        } else {
            alert('Incorrect Username or Password, Try Again');
        }

    } catch(error) {
        console.error(error.message);
    }
}


const Login = (event) => {
    event.preventDefault();

    let Inputusername = document.getElementById('username').value;
    let Inputpass = document.getElementById('pass').value;
    getData(Inputusername, Inputpass)
}

const Logout = () => {
    localStorage.removeItem('LoggedUser');
    container.style.display = 'block';
    loginDiv.style.display = 'none';
    alert('Successful Logout');
}

form.addEventListener('submit', Login);
logout.addEventListener('click', Logout);

checkLoginStatus();