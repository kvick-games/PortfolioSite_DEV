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
    constructor(r, g, b)
    {
        this.r = r;
        this.g = g;
        this.b = b;

        this.CalcOutputColor();
    }

    CalcOutputColor()
    {
        this.outR = this.r * 255;
        this.outG = this.g * 255;
        this.outB = this.b * 255;
    }

    GetOutputColor()
    {
        return new Color(this.this.outR, this.this.outG, this.this.outB);
    }

    Fill()
    {
        fill(this.outR, this.outG, this.outB);
    }

    Stroke()
    {
        stroke(this.outR, this.outG, this.outB);
    }
}

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
        console.log("CALLING DOT??");
        let retVal = (a.x * b.x + a.y * b.y);
        return retVal;
        //return (a.x * b.x + a.y * b.y);
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

function Lerp(a, b, t) 
{ 
    return a + (b - a) * t;
};

function Lerp2(a, b, t) 
{ 
    let x = Lerp(a.x, b.x, t); 
    let y = Lerp(a.y, b.y, t);
    return new Vector2(x, y); 
};

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