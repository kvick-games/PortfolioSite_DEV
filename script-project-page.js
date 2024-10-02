//import * as thre from 'three.module.js'

const projectContentDiv = document.getElementById("projectContentDiv");
const projectBodyDiv = document.getElementById("project-content-body");

const projectButtons = document.getElementsByClassName("projectButton");

class ProjectPage
{
    constructor(projectName)
    {
        this.projectName = projectName;
    }
}

function GetProjectPage(projectName)
{
    switch (projectName)
    {
        case "gow":
            return new ProjectPage("God of War(2018)");
        case "judas":
            var page = new ProjectPage("Judas");
            
            return page;
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

    //Spam text to see the div
    projectBodyDiv.appendChild(spamText);
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

console.log("script-project-page.js loaded");