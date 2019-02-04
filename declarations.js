//GAME STATE. 0=Game paused; 1= game started (phase 1); 2= phase 2; 3 = phase 3.
let gameState=0


//audio vars.
let enableSound=0;
let hbAmp=hAmp=h3Amp=windAmp=wind2Amp=str2Amp=b2Amp=tensAmp=0;

let randomPos = [];

//massima altitudine e massima profondità (segno invertito).
//Questo è il numero di tacche sul righello.
let topValue = -400;
let bottomValue = 400;

//Array contiene le bolle per lo splash. Forse c'è un modo migliore, non so.
var bubbles = [];

//kaleidoscope vars
const slices = 12;
let shape, mask, img;


//Lati verticali del box principale, parametrici, e padding in alto e basso.
let meterWidth=25;
let meterPos=-70;
const padding = 40;
let mainLSide = padding;
let mainRSide = 900;

//Variabili per il noise che uso per variare certe trasformazioni.
var hNoise, vNoise;
var noiseAmount = 20;
var noiseSpeed = 0.1;
let yoff = 0.0;

//abilita gli effetti di post-produzione (pseudo aberrazione cromatica, tinta)
let postPro = true;
//controlla l'intensità del noise e degli effetti postpro
let mapVar = 0;

let bgBrightness = 0;

//praticamente è la profondità.
let vOffset = 0;
//movimento dell'avatar (cuore). L'avatar in realtà resta fermo, mentre il resto del mondo si muove.
let avatarOff = 0;
let avatarScale = 1;
let avatarFill = 255;
let jumping = 0;
let center;
//velocità del mondo e gravità.
let speed = 0;
let gravity = 0.04;

//Variabili per l'effetto splash.
//0: not splashing. 1: splash up. 2: splash down.
let splashState = 0;
let splashAmount = 0;
let allowSplashSound = 1;
let splashSpeed = 0;

let now=then=0;

//kaleido vars
let kalSize, offScreen;
let kalAlpha = 0;

let topPostPro=0;

//for red post-processing near fail areas.
let failApproach=0;

function bottomFailArea(DEPTH) {
  let img = createImage(66, 66);
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      img.set(i, j, color(0, 0, j/img.height*50));
    }
  }
  img.updatePixels();
  let depth = DEPTH;
  let topPos = cullPoint(depth+vOffset);
  let gradTopPos = cullPoint(depth+vOffset-2000);
  let bottomPos = cullPoint(height*2+depth+vOffset);
  if (topPos-gradTopPos>0) {
    image(img,mainLSide,gradTopPos,mainRSide-mainLSide,topPos-gradTopPos);
  }
  fill(255);
  rect(mainLSide,topPos,mainRSide-mainLSide,bottomPos-topPos);
  return topPos;
}
function topFailArea(DEPTH) {
  let img = createImage(66, 66);
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      img.set(i, j, color(0, 0, 100-((img.height-j)/img.height*50)));
    }
  }
  img.updatePixels();
  let depth = DEPTH;
  let topPos = cullPoint(depth+vOffset);
  let bottomPos = cullPoint(height*2+depth+vOffset);
  let gradBottomPos = cullPoint(height*2+depth+vOffset+2000);
  if(gradBottomPos-bottomPos>0) {
    image(img,mainLSide,bottomPos,mainRSide-mainLSide,gradBottomPos-bottomPos);
  }

  fill(0);
  rect(mainLSide,topPos,mainRSide-mainLSide,bottomPos-topPos);
  return bottomPos;
}


function limitValue(VALUE,MIN,MAX) {
  if (VALUE<=MIN) {
    return VALUE=MIN;
  } else if (VALUE>=MAX) {
    return VALUE=MAX;
  } else {
    return VALUE;
  }
}

function failArea(X,Y,WIDTH,HEIGHT) {
  HEIGHT = HEIGHT-2;
  Y = Y+1;
  for (i=-WIDTH;i<HEIGHT;i+=7) {
    if (i<0) {
      line(X+WIDTH,Y-i,X+i+WIDTH,Y);
    } else if(Y+WIDTH+i+4>Y+HEIGHT&&HEIGHT-i-4>0) {
      line(X,Y+i+4,X+HEIGHT-i-4,Y+HEIGHT);
    } else if (HEIGHT-i-4>0) {
      line(X,Y+i+4,X+WIDTH,Y+WIDTH+i+4);
    }
  }
  rect(X,Y-1,WIDTH,HEIGHT+2);
}

