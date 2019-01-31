//Il codice è un po' un casino.
function preload() {}
let randomPos = [];

//massima altitudine e massima profondità (segno invertito).
//Questo è il numero di tacche sul righello.
let topValue = -400;
let bottomValue = 400;

//Array contiene le bolle per lo splash. Forse c'è un modo migliore, non so.
var bubbles = [];

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  textSize(17);
  textAlign(RIGHT, CENTER);
  strokeWeight(1);
  //prendo un po' di valori a caso che mi servono dopo per posizionare le linee cinetiche.
  for (i = topValue; i < bottomValue; i++) {
    let rndValue = random(0, 1);
    randomPos.push(rndValue);
  }
  //Creo le bolle per lo splash.
  var bubNumber = 5;
  //Bolle al centro.
  for (i = 0; i < bubNumber; i++) {
    var newBub = new Bubble(random(-30, 30), 0, random(10, 20), 0);
    bubbles.push(newBub);
  }
  //Bolle distribuite.
  for (i = 0; i < bubNumber; i++) {
    var thisBub = new Bubble(random(-100, 100), 0, random(5, 10), 0);
    thisBub.mass += 0.1;
    bubbles.push(thisBub);
  }
}
//Lati verticali del box principale, parametrici, e padding in alto e basso.
let meterWidth=25;
const padding = 40;
let mainLSide = meterWidth+padding+padding*.75;
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
let center;
//velocità del mondo e gravità.
let speed = 0;
let gravity = 0.02;

//Variabili per l'effetto splash.
//0: not splashing. 1: splash up. 2: splash down.
let splashState = 0;
let splashAmount = 0;

let now=then=0;

