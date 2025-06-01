const projCon = document.querySelector('.proj-con');

const ConProject = (data) => {
    data.forEach(project => {
        const proj = document.createElement('div')
        proj.classList.add('project');
    
        const img = document.createElement('img')
        img.src = `${project.img}`;
        img.alt = `${project.name}`;

        const title = document.createElement('h4');
        title.textContent = `${project.name}`;
        
        const projectLink = document.createElement('div');
        projectLink.className= 'project-link';

        const repoLink = document.createElement('a');
        repoLink.href = project.repo;
        repoLink.textContent = `Repo`;
        repoLink.target = '_blank';

        const viewLink = document.createElement('a');
        viewLink.href = project.link;
        viewLink.textContent = `View`;
        viewLink.target = '_blank';


        projectLink.append(repoLink, viewLink);
        proj.append(img, title, projectLink);
        projCon.appendChild(proj);

        console.log(project.name)
    });
}

const DisplayProject = async () => {
    try {
        const response = await fetch('./src/js/project.json');
        const data = await response.json();
        console.log(data);
        ConProject(data);

    } catch (error) {
        console.log(error);
    }
}   

DisplayProject();