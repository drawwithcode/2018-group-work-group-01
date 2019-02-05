//GAME STATE. -1=Title screen; 0=Game paused; 1= game started (phase 1); 2= phase 2; 3 = phase 3.
let gameState=-1


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
let kalSize, offScreen;
let kalAlpha = 0;


//Lati verticali del box principale, parametrici, e padding in alto e basso.
let meterWidth=25;
let meterPos=-70;
const padding = 40;
let mainLSide = padding;
let mainRSide = 900;
let sidePanelWidth = 650;
let sidePanelPos;

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
let allowSplashSound = 1;
let splashSpeed = 0;

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

let now=then=0;



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
  impact.play();
  speed += offsetJump;
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
    blendMode(BLEND);
    fill(bgBrightness);
    strokeWeight(1);
    stroke(255-bgBrightness);
    rect(x,y,_width,_height);

    // Text
    textFont("Noto Serif");
    textAlign(CENTER);
    textSize(Math.round(_width * 0.7));
    textStyle(BOLD);
    fill(255-bgBrightness);
    noStroke();
    text(String.fromCharCode(_keyCode), x+(_width/2), y+(_height/2)+2);

    if (keyIsDown(_keyCode)) {
      if (this.startOfTreatment == null) {
        this.startOfTreatment = millis();
      }
      stroke(255-bgBrightness);
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



function titleScreen() {
  push();
  //cornice
  rectMode(CORNER);
  fill(0);
  stroke(255);
  rect(40,40,windowWidth-80,windowHeight-80);
  push();
  rectMode(CORNER);
  var wUp = 400;
  var hUp = 125;
  var xUp = windowWidth/2 - 200 ;
  var yUp = windowHeight/2 - 62.5 ;
  var max_xUp = xUp + wUp;
  var max_yUp = yUp + hUp;
  let fillUp = 0;
  let fillDown = 0;
  let fillText = 0;
  let strokeUp = 0;
  let strokeDown = 0;
  let clickOffset=0;
  if(mouseX > xUp - 25 && mouseX < max_xUp && mouseY > yUp - 25 && mouseY < max_yUp) {
    fillUp = 0;
    strokeUp = 255;
    fillDown = 255;
    strokeDown = 0;
    fillText = 0;
    cursor('pointer');
    if (mouseIsPressed&&canPressMouse) {
      clickOffset=7;
      setTimeout(function(){gameState=0;cursor('auto');},200);

    }
  } else {
    fillUp = 255;
    strokeUp = 255;
    fillDown = 0;
    strokeDown = 255;
    fillText = 255;
    cursor('auto');
  }
  //rettangolo sopra
  fill(fillUp);
  rect(xUp,yUp,wUp,hUp);
  //rettangolo sotto
  fill(fillDown);
  rect(xUp - 25+clickOffset, yUp - 25+clickOffset, wUp, hUp);
  //testo
  this.partTwo = function() {
    push();
    textFont('EB Garamond');
    noStroke();
    textSize(60);
    textAlign(CENTER);
    fill(fillText);
    text('Cold Turkey', windowWidth/2 - 27+clickOffset, windowHeight/2+clickOffset);
    pop();
  }
  pop();
}
let storySlide=1;
function failScreen() {
  push();
  let fillSb = 0;
  let fillTx = 0;
  let strokeSb = 0;
  let strokeTx = 0;
  var wSb = 324;
  var hSb = 64;
  var xSb = windowWidth/2 - 162;
  var ySb = windowHeight/2 + 118;
  //boundaries
  var max_xSb = xSb + wSb;
  var max_ySb = ySb + hSb;
  // put drawing code here
  background(0);
  //glitch
  push();
  //cornice
  rectMode(CORNER);
  fill(0);
  stroke(255);
  rect(40,40,windowWidth-80,windowHeight-80);
  textFont('EB Garamond');
  noStroke();
  textSize(60);
  textAlign(CENTER);
  fill(255);
  if (storySlide<5) {
    text(storySlide+'.', windowWidth/2, windowHeight/2 - 100);
  }
  if (storySlide==5) {
    text("Overdose", windowWidth/2, windowHeight/2 - 100);
  }
  if (storySlide==6) {
    text("Abstinence", windowWidth/2, windowHeight/2 - 100);
  }
  if (storySlide==7) {
    text("Cold Turkey", windowWidth/2, windowHeight/2 - 100);
  }
  //spacebar
  pop();
  textAlign(CENTER);
  textFont('Raleway');
  textSize(17);
  fill(255);
  if (storySlide==1) {
    text('You pick it up.', windowWidth/2, windowHeight/2 + 45);
    stroke(255);
    line(windowWidth/2-55, windowHeight/2 + 50,windowWidth/2+55, windowHeight/2 + 50)
    if (mouseX<width/2+55&&mouseX>width/2-55&&mouseY<height/2+55&&mouseY>height/2+25) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=2;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }
  if (storySlide==2) {
    text('You say yes.', windowWidth/2, windowHeight/2 + 45);
    stroke(255);
    line(windowWidth/2-45, windowHeight/2 + 50,windowWidth/2+45, windowHeight/2 + 50)
    if (mouseX<width/2+45&&mouseX>width/2-45&&mouseY<height/2+55&&mouseY>height/2+25) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=3;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }
  if (storySlide==3) {
    text('You make small talk.', windowWidth/2, windowHeight/2 + 45);
    stroke(255);
    line(windowWidth/2-80, windowHeight/2 + 50,windowWidth/2+80, windowHeight/2 + 50)
    if (mouseX<width/2+80&&mouseX>width/2-80&&mouseY<height/2+55&&mouseY>height/2+25) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=4;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }
  if (storySlide==4) {
    text('Press          Space          to accept.', windowWidth/2, windowHeight/2 + 70);
    stroke(255);
    noFill();
    rect(windowWidth/2-70,windowHeight/2+50,106,30);
  }
  if (storySlide==5) {
    text('That was a mistake.', windowWidth/2, windowHeight/2 + 70);
    stroke(255);
    line(windowWidth/2-78, windowHeight/2 + 75,windowWidth/2+78, windowHeight/2 + 75)
    if (mouseX<width/2+78&&mouseX>width/2-78&&mouseY<height/2+80&&mouseY>height/2+50) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=4;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }
  if (storySlide==6) {
    text("There's no point in living anymore.", windowWidth/2, windowHeight/2 + 70);
    stroke(255);
    line(windowWidth/2-130, windowHeight/2 + 75,windowWidth/2+130, windowHeight/2 + 75)
    if (mouseX<width/2+130&&mouseX>width/2-130&&mouseY<height/2+80&&mouseY>height/2+50) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=4;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }
  if (storySlide==7) {
    text("You start to enjoy life again.", windowWidth/2, windowHeight/2 + 70);
    stroke(255);
    line(windowWidth/2-105, windowHeight/2 + 75,windowWidth/2+105, windowHeight/2 + 75)
    if (mouseX<width/2+105&&mouseX>width/2-105&&mouseY<height/2+80&&mouseY>height/2+50) {
      cursor('pointer');
      if (mouseIsPressed&&canPressMouse) {
        storySlide=1;
        gameState=-1;
        canPressMouse=0;
        cursor('auto');
      }
    } else {
      cursor('auto');
    }
  }


  this.partTwo = function() {
    push();
    textFont('Raleway');
    textSize(17);
    fill(255);
    textAlign(CENTER);
    noStroke();
    if (storySlide==1) {
      text("It's late at night. You're at home, bored. Mom is sleeping.", windowWidth/2, windowHeight/2 - 25);
      text('Your phone chimes.', windowWidth/2, windowHeight/2);
    }
    if (storySlide==2) {
      text("It's your older friend calling you. He wants to come pick you up to hang out.", windowWidth/2, windowHeight/2 - 25);
      text("He asks if you're free.", windowWidth/2, windowHeight/2);
    }
    if (storySlide==3) {
      text("You sneak out of your house and get in the car with a bunch of other guys.", windowWidth/2, windowHeight/2 - 25);
      text("It's chilly out.", windowWidth/2, windowHeight/2);
    }
    if (storySlide==4) {
      text("The guy in the driving seat makes a stop at a deserted parking lot.", windowWidth/2, windowHeight/2 - 25);
      text("You see another take out syringes. It's heroin.", windowWidth/2, windowHeight/2);
      text("They offer you some, just a taste.", windowWidth/2, windowHeight/2+25);
    }
    if (storySlide==5) {
      text("After hanging out with that same group more times,", windowWidth/2, windowHeight/2 - 25);
      text("you start to notice that the effect of the drug is wearing off faster and faster.", windowWidth/2, windowHeight/2);
      text("You increase your dose.", windowWidth/2, windowHeight/2+25);
    }
    if (storySlide==6) {
      text("Your friends tell you off when you try to score some for free.", windowWidth/2, windowHeight/2 - 25);
      text("You're broke and have no way to get any more.", windowWidth/2, windowHeight/2);
      text("After a week, the symptoms get really severe and there's nothing you can do about it.", windowWidth/2, windowHeight/2+25);
    }
    if (storySlide==7) {
      text("You get treatment. You fight your symptoms tooth and nail.", windowWidth/2, windowHeight/2 - 25);
      text("You know you're not out of danger and that your life may be permanently scarred,", windowWidth/2, windowHeight/2);
      text("but you manage to finally restore some balance to your world.", windowWidth/2, windowHeight/2+25);
    }

    pop();
  }
  pop();
}
let canPressMouse=1;
function mouseReleased() {
  canPressMouse=1;
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
