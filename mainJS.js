function addSecondButton()
{
    let eButt = document.createElement("button");
    eButt.innerHTML = "Button TWO";
    
    document.body.appendChild(eButt);

    return eButt;
}

function onButtPressed()
{
    document.body.innerHTML = "WIPEOUUUUTTTTT!!!!";
}

let eButter = addSecondButton();
eButter.onclick = onButtPressed;
