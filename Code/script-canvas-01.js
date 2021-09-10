let g_C; //Canvas
let g_canvasSize = [600, 400];

function InitCanvas()
{
    g_C = document.getElementById("canvas-01");
}

function DrawTutorialStuff()
{
    let ctx = g_C.getContext("2d");

    //Draw a rect
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(10, 10, 150, 75);

    //Draw a stroke
    ctx.strokeStyle = "#FFF"
    ctx.moveTo(0, 0);
    ctx.lineTo(g_canvasSize[0], g_canvasSize[1]);
    ctx.stroke();

    //Draw a circle
    ctx.beginPath();
    let xPos = 95;
    let yPos = 95;
    ctx.arc(xPos, yPos, 40, 0, 2 * Math.PI);
    ctx.stroke();

    //Draw a gradient
    let grd = ctx.createLinearGradient(0, 0, 200, 0);
    grd.addColorStop(0, "#F00");
    grd.addColorStop(1, "#020");

    ctx.fillStyle = grd;
    ctx.fillRect(10, 10, 150, 80);
}

function DrawClockDemo()
{
    let c = g_C.getContext("2d");
    let radius = g_canvasSize[1] / 2.0;

    function DrawBG()
    {
        c.translate(radius, radius);
        radius *= 0.9;
        
        c.beginPath();
        c.fillStyle = "white";
        c.arc(0, 0, radius, 0, 2 * Math.PI);
        c.fill();

        let grad = c.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.05);
        grad.addColorStop(0, '#333');
        grad.addColorStop(0.5, '#fff');
        grad.addColorStop(1, '#333');
        c.strokeStyle = grad;
        c.lineWidth = radius * 0.1;
        c.stroke();

        c.beginPath();
        c.fillStyle = "#333";
        c.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
        c.fill();
    }
    
    function DrawNumbers()
    {
        let num;
        c.font = (radius * 0.15).toString() + "px arial";
        c.textBaseline = "middle";
        c.textAlign = "center";
        for(let num = 1; num <= 12; ++num)
        {
            const pi2 = (2 * Math.PI);
            let rads = ((pi2 / 12.0));

            c.rotate(rads);
            c.translate(0, -radius * 0.85);
            c.rotate(-rads);
            c.fillText(num.toString(), 0, 0);
            c.rotate(rads);
            c.translate(0, rads * 0.85);
            c.rotate(-rads);
        }
    }

    DrawBG();
    DrawNumbers();
}

InitCanvas();

DrawClockDemo();