let axiom = "F";
let sentence = axiom;

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

let len = 100;
let angle;

function generate()
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
  createP(output);
  turtle();
}


function turtle()
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

function setup() {
  createCanvas(400, 400);
  //noCanvas();
  angle = radians(25);
  background(51);
  createP(axiom);
  turtle();
  
  let eButton = createButton("generate");
  eButton.mousePressed(generate);

}

function draw() {
  
}