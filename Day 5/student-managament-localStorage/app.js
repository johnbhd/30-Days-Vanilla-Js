const form = document.getElementById('FieldForm');
// Add Students
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
// Display Data in table
function DisplayData() {
    let dataLocalInfo = JSON.parse(localStorage.getItem('students')) || [];
    const dataResult = document.getElementById('dataResult');

    dataResult.innerHTML = ''; 
    dataLocalInfo.forEach((student, index) => {
        console.log(student.nameAdd);
        const dataTable = `
            <tr id="dataRow" data-index="${index}">
                <td><input type="text" value="${student.nameAdd}" class="name1"></td>
                <td><input type="number" value="${student.ageAdd}" class="age1"></td>
                <td>
                    <select class="course1">
                        <option value="BSIT" ${student.courseAdd === 'BSIT' ? 'selected' : ''}>BSIT</option>
                        <option value="Nursing" ${student.courseAdd === 'Nursing' ? 'selected' : ''}>Nursing</option>
                        <option value="Business Administration" ${student.courseAdd === 'Business Administration' ? 'selected' : ''}>Business Administration</option>
                        <option value="Accountancy" ${student.courseAdd === 'Accountancy' ? 'selected' : ''}>Accountancy</option>
                        <option value="Education" ${student.courseAdd === 'Education' ? 'selected' : ''}>Education</option>
                        <option value="Engineering" ${student.courseAdd === 'Engineering' ? 'selected' : ''}>Engineering</option>
                        <option value="Hospitality Management" ${student.courseAdd === 'Hospitality Management' ? 'selected' : ''}>Hospitality Management</option>
                        <option value="CS" ${student.courseAdd === 'CS' ? 'selected' : ''}>CS</option>
                        <option value="Psychology" ${student.courseAdd === 'Psychology' ? 'selected' : ''}>Psychology</option>
                        <option value="Architecture" ${student.courseAdd === 'Architecture' ? 'selected' : ''}>Architecture</option>
                    </select>
                </td>
                <td>
                    <select class="section1">
                        <option value="1A" ${student.sectionAdd === '1A' ? 'selected' : ''}>1A</option>
                        <option value="1B" ${student.sectionAdd === '1B' ? 'selected' : ''}>1B</option>
                        <option value="1C" ${student.sectionAdd === '1C' ? 'selected' : ''}>1C</option>
                    </select>
                </td>
                <td class="but">
                    <button class="updateBut">Update</button>
                    <button class="deleteBut">Delete</button>
                </td>
            </tr>


        `;
        dataResult.innerHTML += dataTable;
    });

}
// delete and update 

document.getElementById('dataResult').addEventListener('click', (e) => {
    const row = e.target.closest("tr");
    const index = row.dataset.index;

    if (e.target.classList.contains('deleteBut')) {
        let students = JSON.parse(localStorage.getItem('students'));

            students.splice(index, 1);
            localStorage.setItem("students", JSON.stringify(students));
            alert("Succesfully Deleted!");
            DisplayData();
    }
    if (e.target.classList.contains('updateBut')) {
        UpdateData(row, index);
    }
    
});
// update func
function UpdateData(row, index) {
    
    const fields = ['nameAdd', 'ageAdd', 'courseAdd', 'sectionAdd'];
    const selectors = ['.name1', '.age1', '.course1', '.section1'];
    
    let updatedStudent = {};
    
    selectors.forEach((selection, i) => {
        const value = row.querySelector(selection).value.trim();
        updatedStudent[fields[i]] = value;
    });
    
    let students = JSON.parse(localStorage.getItem('students')) || [];
    students[index] = updatedStudent;
    
    localStorage.setItem('students', JSON.stringify(students));
    alert('Successfully Updated!');
    
}
// update Key Enter 
document.getElementById('dataResult').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const row = e.target.closest("tr");
        const index = row ? row.dataset.index : null;

        if (row && index !== null) {
            UpdateData(row, index);
        }
    }
});

// Save
function SaveData() {
    const modal = document.getElementById('simpleModal');
    const pdf = document.getElementById('pdf');
    const jpg = document.getElementById('jpg');
    
    modal.style.display = 'flex';
    
    pdf.addEventListener('click', () => {
      alert('Saving as Pdf file...');
      modal.style.display = 'none';
      PdfSave();
    });
    
    jpg.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    


}
// PDF
function PdfSave() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    setTimeout(() => {
        const table = document.getElementById('table');
        const cloneTable = table.cloneNode(true);
        
        cloneTable.querySelectorAll('th:last-child, td.but').forEach(x => x.remove());
        
        cloneTable.querySelectorAll('td').forEach(td => {
            const input = td.querySelector('input');
            const select = td.querySelector('select');
            if (input) {
                td.textContent = input.value;
            } else if (select) {
                td.textContent = select.value;
            }
        });
        
        table.style.display = 'none';
        document.body.appendChild(cloneTable);
    
        doc.autoTable({
            html: cloneTable,
            headStyles: {
                fillColor: [173, 216, 230], 
                textColor: [0, 0, 0],
                fontSize: 12,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.5,
                lineColor: [200, 200, 200],
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontSize: 11,
                lineWidth: 0.5,
                lineColor: [200, 200, 200],
                halign: 'center',
                valign: 'middle',
            },
            margin: { top: 20 },
            tableWidth: 'auto',
            startY: 40,
            theme: 'grid',
            styles: {
                cellPadding: 5,
                overflow: 'linebreak',
                halign: 'center',
                font: 'helvetica',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            }
        });
        doc.save('student_management.pdf');
        document.body.removeChild(cloneTable);
        location.reload();
    }, 500);
}
// JPG

DisplayData();