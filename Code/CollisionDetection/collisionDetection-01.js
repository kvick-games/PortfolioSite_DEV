let g_canvas_width = 800;
let g_canvas_height = g_canvas_width;

let g_circ;
let g_line;

function setup()
{
    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    g_circ = new SCircle(new Vector2(250, 250), 100, new Color(0.2, 0.5, 1.0));
    g_line = new SLine(new Vector2(50, 450), new Vector2(550, 450), new Color(1.0, 0.3, 0.3));
}

function DrawTest_InfiniteLineAgainstCircle()
{
    if (mouseIsPressed)
    {
        g_line.SetPosition1(GetMousePos());
    }

    let bCollisionOccurred = false;

    let vLine0ToCirc = g_circ.pos.Sub(g_line.pos0);
    let nLine = g_line.GetVec_0to1_Normalized();
    let vToLineProj = nLine.MultScalar(Vector2.Dot(vLine0ToCirc, nLine));
    
    let ptProjOnLine = g_line.pos0.Add(vToLineProj);
    let vCircToProjPoint = ptProjOnLine.Sub(g_circ.pos);

    if (vCircToProjPoint.Length() < g_circ.GetRadius())
    {
        bCollisionOccurred = true;
        g_circ.SetColor(new Color(0.3, 0.9, 0.5));
    }
    else
    {
        g_circ.SetColor(new Color(0.3, 0.4, 0.9));
    }

    //RENDER
    clear();
    
    g_circ.Draw();
    g_line.Draw();

    //Draw line to circle
    stroke(255, 255, 255);
    line(g_line.pos0.x, g_line.pos0.y, g_circ.pos.x, g_circ.pos.y);

    //Draw line from circle to projected line point
    stroke(155, 255, 155);
    line(g_circ.pos.x, g_circ.pos.y, ptProjOnLine.x, ptProjOnLine.y);

    //Draw circle at projected point from circle to line
    strokeWeight(2);
    fill(255, 255, 255, 150);
    circle(ptProjOnLine.x, ptProjOnLine.y, 25);
}

function DrawTest_LineSegmentAgainstCircle()
{
    if (mouseIsPressed)
    {
        g_line.SetPosition1(GetMousePos());
    }

    let bCollisionOccurred = false;

    let vLine0ToCirc = g_circ.pos.Sub(g_line.pos0);
    let nLine = g_line.GetVec_0to1_Normalized();
    let projDotDist = Vector2.Dot(vLine0ToCirc, nLine);
    let vToLineProj = nLine.MultScalar(projDotDist);
    
    let lineLength = g_line.GetLength();
    let t = Math.max(0, Math.min(lineLength, projDotDist));
    
    let ptProjOnLine = g_line.pos0.Add(nLine.MultScalar(t));
    let vCircToProjPoint = ptProjOnLine.Sub(g_circ.pos);



    if (vCircToProjPoint.Length() < g_circ.GetRadius())
    {
        bCollisionOccurred = true;
        g_circ.SetColor(new Color(0.3, 0.9, 0.5));
    }
    else
    {
        g_circ.SetColor(new Color(0.3, 0.4, 0.9));
    }

    //RENDER
    clear();
    
    g_circ.Draw();
    g_line.Draw();

    //Draw line to circle
    stroke(255, 255, 255);
    line(g_line.pos0.x, g_line.pos0.y, g_circ.pos.x, g_circ.pos.y);

    //Draw line from circle to projected line point
    stroke(155, 255, 155);
    line(g_circ.pos.x, g_circ.pos.y, ptProjOnLine.x, ptProjOnLine.y);

    //Draw circle at projected point from circle to line
    strokeWeight(2);
    fill(255, 255, 255, 150);
    circle(ptProjOnLine.x, ptProjOnLine.y, 25);
}

function draw()
{
    DrawTest_LineSegmentAgainstCircle();
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