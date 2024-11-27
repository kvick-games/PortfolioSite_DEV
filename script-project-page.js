//import * as thre from 'three.module.js'

const projectContentDiv = document.getElementById("projectContentDiv");
const projectBodyDiv = document.getElementById("project-content-body");

const projectButtons = document.getElementsByClassName("projectButton");

class ProjectPage
{
    constructor(projectName, projectHTMLPath)
    {
        this.projectName = projectName;
        this.projectHTMLPath = projectHTMLPath;
    }

    async LoadProjectPageHTML()
    {
        try 
        {
            //Load a project subpage
            let response = await fetch(this.projectHTMLPath);
            if (!response.ok)
            {
                throw new Error("HTTP error: " + response.status);
            }

            let data = await response.text();
            console.log(data);
            console.log("Inserting data");

            //projectContentDiv.innerHTML = data;

            return data;
/*
            var projectDivHTML = projectPage.projectHTMLPath;
            var loadedProjectDiv = fetch(projectDivHTML)
            .then(response => response.text())
            .then(data => {
                console.log(data);
                console.log("Inserting data");
                
                return data;
            })
            .catch(error => {
                console.log("Error loading project sub-page: " + error);
            });
             */
        }
        catch (error)
        {
            console.log("Error loading project page HTML: " + error);
            throw error;
        }
        
    }
}

function GetProjectPage(projectName)
{
    switch (projectName)
    {
        case "gow":
            return new ProjectPage("God of War(2018)", "Resources/Projects/project-site_GoW.html");
        case "judas":
            var page = new ProjectPage("Judas", "Resources/Projects/project-site_Judas.html");
            return page;
        case "tanuki":
            return new ProjectPage("Tanuki", "Resources/Projects/project-site_Tanuki.html");
        case "LevelGenerator":
            return new ProjectPage("Level Generator", "Resources/Projects/project-site_LevelGenerator.html");
        case "EWA":
            return new ProjectPage("EWA", "Resources/Projects/project-site_EWA.html");
        default:
            return new ProjectPage("blank");
    }
}

function ClearProjectContentDiv()
{
    //Clear the project content div
    while (projectContentDiv.firstChild)
    {
        projectContentDiv.removeChild(projectContentDiv.firstChild);
    }
}

function GenerateProjectContentDiv(activeProjectKey)
{
    projectPage = GetProjectPage(activeProjectKey);

    //Add spam text to just see it on the page
    var spamText = document.createElement("p");

    var spamString = "";
    var projectName = projectPage.projectName;
    for (let i = 0; i < 40; ++i)
    {
        spamString += i.toString() + " - Project " + projectName + " content goes here<br>";
    }
    spamText.innerHTML = spamString;

    projectPage.LoadProjectPageHTML()
    .then(htmlContent => {
        projectContentDiv.innerHTML = htmlContent;
    })
    ;
    
    //projectBodyDiv.appendChild(spamText);
}

function UpdateURL(projectKey)
{
    window.history.pushState(null, "", "?project=" + projectKey);
}

function HandleURL()
{
    const urlParams = new URLSearchParams(window.location.search);
    const project = urlParams.get('project');

    if (project)
    {
        GenerateProjectContentDiv(project);
    }
}

console.log("projectButtons" + projectButtons);
console.log("projectButtons[0]" + projectButtons[2]);

Array.from(projectButtons).forEach(button => {
    button.addEventListener("click", () => {
        ClearProjectContentDiv();

        buttonID = button.id;
        if (buttonID == "projectBtn-hide")
        {
            projectContentDiv.classList.add("hidden");
        }
        else
        {
            var projectKey = button.getAttribute("projectKey");
            
            UpdateURL(projectKey);
            GenerateProjectContentDiv(projectKey);
        }
        
        console.log("Project button clicked: " + projectKey);
    })
});


window.onLoad = HandleURL();

// Parallax effect
window.addEventListener('scroll', function () {
    console.log("scrolling");
    const parallax = document.querySelector('.project-bg');
    let scrollPosition = window.scrollY;
    parallax.style.backgroundPositionY = scrollPosition * 0.5 + 'px'; // Adjust speed by changing 0.5
});


console.log("script-project-page.js loaded");