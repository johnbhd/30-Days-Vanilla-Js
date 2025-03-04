    document.addEventListener('DOMContentLoaded', () => {
        const taskCon = document.getElementById('taskCon');
        const input = document.getElementById('input-text');
        const form = document.getElementById('myForm'); 
        // load task
        const loadTask = () => {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.forEach(task => addTask(task));
        }
        // save task
        const saveTasks = (tasks) => {
            localStorage.setItem("tasks", JSON.stringify(tasks));
        }
        // rename function 
        const renameTask = (oldVal, newVal) => {
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

            const taskIndex = tasks.indexOf(oldVal);
            if (taskIndex !== -1) {
                tasks[taskIndex] = newVal;
                saveTasks(tasks);
            }
        }
        // addtask 
        const addTask = (taskVal) => {
            const taskDiv = document.createElement('div');
            taskDiv.classList.add('task');

            taskDiv.innerHTML = `
                    <input type="checkbox">
                    <input type="text" id="taskInput" value="${taskVal}">
                    <i class="fa-solid fa-trash delete"></i><br>
            `;
            //rename
            const inputTask = taskDiv.querySelector('input[type="text"]');
            inputTask.addEventListener('input', () => {
                renameTask(taskVal, inputTask.value);
                taskVal = inputTask.value;
            })
            // delete
            taskDiv.querySelector('.delete').addEventListener('click', () => {
                removeTask(taskVal);
                taskDiv.remove();
            });

            taskCon.append(taskDiv);
        }
        // delete task localstorage
        const removeTask = (taskVal) => {
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks = tasks.filter(task => task !== taskVal);
            saveTasks(tasks);
        }

        const myForm = (event) => {
            event.preventDefault();
        
            const inputVal = input.value.trim();
        
            if (inputVal === ""){
                alert("Task cannot be empty");
                return ;
            }
            // add task to the localstorage
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.push(inputVal);
            addTask(inputVal);
            saveTasks(tasks);

            input.value = '';
        }
        
        form.addEventListener('submit', (event) => myForm(event));

        loadTask();
    });