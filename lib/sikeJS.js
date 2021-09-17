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
    }

    GetOutputColor()
    {
        return new Color(this.r * 255, this.g * 255, this.b * 255);
    }
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

    Dot(other)
    {
        return new Vector2(this.x * other.x + this.y * other.y);
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
        return new Vector2(this.x / length, this.y / length);
    }

    Normalize()
    {
        let length = this.Length();
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