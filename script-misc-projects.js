// Misc projects script
let miscProjectContentDiv = null;
let miscProjectButtons = null;
let miscProjectBg = null;
let miscProjectBgImage = null;

function refreshProjectElements() {
    miscProjectContentDiv = document.getElementById("projectContentDiv");
    miscProjectButtons = document.getElementsByClassName("projectButton");
    miscProjectBg = document.getElementById('projectBgDiv');
    miscProjectBgImage = document.getElementById('projectBgImg');

    return miscProjectContentDiv && miscProjectButtons && miscProjectBg && miscProjectBgImage;
}

class MiscProject {
    constructor(name, description, imagePath, content, demoLink, sourceLink, demoLabel) {
        this.name = name;
        this.description = description;
        this.imagePath = imagePath;
        this.content = content;
        this.demoLink = demoLink || null;
        this.sourceLink = sourceLink || null;
        this.demoLabel = demoLabel || "View Demo";
    }

    // Generates HTML for the project
    generateHTML() {
        const projectLinks = [
            this.demoLink ? `<a href="${this.demoLink}" target="_blank" class="demo-button">${this.demoLabel}</a>` : '',
            this.sourceLink ? `<a href="${this.sourceLink}" target="_blank" class="demo-button source-button">GitHub Repo</a>` : ''
        ].join('');

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
                    ${projectLinks ? `<div class="project-links">${projectLinks}</div>` : ''}
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
    ),
    "aitimeline": new MiscProject(
        "AI Model Timeline",
        "An interactive timeline website for comparing major AI model and coding-tool releases across providers.",
        "./Resources/Projects/Misc/ai-model-timeline.png",
        `
        <p>AI Model Timeline organizes foundation model launches and agentic coding tools on a horizontal timeline so release cadence can be compared across companies and product lines.</p>
        <h3>Highlights:</h3>
        <ul>
            <li>Company rows with compact product-line lanes</li>
            <li>Filters for frontier LLMs, open-source LLMs, coding harnesses, image generation, video generation, and 3D generation</li>
            <li>Month and year guides, zoom controls, release-gap labels, and a live Today marker</li>
        </ul>
        <h3>Technologies Used:</h3>
        <ul>
            <li>React 19</li>
            <li>Vite</li>
            <li>TypeScript</li>
            <li>Tailwind CSS</li>
            <li>Motion</li>
        </ul>
        `,
        "https://kvick-games.github.io/AI_Model_Timeline_Website/",
        "https://github.com/kvick-games/AI_Model_Timeline_Website",
        "View Live Site"
    )
};

// Function to clear project content div
function clearProjectContentDiv() {
    if (!miscProjectContentDiv) {
        refreshProjectElements();
    }

    if (!miscProjectContentDiv) {
        return;
    }

    while (miscProjectContentDiv.firstChild) {
        miscProjectContentDiv.removeChild(miscProjectContentDiv.firstChild);
    }
}

// Function to load project content
function loadProjectContent(projectKey) {
    if (!refreshProjectElements()) {
        return;
    }

    // Check if project exists
    if (miscProjects[projectKey]) {
        // Get project
        const project = miscProjects[projectKey];
        
        // Set background image if available
        if (project.imagePath) {
            miscProjectBgImage.src = project.imagePath;
        }
        
        // Generate and insert HTML
        miscProjectContentDiv.innerHTML = project.generateHTML();
        
        // Update URL
        window.history.pushState(null, "", "?project=" + projectKey);
    } else {
        // Project not found, show error
        miscProjectContentDiv.innerHTML = `
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

function initializeMiscProjects() {
    if (!refreshProjectElements()) {
        return;
    }

    // Rebinding with onclick keeps dynamic navigation from stacking duplicate listeners.
    Array.from(miscProjectButtons).forEach(button => {
        button.onclick = () => {
            clearProjectContentDiv();

            const projectKey = button.getAttribute("projectKey");
            loadProjectContent(projectKey);
        };
    });

    handleURL();
    updateParallax();
}

// Parallax effect for background
function updateParallax() {
    if (!miscProjectBg && !refreshProjectElements()) {
        return;
    }

    let scrollPosition = window.scrollY;
    let scrollRate = 0.1;
    let bgOffset = -255.0;
    
    let newTopPos = bgOffset + scrollPosition * scrollRate;
    miscProjectBg.style.top = `${newTopPos}px`;
}

// Add scroll listener for parallax effect
window.addEventListener('scroll', function () {
    updateParallax();
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMiscProjects);
} else {
    initializeMiscProjects();
}

window.initializeMiscProjects = initializeMiscProjects;

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