function Splash(WIDTH, HEIGHT, OFFSET) {
  this.topVertex = height / 2 + vOffset + 15 - HEIGHT;
  this.bottomVertex = height / 2 + vOffset + 15;
  this.topVertex = cullPoint(this.topVertex);
  this.bottomVertex = cullPoint(this.bottomVertex);

  beginShape();
  curveVertex(center.x - WIDTH + OFFSET - 100, this.bottomVertex);
  curveVertex(center.x - WIDTH + OFFSET, this.bottomVertex);
  curveVertex(center.x + OFFSET, this.topVertex);
  curveVertex(center.x + WIDTH + OFFSET, this.bottomVertex);
  curveVertex(center.x + WIDTH + OFFSET + 100, this.bottomVertex);
  endShape();
}

function Bubble(X, Y, SIZE, BRIGHTNESS) {
  this.position = createVector(X, Y);
  this.velocity = createVector(0, 0);
  this.acceleration = createVector(0, 0);
  this.mass = SIZE * 0.01;
  this.display = function() {
    if (this.position.y + height / 2 + vOffset < height - padding - SIZE / 2 && this.position.y + height / 2 + vOffset > padding + SIZE / 2) {
      push();
      noStroke();
      fill(BRIGHTNESS);
      ellipse(this.position.x + center.x, this.position.y + height / 2 + vOffset, SIZE);
      pop();
    }
  }
}
Bubble.prototype.applyForce = function(force) {
  let f = p5.Vector.div(force, this.mass);
  this.acceleration.add(f);
}
Bubble.prototype.update = function() {
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.acceleration.mult(0);
}
Bubble.prototype.checkEdges = function() {
  if (this.position.y > 20) {
    this.velocity.y = 0;
    this.position.y = 20;
  }
}

//The next three functions are for the kaleidoscope effect.
function calcStuff(width, height, s) {
  // because pythagorean theorem
  // h = sqrt(a^2 + b^2)
  // a = sqrt(h^2 - b^2)
  // b = sqrt(h^2 - a^2)
  let a = sqrt(sq(width/2)+sq(height/2));
  let theta = radians(360 / s);
  let o = tan(theta) * a;
  let h = a / cos(theta);

  return {a: round(a), o: round(o), h: round(h)};
}
function createMask(w,h) {
    mask = createImage(w,h);
    mask.loadPixels();
    for (i = 0; i < mask.width; i++) {
        for (j = 0; j < mask.height; j++) {
            if(i >= map(j,0,h,0,w)-1) // -1 removes some breaks
                mask.set(i, j, color(255));
        }
    }
    mask.updatePixels();
    return mask;
}
function mirror(img) {
    img.mask(mask);
    push();
    translate(width/2,height/2);
    rotate(radians(frameCount/3));
    for(var i=0; i<slices; i++) {
      if(i%2==0) {
        push();
        scale(1,-1); // mirror
        image(img,0,0); // draw slice
        pop();
      } else {
        rotate(radians(360/slices)*2); // rotate
        image(img,0,0); // draw slice
      }
    }
    pop();
}


function cullPoint(INPUT) {
  if (INPUT <= padding) {
    return padding;
  } else if (INPUT >= height - padding) {
    return height - padding;
  } else {
    return INPUT;
  }
}
function calcSpeed(DELTA,SPEED) {
  return (SPEED*DELTA)*0.06;
}

let jumpAmount=30;
function keyPressed() {
  if (keyCode===32) {
    if (jumpAmount>0.7) {
      jumpAmount*=0.80;
    }
    let offsetJump=jumpAmount;
    if (vOffset<200) {
      offsetJump=lerp(offsetJump,jumpAmount*0.8,0.1);
    }
    now = millis();
    delta = now - then;
    vOffset += calcSpeed(delta,speed);
    speed += calcSpeed(delta,-gravity);
  if (speed < 0) {
    impact.play();
    speed += offsetJump;
  } else {
    impact.play();
    speed += offsetJump;
  }
  then = now;
  }
}