function draw() {
  //Velocità calcolata SUL TEMPO, non su framerate.
  function calcSpeed(DELTA,SPEED) {
    return (SPEED*DELTA)*0.06;
  }
  now = millis();
  delta = now - then;
  vOffset += calcSpeed(delta,speed);
  speed += calcSpeed(delta,-gravity);
  if (keyIsPressed && speed < 0) {
    speed = 0.5;
  } else if (keyIsPressed) {
    speed += calcSpeed(delta,0.5);
  }
  then=now;
  //vOffset = vOffset + speed;
  //speed = speed - gravity;

  //In risposta a evento, viene data spinta verso l'alto.
  //Questa parte è provvisoria. L'evento è sbagliato e la spinta non deve essere costante.

  //mapVar a seconda della profondità.
  if (vOffset < -2000 && mapVar <= 2) {
    mapVar = lerp(mapVar, 2, 0.01);
  }
  if (vOffset > -2000 && mapVar >= 0) {
    mapVar = lerp(mapVar, 0, 0.01);
  }
  //Movimento dell'avatar. Noise+oscillazione verticale.
  avatarOff = lerp(avatarOff, speed * 10, 0.05) + cos(millis()*0.06 / 30);
  noiseSpeed = 0.2;
  noiseAmount = mapVar * 30;
  noiseSeed(9);
  hNoise = (noise(millis() / 100 * noiseSpeed) - 0.5) * noiseAmount;
  noiseSeed(10);
  vNoise = (noise(millis() / 100 * noiseSpeed) - 0.5) * noiseAmount;

  //Colore di sfondo a seconda della profondità.
  if (vOffset > 300) {
    bgBrightness = lerp(bgBrightness, 255, 0.05);
  } else if (vOffset < -300) {
    bgBrightness = lerp(bgBrightness, 0, 0.05);
  }
  background(200, 0, bgBrightness);

  //provvisoriamente il mouse indica le dimensioni del box. Per testing.
  mainRSide = mouseX;

  //sfondo del box.
  fill(0);
  stroke(255);
  rect(mainLSide, padding, mainRSide - mainLSide, height - padding * 2);

  //posizione dell'avatar
  center = createVector(mainLSide + (mainRSide - mainLSide) / 2, height / 2 + avatarOff);
  center.y = limitValue(center.y, padding*3, height-padding*3);


  //***MARE-CIELO***
  push();
  fill(255);
  noStroke();
  blendMode(BLEND);
  //Il codice per la superficie del mare è preso quasi paro paro dagli esempi di p5.
  beginShape();
  let xoff = 0;
  for (let x = mainLSide; x <= mainRSide; x += 10) {
    let y = map(noise(xoff, yoff), 0, 1, height / 2 - 20 + vOffset, height / 2 + 20 + vOffset);
    //eccetto che se uno dei punti finisce fuori dal box, lo rispingo dentro.
    //uso spesso questa funzione (definita dopo) per fare in modo che nulla finisca fuori dal box.
    //questo perché p5 non ha una funzione "maschera" per queste situazioni.
    y=cullPoint(y);
    //ultimo vertice
    vertex(x, y);
    xoff += 0.05;
    if (x > mainRSide - 10) {
      vertex(mainRSide, y);
    }
  }
  yoff += 0.01;
  //ultimi due vertici ai margini del box.
  vertex(mainRSide, padding);
  vertex(mainLSide, padding);
  endShape(CLOSE);

  //SPLASH
  blendMode(MULTIPLY);
  fill(0);
  //forse questa cosa poteva essere fatta più semplicemente, non so.
  //è un po' difficile far partire una animazione con una certa durata
  let splashing = 0;
  if (vOffset < 10 && vOffset > -10) {
    splashing = 1;
  }
  if (splashing && splashState == 0 || splashing && splashState == 2) {
    splashState = 1;
  } else if (splashState == 1) {
    splashAmount = lerp(splashAmount, 100, 0.1);
  }
  if (splashAmount > 99 && splashState == 1) {
    splashState = 2;
  } else if (splashState == 2) {
    splashAmount = lerp(splashAmount, 0, 0.02);
  }
  if (splashState == 2 && splashAmount < 1) {
    splashState = 0;
  }
  //splash sono object. splashAmount ne regola l'altezza
  new Splash(50, splashAmount * 1.5 * 0.2 * abs(speed), 0);
  new Splash(40, splashAmount * 0.6 * 0.2 * abs(speed), -50);
  new Splash(30, splashAmount * 0.6 * 0.2 * abs(speed), +60);
  pop();
  //Bolle dello splash. Sono simulate fisicamente con gravità loro.
  //vedi object e funzioni corrispondenti.
  for (j = 0; j < bubbles.length; j++) {
    var bubGravity = createVector(0, 0.05 * bubbles[j].mass);
    bubbles[j].applyForce(bubGravity);
    if (splashState == 1 && bubbles[j].position.y > -20) {
      bubbles[j].velocity.y = -0.1 * abs(speed) / bubbles[j].mass;
    }
    bubbles[j].update();
    bubbles[j].display();
    bubbles[j].checkEdges();
  }

  //FRAME. cioè il rettangolo che delimita il box.
  noFill();
  stroke(255 - bgBrightness);
  rect(mainLSide, padding, mainRSide - mainLSide, height - padding * 2);

  //AVATAR
  stroke(255);
  blendMode(DIFFERENCE);
  push();
  fill(255);
  noStroke();
  translate(hNoise, vNoise);
  beginShape();
  vertex(center.x + vNoise / 2, center.y + 30 + hNoise / 2);
  bezierVertex( center.x - 50, center.y + hNoise / 2,
                center.x - 15 + vNoise / 2, center.y - 37.5,
                center.x, center.y - 7.5);
  bezierVertex( center.x + 15, center.y - 37.5 + hNoise / 2,
                center.x + 50, center.y + hNoise / 2,
                center.x + vNoise / 2, center.y + 30 + hNoise / 2);
  endShape();
  pop();

  //Righello
  for (i = topValue; i < bottomValue; i += 1) {
    let iToPx = i * 4 * 25;
    let lineWidth = 20;
    let vPos = height / 2 + iToPx + vOffset;
    if (vPos < height - padding && vPos > padding) {
      textStyle(NORMAL);
      if (i % 4 === 0) {
        lineWidth = 30;
        textStyle(BOLD);
      }
      line(mainRSide - lineWidth, vPos, mainRSide, vPos);
      push();
      noStroke();
      fill(255);
      if (vPos < height - padding - 7 && vPos > padding + 7) {
        text(-i * 25, mainRSide - lineWidth - 10, vPos);
      }
      pop();

    }
    //linee cinetiche (una per ogni tacca del righello)
    if (vPos < height && vPos > 0) {
      let linePos = map(randomPos[i - topValue], 0, 1, mainLSide + 10, mainRSide - 100) + cos(millis()*0.06 / 100 + randomPos[i - topValue] * 360) * 5;
      let topPos = vPos - 3 * speed - random(0, 2);
      let bottomPos = vPos + 3 * speed + random(0, 2);
      topPos = cullPoint(topPos);
      bottomPos = cullPoint(bottomPos);
      line(linePos + hNoise / 10, topPos, linePos + vNoise / 10, bottomPos);
    }

  }
  //***DEPTH METER***//



  let meterAvatarHeight=map(vOffset,40000,-40000,padding*1.2,height-padding*1.2);
  meterAvatarHeight=limitValue(meterAvatarHeight,padding*1.2,height-padding*1.2);
  /*if (meterAvatarHeight<=padding*1.2) {
    meterAvatarHeight=padding*1.2;
  } else if (meterAvatarHeight>=height-padding*1.2) {
    meterAvatarHeight=height-padding*1.2;
  }*/
  push(); noStroke(); fill(255);
  ellipse(padding+meterWidth/2,meterAvatarHeight,10);
  blendMode(DIFFERENCE);
  rect(padding,height/2,meterWidth,height/2-padding);
  pop();
  blendMode(BLEND);
  stroke(255-bgBrightness);
  rect(padding,padding,meterWidth,height-padding*2);

  //***POST-PROCESSING***//
  if (vOffset > -100) {
    postPro = false;
  } else {
    postPro = true;
  }
  if (postPro) {
    push();
    var snapShot = get();
    let n = noise(millis() / 30 * 0.1) * mapVar;
    let scaleAm = 1 + n / 160;
    let satVar = (millis() / 100) % 510;
    if (satVar > 255) {
      satVar = 500 - satVar;
    }
    colorMode(HSB);
    fill(255, 255, 200, 40);
    blendMode(MULTIPLY);
    rect(0, 0, width, height);
    blendMode(SCREEN);
    push();
    translate(width / 2, height / 2);
    rotate(n / 500);
    translate(-width / 2, -height / 2);
    scale(scaleAm)
    translate(-width * (sqrt(scaleAm) - 1), -height * (sqrt(scaleAm) - 1));
    image(snapShot, n, n);
    pop();

    fill(satVar, 100, 255, map(mapVar, 0, 2, 0, 1));
    blendMode(MULTIPLY);
    rect(0, 0, width, height);
    pop();
  }
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

function cullPoint(INPUT) {
  if (INPUT <= padding) {
    return padding;
  } else if (INPUT >= height - padding) {
    return height - padding;
  } else {
    return INPUT;
  }
}

function windowResized() {
  resizeCanvas(windowWidth,windowHeight);
}
