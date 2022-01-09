let g_canvas_width = 3400;
let g_canvas_height = g_canvas_width * 0.5;
let g_halfCanvasHeight = (g_canvas_height*0.5);

let g_numPoints = 90;
let g_points = [];
let g_line;
let g_capsule;

function setup()
{
    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    for(let i = 0; i < g_numPoints; ++i)
    {
        let xpos = (g_canvas_width / g_numPoints) * i;
        
        g_points.push(
            new SCircle(
                new Vector2(
                    xpos, 
                    g_halfCanvasHeight + ((Math.random() - 0.5) * 2.0) * g_halfCanvasHeight * 0.95
                ), 
                g_canvas_width / 6 / g_numPoints,
                new Color(1.0, 0.8, 0.3, 0.05)
            )
        );
    }

    //g_line = new SLine(new Vector2(50, 450), new Vector2(550, 450), new Color(1.0, 0.3, 0.3));
    /*
    g_capsule = new SCapsule(
        new SLine(new Vector2(50, 450), new Vector2(550, 450), new Color(1.0, 0.3, 0.3)),
        40,
        new Color(1.0, 0.7, 0.3)
    );
    */
}

function draw()
{
    let tempNewValues = [];
    for (let i = 0; i < g_points.length; ++i)
    {
        let current = g_points[i].pos.y;
        let avg = 0;
        
        //Get Prev neighbor
        if (i > 0)
        {
            avg += g_points[i-1].pos.y;
        }
        else
        {
            avg += g_halfCanvasHeight;
        }

        //Get Next neighbor
        if (i < g_points.length-1)
        {
            avg += g_points[i+1].pos.y;
        }
        else
        {
            avg += g_halfCanvasHeight;
        }

        avg /= 2;

        //Assign the new value
        let newY = Lerp(current, avg, 0.05);
        tempNewValues.push(newY);
    }

    //Apply new values
    for (let i = 0; i < g_points.length; ++i)
    {
        let newY = tempNewValues[i];
        g_points[i].pos.y = newY;
        
        
        let alpha = 0.1;
        let colorUp = new Color(1.0, 0.0, 0.0, alpha);
        let colorMiddle = new Color(1.0, 0.5, 0.0, alpha);
        let colorDown = new Color(0.0, 0.0, 1.0, alpha);

        let t = newY/g_canvas_height;
        let aboveHalf = t > 0.5;

        let finalColor = aboveHalf ? 
                            Color.Lerp(colorMiddle, colorUp, SUtils.MapRange(t, 0.5, 1.0, 0.0, 1.0)) :
                            Color.Lerp(colorDown, colorMiddle, SUtils.MapRange(t, 0.0, 0.5, 0.0, 1.0));

        //finalColor = Color.Lerp(colorDown, colorUp, t);

        g_points[i].SetColor(finalColor);

        /*
        g_points[i].color.SetColor(
            0.0 + Lerp(0.0, 1.0, ((newY / g_canvas_height) * 0.5 + 0.5) * 1.0),
            0.8 + Lerp(0.0, 1.0, ((newY / g_canvas_height) * 0.5 + 0.5) * 0.1),
            0.0 + Lerp(0.0, 1.0, ((newY / g_canvas_height) * 0.5 + 0.5) * 0.1),
            0.1
        );
         */
    }
    

    for (let i = 0; i < g_numPoints; ++i)
    {
        g_points[i].Draw();
        if (i > 0)
        {
            let p0 = g_points[i].pos;
            let p1 = g_points[i-1].pos;

            strokeWeight(2);
            stroke(200, 200, 200, 15);
            line(p0.x, p0.y, p1.x, p1.y);
        }
    }
}

//MOUSE STUFF

function mousePressed()
{
    //g_pinnedPoint.SetPinned(false);
}

function mouseReleased()
{
    //g_pinnedPoint.SetPinned(true);
}

function mouseDragged()
{
    
}