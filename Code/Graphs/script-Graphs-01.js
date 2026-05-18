
let g_canvas_width = 1000;
let g_canvas_height = g_canvas_width;



class GraphVertex
{
    constructor(id, pos)
    {
        this.id = id;
        this.pos = pos;
        this.color = new Color(0.7, 0.2, 0.3);
        this.outlineColor = new Color(0.9, 0.9, 0.9);

        this.radius = 50;
    }

    GetCenterPos()
    {
        return this.pos;
    }

    Draw()
    {
        this.outlineColor.Stroke();
        this.color.Fill();
        Circle(this.pos, this.radius);

        let ptMid = this.GetCenterPos();
        COL_WHITE.Fill();
        fill(255);
        textSize(32);
        textAlign(CENTER);
        text(this.id.toString(), ptMid.x, ptMid.y + 8);
    }

    IsPointOverlapping(point)
    {
        return (this.pos.Sub(point).Length() < this.radius);
    }
}

class GraphEdge
{
    
}

class EdgeList
{
    constructor()
    {
        this.head = null;
    }
}

class Graph_AdjList
{
    constructor()
    {
        this.adjList = [];
        this.verts = [];
    }

    AddVertex(vert)
    {
        this.verts.push(vert);
        let newList = [];
        this.adjList.push(newList);
    }

    AddEdge(id0, id1)
    {
        for (let i = 0; i < this.adjList.length; ++i)
        {
            if (i == id0)
            {
                let list = this.adjList[i];
                list.push(id1);
            }
        }
    }

    RemoveVertex(id)
    {
        for (let i = 0; i < this.adjList.length; ++i)
        {
            this.adjList.push(vert.id);
        }
    }

    DrawEdges()
    {
        for (let i = 0; i < this.verts.length; ++i)
        {
            let id = this.verts[i].id;
            let p0 = this.verts[i].GetCenterPos();
            let list = this.adjList[id];

            for (const edgeID of list)
            {
                let p1 = this.verts[edgeID].GetCenterPos();

                strokeWeight(3);
                COL_WHITE.Stroke();

                //Draw connecting arrow
                let vP0toP1 = p1.Sub(p0);
                let len = vP0toP1.Length();
                let nP0toP1 = vP0toP1.DivScalar(len);
                let nodeRadius =this.verts[edgeID].radius;
                let vP0toP1fixed = nP0toP1.MultScalar(len - (nodeRadius * 1.));
                let pt1Fixed = p0.Add(vP0toP1fixed);
                Arrow(p0, pt1Fixed);
            }
        }
    }

    Draw()
    {
        this.DrawEdges();

        for (let i = 0; i < this.verts.length; ++i)
        {
            this.verts[i].Draw();
        }
    }
}


class Graph_AdjMatrix
{
    constructor()
    {
        this.adjMatrix = [];
        this.verts = [];
    }

    AddVertex(vert)
    {
        this.verts.push(vert);
        let newList = [];
        this.adjList.push(newList);
    }

    AddEdge(id0, id1)
    {
        for (let i = 0; i < this.adjList.length; ++i)
        {
            if (i == id0)
            {
                let list = this.adjList[i];
                list.push(id1);
            }
        }
    }

    RemoveVertex(id)
    {
        for (let i = 0; i < this.adjList.length; ++i)
        {
            this.adjList.push(vert.id);
        }
    }

    DrawEdges()
    {
        for (let i = 0; i < this.verts.length; ++i)
        {
            let id = this.verts[i].id;
            let p0 = this.verts[i].GetCenterPos();
            let list = this.adjList[id];

            for (const edgeID of list)
            {
                let p1 = this.verts[edgeID].GetCenterPos();

                strokeWeight(3);
                COL_WHITE.Stroke();

                //Draw connecting arrow
                let vP0toP1 = p1.Sub(p0);
                let len = vP0toP1.Length();
                let nP0toP1 = vP0toP1.DivScalar(len);
                let nodeRadius =this.verts[edgeID].radius;
                let vP0toP1fixed = nP0toP1.MultScalar(len - (nodeRadius * 1.));
                let pt1Fixed = p0.Add(vP0toP1fixed);
                Arrow(p0, pt1Fixed);
            }
        }
    }

    Draw()
    {
        this.DrawEdges();

        for (let i = 0; i < this.verts.length; ++i)
        {
            this.verts[i].Draw();
        }
    }
}

let g_graph;

function setup()
{
    createCanvas(g_canvas_width, g_canvas_height);
    background(50);

    g_graph = new Graph_AdjList();
    g_graph.AddVertex(new GraphVertex(0, new Vector2(50, 50)));
    g_graph.AddVertex(new GraphVertex(1, new Vector2(150, 250)));
    g_graph.AddVertex(new GraphVertex(2, new Vector2(450, 450)));
    g_graph.AddVertex(new GraphVertex(3, new Vector2(650, 350)));

    g_graph.AddEdge(0, 1);
    g_graph.AddEdge(0, 2);
    g_graph.AddEdge(2, 0);
    g_graph.AddEdge(3, 1);
    g_graph.AddEdge(3, 2);
}

let g_clickedVert;

function Update()
{
    if (g_clickedVert != null)
    {
        g_clickedVert.pos = GetMousePos();
    }
}

function draw()
{
    Update();

    clear();
    g_graph.Draw();
}


function mousePressed()
{
    if (!MouseIsInCanvas())
    {
        return;
    }

    for (let i = 0; i < g_graph.verts.length; ++i)
    {
        let vert = g_graph.verts[i];
        if (vert.IsPointOverlapping(GetMousePos()))
        {
            g_clickedVert = vert;
            break;
        }
    }
    
}

function mouseReleased()
{
    g_clickedVert = null;
}

function mouseDragged()
{
    
}