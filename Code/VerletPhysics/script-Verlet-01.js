let g_canvas_width = 800;
let g_canvas_height = g_canvas_width;

let g_points = [];
let g_sticks = [];
let g_bodies = [];

let g_box;
let g_pinnedPoint;

let g_gravity = 0.5;
let g_friction = 0.99;

let g_time = 0;
let g_releaseConstraint = false;

let g_mouseAttractRadius = 100;
let g_ptPrevMouse = null;


class Poly
{
    constructor(indices)
    {
        this.indices = indices;
    }
}

class VBody
{
    constructor(points, indices)
    {
        this.points = points;
        this.color = new Color(0, 1, 0);
        this.polys = [];

        for (let i = 0; i < indices.length; i += 3)
        {
            this.polys.push(new Poly([
                indices[i],
                indices[i+1],
                indices[i+2],
            ]));
        }
    }

    Draw()
    {
        for(let poly of this.polys)
        {
            let p1 = this.points[poly.indices[0]].pos;
            let p2 = this.points[poly.indices[1]].pos;
            let p3 = this.points[poly.indices[2]].pos;

            let c = this.color.GetOutputColor();
            //noStroke();
            fill(c.r, c.g, c.b);
            triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        }
    }
}

class VStick
{
    constructor(p1, p2, length, visible)
    {
        this.p1 = p1;
        this.p2 = p2;
        this.length = length;
        this.visible = (visible != null) ? visible : true;
    }

    Update()
    {
        
        let p1 = this.p1.pos;
        let p2 = this.p2.pos;

        let vDiff = p2.Sub(p1);
        let pointDist = vDiff.Length();
        
        let diff = this.length - pointDist;
        let percentDiff = diff / this.length / 2.0;

        percentDiff = Math.sign(percentDiff) * Math.min(Math.abs(percentDiff), 0.3);

        let offsetX = vDiff.x * percentDiff;
        let offsetY = vDiff.y * percentDiff;
        
        if (!this.p1.GetPinned())
            this.p1.pos.SubEq(new Vector2(offsetX, offsetY));

        if (!this.p2.GetPinned())
            this.p2.pos.AddEq(new Vector2(offsetX, offsetY));
        
    }

    Distance()
    {
        return (this.p1.pos.Sub(this.p2.pos)).Length();
    }

    Midpoint()
    {
        return this.p1.pos.Add(this.p2.pos).DivScalar(2.0);
    }

    GetP1ToP2()
    {
        return this.p2.pos.Sub(this.p1.pos);
    }

    Draw()
    {
        //stroke(255, 0, 0);
        //line(this.p1.pos.x, this.p1.pos.y, this.p2.pos.x, this.p2.pos.y);

        stroke(155, 255, 0, 255);
        strokeWeight(5);
        let vLine = this.GetP1ToP2().Normalized();
        let vLineHalf = vLine.MultScalar(this.length * 0.5);
        let ptMid = this.Midpoint();
        let p1 = ptMid.Add(vLineHalf);
        let p2 = ptMid.Add(vLineHalf.Negative());
        line(p1.x, p1.y, p2.x, p2.y);
    }

    ToString()
    {
        return (this.p1.pos.ToString() + ", " + this.p2.pos.ToString());
    }
}

class VPoint
{
    constructor(ptStart, color)
    {
        this.pos = ptStart;
        this.pos_old = ptStart.MultScalar(0.99);
        this.restitution = 0.81;
        this.color = color;
        this.pinned = false;
        this.id = -1;

        this.radius = 15;
    }

    Update()
    {
        if (this.pinned)
            return;

        let vel = this.pos.Sub(this.pos_old);
        vel = vel.MultScalar(g_friction);
        this.pos_old = this.pos;
        this.pos = this.pos.Add(vel);

        this.pos_old.y -= g_gravity;
    }

    AddForce(force)
    {
        this.pos_old.SubEq(force);
    }

    UpdateConstraints()
    {
        //if (this.pinned)
        //    return;

        if (this.pos.x > g_canvas_width - this.radius)
        {
            this.pos.x = g_canvas_width - this.radius;
            this.pos_old.x = this.pos.x + (this.pos.x - this.pos_old.x) * this.restitution; //Flip the velocity

            /*
            console.log("COLLIDE:");
            console.log(this.pos.ToString());
            console.log(this.pos_old.ToString());
            console.log("--");
            */
        }
        else if (this.pos.x < this.radius)
        {
            this.pos.x = this.radius;
            this.pos_old.x = this.pos.x + (this.pos.x - this.pos_old.x) * this.restitution; //Flip the velocity
        }

        if (this.pos.y > g_canvas_height - this.radius)
        {
            this.pos.y = g_canvas_width - this.radius;
            this.pos_old.y = this.pos.y + (this.pos.y - this.pos_old.y) * this.restitution; //Flip the velocity
        }
        else if (this.pos.y < this.radius)
        {
            this.pos.y = this.radius;
            this.pos_old.y = this.pos.y + (this.pos.y - this.pos_old.y) * this.restitution; //Flip the velocity
        }
    }

    SetPinned(val)
    {
        this.pinned = val;
    }

    GetPinned()
    {
        return this.pinned;
    }

    SetID(id)
    {
        this.id = id;
    }

    GetID()
    {
        return this.id;
    }

