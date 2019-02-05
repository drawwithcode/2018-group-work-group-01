let hbAmp=hAmp=h3Amp=windAmp=str2Amp=b2Amp=0;

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
const padding = 40;
let mainLSide = meterWidth+padding+padding*.75;
let mainRSide = 750;
let sidePanelWidth = 450;

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
let vOffset = 0; // moltiplicarlo per un numero più piccoli

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
let allowSound = 1;
let splashSpeed = 0;

let now=then=0;

//kaleido vars
let kalSize, offScreen;
let kalAlpha = 0;

let topPostPro=0;

//for red post-processing near fail areas.
let failApproach=0;

// Organs image
var outline;
var brainImage;
var lungsImage;
var veinsImage;
var skinImage;
var heartImage;
var intestinesImage;
var muscleImage;

// Organ objects
var brain;
var lungs;
var veins;
var skin;
var heart;
var intestines;
var muscle;

function bottomFailArea() {
  let img = createImage(66, 66);
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      img.set(i, j, color(0, 0, j/img.height*50));
    }
  }
  img.updatePixels();
  let depth = 27000;
  let topPos = cullPoint(padding+depth+vOffset);
  let gradTopPos = cullPoint(padding+depth+vOffset-2000);
  let bottomPos = cullPoint(height*2+padding+depth+vOffset);
  if (topPos-gradTopPos>0) {
    image(img,mainLSide,gradTopPos,mainRSide-mainLSide,topPos-gradTopPos);
  }
  fill(255);
  rect(mainLSide,topPos,mainRSide-mainLSide,bottomPos-topPos);
}
function topFailArea() {
  let img = createImage(66, 66);
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      img.set(i, j, color(0, 0, 100-((img.height-j)/img.height*50)));
    }
  }
  img.updatePixels();
  let depth = -27000;
  let topPos = cullPoint(padding+depth+vOffset);
  let bottomPos = cullPoint(height*2+padding+depth+vOffset);
  let gradBottomPos = cullPoint(height*2+padding+depth+vOffset+2000);
  if(gradBottomPos-bottomPos>0) {
    image(img,mainLSide,bottomPos,mainRSide-mainLSide,gradBottomPos-bottomPos);
  }

  fill(0);
  rect(mainLSide,topPos,mainRSide-mainLSide,bottomPos-topPos);
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
let jumpStrength=10;
let jumpAmount=40;
function keyPressed() {
  if (keyCode===32) {
    if (jumpAmount>2) {
      jumpAmount*=0.95;
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

// ORGANO

// Keycode of corresponding letter, x, y, width and height from left and top of image, time of treatment in milliseconds
function Organ(_keyCode,_xFromSide,_yFromTop,_width,_height,_treatmentTime) {

  // Hardcoded properties
  this.symptomStage = 0;
  this.startOfTreatment;
  this.treatmentStage = 0;


  // Methods
  this.display = function() {

    x = _xFromSide - _width/2 + mainRSide - mainLSide + padding * 3;
    y = height - padding - sidePanelWidth*outline.height/outline.width + _yFromTop;

    // Rectangle
    fill(0);
    strokeWeight(1);
    stroke(255);
    rect(x,y,_width,_height);

    // Text
    textFont("Noto Serif");
    textAlign(CENTER);
    textSize(Math.round(_width * 0.7));
    textStyle(BOLD);
    fill(255);
    noStroke();
    text(String.fromCharCode(_keyCode), x+(_width/2), y+(_height/2)+2);

    if (keyIsDown(_keyCode)) {
      if (this.startOfTreatment == null) {
        this.startOfTreatment = millis();
      }
      stroke(255);
      strokeWeight(5);
      var quarterTreatmentProgress = (millis()-this.startOfTreatment)/(_treatmentTime/4);
      if (this.treatmentStage == 0) {
        line(x,y+_height,x,y+_height-_height*quarterTreatmentProgress);
        if (quarterTreatmentProgress >= 1) {
          this.treatmentStage = 1;
        }
      } else if (this.treatmentStage == 1) {
        line(x,y+_height,x,y);
        line(x,y,x+_width*(quarterTreatmentProgress-1),y);
        if (quarterTreatmentProgress >= 2) {
          this.treatmentStage = 2;
        }
      } else if (this.treatmentStage == 2) {
        line(x,y+_height,x,y);
        line(x,y,x+_width,y);
        line(x+_width,y,x+_width,y+_height*(quarterTreatmentProgress-2));
        if (quarterTreatmentProgress >= 3) {
          this.treatmentStage = 3;
        }
      } else if (this.treatmentStage == 3) {
        line(x,y+_height,x,y);
        line(x,y,x+_width,y);
        line(x+_width,y,x+_width,y+_height);
        line(x+_width,y+_height,x+_width-_width*(quarterTreatmentProgress-3),y+_height);
        if (quarterTreatmentProgress >= 4) {
          this.treatmentStage = null;
        }
      }
    } else {
      this.treatmentStage = 0;
      this.startOfTreatment = null;
    }
  }
}
