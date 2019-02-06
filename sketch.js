//Il codice è un po' un casino.
function preload() {
  splash1 = loadSound("./sounds/splash1.mp3");
  splash3 = loadSound("./sounds/splash3.mp3");
  horror = loadSound("./sounds/horror.mp3");
  horror3 = loadSound("./sounds/horror3.mp3");
  heartbeat = loadSound("./sounds/heartbeat.mp3");
  impact = loadSound("./sounds/impact.mp3");
  wind = loadSound("./sounds/wind.mp3");
  wind2 = loadSound("./sounds/wind2.mp3");
  strings2 = loadSound("./sounds/strings2.mp3");
  beat2 = loadSound("./sounds/blood.mp3");
  inception = loadSound("./sounds/boom.mp3");
  tension = loadSound("./sounds/tension.mp3");

  kaleido = loadImage("./images/kaleido.png");

  //organ display
  outline = loadImage("./images/body-outline.png");
  brainImage = loadImage("./images/brain.png");
  lungsImage = loadImage("./images/lungs.png");
  veinsImage = loadImage("./images/veins.png");
  skinImage = loadImage("./images/skin.png");
  heartImage = loadImage("./images/heart.png");
  intestinesImage = loadImage("./images/intestines.png");
  muscleImage = loadImage("./images/muscle.png");
  invertedBrainImage = loadImage("./images/inverted-brain.png");
  invertedLungsImage = loadImage("./images/inverted-lungs.png");
  invertedVeinsImage = loadImage("./images/inverted-veins.png");
  invertedSkinImage = loadImage("./images/inverted-skin.png");
  invertedHeartImage = loadImage("./images/inverted-heart.png");
  invertedIntestinesImage = loadImage("./images/inverted-intestines.png");
  invertedMuscleImage = loadImage("./images/inverted-muscle.png");
}


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
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
  //needed for kaleidoscope
  shape = calcStuff(width,height,slices);
  mask = createMask(shape.a,shape.o);
  //organs

  //_keyCode,_xFromSide,_yFromTop,_width,_height,_symptoms,_xFromSideText_yFromTopText,_treatmentTime
  brain = new Organ(89,0.5,0.15,40,40,brainSymptoms,0.55,0.2,1000); //E
  lungs = new Organ(71,0.41,0.5,40,40,lungsSymptoms,.46,.55,1000); //S
  veins = new Organ(75,0.8,0.5,40,40,veinsSymptoms,.85,.55,1000); //F
  skin = new Organ(90,0.15,0.8,40,40,skinSymptoms,.2,.85,1000); //N
  heart = new Organ(72,0.5,0.61,40,40,heartSymptoms,.55,.66,1000); //M
  intestines = new Organ(66,0.5,0.75,40,40,intestinesSymptoms,.55,.8,1000); //K
  muscle = new Organ(65,0.15,0.5,40,40,muscleSymptoms,.16,.60,1000); //B
  organs.push(brain,lungs,veins,skin,heart,intestines,muscle);
}

function startTurkey() {
  if (turkey == true) {
    return;
  }
  turkey = true;
  for (var i = 0; i < organs.length; i++) {
    organs[i].symptomStage = 0;
    organs[i].treatedSymptomsStage = 0;
  }
  setTimeout(function() {
    for (var i = 0; i < organs.length; i++) {
      setSymptom(organs[i], 1, int(random(0, 7000)));
    }
    stateChecker = setInterval(increaseLevel, 2000);
  }, 2000);
}

function endGame() {
  for (var i = 0; i < organs.length; i++) {
    organs[i].symptomStage = 0;
    organs[i].treatedSymptomsStage = 0;
  }
  clearInterval(stateChecker);
  turkey = false;
}

function increaseLevel() {
  var curedOrgans = 0;
  var currentLevel = 0;
  for (var i = 0; i < organs.length; i++) {
    if (organs[i].symptomStage == organs[i].treatedSymptomsStage) {
      curedOrgans++;
    }
    if (organs[i].treatedSymptomsStage > currentLevel) {
      currentLevel = organs[i].treatedSymptomsStage;
    }
  }

  if (curedOrgans == organs.length) {
    for (var i = 0; i < organs.length; i++) {
      if (currentLevel + 1 < 4) {
        setSymptom(organs[i], currentLevel + 1, int(random(0, 7000)))
      } else {
        storySlide=7;
        gameState=0;
        endGame();
      }
    }
  }
}


