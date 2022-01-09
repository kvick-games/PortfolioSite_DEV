class Slider
{
    constructor(id)
    {
        this.id = id;
        this.progress = 1.0;
        this.domSlider = document.getElementById(id);
        this.domSliderText = document.getElementById(id + '-text');

        this.domSlider.addEventListener('input', evt => this.OnValueChanged(evt));

        this.dOnValueChanged = function() {};
    }

    Update()
    {
        this.domSliderText.innerHTML = this.progress.toString();
    }

    SetValue(val)
    {
        this.progress = val;
        this.domSlider.value = this.progress;
        this.Update();
    }

    SetProgress(val)
    {
        this.progress = val;
        this.domSlider.value = this.progress;
        this.Update();
    }

    OnValueChanged(event)
    {
        let val = event.currentTarget.value;
        this.SetProgress(val);

        if (this.dOnValueChanged)
        {
            console.log("CALLING DISP");
            this.dOnValueChanged();
        }
    }

    GetValue()
    {
        return this.progress;
    }
}

let g_eSlider_Progress;

let g_mouseClickedX = 0;
let g_mouseClickedY = 0;

let g_startX = 0;
let g_startY = 0;

//Board stuff
let g_board;

let g_canvas_width = 800;
let g_canvas_height = g_canvas_width;

let g_targetDestination;
let g_startDestination;

