document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const nameVal = localStorage.getItem('name');
    const bdayVal = localStorage.getItem('bday');
    const spanName = document.getElementById('nameSpan');
    const age = document.getElementById('age');
    const edit = document.getElementById('edit');

    edit.addEventListener('click', () => {
        if (confirm("Do you want to change Countdown?")) {
            alert('You clicked Yes! Proceeding...');
            localStorage.clear();
            location.reload();
        } else {
            alert('You clicked No! Action canceled.');
        }
    });

    if (nameVal && bdayVal) {
        spanName.textContent = nameVal;
        age.textContent = ageFunc(bdayVal);
        
        countdown(bdayVal);
        checkBirthdayReset();
    } else {
        showModal(container);
    }
});

const showModal = (container) => {
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
                <label>Birth Date : </label>
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
        
        location.reload(); // Reload to apply changes immediately
    });
};

const countdown = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();

    let nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
    }

    const intervalId = setInterval(() => {
        updateCountdown(nextBday, intervalId);
    }, 1000); // Changed from 100ms to 1s for better performance
};

const updateCountdown = (targetDate, intervalId) => {
    const now = new Date();
    let diff = targetDate - now; 

    if (diff <= 0) {
        clearInterval(intervalId);

        const nameVal = localStorage.getItem('name') || "User";
        const heading = document.querySelector("h2");
        if (heading) {
            heading.innerHTML = `🎉 Happy Birthday, ${nameVal}! 🎂`;
        }

        localStorage.setItem("lastBirthdayDisplayed", new Date().toDateString());
        return;
    }

    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44)); 
    const weeks = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.querySelector(".box:nth-child(1) h3").textContent = formatTime(months);
    document.querySelector(".box:nth-child(2) h3").textContent = formatTime(weeks);
    document.querySelector(".box:nth-child(3) h3").textContent = formatTime(days);
    document.getElementById("hrs").textContent = formatTime(hours);
    document.getElementById("mins").textContent = formatTime(minutes);
    document.getElementById("sec").textContent = formatTime(seconds);
};

const checkBirthdayReset = () => {
    const lastBirthdayDisplayed = localStorage.getItem("lastBirthdayDisplayed");
    const today = new Date().toDateString();

    if (lastBirthdayDisplayed && lastBirthdayDisplayed !== today) {
        localStorage.removeItem("lastBirthdayDisplayed");
        location.reload();
    }
};

const formatTime = (time) => (time < 10 ? `0${time}` : time);

const ageFunc = (bday) => {
    const birthDate = new Date(bday);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear() + 1;
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
