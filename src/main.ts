import "./style.css";
import { interval, fromEvent , zip, merge} from "rxjs";
import { map, filter , scan} from "rxjs/operators";



function main() {
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   * 
   * WHAT I HAVE:
   * - A frog that can move in 4 directions
   * - As many rectangles as i want moving across the screen
   * - Collision between frog and rectangles 
   * - When collision occurs, game over
   * 
   * 
   * TODO:
   * - Label which parts inspired/taken from asteroids
   * - Fix comments
   * - Add score
   * - Add timer
   * - Add safe spots at the end
   * - Add sound
   */

  
  /**
   * This is the view for your game to add and update your game elements.
   */
   const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;
  

    /* All constant variables and types */
    const CanvasConstants = {
      canvasSize: {width: 800, height: 800},
    }
  
    const FrogConstants = {
      frogStartingPos: [390,750],
      frogMovementSpeed: 45,
      frogRadius: 15,
    } as const;
  
    /* Enemy refers to obstacles or objects that could end the game when collided to */
    const EnemyConstants = {
      enemyMovementSpeed: 10,
      enemySize: [45,100]
    } as const;


    /* Document, canvas, & custom color information */
    const Colors = {
      RED: "#FF0000",
      LIGHT_GREEN: "#90EE90",
      LIGHT_BLUE: "#add8e6",
      DARK_GREEN: "#228B22",
      NEON_GREEN: "#0FFF50",
      GREEN_GRADIENT: "linear-gradient(to bottom, #339933 0%, #003300 100%)"
    }

    /* All interfaces are here */

    /* Basic interface for all object variables */

    interface IBody extends Circle, Rectangle{
      ID: string,
      shape: string,
      speed: number,
      size: number[],
      color?: string
    }

    /* All types are here */

    type Circle = Readonly<{x_coord:number, y_coord:number}>;
    type Rectangle = Readonly<{x_coord:number, pos_y:number}>;

    type Key = "KeyA" | "KeyD" | "KeyW" | "KeyS";
    type Event = "keydown" | "keyup";

    type Body = Readonly<IBody>;

    /* All classes are here */
    
    /* 
      Game actions 
      Inspired by Asteroids
    */

    class Move{constructor(public readonly moveX: number, readonly moveY: number){}}
    class Tick{constructor(public readonly timePassed: number){}}

  /* Customizing the canvas and document */

  // Changing page background to green gradient 
  document.body.style.background = Colors.GREEN_GRADIENT;
  //document.body.style.background = "url('https://imgur.com/oopmRob.jpg')";
  
  // change canvas size
  svg.setAttribute("width", `${CanvasConstants.canvasSize.width}`);
  svg.setAttribute("height", `${CanvasConstants.canvasSize.height}`);

  // getting the iconic frogger background image
  svg.style.backgroundImage = "url('https://i.imgur.com/9TmTyuu.png')";
  // making the background image the same size as the canvas
  svg.style.backgroundSize = `${CanvasConstants.canvasSize.width}px ${CanvasConstants.canvasSize.height}px`;
  // adding a canvas border
  svg.style.border = "5px solid blueviolet"; 


  // centering the canvas
  svg.setAttribute("transform", `translate(540,-200)`);
  
  /* Frog class */
const createFrog = () => <Body>{
     ID: "frog",
     shape: "circle",
     x_coord: FrogConstants.frogStartingPos[0],
     y_coord: FrogConstants.frogStartingPos[1],
     speed: 0,
     color: Colors.LIGHT_GREEN,
     size: [FrogConstants.frogRadius, FrogConstants.frogRadius]
}
 
 /* Creating the enemies/obstacles that could end the game for the user */

 const createEnemy = (x: number, y: number, speed: number, enemyId: string, shape: string) => 
 (color: string, size: Readonly<number[]>) => 
 <Body>{
     ID: enemyId + (x + ""),
     shape: shape,
     x_coord: x,
     y_coord: y,
     speed: speed,
     size: size,
     color: color
   }


  /* Game state type */
  type GameState = Readonly<{
    time: number,
    frog: Body,
    enemy:ReadonlyArray<Body>,
    GAME_OVER: boolean,
  }>

  /* Initial state*/

  const initialState: GameState = {
    time: 0,
    frog: createFrog(),
    /* enemy parameters: (x,y,speed,id,shape)(color, size)*/
    enemy: [
      createEnemy(100, 645, 2, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      createEnemy(500, 575, -3, "enemy", "rect")("red", EnemyConstants.enemySize),
      createEnemy(300, 455, 4, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      createEnemy(400, 335, -3, "enemy", "rect")("red", EnemyConstants.enemySize),
      createEnemy(200, 215, 5, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      createEnemy(600, 95, -7, "enemy", "rect")("red", EnemyConstants.enemySize),

      // createEnemy(100, 330, 3, "enemy", "rect")("red", EnemyConstants.enemySize),
      // createEnemy(600, 215, 5, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      // createEnemy(100, 95, 7, "enemy", "rect")("red", EnemyConstants.enemySize),

      // createEnemy(151, 630, 2, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      // createEnemy(150, 570, 3, "enemy", "rect")("red", EnemyConstants.enemySize),
      // createEnemy(670, 450, 4, "enemy", "rect")("yellow", EnemyConstants.enemySize),
    ],
    GAME_OVER: false,
  }


    /* tick function */
    const tick = (stateNow: GameState , timePassed: number) =>
    {
      return {...stateNow,
        enemy: stateNow.enemy.map(moveBody),
        time: timePassed,
        GAME_OVER: stateNow.enemy.some(enemy => collisionDetection(stateNow, stateNow.frog, enemy)),
      };
    }

    const currentState = (stateNow: GameState, eventNow: Move | Tick ) => 
    eventNow instanceof Move ? 
    {...stateNow,
      frog: 
      { ...stateNow.frog,
        x_coord: stateNow.frog.x_coord + eventNow.moveX,
        y_coord: stateNow.frog.y_coord + eventNow.moveY
      }
    }
    : tick(stateNow, eventNow.timePassed) 


 
    // FPS setter 
    const gameClock = interval(10).pipe(map(timePassed => new Tick(timePassed))),

      /* 
        Frog controls/movement
        Inspired from FRP asteroids game
        Avoiding hard corded movement values
      */

    movementObservable = <T>(e:Event, k:Key, result:()=>T)=>
    fromEvent<KeyboardEvent>(document,e)
      .pipe(
        filter(({code})=>code === k),
        map(result)),

        PressedA = movementObservable('keydown', 'KeyA', () => new Move(-FrogConstants.frogMovementSpeed, 0)),
        PressedD = movementObservable('keydown', 'KeyD', () => new Move(FrogConstants.frogMovementSpeed, 0)),
        PressedW = movementObservable('keydown', 'KeyW', () => new Move(0, -FrogConstants.frogMovementSpeed)),
        PressedS = movementObservable('keydown', 'KeyS', () => new Move(0, FrogConstants.frogMovementSpeed))

    // enemy automatic movement
    // if the enemy reaches the end of the canvas, it will be reset to the start of the canvas
    const moveBody = (enemy: Body) => <Body>
    {
      ...enemy,
      x_coord: 
        // Number(enemy.x_coord) < 0 ? Number(enemy.x_coord) > CanvasConstants.canvasSize.width ? enemy.x_coord + enemy.speed :
        //   800+enemy.x_coord + enemy.speed: 
        //   enemy.x_coord + enemy.speed,
        Number(enemy.x_coord) < 0 ? CanvasConstants.canvasSize.width+enemy.x_coord + enemy.speed : 
        Number(enemy.x_coord) > CanvasConstants.canvasSize.width ? CanvasConstants.canvasSize.width-enemy.x_coord + enemy.speed :
        enemy.x_coord + enemy.speed      
    }

    /* 
      Collision detection 
      Math way to calculate the distance between all points between 
      rectangles and circles, where rectangles are the obstacles/enemies
      and the circle is always the frog
    */

    const collisionDetection = (State: GameState, frog: Body, enemy: Body) =>
    { 

      // calculating the collision when frog is a circle, and enemy is a rectangle
      const distX = Math.abs(frog.x_coord - enemy.x_coord-enemy.size[1]/2);
      const distY = Math.abs(frog.y_coord - enemy.y_coord-enemy.size[0]/2);
      distX > (enemy.size[1]/2 + frog.size[0]) ? false : true
      distY > (enemy.size[0]/2 + frog.size[0]) ? false : true
      distX <= (enemy.size[1]/2) ? true : false
      distY <= (enemy.size[0]/2) ? true : false
  
      const dx=distX-enemy.size[1]/2;
      const dy=distY-enemy.size[0]/2;
      
      if(dx*dx+dy*dy<=(frog.size[0] *frog.size[0])){
        return <GameState>{
          ...State,
          GAME_OVER: true,
        }
      }
  }
  
  
  function updateView(main_state: GameState){
    
    const updateBodyView = (body: Body, canvas: HTMLElement) => {
      
      const createBodyView = () => {
        // shape of enemy
        const updateBody = document.createElementNS(canvas.namespaceURI, body.shape);
        
        //Set its id
        updateBody.setAttribute("id", body.ID);
        
        //Different steps for different shapes
        body.shape == "rect" ?
        (updateBody.setAttribute("x", String(body.x_coord)),
        updateBody.setAttribute("y", String(body.y_coord)),
        //Size is an optional variable
        body.size ?
          (updateBody.setAttribute("width", String(body.size[1])), 
          updateBody.setAttribute("height", String(body.size[0])))
          :
          0,
        //Color is an optional variable
        body.color ?
          (updateBody.setAttribute("style", "fill: " + body.color + "; stroke: " 
          + body.color + "; stroke-width: 1px;"))
          :
          0,
        canvas.appendChild(updateBody))
        :
        canvas.appendChild(updateBody)
        return updateBody;
      }

      
      if(main_state.GAME_OVER) {
        mainGameStream.unsubscribe();
        const v = document.createElementNS(svg.namespaceURI, "text")!;
        v.setAttribute("x", `${CanvasConstants.canvasSize.width/6}`);
        v.setAttribute("y", `${CanvasConstants.canvasSize.height/1.8}`);
        v.setAttribute("style", "fill: red; stroke: red; stroke-width: 1px;");
        v.setAttribute("class", "gameover");
        v.textContent = "Game Over";
        svg.appendChild(v);
      }
      

    //Updating circle objects
    const moveFrog = () =>
    {
      updateBody.setAttribute("cx", String(body.x_coord))
      updateBody.setAttribute("cy", String(body.y_coord))
      updateBody.setAttribute("rx", String(FrogConstants.frogRadius))  
      updateBody.setAttribute("ry", String(FrogConstants.frogRadius))
    }

    // Updating enemies
    const moveEnemies = () =>
    {
      updateBody.setAttribute("x", String(body.x_coord))
      updateBody.setAttribute("y", String(body.y_coord))
    }

    const updateBody = document.getElementById(body.ID) || createBodyView()

    // only circle is the frog
    body.shape == "circle" ? moveFrog() : moveEnemies()
    }

    // Update FROG
    updateBodyView(main_state.frog , svg)
    
    // update enemy
    main_state.enemy.forEach((enemy => updateBodyView(enemy, svg)))
  
  }

  /* merge into 1 stream */
  const mainGameStream = merge(
    gameClock,
    PressedA,
    PressedD,
    PressedW,
    PressedS,
  ).pipe(scan(currentState, initialState)).subscribe(updateView);

}
    

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main()
  };
}

/*

// Frog which can move forwards, backwards, left, and right using one of the
// keyboard or mouse
// Multiple rows of objects (at least 6) appear and move across the screen
// Objects move at different speeds and directions (left-right)
-
Correct collision behaviour (defined above) including at least one ground
section and one river section
For minimum requirements, you do not need to include enemies
// Game ends when the Frog dies
Indicate the score for the player
Player scores points by landing the Frog in a distinct target area


*/