//Cell stuff
let g_cellSize = 50;
let g_cellSpacing = 5.0;
let g_cellsX = 10;
let g_cellsY = g_cellsX;

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

    Add(other)
    {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    Sub(other)
    {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    Dot(other)
    {
        return new Vector2(this.x * other.x + this.y * other.y);
    }

    Length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class PathPiece
{
    constructor(cell, prevCell)
    {
        this.cell = cell;
        this.prevCell = prevCell;
    }
}

class Destination
{
    constructor(pos, color)
    {
        this.pos = pos;
        this.color = color;
        this.size = new Vector2(25, 25);
    }

    Draw()
    {
        let finalColor = this.color.GetOutputColor();

        stroke(255);
        fill(finalColor.r, finalColor.g, finalColor.b);
        square(this.pos.x - this.size.x*0.5, this.pos.y - this.size.y*0.5, this.size.x, this.size.y);
    }

    IsPointOverlapping(point)
    {
        return (this.pos.Sub(point).Length() < this.size.x);
    }
}

class Cell
{
    constructor(pos)
    {
        this.pos = pos;
        this.size = new Vector2(g_cellSize, g_cellSize);
        this.m_color = new Color(1.0);

        this.index = g_cellsX * pos.y + pos.x;

        this.neighbors = new Object;

        this.asPath = false;
        this.hovered = false;
    }

    ClearStates()
    {
        this.SetAsHovered(false);
        this.SetAsPath(false);
    }

    SetAsHovered(val)
    {
        this.hovered = val;
    }

    SetAsPath(val)
    {
        this.asPath = val;
    }

    SetNeighbor(enumDirection, neighbor)
    {
        this.neighbors[enumDirection] = neighbor;
    }

    GetNeighbor(enumDirection)
    {
        return this.neighbors[enumDirection];
    }

    GetNeighbors()
    {
        return Object.values(this.neighbors);
    }

    GetFinalPos()
    {
        let ptFinal = this.pos.MultScalar(this.size.x + g_cellSpacing);
        return ptFinal;
    }

    GetCenterPos()
    {
        let pt = this.GetFinalPos();
        pt.x = pt.x + g_cellSize / 2;
        pt.y = pt.y + g_cellSize / 2;
        return pt;
    }
    
    PointOverlaps(point)
    {
        let ptFinal = this.GetFinalPos();
        return (
            point.x > ptFinal.x && point.x < (ptFinal.x + this.size.x) 
            &&
            point.y > ptFinal.y && point.y < (ptFinal.y + this.size.y)
            );
    }

    Draw()
    {
        let ptFinal = this.GetFinalPos();
        let finalColor = this.m_color.GetOutputColor();

        if (this.hovered)
        {
            finalColor.r = 215;
            finalColor.g = 215;
            finalColor.b = 215;
        }
        else if (this.asPath)
        {
            finalColor.r = 115;
            finalColor.g = 205;
            finalColor.b = 130;
        }
        else
        {
            finalColor.r = 0;
            finalColor.g = 0;
            finalColor.b = 0;
        }

        stroke(100);
        fill(finalColor.r, finalColor.g, finalColor.b, 255);
        rect(ptFinal.x, ptFinal.y, this.size.x, this.size.y);

        let midX = ptFinal.x + this.size.x * 0.5;
        let midY = ptFinal.y + this.size.y * 0.5;
        fill(255, 255, 255);
        text(this.index.toString(), midX, midY);
        
        //Draw Direction links
        /*
        {
            let offsetSize = 0.35;
            let linkSize = 5;
            if (this.GetNeighbor("TOP"))
            {
                fill(255, 255, 255);
                rect( midX, midY - this.size.y * offsetSize, linkSize, linkSize);
            }
            if (this.GetNeighbor("BOTTOM"))
            {
                fill(255, 255, 255);
                rect( midX, midY + this.size.y * offsetSize, linkSize, linkSize);
            }
            if (this.GetNeighbor("LEFT"))
            {
                fill(255, 255, 255);
                rect( midX - this.size.y * offsetSize, midY, linkSize, linkSize);
            }
            if (this.GetNeighbor("RIGHT"))
            {
                fill(255, 255, 255);
                rect( midX + this.size.y * offsetSize, midY, linkSize, linkSize);
            }
        }
        */
    }
}

function GetHoveredCellIndices(inCoords)
{
    if (inCoords == null)
    {
        inCoords = new Vector2(mouseX, mouseY);
    }

    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    let cellWidthPlusSpace = g_cellSize + g_cellSpacing;
    let cellHeightPlusSpace = g_cellSize + g_cellSpacing;

    let xPos = inCoords.x;
    let yPos = inCoords.y;

    let x = clamp(Math.floor(xPos / cellWidthPlusSpace), 0, g_cellsX-1);
    let y = clamp(Math.floor(yPos / cellHeightPlusSpace), 0, g_cellsY-1);

    return new Vector2(x, y);
}

function GetHoveredCell(inCoords)
{
    let indices = GetHoveredCellIndices(inCoords);
    return g_board.cells[indices.y][indices.x];
}

class Board
{
    constructor()
    {
        this.width = g_cellsX;
        this.height = this.width;

        this.cells = new Array(this.height);
        for (let y = 0; y < this.height; ++y)
        {
            this.cells[y] = new Array(this.width);

            for (let x = 0; x < this.width; ++x)
            {   
                this.cells[y][x] = new Cell(new Vector2(x, y));
            }
        }

        //Link neighbors
        for (let y = 0; y < this.height; ++y)
        {
            for (let x = 0; x < this.width; ++x)
            {   
                if (y > 0)
                {
                    let top = this.cells[y - 1][x];
                    this.cells[y][x].SetNeighbor("TOP", top);
                }
                
                if (x < this.width - 1)
                {
                    let right = this.cells[y][x + 1];
                    this.cells[y][x].SetNeighbor("RIGHT", right);
                }

                if (y < this.height - 1)
                {
                    let bottom = this.cells[y + 1][x];
                    this.cells[y][x].SetNeighbor("BOTTOM", bottom);
                }

                if (x > 0)
                {
                    let left = this.cells[y][x - 1];
                    this.cells[y][x].SetNeighbor("LEFT", left);
                }
            }
        }
    }

    ClearPath()
    {
        for (const row of this.cells)
        {
            for (const cell of row)
            {
                cell.SetAsPath(false);
            }   
        }
    }

    Draw()
    {
        clear();
        
        //Draw Path
        this.ClearPath();

        let ptStart = GetHoveredCellIndices(new Vector2(g_startDestination.pos.x, g_startDestination.pos.y));
        let ptEnd = GetHoveredCellIndices(new Vector2(g_targetDestination.pos.x, g_targetDestination.pos.y));
        let pathPack = this.GetPath(ptStart.x, ptStart.y, ptEnd.x, ptEnd.y);

        let path = pathPack.path.reverse();
        let allVistedCells = pathPack.allVisitedPath;

        for (const row of this.cells)
        {
            for (const cell of row)
            {
                cell.ClearStates();
            }
        }

        for(let i = 0; i < allVistedCells.length; ++i)
        {
            let curr = allVistedCells[i].cell;
            curr.SetAsPath(true);
        }

        GetHoveredCell().SetAsHovered(true);        

        for (const row of this.cells)
        {
            for (const cell of row)
            {
                cell.Draw();
            }   
        }
        
        //Draw path
        let pathLimit = Math.floor(g_eSlider_Progress.GetValue() * path.length);
        for(let i = 0; i < Math.min(path.length, pathLimit); ++i)
        {
            let curr = path[i].cell;
            let prev = path[i].prevCell;

            let progress = i / path.length;

            curr.SetAsPath(true);

            if (prev)
            {   
                let ptCurr = curr.GetCenterPos();
                let ptPrev = prev.GetCenterPos();
                stroke(progress * 255);
                line(ptCurr.x, ptCurr.y, ptPrev.x, ptPrev.y);
            }
        }

        noStroke();

    }

    GetPath(startX, startY, endX, endY)
    {
        let start = this.cells[startY][startX];
        let target = this.cells[endY][endX];

        let visited = [];
        let allVisitedPath = [];
        let toVisit = [new PathPiece(start, null)];
        
        let prev;
        let current;
        do
        {
            prev = current;
            let front = toVisit.shift();
            current = (front) ? front.cell : null;
            
            if (current == null)
            {
                break;
            }
            
            let pathPiece = new PathPiece(current, front.prevCell);
            allVisitedPath.push(pathPiece);

            visited.push(current);
            
            if (current == target)
            {
                break;
            }

            //Queue up neighbors to visit
            let currNeighbors = current.GetNeighbors();
            for(let i = 0; i < currNeighbors.length; ++i)
            {
                let currNeighbor = currNeighbors[i];

                //If neighbor cell is inside the tovisit queue
                let bInToVisitQueue = false;
                for(let j = 0; j < toVisit.length; ++j)
                {
                    if (currNeighbor == toVisit[j].cell)
                    {
                        bInToVisitQueue = true;
                        break;
                    }
                }

                if (!bInToVisitQueue && !visited.includes(currNeighbor))
                {
                    toVisit.push(new PathPiece(currNeighbor, current));
                }
            }
            
        } while (current != target && toVisit.length > 0);
        
        
        let path = [];
        
        if (target == null)
        {
            return path;
        }

        path.push(allVisitedPath[visited.length-1]);
        
        //Construct the path from the history
        let currPiece = path[0];
        
        while(true)
        {
            let cameFrom = currPiece.prevCell;
            if (cameFrom)
            {
                let bFound = false;
                for(let piece of allVisitedPath)
                {
                    if (piece.cell == cameFrom)
                    {
                        path.push(piece);
                        currPiece = piece;
                        bFound = true;
                        break;
                    }
                }
                if (!bFound)
                {
                    break;
                }
            }
            else
            {
                break;
            }
        } 
        
        return {path, allVisitedPath};
        //return allVisitedPath;
    }
}

function setup()
{
    g_eSlider_Progress = new Slider('range-slider-01');
    g_eSlider_Progress.dOnValueChanged = UpdateScene;

    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    g_board = new Board();
    g_startDestination = new Destination(new Vector2(20, 20), new Color(0.4, 0.3, 0.9));
    g_targetDestination = new Destination(new Vector2(250, 250), new Color(0.9, 0.3, 0.3));

    UpdateScene();
}

function draw()
{
    g_eSlider_Progress.Update();
}

let g_grabbedItem = null;

function GetMousePos()
{
    return new Vector2(mouseX, mouseY);
}

function UpdateScene()
{
    g_mouseClickedX = mouseX;
    g_mouseClickedY = mouseY;

    if (g_grabbedItem)
    {
        let ptMouse = GetMousePos();
        g_grabbedItem.pos.x = ptMouse.x;
        g_grabbedItem.pos.y = ptMouse.y;
    }

    g_board.Draw();
    g_startDestination.Draw();
    g_targetDestination.Draw();
}

//MOUSE STUFF

function MouseIsInCanvas()
{
    return ( //Within the canvas bounds
        (mouseX >= 0 && mouseX <g_canvas_width && 
        mouseY >= 0 && mouseY <g_canvas_height)
        );
}

function mousePressed()
{
    if (!MouseIsInCanvas())
    {
        return;
    }

    UpdateScene();
    
    if (g_targetDestination.IsPointOverlapping(GetMousePos()))
    {
        g_grabbedItem = g_targetDestination;
    }
    else if (g_startDestination.IsPointOverlapping(GetMousePos()))
    {
        g_grabbedItem = g_startDestination;
    }
}

function mouseReleased()
{
    g_grabbedItem = null;
}

function mouseDragged()
{
    if (!MouseIsInCanvas())
    {
        return;
    }
    UpdateScene();
}