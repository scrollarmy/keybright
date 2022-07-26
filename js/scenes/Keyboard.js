    /*
    Keybright:  https://github.com/philippedubost/keybright
    ---------------------------------
    This portion is a template behavior for the Keyboard
    It is using the variables keyboardX, keyboardY, keyboardSX, keyboardSY set during Calibration phase.
    */  
    (function() {
    //refers to the folder /img/courierNew/ containing all letters images
    var _FONT = "georgia";
    var soundType = new Howl({urls: ['../../sound/key1.ogg']});
    var soundSpace = new Howl({urls: ['../../sound/space1.ogg']});

    // Matter aliases
    var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Constraint = Matter.Constraint,
    RenderPixi = Matter.RenderPixi,
    Events = Matter.Events,
    Bounds = Matter.Bounds,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Query = Matter.Query;

    var Keyboard = {};

    var _engine,
    _gui,
    _inspector,
    _sceneName,
    _mouseConstraint,
    _sceneEvents = [],
    _useInspector = window.location.hash.indexOf('-inspect') !== -1,
    _isMobile = /(ipad|iphone|ipod|android)/gi.test(navigator.userAgent);
    
    // initialise the Keyboard
    Keyboard.init = function() {
        var container = document.getElementById('canvas-container');

        // some example engine options
        var options = {
            background: '#111111',
            positionIterations: 6,
            velocityIterations: 4
        };

        // create a Matter engine
        // NOTE: this is actually Matter.Engine.create(), see the aliases at top of this file
        _engine = Engine.create(container, options);

        // add a mouse controlled constraint
        _mouseConstraint = MouseConstraint.create(_engine);
        World.add(_engine.world, _mouseConstraint);

        // run the engine
        Engine.run(_engine);
        
        // set up a scene with bodies
        Keyboard.keyboard();
    };

    // each Keyboard scene is set up in its own function, see below
    Keyboard.keyboard = function() {
        var _world = _engine.world;

        //Keyboard.reset();
        _world.bodies = [];
        
        var renderOptions = _engine.render.options;
        renderOptions.background = './img/black.jpg';
        renderOptions.showAngleIndicator = false;
        renderOptions.wireframes = false;
    };

    //create Obstacle correspondig to the physical Keyboard
    Keyboard.addObstacle = function() {
        var options = { 
            background: '#FF0000',
            isStatic: true,
            label: "keyboard",
            render: {
                visible: false
            }
        };

        var _world = _engine.world;
        World.add(_world, [Bodies.rectangle(keyboardX, keyboardY, keyboardSX, keyboardSY, options)]);
    };

    //Delete Obstacle for Re-Calibration
    Keyboard.deleteObstacle = function() {
        var _world = _engine.world;
        var bodies = Composite.allBodies(_world);

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if(body.label == "keyboard"){
                World.remove(_world, body);
            }
        }
    };

    //Used onkeydown with A..Z 0..9
    Keyboard.shootLetter = function(charCode) {
        var _world = _engine.world;

        //Calculate appropriate x emission for the position of the letter on the keyboard
        //Standard QWERTY keyboard
        var x_fraction = .5;
        var letter = String.fromCharCode(charCode);

        var line1 = "1234567890";
        var line2 = "QWERTYUIOP";
        var line3 = "ASDFGHJKL";
        var line4 = "ZXCVBNM";
        if(line1.indexOf(letter) != -1){
            x_fraction = line1.indexOf(letter)/10;                        
        }
        else if(line2.indexOf(letter) != -1){
            x_fraction = line2.indexOf(letter)/10;                        
        }
        else if(line3.indexOf(letter) != -1){
            x_fraction = line3.indexOf(letter)/10;                        
        }
        else if(line4.indexOf(letter) != -1){
            x_fraction = line4.indexOf(letter)/10+1/10;                        
        }

        //scaling down and offseting to the left
        x_fraction = x_fraction*0.8-0.2; 

        //Add letter to the world
        World.add(_world, [
            Bodies.rectangle(keyboardX + (-0.5+x_fraction)*keyboardSX/2, keyboardY - keyboardSY/2-5, 14, 14, {
                render: {
                    strokeStyle: '#ffffff',
                    sprite: {
                        texture: './img/'+_FONT+'/'+charCode+'.png',
                        xScale: .40,
                        yScale: .40
                    }
                }
            })
            ]); 
        
        //Add a shooting force
        var bodies = Composite.allBodies(_world);
        var body = bodies[bodies.length-1];
        Body.applyForce(body, { x: keyboardX + (-0.5+x_fraction)*keyboardSX/1.7, y: keyboardY - keyboardSY/2-1 }, { 
            x: Math.random()*0.001, 
            y: -.007-0.002*Math.random()
        });

        //Sound
       soundType.play();

    };

       
    //Used when SPACE is pressed    
    Keyboard.explode = function() {
        var _world = _engine.world;

        var bodies = Composite.allBodies(_world);

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            Body.applyForce(body, { x: 0, y: 0 }, { 
                x: 0.005*(Math.random()-.5), 
                y: 0.005*(Math.random()-.5)
            });
        }
        
        //Sound
       soundSpace.play();
    };

    Keyboard.destroyFallenLetters = function() {
        var _world = _engine.world;
        var bodies = Composite.allBodies(_world);

        console.log("nb Bodies = "+bodies.length);
        console.log("1ere lettre y = "+bodies[1].position.y+" 1ere lettre x = "+bodies[1].position.x);

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var y = body.position.y;

            //Delete letters out of the world space
            if(body.position.y > 600 || body.position.x > 800 || body.position.x < 0 || body.position.y < 0){
                World.remove(_world, body);            
            }

        }
        
    };

    //Used onkeydown Delete
    Keyboard.deleteLast = function() {        
            //TODO: animate before death - shrink or pop out
            var _world = _engine.world;

            var bodies = Composite.allBodies(_world);
            var body = bodies[bodies.length-1];
            Body.applyForce(body, { x: 0, y: 0 }, { 
                x: 0, 
                y: -.5
            });
            //window.setTimeout('', 2000);
            World.remove(_world, body)
        };

    Keyboard.onkeydown = function(e) {
        var _world = _engine.world;

        if(_world.bodies.length > 0){
                var key = e.keyCode ? e.keyCode : e.which;

                //Character 0..9 A..Z is pressed
                if(key < 91 && key > 47){
                    Keyboard.shootLetter(key);
                }
                
                //Space is pressed
                if(key == 32){
                    Keyboard.explode();
                }
                
                //Delete is pressed
                if(key == 46){
                    Keyboard.deleteLast();
                }

                Keyboard.destroyFallenLetters();
            }

            //Light Keyboard
            $("#keyboardLight").fadeIn(100);
    }

    Keyboard.onkeyup = function(e) {
            //Light Keyboard
            $("#keyboardLight").fadeOut(100);
    }

    Keyboard.onload = function() {
        document.getElementById("startPlay").addEventListener("click", function(){
            Keyboard.addObstacle();
        });

        document.getElementById("backToCalibration").addEventListener("click", function(){
            Keyboard.deleteObstacle();
        });

        //preload images for letters
        var path = './img/'+_FONT+'/';

        for (var index = 34; index < 97; index++) {
            new Image().src = path + index + ".png";
        }
    };

//*********************************************************************************
//Define the Scene
    if(scene == "Keyboard"){
        console.log("Loading: "+scene);
        var Scene = Keyboard;
        // Initialize Scene when the page has loaded fully    
        if (window.addEventListener) {
            window.addEventListener('load', Scene.init);
        } 
        else if (window.attachEvent) {
            window.attachEvent('load', Scene.init);
        }

        window.onload = function() {
            Scene.onload(); 
        };

        window.onkeydown = function(e) {
            Scene.onkeydown(e);
        }

        window.onkeyup = function(e) {
            Scene.onkeyup(e);       
        }
    }
})();