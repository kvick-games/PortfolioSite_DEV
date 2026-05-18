class Collection
{
    constructor()
    {
        this.array = [];
    }

    Size()
    {
        return this.array.size;
    }
}

class Queue extends Collection
{
    constructor()
    {
        super();
    }

    Push(item)
    {
        this.array.push(item);
    }

    Pop()
    {
        return this.array.pop();
    }
}

class Stack extends Collection
{
    constructor()
    {
        this.array = [];
    }

    Push(item)
    {
        this.array.push(item);
    }

    Pop()
    {
        return this.array.pop();
    }
}

class Color
{
    constructor(r, g, b, a = 1.0)
    {
        this.SetColor(r, g, b, a);
    }

    CalcOutputColor()
    {
        this.outR = this.r * 255;
        this.outG = this.g * 255;
        this.outB = this.b * 255;
        this.outA = this.a * 255;
    }
    
    GetOutputColor()
    {
        let newColor = new Color(this.outR, this.outG, this.outB, this.outA);
        return newColor;
    }

    SetColor(r, g, b, a = 1.0)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;

        this.CalcOutputColor();
    }

    SetR(val)
    {
        this.r = val;
        this.CalcOutputColor();
    }

    SetG(val)
    {
        this.g = val;
        this.CalcOutputColor();
    }

    SetB(val)
    {
        this.b = val;
        this.CalcOutputColor();
    }

    SetAlpha(alpha)
    {
        this.a = alpha;
        this.CalcOutputColor();
    }

    static Lerp(colA, colB, t)
    {
        let newColor = new Color(
            Lerp(colA.r, colB.r, t),
            Lerp(colA.g, colB.r, t),
            Lerp(colA.b, colB.r, t),
            Lerp(colA.a, colB.a, t)
        );
        return newColor;
    }

    Fill()
    {
        fill(this.outR, this.outG, this.outB, this.outA);
    }

    Stroke()
    {
        stroke(this.outR, this.outG, this.outB, this.outA);
    }

    ToString()
    {
        return "(" + "r:" + this.r + ", g: " + this.g + ", b:" + this.b + ", a:" + this.a + ")";
    }

    Log()
    {
        console.log(this.ToString());
    }
}
let COL_WHITE = new Color(1.0, 1.0, 1.0);

function IsNearlyEqual(v1, v2, tolerance)
{
    if (tolerance == null)
    {
        tolerance = 0.001;
    }

    return (Math.abs(v1 - v2) < tolerance);
}

class Vector2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    MultScalar(scalar)
    {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    MultEq(otherScalar)
    {
        this.x *= otherScalar;
        this.y *= otherScalar;
    }

    DivScalar(scalar)
    {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    DivEq(scalar)
    {
        this.x /= scalar;
        this.y /= scalar;
    }

    Add(other)
    {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    AddEq(other)
    {
        this.x += other.x;
        this.y += other.y;
    }

    Sub(other)
    {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    SubEq(other)
    {
        this.x -= other.x;
        this.y -= other.y;
        
    }

    static Dot(a, b)
    {
        let retVal = (a.x * b.x + a.y * b.y);
        return retVal;
        //return (a.x * b.x + a.y * b.y);
    }

    GetRotated(rads)
    {
        let currLength = this.Length();
        let currRads = Math.atan2(this.y, this.x);
        let newRads = currRads + rads;
        return new Vector2(Math.cos(newRads) * currLength, Math.sin(newRads) * currLength);
    }

    RotateBy(rads)
    {
        let currLength = this.Length();
        let currRads = Math.atan2(this.y, this.x);
        let newRads = currRads + rads;
        this.x = Math.cos(newRads) * currLength;
        this.y = Math.sin(newRads) * currLength;
    }

    Length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    LengthSqr()
    {
        return (this.x * this.x + this.y * this.y);
    }

    LengthTo(ptOther)
    {
        let newX = this.x-ptOther.x;
        let newY = this.y-ptOther.y;
        return Math.sqrt(newX * newX + newY * newY);
    }

    Normalized()
    {
        let length = this.Length();
        if (IsNearlyEqual(length, 0, 0.001))
        {
            return new Vector2(0, 0);
        }
        return new Vector2(this.x / length, this.y / length);
    }

    Normalize()
    {
        let length = this.Length();
        if (IsNearlyEqual(length, 0, 0.001))
        {
            this.x = 0;
            this.y = 0;
            return;
        }
        this.x /= length;
        this.y /= length;
    }

    Negative()
    {
        return new Vector2(-this.x, -this.y);
    }

    ToString()
    {
        return "x(" + this.x.toString() + ") y(" + this.y.toString() + ")";
    }
}

class SUtils
{
    static MapRange(val, ina, inb, outa, outb)
    {
        let rangeIn = inb - ina;
        let rangeOut = outb - outa;
        let t = (val - ina) / rangeIn;
        return outa + rangeOut * t;
    }

    static Lerp(a, b, t) 
    { 
        return a + (b - a) * t;
    };

    static Lerp2(a, b, t) 
    { 
        let x = Lerp(a.x, b.x, t); 
        let y = Lerp(a.y, b.y, t);
        return new Vector2(x, y); 
    };
}

//DEPRECATED
function Lerp(a, b, t) 
{ 
    console.log("Using deprecated lerp");
    return a + (b - a) * t;
};

function Lerp2(a, b, t) 
{ 
    console.log("Using deprecated lerp");
    let x = Lerp(a.x, b.x, t); 
    let y = Lerp(a.y, b.y, t);
    return new Vector2(x, y); 
};

//=================//
//DRAWING FUNCTIONS//
//=================//
function Line(p0, p1)
{
    line(p0.x, p0.y, p1.x, p1.y);
}

function Circle(pt, radius)
{
    circle(pt.x, pt.y, radius * 2.0);
}

let timer = 0;

function Arrow(p0, p1, size = 15)
{
    let vP0toP1 = p1.Sub(p0);
    let len = vP0toP1.Length();
    let nP0toP1 = vP0toP1.DivScalar(len);

    let nRotated90Clockwise = new Vector2(nP0toP1.y, -nP0toP1.x);
    //let nRotated90Clockwise = nP0toP1.GetRotated(Math.PI * -0.5);
    let vP0toP1Scaled = nP0toP1.Negative().MultScalar(size);
    
    let pt1 = p1;
    let pt0 = pt1.Add(vP0toP1Scaled.Add(nRotated90Clockwise.MultScalar(size)));
    let pt2 = pt1.Add(vP0toP1Scaled.Add(nRotated90Clockwise.Negative().MultScalar(size)));
    
    Line(p0, p1);
    triangle(pt0.x, pt0.y, pt1.x, pt1.y, pt2.x, pt2.y);
    //triangle(0, 0, pt1.x, pt1.y, 0, 50);
}

//===========//
//MOUSE UTILS//
//===========//
function GetMousePos()
{
    return new Vector2(mouseX, mouseY);
}

//Note this only works if g_canvas_width and g_canvas_height are defined
function MouseIsInCanvas()
{
    return ( //Within the canvas bounds
        (mouseX >= 0 && mouseX <g_canvas_width && 
        mouseY >= 0 && mouseY <g_canvas_height)
        );
}