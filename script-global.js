class LinkDesc
{
    constructor(href, text)
    {
        this.href = linkString;
        this.text = text;
    }
}

/* Hide the header bar when scrolling down, make it reappear on scrolling up */
const headerBar = document.getElementById("templateHeader");
let prevScrollPos = window.scrollY;
window.addEventListener("scroll", () => {
    let currentScrollPos = window.scrollY;
    if (prevScrollPos < currentScrollPos)
    {
        headerBar.classList.add("hide");
    }
    else
    {
        headerBar.classList.remove("hide");
    }
    prevScrollPos = currentScrollPos;
    
});

function createHeader_default()
{
    let arrHeaderSites = [
        /*
        {
            "href" : "./site-audio-root.html",
            "text" : "AUDIO"
        },
        {
            "href" : "./site-video-root.html",
            "text" : "VIDEO"
        },
        {
            "href" : "./site-code-root.html",
            "text" : "CODE"
        },
        {
            "href" : "./site-fx-root.html",
            "text" : "FX"
        },
        {
            "href" : "./site-art-root.html",
            "text" : "ART"
        },
        
        {
            "href" : "./site-ML-root.html",
            "text" : "ML"
        },
        
        {
            "href" : "./site-games-root.html",
            "text" : "GAMES"
        },
        */
        {
            "href" : "./site-portfolio-root.html",
            "text" : "PORTFOLIO"
        },
        {
            "href" : "./site-projects-root.html",
            "text" : "PROJECTS"
        },
        {
            "href" : "./site-about.html",
            "text" : "ABOUT"
        },
    ];

    let eHeader = document.getElementById("templateHeader");
    if (eHeader)
    {
        let eTitle = document.createElement("h1");
        eTitle.className = "HeaderTitle";

        let sHeaderText = "Michael Nevins";
        let eMeta = document.head.querySelector("meta[name=\"headerText\"]");
        if (eMeta)
        {
            let sHeaderMetadata = eMeta.content;
            console.log("headerText: " + sHeaderMetadata);
            if (sHeaderMetadata)
            {
                sHeaderText += " - " + sHeaderMetadata;
            }
        }
        
        eTitle.innerHTML = sHeaderText;
        eHeader.appendChild(eTitle);

        let eNav = document.createElement("nav");
        eHeader.appendChild(eNav);

        let eList = document.createElement("ul");
        eNav.appendChild(eList);

        for (const linkData of arrHeaderSites)
        {
            let eListElem = document.createElement("li");
            eListElem.className = "header-nav-button";

            eList.appendChild(eListElem);
            
            let eLink = document.createElement("a");
            eLink.setAttribute("href", linkData.href);
            eLink.className = "header-button-link"; // Add a class for styling

            eLink.setAttribute("aria-label", linkData.text); // Screen readers will read this
            eLink.innerHTML = linkData.text;

            //Make the Background color clickable
            eListElem.addEventListener("hover", () => {
                eListElem.style.backgroundColor = "green";
            });
            eListElem.addEventListener("click", () => {
                window.location.href = linkData.href;
            });
            
            eListElem.appendChild(eLink);

            // Append the list element to the parent container
            eList.appendChild(eListElem);
        }
    }
    else
    {
        console.log("Failed to find 'templateHeader' element");
    }
}

class Widget_Socials extends HTMLElement
{
    constructor()
    {
        super();

        const shadow = this.attachShadow({mode: 'open'});

        const button = document.createElement('button');
        button.textContent = 'Click me';
        button.imag

        const style = document.createElement('style');
        style.textContent = `
        button {
            font-size: 1em;
            padding: 10px 20px;
        }
        `;



        shadow.appendChild(style);
        shadow.appendChild(button);
    }
}

customElements.define('widget-socials', Widget_Socials);

function CreateNavBar()
{
    
}

console.log("Running global script");

createHeader_default();
