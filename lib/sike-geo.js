class SLine
{
    constructor(ptPos0, ptPos1, color)
    {
        this.pos0 = ptPos0;
        this.pos1 = ptPos1;
        this.color = color;
        this.thickness = 3;
    }

    SetPosition0(pos)
    {
        this.pos0 = pos;
    }
    SetPosition1(pos)
    {
        this.pos1 = pos;
    }
    
    GetPosition0()
    {
        return this.pos0;
    }
    GetPosition1()
    {
        return this.pos1;
    }

    GetLength()
    {
        return this.GetVec_0to1().Length();
    }

    GetVec_0to1()
    {
        return this.pos1.Sub(this.pos0);
    }

    GetVec_0to1_Normalized()
    {
        return this.GetVec_0to1().Normalized();
    }

    GetVec_1to0()
    {
        return this.pos0.Sub(this.pos1);
    }

    GetVec_1to0_Normalized()
    {
        return this.GetVec_1to0().Normalized();
    }

    SetThickness(thickness)
    {
        this.thickness = thickness;
    }

    Draw()
    {
        strokeWeight(this.thickness);
        this.color.Stroke();
        line(this.pos0.x, this.pos0.y, this.pos1.x, this.pos1.y);
    }
}

class SCircle
{
    constructor(ptPos, radius, color)
    {
        this.pos = ptPos;
        this.radius = radius;
        this.color = color;
        this.outlineColor = null;
    }

    GetRadius()
    {
        return this.radius;
    }

    SetPosition(pos)
    {
        this.pos = pos;
    }

    GetPosition()
    {
        return this.pos;
    }

    SetColor(color)
    {
        this.color = color;
    }

    SetOutlineColor(color)
    {
        this.outlineColor = color;
    }

    Draw()
    {
        if (this.outlineColor != null)
        {
            stroke();
        }
        else
        {
            noStroke();
        }

        if (this.color != null)
        {
            this.color.Fill();
        }
        else
        {
            noFill();
        }
        
        circle(this.pos.x, this.pos.y, this.radius*2.0);
    }
}