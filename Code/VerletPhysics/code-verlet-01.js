let g_canvas_width = 800;
let g_canvas_height = g_canvas_width;

let g_points = [];
let g_sticks = [];
let g_bodies = [];

let g_gravity = 0.5;
let g_friction = 0.99;

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
        
        //let ptMid = this.Midpoint();
        //let halfLen = pointDist / 2.0;

        //let n_p2_To_p1 = p1.Sub(p2).Normalized();
        //let ptTarget_p1 = ptMid.Add(n_p2_To_p1.MultScalar( halfLen));
        //let ptTarget_p2 = ptMid.Add(n_p2_To_p1.MultScalar(-halfLen));

        let diff = this.length - pointDist;
        let percentDiff = diff / this.length / 2.0;

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

        stroke(155, 255, 0);
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

        console.log(this.pos.ToString());
        console.log(this.pos_old.ToString());
        console.log("--");

        this.radius = 25;
    }

    Update()
    {
        let vel = this.pos.Sub(this.pos_old);
        vel = vel.MultScalar(g_friction);
        this.pos_old = this.pos;
        this.pos = this.pos.Add(vel);

        //console.log(vel.ToString());
        this.pos_old.y -= g_gravity;
    }

    UpdateConstraints()
    {
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

    Draw()
    {
        let finalColor = this.color.GetOutputColor();
        stroke(0, 0, 0);
        fill(finalColor.r, finalColor.g, finalColor.b);
        circle(this.pos.x, this.pos.y, this.radius);
    }
}

let g_pinnedPoint;

function CreateGeo()
{
    let baseStickLen = 100;
    //Create box
    let red = new Color(1.0, 0.0, 0.0);
    g_points.push(new VPoint(new Vector2(150, 150), red));
    g_points.push(new VPoint(new Vector2(200, 150), red));
    g_points.push(new VPoint(new Vector2(200, 200), red));
    g_points.push(new VPoint(new Vector2(150, 200), red));
    //g_points.push(new VPoint(new Vector2(270, 0)));

    g_sticks.push(new VStick(g_points[0], g_points[1], baseStickLen));
    g_sticks.push(new VStick(g_points[1], g_points[2], baseStickLen));
    g_sticks.push(new VStick(g_points[2], g_points[3], baseStickLen));
    g_sticks.push(new VStick(g_points[3], g_points[0], baseStickLen));

    //Cross-section
    g_sticks.push(new VStick(g_points[0], g_points[2], (new Vector2(baseStickLen, baseStickLen)).Length(), false));
    //g_sticks.push(new VStick(g_points[1], g_points[3], (new Vector2(200, 200)).Length()));

    g_bodies.push(new VBody(
        [
            g_points[0],
            g_points[1],
            g_points[2],
            g_points[3],
        ],
        [
            0, 1, 2,
            2, 0, 3
        ]
        ));

    //Create a rope
    //push returns the length of the array, so - 1 is equal to the current index
    let r1 = g_points.push(new VPoint(new Vector2(250, 150), red)) - 1;
    let r2 = g_points.push(new VPoint(new Vector2(300, 150), red)) - 1;
    let r3 = g_points.push(new VPoint(new Vector2(350, 150), red)) - 1;
    g_pinnedPoint = g_points[r3];
    g_pinnedPoint.SetPinned(true);

    g_sticks.push(new VStick(g_points[r1-2], g_points[r1], baseStickLen));
    g_sticks.push(new VStick(g_points[r1], g_points[r2], baseStickLen));
    g_sticks.push(new VStick(g_points[r2], g_points[r3], baseStickLen));
}

let g_time = 0;

//MAIN STUFF
function setup()
{
    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    CreateGeo();

}

function draw()
{
    g_time += 0.05;
    clear();
    //fill(255);
    //circle(0, 0, 500);

    g_pinnedPoint.pos = new Vector2(
          g_canvas_width * 0.5 + Math.sin(g_time) * 150
        , 100 + Math.sin(g_time * 1.1) * 50
    );

    for(let vpoint of g_points)
    {
        if (vpoint.GetPinned())
            continue;

        vpoint.Update();
        vpoint.UpdateConstraints();
    }
    for(let vStick of g_sticks)
    {
        vStick.Update();
    }

    for(let vpoint of g_points)
    {
        //vpoint.Draw();
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

    for (let vBody of g_bodies)
    {
        vBody.Draw();
    }
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
    
}

function mouseReleased()
{
    
}

function mouseDragged()
{
    
}