function draw() {
  //AVATAR POSITION
  center = createVector(mainLSide + (mainRSide - mainLSide) / 2, height / 2 + avatarOff);
  center.y = limitValue(center.y, padding*3, height-padding*3);
  //***GAME STATE***//
  if (gameState<1) {
    timesJumped=0;
    vOffset=-200;
    speed=0;
    jumpAmount=32;
    mainRSide=width-padding;
    center.y=height/2;
    enableSound=0;
    sidePanelPos=width+padding;
    if (keyIsDown(32)&&canPressSpace&&gameState==0&&storySlide==4) {
      canPressSpace=0;
      gameState=1;
      speed+=jumpAmount;
      inception.play();
    }
  } else {
    enableSound=1;
  }
  if (gameState==1&&jumpAmount<32) {
    meterPos=lerp(meterPos,0,0.02);
    mainLSide=lerp(mainLSide, padding+meterWidth+padding*.75,0.02);
    sidePanelPos=width+padding;
    if (jumpAmount<15) {
      gameState=2;
    }
  }
  if (gameState==2) {
    startTurkey();
    meterPos=lerp(meterPos,0,0.02);
    mainLSide=lerp(mainLSide, padding+meterWidth+padding*.75,0.02);
    mainRSide=lerp(mainRSide,width-padding*1.75-sidePanelWidth,0.02);
    sidePanelPos=(mainRSide+padding*.75);
  }
  let topFailIncrease=13000*(timesJumped-5)/30;
  if (topFailIncrease>13000) {
    topFailIncrease=13000;
  }
  let topMeterIncrease=138*(timesJumped-5)/30;
  if (topMeterIncrease>138) {
    topMeterIncrease=138;
  }
  if((height-center.y)>(26150-topFailIncrease)-vOffset||(height-center.y)<-(26300)-vOffset) {
    endGame();
    gameState=0;
    playerDied=1;
    if(inception.isPlaying()==false) {
      inception.play();
    }
    if (vOffset>0) {
      storySlide=5;
    }
    if (vOffset<0) {
      storySlide=6;
    }
  }
  //Velocità calcolata SUL TEMPO, non su framerate.
  if (vOffset > 300) {
    bgBrightness = lerp(bgBrightness, 255, 0.05);
  } else if (vOffset < -300) {
    bgBrightness = lerp(bgBrightness, 0, 0.05);
  }
  background(255);
  //KALEIDOSCOPE
  if (vOffset > 13000 && kalAlpha<=1) {
    kalAlpha+=0.002;
  }
  if (vOffset < 13000 && kalAlpha>=0 || vOffset > 23000 && kalAlpha>=0){
    kalAlpha+=-0.01;
  }
  push();
  kalSize=height*1.2;
  offScreen = createVector(0,0);
  blendMode(BLEND);
  fill(255);
  noStroke();
  rect(offScreen.x,offScreen.y,kalSize,kalSize);
  imageMode(CENTER);
  for(i=0;i<6;i++) {
    image(kaleido,offScreen.x+kalSize/2+i*50+cos(millis()/5000+i*60)*60+100,offScreen.y+kalSize/2+cos(millis()/6000+i*60)*kalSize/2,kalSize,kalSize/5);
  }
  fill(255,1-kalAlpha);
  rect(-width,-height,width*3,height*3);
  kalCopy = get(width/2,padding,kalSize,kalSize);
  fill(bgBrightness);
  noStroke();
  blendMode(BLEND);
  rect(0,0,width,height);
  pop();

  now = millis();
  delta = now - then;
  vOffset += calcSpeed(delta,speed);
  speed += calcSpeed(delta,-gravity);
  then=now;

  if (keyIsDown(32)) {
    /*if(jumpStrength<3) {
      jumpStrength+=0.1;
    } else {
      jumpStrength=3;
    }*/

    avatarScale = lerp(avatarScale,1.3,0.1);
    avatarFill = lerp(avatarFill,50,0.5);
  } else {
    jumpStrength=0;
    avatarScale = lerp(avatarScale,1,0.1);
    avatarFill = lerp(avatarFill,255,0.5);
  }

  //mapVar a seconda della profondità.
  if (vOffset < -8000 && mapVar <= 2) {
    mapVar = lerp(mapVar, 2, 0.01);
  }
  if (vOffset > -8000 && mapVar >= 0) {
    mapVar = lerp(mapVar, 0, 0.01);
  }
  //Movimento dell'avatar. Noise+oscillazione verticale.
  avatarOff = lerp(avatarOff, speed * 10, 0.05) + cos(millis()*0.06 / 30);
  noiseSpeed = 0.2;
  noiseAmount = mapVar * 30;
  if (vOffset<-25000+topFailIncrease||vOffset>24000) {
    noiseSpeed =0.4;
    noiseAmount=50;
  }
  noiseSeed(9);
  hNoise = (noise(millis() / 100 * noiseSpeed) - 0.5) * noiseAmount;
  noiseSeed(10);
  vNoise = (noise(millis() / 100 * noiseSpeed) - 0.5) * noiseAmount;


  //sfondo del box.
  fill(0);
  stroke(255);
  rect(mainLSide, padding, mainRSide - mainLSide, height - padding * 2);
  push();
  noFill();
  blendMode(DIFFERENCE);
  rect(sidePanelPos, padding, sidePanelWidth, height - padding * 2);
  pop();


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

  //FAIL AREAS
  bottomFailArea(27000);
  topFailArea(-27000+topFailIncrease);

  //SPLASH
  blendMode(MULTIPLY);
  fill(0);
  //forse questa cosa poteva essere fatta più semplicemente, non so.
  //è un po' difficile far partire una animazione con una certa durata
  let splashing = 0;
  if (vOffset < 10 && vOffset > -10) {
    splashing = 1;
    if(allowSplashSound&&enableSound) {
      if(speed>0) {
        splash1.rate(2);
        splash3.rate(1);
      } else {
        splash1.rate(1);
        splash3.rate(0.8);
      }
      splash1.play();
      splash3.play();
      allowSplashSound=0;
      setTimeout(function(){allowSplashSound=1},1000);
    }
  }
  if (splashing && splashState == 0 || splashing && splashState == 2) {
    splashSpeed = speed;
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
  new Splash(50, splashAmount * 1.5 * 0.2 * abs(splashSpeed), 0);
  new Splash(40, splashAmount * 0.6 * 0.2 * abs(splashSpeed), -50);
  new Splash(30, splashAmount * 0.6 * 0.2 * abs(splashSpeed), +60);
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

  //***AVATAR***//
  //kaleidoscope under avatar
  push();
  translate(center.x-width/2,center.y-height/2+5);
  blendMode(MULTIPLY);
  mirror(kalCopy);
  pop();
  //avatar proper starts here
  stroke(255);
  blendMode(DIFFERENCE);
  push();
  fill(avatarFill);
  noStroke();
  translate(hNoise, vNoise);
  beginShape();
  vertex(center.x + vNoise / 2*avatarScale, center.y + 30*avatarScale + hNoise / 2*avatarScale);
  bezierVertex( center.x - 50*avatarScale, center.y + hNoise / 2*avatarScale,
                center.x - 15 + vNoise / 2*avatarScale, center.y - 37.5*avatarScale,
                center.x, center.y - 7.5*avatarScale);
  bezierVertex( center.x + 15*avatarScale, center.y - 37.5*avatarScale + hNoise / 2*avatarScale,
                center.x + 50*avatarScale, center.y + hNoise / 2*avatarScale,
                center.x + vNoise / 2*avatarScale, center.y + 30*avatarScale + hNoise / 2*avatarScale);
  endShape();
  pop();

  //***INDICATORE PROFONDITÀ***//
  push();
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
      textSize(17);
      textAlign(RIGHT, CENTER);
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
  //meter
  translate(meterPos,0);
  let meterAvatarHeight=map(vOffset,40000,-40000,padding*1.2,height-padding*1.2);
  meterAvatarHeight=limitValue(meterAvatarHeight,padding*1.2,height-padding*1.2);
  push(); noStroke(); fill(255);
  ellipse(padding+meterWidth/2,meterAvatarHeight,10);
  blendMode(DIFFERENCE);
  rect(padding,height/2,meterWidth,height/2-padding);
  pop();
  topFail = new failArea(padding,padding,meterWidth,(height-padding*2)*0.18+topMeterIncrease);
  bottomFail = new failArea(padding,height-padding-(height-padding*2)*0.18,meterWidth,(height-padding*2)*0.18);
  blendMode(BLEND);
  stroke(255-bgBrightness);
  rect(padding,padding,meterWidth,height-padding*2);
  translate(-meterPos,0);


  //*** INDICATORE SINTOMI***//
  push();
  blendMode(DIFFERENCE);
  sidePanelWidth=outline.width/outline.height*(height-padding*2);
  var imageX = mainRSide - mainLSide + padding * 3;
  var imageY = height - padding - sidePanelWidth*outline.height/outline.width;
  var imageHeight = sidePanelWidth*outline.height/outline.width;
  image(outline,imageX, imageY, sidePanelWidth, imageHeight);

  // I deeply apologize
  if (brain.symptomStage != brain.treatedSymptomsStage) {
    image(invertedBrainImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(brainImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (lungs.symptomStage != lungs.treatedSymptomsStage) {
    image(invertedLungsImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(lungsImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (veins.symptomStage != veins.treatedSymptomsStage) {
    image(invertedVeinsImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(veinsImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (skin.symptomStage != skin.treatedSymptomsStage) {
    image(invertedSkinImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(skinImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (heart.symptomStage != heart.treatedSymptomsStage) {
    image(invertedHeartImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(heartImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (intestines.symptomStage != intestines.treatedSymptomsStage) {
    image(invertedIntestinesImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(intestinesImage,imageX, imageY, sidePanelWidth, imageHeight);
  }
  if (muscle.symptomStage != muscle.treatedSymptomsStage) {
    image(invertedMuscleImage,imageX, imageY, sidePanelWidth, imageHeight);
  } else {
    image(muscleImage,imageX, imageY, sidePanelWidth, imageHeight);
  }

  for (var i = 0; i < organs.length; i++) {
    organs[i].display();
  }
  pop();

  strokeWeight(1);
  textSize(20);

  //***AMBIENT SOUNDS***//
  if (enableSound) {
  if (horror3.isPlaying()==false&&vOffset<0) {
    horror3.loop();
  }
  if (vOffset<-100) {
    h3Amp=lerp(h3Amp,1,0.1);
  } else {
    h3Amp=lerp(h3Amp,0,0.01);
  }
  if (horror.isPlaying()==false&&vOffset<-4000) {
    horror.loop();
  }
  if (vOffset<-4000) {
    hAmp=lerp(hAmp,1,0.1);
  } else {
    hAmp=lerp(hAmp,0,0.01);
  }
  if (heartbeat.isPlaying()==false&&vOffset<-8000) {
    heartbeat.loop();
  }
  if (vOffset<-8000) {
    hbAmp=lerp(hbAmp,1,0.5);
  } else {
    hbAmp=lerp(hbAmp,0,0.1);
  }
  if (beat2.isPlaying()==false&&vOffset<-12000) {
    beat2.amp(0.5);
    beat2.loop();
  }
  if (vOffset<-12000) {
    b2Amp=lerp(b2Amp,0.5,0.1);
  } else {
    b2Amp=lerp(b2Amp,0,0.01);
  }
  if (wind.isPlaying()==false&&vOffset>-100) {
    wind.loop();
  }
  if (vOffset>-100) {
    windAmp=lerp(windAmp,0.5,0.1);
  } else {
    windAmp=lerp(windAmp,0,0.01);
  }
  if (strings2.isPlaying()==false&&vOffset>13000) {
    strings2.loop();
  }
  if (vOffset>13000) {
    str2Amp=lerp(str2Amp,1,0.1);
  } else {
    str2Amp=lerp(str2Amp,0,0.01);
  }
  if (tension.isPlaying()==false&&vOffset>23000-topFailIncrease||tension.isPlaying()==false&&vOffset<-23000) {
    tension.loop();
  }
  if (vOffset>23000-topFailIncrease||vOffset<-23000) {
    tensAmp=lerp(tensAmp,0.9,0.1);
  } else {
    tensAmp=lerp(tensAmp,0,0.01);
  }

  if (wind2.isPlaying()==false) {
    wind2.loop();
  }
  wind2.amp(speed*0.003);
  wind2.rate(1.1);

  horror.amp(hAmp);
  horror3.amp(h3Amp);
  heartbeat.amp(hbAmp);
  beat2.amp(b2Amp);
  tension.amp(tensAmp);

  wind.amp(windAmp);
  strings2.amp(str2Amp);
} else {
  horror3.stop();
  horror.stop();
  heartbeat.stop();
  beat2.stop();
  wind.stop();
  strings2.stop();
  wind2.stop();
  tensAmp=lerp(tensAmp,0,0.01);
  tension.amp(tensAmp);
}

  //***TITLE SCREEN***//

  if(gameState==-1) {
    mapVar=2;
    title=new titleScreen();
  }
  if (gameState==0) {
    mapVar=2;
    fail=new failScreen();
  }


  //***POST-PROCESSING***//
  if (vOffset > -5000 && gameState>0) {
    postPro = false;
  } else {
    postPro = true;
  }
  if (vOffset<-23000||vOffset>23000) {
    failApproach = lerp(failApproach,1,0.05);
  } else {
    failApproach = lerp(failApproach,0,0.05);
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
    blendMode(MULTIPLY);
    fill(satVar, 100, 255, map(mapVar, 0, 2, 0, 1)*(1-failApproach));
    rect(0, 0, width, height);
    fill(0, 100, 255, map(mapVar, 0, 2, 0, 1)*failApproach);
    rect(0, 0, width, height);
    pop();
  }
  if (vOffset>7000) {
    topPostPro=lerp(topPostPro,255,0.05);
  } else {
    topPostPro=lerp(topPostPro,0,0.05);
  }
  push();
  blendMode(ADD);
  colorMode(RGB);
  fill(map(failApproach,0,1,255,150),0,150*(1-failApproach),topPostPro);
  noStroke();
  rect(0,0,width,height);
  pop();
  if(gameState==-1) {
    title.partTwo();
  }
  if (gameState==0) {
    fail.partTwo();
  }

}

function windowResized() {
  resizeCanvas(windowWidth,windowHeight);
}