    Draw()
    {
        if (this.pinned)
        {
            (new Color(0, 0, 1)).Fill();
        }
        else
        {
            this.color.Fill();
        }
        
        stroke(0, 0, 0);
        circle(this.pos.x, this.pos.y, this.radius);
    }
}

let baseStickLen = 55;

class VBox
{
    constructor()
    {
        this.firstPointIndex = g_points.length;
        this.points = [];
        this.sticks = [];

        let red = new Color(1.0, 0.0, 0.0);
        this.points.push(new VPoint(new Vector2(150, 150), red));
        this.points.push(new VPoint(new Vector2(200, 150), red));
        this.points.push(new VPoint(new Vector2(200, 200), red));
        this.points.push(new VPoint(new Vector2(150, 200), red));
        
        //Index point
        let ip = this.firstPointIndex;
        this.sticks.push(new VStick(this.points[ip+0], this.points[ip+1], baseStickLen));
        this.sticks.push(new VStick(this.points[ip+1], this.points[ip+2], baseStickLen));
        this.sticks.push(new VStick(this.points[ip+2], this.points[ip+3], baseStickLen));
        this.sticks.push(new VStick(this.points[ip+3], this.points[ip+0], baseStickLen));

        //Cross-section
        this.sticks.push(new VStick(this.points[ip+0], this.points[ip+2], (new Vector2(baseStickLen, baseStickLen)).Length(), false));
        this.sticks.push(new VStick(this.points[ip+1], this.points[ip+3], (new Vector2(baseStickLen, baseStickLen)).Length(), false));

        for (let p of this.points)
        {
            p.SetID(0);
            g_points.push(p);
        }
        for (let stick of this.sticks)
        {
            g_sticks.push(stick);
        }

        g_bodies.push(new VBody(
            [
                this.points[0],
                this.points[1],
                this.points[2],
                this.points[3],
            ],
            [
                0, 1, 2,
                2, 0, 3
            ]
            ));
    }

    GetPoint(index)
    {
        return this.points[index];
    }
}

function CreateGeo()
{
    //Create box
    g_box = new VBox();

    //Create a rope
    
    //push returns the length of the array, so - 1 is equal to the current index
    let numPoints = 6;
    let ropePoints = [];
    
    let red = new Color(1.0, 0.0, 0.0);
    ropePoints.push(new VPoint(new Vector2(200, 150), red));
    g_sticks.push(new VStick(g_box.GetPoint(1), ropePoints[0], baseStickLen));

    for (let i = 1; i < numPoints; ++i)
    {
        ropePoints.push(new VPoint(new Vector2(200 + i * 25, 150), red));
        g_sticks.push(new VStick(ropePoints[i - 1], ropePoints[i], baseStickLen));
    }
    g_pinnedPoint = ropePoints[ropePoints.length-1];
    g_pinnedPoint.SetPinned(true);

    for(let ropePoint of ropePoints)
    {
        g_points.push(ropePoint);
    }
}

//MAIN STUFF
function setup()
{
    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    g_ptPrevMouse = GetMousePos();

    //g_pinPoint = new Vector2(g_canvas_width * 0.5, 50);

    CreateGeo();

}

function Update()
{
    g_time += 0.05;

    if (mouseIsPressed)
    {
        let vMouseVel = GetMousePos().Sub(g_ptPrevMouse);

        //Move pinned point to the mouse cursor
        //g_pinnedPoint.pos = Lerp2(g_pinnedPoint.pos, GetMousePos(), 0.1);

        //Attractor
        let ptMouse = GetMousePos();
        for(let p of g_points)
        {
            if (p.GetID() == 0)
            {
                let vPtoMouse = ptMouse.Sub(p.pos);
                let distTo = vPtoMouse.Length();
                
                //Add attraction force based on distance
                //p.AddForce(nPtoMouse.MultScalar(51 / distTo));

                if (distTo < g_mouseAttractRadius)
                {
                    let nPtoMouse = vPtoMouse.DivScalar(distTo);
                    let nMouseVel = vMouseVel.Normalized();

                    let dotter = Vector2.Dot(nPtoMouse.Negative(), nMouseVel);
                    let scaleFactor = dotter * 0.5 + 0.5;
                    p.AddForce(vMouseVel.MultScalar(0.09 * scaleFactor));
                    //p.AddForce(mouseVel.MultScalar(1 / distTo));


                }
            }
            
        }

    }

    g_ptPrevMouse = GetMousePos();
}



function draw()
{
    Update();

    clear();

    for(let vpoint of g_points)
    {
        vpoint.Update();
        vpoint.UpdateConstraints();
    }
    for(let vStick of g_sticks)
    {
        vStick.Update();
    }

    for(let vpoint of g_points)
    {
        vpoint.Draw();
    }

    stroke(255);
    strokeWeight(1);
    for(let vStick of g_sticks)
    {
        if (vStick.visible)
        {
            vStick.Draw();
        }
    }

    /*
    for (let vBody of g_bodies)
    {
        vBody.Draw();
    }
    */

    //Circle around mouse
    stroke(255);
    noFill();
    circle(mouseX, mouseY, g_mouseAttractRadius * 2);
}

//MOUSE STUFF
function GetMousePos()
{
    return new Vector2(mouseX, mouseY);
}

function MouseIsInCanvas()
{
    return ( //Within the canvas bounds
        (mouseX >= 0 && mouseX <g_canvas_width && 
        mouseY >= 0 && mouseY <g_canvas_height)
        );
}

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