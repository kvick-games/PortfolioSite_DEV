// Misc projects script
const projectContentDiv = document.getElementById("projectContentDiv");
const projectButtons = document.getElementsByClassName("projectButton");
const projectBg = document.getElementById('projectBgDiv');
const projectBgImage = document.getElementById('projectBgImg');

class MiscProject {
    constructor(name, description, imagePath, content, demoLink) {
        this.name = name;
        this.description = description;
        this.imagePath = imagePath;
        this.content = content;
        this.demoLink = demoLink || null;
    }

    // Generates HTML for the project
    generateHTML() {
        let html = `
            <div class="project-content-header">
                <h1 id="project-title">${this.name}</h1>
            </div>
            <div id="project-content-body">
                <div id="project-main-content">
                    ${this.description}
                    <br><br>
                    <div class="project-image">
                        <img src="${this.imagePath}" alt="${this.name}" style="max-width: 100%;">
                    </div>
                    <br><br>
                    ${this.content}
                    ${this.demoLink ? `<br><br><a href="${this.demoLink}" target="_blank" class="demo-button">View Demo</a>` : ''}
                </div>
            </div>
        `;
        return html;
    }
}

// Repository of misc projects
const miscProjects = {
    "musicvis": new MiscProject(
        "Music Visualizer", 
        "An interactive music visualizer created with Web Audio API and Canvas.",
        "./Resources/Projects/Misc/musicvis.jpg",
        `
        <p>This project uses the Web Audio API to analyze audio frequencies in real-time and creates dynamic visualizations with HTML5 Canvas.</p>
        <h3>Features:</h3>
        <ul>
            <li>Real-time frequency analysis</li>
            <li>Multiple visualization modes</li>
            <li>Responsive design that works across devices</li>
            <li>Customizable color schemes</li>
        </ul>
        <h3>Technologies Used:</h3>
        <ul>
            <li>JavaScript</li>
            <li>Web Audio API</li>
            <li>HTML5 Canvas</li>
            <li>CSS3</li>
        </ul>
        `,
        "#" // Replace with actual demo link when available
    ),
    "generativeart": new MiscProject(
        "Generative Art Experiments", 
        "A collection of procedural art experiments using algorithms and randomization.",
        "./Resources/Projects/Misc/generativeart.jpg",
        `
        <p>This is a collection of generative art experiments I've created while exploring algorithmic art generation techniques.</p>
        <h3>Techniques Explored:</h3>
        <ul>
            <li>Lindenmayer Systems (L-systems)</li>
            <li>Cellular Automata</li>
            <li>Flow Fields</li>
            <li>Voronoi Diagrams</li>
            <li>Recursive Patterns</li>
        </ul>
        <h3>Tools Used:</h3>
        <ul>
            <li>p5.js</li>
            <li>Three.js</li>
            <li>Custom WebGL shaders</li>
        </ul>
        <p>Each experiment is focused on exploring a different technique or visual aesthetic. I've been particularly interested in creating systems that evolve over time and respond to input.</p>
        `,
        "#" // Replace with actual demo link when available
    )
};

// Function to clear project content div
function clearProjectContentDiv() {
    while (projectContentDiv.firstChild) {
        projectContentDiv.removeChild(projectContentDiv.firstChild);
    }
}

// Function to load project content
function loadProjectContent(projectKey) {
    // Check if project exists
    if (miscProjects[projectKey]) {
        // Get project
        const project = miscProjects[projectKey];
        
        // Set background image if available
        if (project.imagePath) {
            projectBgImage.src = project.imagePath;
        }
        
        // Generate and insert HTML
        projectContentDiv.innerHTML = project.generateHTML();
        
        // Update URL
        window.history.pushState(null, "", "?project=" + projectKey);
    } else {
        // Project not found, show error
        projectContentDiv.innerHTML = `
            <div class="project-content-header">
                <h1>Project Not Found</h1>
            </div>
            <div id="project-content-body">
                <p>Sorry, the requested project could not be found.</p>
            </div>
        `;
    }
}

// Handle URL parameters on page load
function handleURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const project = urlParams.get('project');

    if (project && miscProjects[project]) {
        loadProjectContent(project);
    }
}

// Add click listeners to all project buttons
Array.from(projectButtons).forEach(button => {
    button.addEventListener("click", () => {
        clearProjectContentDiv();

        const projectKey = button.getAttribute("projectKey");
        loadProjectContent(projectKey);
    });
});

// Handle URL parameters on page load
window.onload = handleURL;

// Parallax effect for background
function updateParallax() {
    let scrollPosition = window.scrollY;
    let scrollRate = 0.1;
    let bgOffset = -255.0;
    
    let newTopPos = bgOffset + scrollPosition * scrollRate;
    projectBg.style.top = `${newTopPos}px`;
}

// Add scroll listener for parallax effect
window.addEventListener('scroll', function () {
    updateParallax();
});

// Initial parallax update
updateParallax();
console.log("script-misc-projects.js loaded");

/*
HOW TO ADD A NEW PROJECT:
1. Create project assets in Resources/Projects/Misc/ directory
2. Add a new button to site-projects-root.html:
   <li><button class="projectButton" id="projectBtn-[key]" projectKey="[key]" dispText="[DisplayName]">[DisplayName]</button></li>
3. Add project to the miscProjects object in this file:
   "[key]": new MiscProject(
     "Project Name", 
     "Brief description of the project",
     "./Resources/Projects/Misc/[image-name].jpg",
     `
     <p>Detailed HTML content of your project goes here.</p>
     <h3>Features:</h3>
     <ul>
       <li>Feature 1</li>
       <li>Feature 2</li>
     </ul>
     `,
     "optional-demo-link.html" // Remove this parameter if no demo is available
   )
*/