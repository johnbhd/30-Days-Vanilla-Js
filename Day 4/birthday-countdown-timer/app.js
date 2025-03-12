document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const nameVal = localStorage.getItem('name');
    const bdayVal = localStorage.getItem('bday');
    const spanName = document.getElementById('nameSpan');
    const age = document.getElementById('age');

    if (nameVal && bdayVal) {
        spanName.textContent = nameVal;
        age.textContent = ageFunc(bdayVal);
        
        countdown(bdayVal);
    } else {
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';


        const modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'modal';
   

        modal.innerHTML = `
            <div class="modal-body" id="modal-body">
                <form id="myForm">
                    <h4>Enter the following</h4>
                    <label>Name: </label>
                    <input type="text" id="name" required><br>
                    <label>birthDate : </label>
                    <input type="date" id="bday" required>
                    <button type="submit">Submit</button>
                </form>
            </div>
        `; 
        container.appendChild(overlay);
        container.appendChild(modal);

        overlay.style.display = 'block';
        modal.style.display = 'block';
        
        const form = document.getElementById('myForm');
        
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const name = document.getElementById('name').value;
            const bday = document.getElementById('bday').value;
            localStorage.setItem('name', name);
            localStorage.setItem('bday', bday);
            
            spanName.textContent = name;
            age.textContent = ageFunc(bday);
            
            overlay.remove();
            modal.remove();
        });
    }
});
const countdown = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();

    let nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    // if bday passed set another year
    if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
    }
    const intervalId = setInterval(() => {
        updateCountdown(nextBday, intervalId);
    }, 1000);
}
const updateCountdown = (targetDate) => {
    const now = new Date();
    const diff = targetDate - now; // time diff

    if (diff <= 0) {
        document.getElementById('con-box').innerHTML = '<h3>Happy Birthday!</h3>';
        clearInterval(intervalId);
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.querySelector(".box:nth-child(1) h3").textContent = formatTime(days);
    document.querySelector(".box:nth-child(2) h3").textContent = formatTime(hours);
    document.querySelector(".box:nth-child(3) h3").textContent = formatTime(minutes);
    document.querySelector(".box:nth-child(4) h3").textContent = formatTime(seconds);
}
const formatTime = (time) => {
    return time < 10 ? `0${time}`: time;
}

const ageFunc = (bday) => {
    const birthDate  = new Date(bday);
    const today = new Date();

    let age = (today.getFullYear() - birthDate .getFullYear()) + 1;
    const monthDiff = today.getMonth() -birthDate .getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate .getDate())) {
        age--;
    }
    return age;
}