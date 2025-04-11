const form = document.getElementById('FieldForm');

form.addEventListener('submit', () => {
 
    const Inputs = form.querySelectorAll('input, select');
    const studentInfo = {};

    Inputs.forEach(info => {
        studentInfo[info.id] = info.value;
    })

    alert("Successful added Student!");
    let dataLocalInfo = JSON.parse(localStorage.getItem("students")) || [];
    dataLocalInfo.push(studentInfo);

    localStorage.setItem('students', JSON.stringify(dataLocalInfo));


});
console.log(localStorage);
function DisplayData() {
    let dataLocalInfo = JSON.parse(localStorage.getItem('students')) || [];
    const dataResult = document.getElementById('dataResult');


    dataLocalInfo.forEach(student => {
        console.log(student.nameAdd);
        const dataTable = `
            <tr>
                <td><input type="text" value="${student.nameAdd}" id="name1"></td>
                <td><input type="number" value="${student.ageAdd}" id="age1"></td>
                <td><input type="text" value="${student.courseAdd}" id="course1"></td>
                <td><input type="text" value="${student.sectionAdd}" id="section1"></td>
                <td class="but">
                    <button id="update">Update</button>
                    <button id="delete">Delete</button>
                </td>
            </tr>
        `;
        dataResult.innerHTML += dataTable;
    });

}
DisplayData();