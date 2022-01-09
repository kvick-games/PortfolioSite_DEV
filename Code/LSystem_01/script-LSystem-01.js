let axiom = "F";
let sentence = axiom;

let printedTextElems = [];

let rules = [];
/*
rules[0] = {
  a: "a",
  b: "ab",
}

rules[1] = {
  a: "b",
  b: "a",
}
 */

rules[0] = {
  a: "F",
  b: "F+[+FF-F]-[-F+F+F]",
}

let len = 400;
let angle;

function ClearPrints()
{
  for(let e of printedTextElems)
  {
    e.remove();
  }
  printedTextElems = [];
}

function Reset()
{
  sentence = axiom;
  len = 400;
  ClearPrints();
  Generate();
}

function Generate()
{
  len *= 0.5;
  let output = "";
  for (let i = 0; i < sentence.length; ++i)
  {
    let found = false;
    let currChar = sentence.charAt(i);
    for (let j = 0; j < rules.length; ++j)
    {
      if (currChar == rules[j].a)
      {
        found = true;
        output += rules[j].b;
        break;
      }
    }

    if (!found)
    {
      output += currChar;
    }

  }
  sentence = output;
  printedTextElems.push(createP(output));
  Turtle();
}


function Turtle()
{
  background(51);
  resetMatrix();
  translate(width / 2, height);
  stroke(255, 100);

  for(let i = 0; i < sentence.length; ++i)
  {
    let current = sentence.charAt(i);

    if (current == 'F')
    {
      line(0, 0, 0, -len);
      translate(0, -len);
    } 
    else if (current == '+') 
    {
      rotate(angle);
    }
    else if (current == '-') 
    {
      rotate(-angle);
    }
    else if (current == '[') 
    {
      push();
    }
    else if (current == ']') 
    {
      pop();
    }
  }
}

let g_canvas_width = 800;
let g_canvas_height = g_canvas_width;

function OnTextFieldChanged(event)
{
  let eTextInput = document.getElementById("system-01-textInput");
  let textInput = eTextInput.value;



  rules[0].b = textInput;
}

function setup() {
  let eCanvas = createCanvas(g_canvas_width, g_canvas_height);
  eCanvas.parent("system-01-container");
  //noCanvas();
  angle = radians(25);
  background(51);
  Turtle();

  let eTextInput = document.getElementById("system-01-textInput");
  let textInput = eTextInput.getAttribute("value");
  eTextInput.addEventListener('input', OnTextFieldChanged);

  //Make buttons
  let eButton_generate = createButton("generate");
  eButton_generate.mousePressed(Generate);

  let eButton_reset = createButton("reset");
  eButton_reset.mousePressed(Reset);

  createP(axiom);
}

function draw() {
  
}