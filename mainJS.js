//import * as thre from 'three.module.js'

function addFooterButton_Second()
{
    let eButt = document.createElement("button");
    eButt.innerHTML = "Wipeout";
    
    let eFooter = document.querySelector("footer");
    if (eFooter)
    {
        eFooter.appendChild(eButt);
    }

    return eButt;
}

function onSecondFooterButtonPressed()
{
    document.body.innerHTML = "WIPEOUUUUTTTTT!!!!";
}

let eButter = addFooterButton_Second();
eButter.onclick = onSecondFooterButtonPressed;

let eSpamBox = document.getElementById("spambox");
if (eSpamBox)
{
    for(let i = 0; i < 225; ++i)
    {
        let eNew = document.createElement("p");
        eNew.innerHTML = i.toString() + " - SpamBoxContent";
        eNew.className = "spambox";
        eNew.id = "spam" + i.toString();

        //eNew.style.display = "inline-block";
        eNew.style.width = "115px";
        eSpamBox.appendChild(eNew);
    }
}

//==============================
//Nav bar

let offsetLeft = 350;
let navBarLeftOffset = 50;
let navBarExpandedLeftOffset = offsetLeft + navBarLeftOffset;
let navBarExpanded = false;

function toggleOpenNav()
{
    if (navBarExpanded)
    {
        closeNav();
    }
    else
    {
        openNav();
    }
}

function openNav()
{
    navBarExpanded = true;

    let eSidebar = document.getElementById("mainSideBar");
    if (eSidebar)
    {
        eSidebar.style.width = offsetLeft + "px";
    }
    else
    {
        console.error("Failed to get sidebar");
    }

    let eMainContent = document.getElementById("mainContent");
    if (eMainContent)
    {
        eMainContent.style.width = offsetLeft + "px";
    }
    else
    {
        console.error("Failed to get maincontent");
    }

    document.getElementById("navIcon").style.left = offsetLeft + "px";
}

function closeNav()
{
    navBarExpanded = false;

    let eSidebar = document.getElementById("mainSideBar");
    if (eSidebar)
    {
        eSidebar.style.width = 0 + "px";
    }
    else
    {
        console.error("Failed to get sidebar");
    }

    let eMainContent = document.getElementById("mainContent");
    if (eMainContent)
    {
        eMainContent.style.width = 0 + "px";
    }
    else
    {
        console.error("Failed to get maincontent");
    }

    document.getElementById("navIcon").style.left = navBarLeftOffset + "px";
}