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
            "href" : "./site-projects-root.html",
            "text" : "PROJECTS"
        },
        {
            "href" : "./site-portfolio-root.html",
            "text" : "PORTFOLIO"
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
            eLink.setAttribute("data-page", linkData.href); // For dynamic loading
            eLink.className = "header-button-link"; // Add a class for styling

            eLink.setAttribute("aria-label", linkData.text); // Screen readers will read this
            eLink.innerHTML = linkData.text;

            // Prevent default link behavior and use dynamic loading instead
            eLink.addEventListener("click", (e) => {
                e.preventDefault();
                loadPage(linkData.href);
            });
            
            eListElem.appendChild(eLink);

            // Add hover effect with animation
            eListElem.addEventListener("mouseover", () => {
                eListElem.classList.add("button-hover");
            });
            
            eListElem.addEventListener("mouseout", () => {
                eListElem.classList.remove("button-hover");
            });

            // Append the list element to the parent container
            eList.appendChild(eListElem);
        }
    }
    else
    {
        console.log("Failed to find 'templateHeader' element");
    }
}

// Dynamic page loading
let contentCache = {}; // Cache for loaded content

async function loadPage(url) {
    // If we already have the page content cached, use that
    if (contentCache[url]) {
        transitionToNewContent(contentCache[url]);
        return;
    }

    try {
        // Animate current content out
        document.querySelector('main').classList.add('slide-out');
        
        // Fetch the new page
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Extract the main content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('main').innerHTML;
        
        // Cache the content for future use
        contentCache[url] = newContent;
        
        // Wait for exit animation to complete
        setTimeout(() => {
            transitionToNewContent(newContent);
        }, 300); // Match this with CSS transition duration
        
        // Update URL without page refresh
        window.history.pushState({path: url}, '', url);
        
        // Update page title and meta information
        const newTitle = doc.querySelector('title').textContent;
        document.title = newTitle;
        
        // Update the header text if needed
        const headerTextMeta = doc.querySelector('meta[name="headerText"]');
        if (headerTextMeta) {
            const currentMeta = document.head.querySelector('meta[name="headerText"]');
            if (currentMeta) {
                currentMeta.content = headerTextMeta.content;
                // Update the header title
                const headerTitle = document.querySelector('.HeaderTitle');
                if (headerTitle) {
                    headerTitle.innerHTML = `Michael Nevins - ${headerTextMeta.content}`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading page:', error);
        // Fallback to traditional navigation on error
        window.location.href = url;
    }
}

function transitionToNewContent(content) {
    const mainElement = document.querySelector('main');
    
    // Replace content while it's invisible
    mainElement.innerHTML = content;
    
    // Animate new content in
    mainElement.classList.remove('slide-out');
    mainElement.classList.add('slide-in');
    
    // Remove animation class after transition completes
    setTimeout(() => {
        mainElement.classList.remove('slide-in');
    }, 500);
    
    // Re-initialize any scripts needed for the new content
    initializeNewPageScripts();
}

function initializeNewPageScripts() {
    // Detect which page we're on and run the appropriate initialization
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('portfolio')) {
        // Check if the script is already loaded
        if (typeof initializeProjectPage === 'function') {
            initializeProjectPage();
        } else {
            // Load and execute the script if it's not already loaded
            loadScript('script-project-page.js', () => {
                if (typeof initializeProjectPage === 'function') {
                    initializeProjectPage();
                }
            });
        }
    } else if (currentPath.includes('projects')) {
        // Initialize projects page scripts
        if (typeof initializeMiscProjects === 'function') {
            initializeMiscProjects();
        } else {
            loadScript('script-misc-projects.js', () => {
                if (typeof initializeMiscProjects === 'function') {
                    initializeMiscProjects();
                }
            });
        }
    }
    
    // Add more conditional initializations as needed
}

function loadScript(src, callback) {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
        callback();
        return;
    }
    
    // Create and append the script
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.body.appendChild(script);
}

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.path) {
        loadPage(event.state.path);
    } else {
        // Fallback to the current URL if no state is available
        loadPage(window.location.pathname);
    }
});

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

// Initialize the header
createHeader_default();

// Initial page state
window.history.replaceState({path: window.location.pathname}, '', window.location.pathname);