function addSecondButton()
{
    let eButt = document.createElement("button");
    eButt.innerHTML = "Button TWO";
    
    let eFooter = document.querySelector("footer");
    eFooter.appendChild(eButt);

    return eButt;
}

function onButtPressed()
{
    document.body.innerHTML = "WIPEOUUUUTTTTT!!!!";
}

let eButter = addSecondButton();
eButter.onclick = onButtPressed;

let eSpamBox = document.getElementById("spambox");
if (eSpamBox)
{
    for(let i = 0; i < 50; ++i)
    {
        let eNew = document.createElement("p");
        eNew.innerHTML = "SpamBoxContent".toUpperCase();
        eSpamBox.appendChild(eNew);
    }
}