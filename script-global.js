class LinkDesc
{
    constructor(href, text)
    {
        this.href = linkString;
        this.text = text;
    }
}

function createHeader_default()
{
    let arrHeaderSites = [
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

        let sHeaderText = "ABOUT";
        let eMeta = document.head.querySelector("meta[name=\"headerText\"]");
        if (eMeta)
        {
            let sHeaderMetadata = eMeta.content;
            console.log("headerText: " + sHeaderMetadata);
            if (sHeaderMetadata)
            {
                sHeaderText = sHeaderMetadata;
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
            eLink.innerHTML = linkData.text;
            
            eListElem.appendChild(eLink);
        }
    }
    else
    {
        console.log("Failed to find 'templateHeader' element");
    }
}

console.log("Running global script");

createHeader_default();
