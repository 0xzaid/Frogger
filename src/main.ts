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
   * 
   * TODO:
   * - Label which parts inspired/taken from asteroids
   * - Fix comments
   */

  

  /**
   * This is the view for your game to add and update your game elements.
   */
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;
  
  /* Document, canvas, & custom color information */
  const Colors = {
    RED: "#FF0000",
    LIGHT_GREEN: "#90EE90",
    LIGHT_BLUE: "#add8e6",
    DARK_GREEN: "#228B22",
  }
  
  // Changing page background to light green
  document.body.style.background = Colors.LIGHT_GREEN;

  // change canvas size
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "800");
  
  // change canvas background to light blue
  svg.style.background = Colors.LIGHT_BLUE; // light blue background
  // image background
  // svg.style.backgroundImage = "url('https://art.pixilart.com/f3a78cc98592f29.png')";
  //svg.style.backgroundSize = "900px 600px";
  svg.setAttribute("transform", "translate(550,-50)");

  /* Game actions */

  class Move{constructor(public readonly moveX: number, readonly moveY: number){}}
  class Tick{constructor(public readonly timePassed: number){}}

  /* Game constant variables and types */


  const CanvasConstants = {
    canvasSize: 900
  }

  const FrogConstants = {
    frogStartingPos: [390,750],
    frogMovementSpeed: 20,
    frogRadius: 20,
  } as const;

  /* Enemy refers to obstacles or objects that could end the game when collided to */

  const EnemyConstants = {
    enemyMovementSpeed: 10,
    enemySize: [45,100]
  } as const;

  /* Shape types and their details*/

  type Circle = Readonly<{pos_x:number, pos_y:number}>;
  type Rectangle = Readonly<{pos_x:number, pos_y:number}>;

  /* Basic interface for all object variables */

  interface IBody extends Circle, Rectangle{
    ID: string,
    shape: string,
    speed: number,
    size?: number[],
    color?: string
  }
  // custom type that uses IBody interface for frog and enemies
  type Body = Readonly<IBody>;


    /* Creating the frog that will be controlled by user */
//     function createFrog(): Body
//     {
//      return{
//      ID: "frog",
//      shape: "ellipse",
//      pos_x: FrogConstants.frogStartingPos[0],
//      pos_y: FrogConstants.frogStartingPos[1],
//      speed: 0
//      //color: Colors.DARK_GREEN,
//    };
//  }

const createFrog = () => <Body>{
     ID: "frog",
     shape: "ellipse",
     pos_x: FrogConstants.frogStartingPos[0],
     pos_y: FrogConstants.frogStartingPos[1],
     speed: 0,
}
 
 /* Creating the enemies/obstacles that could end the game for the user */

 const createEnemy = (x: number, y: number, speed: number, enemyId: string, shape: string) => 
 (color: string, size: Readonly<number[]>) => 
 <Body>{
     ID: enemyId + (x + ""),
     shape: shape,
     pos_x: x,
     pos_y: y,
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
      createEnemy(35, 500, 1, "enemy", "rect")("yellow", EnemyConstants.enemySize),
      createEnemy(20, 400, 1, "enemy", "rect")("red", EnemyConstants.enemySize),
      createEnemy(200, 300, 1, "enemy", "rect")("black", EnemyConstants.enemySize),
      createEnemy(100, 200, 1, "enemy", "rect")("red", EnemyConstants.enemySize),
      createEnemy(-10, 130, 1, "enemy", "rect")("red", EnemyConstants.enemySize),
      createEnemy(500, 50, 1, "enemy", "rect")("brown", EnemyConstants.enemySize)
    ],
    GAME_OVER: false,
  }


  const currentState = (stateNow: GameState, eventNow: Move | Tick ) => 
    eventNow instanceof Move ? 
    {...stateNow,
      frog: 
      { ...stateNow.frog,
        pos_x: stateNow.frog.pos_x + eventNow.moveX,
        pos_y: stateNow.frog.pos_y + eventNow.moveY
      }
    }
    : tick(stateNow, eventNow.timePassed) 

    /* Enemy and obstacles movements */

    
    const tick = (stateNow: GameState , timePassed: number) =>
    {
      return {...stateNow,
        enemy: stateNow.enemy.map(moveBody),
        time: timePassed,
      };
    }

    type Key = "KeyA" | "KeyD" | "KeyW" | "KeyS";
    type Event = "keydown" | "keyup";


    const
    // FPS setter
    gameClock = interval(10).pipe(map(timePassed => new Tick(timePassed))),

      /* Frog controls/movement */

    keyPressed = <T>(e:Event, k:Key, result:()=>T)=>
    fromEvent<KeyboardEvent>(document,e)
      .pipe(
        filter(({code})=>code === k),
        filter(({repeat})=>!repeat),
        map(result)),

        moveLeft = keyPressed('keydown', 'KeyA', () => new Move(-FrogConstants.frogMovementSpeed, 0)),
        moveRight = keyPressed('keydown', 'KeyD', () => new Move(FrogConstants.frogMovementSpeed, 0)),
        moveUp = keyPressed('keydown', 'KeyW', () => new Move(0, -FrogConstants.frogMovementSpeed)),
        moveDown = keyPressed('keydown', 'KeyS', () => new Move(0, FrogConstants.frogMovementSpeed))

    // enemy automatic movement
    const moveBody = (enemy: Body) => <Body>
    {
      ...enemy,
      pos_x: Number(enemy.pos_x) > 800 ? 790-enemy.pos_x + enemy.speed : 1+enemy.pos_x + enemy.speed,
      
    }

    // interval(-10).subscribe(_ => enemy.setAttribute("x", String(1 + Number(enemy.getAttribute("x"))>800 ?
    //  800-Number(enemy.getAttribute("x")): 1 + Number(enemy.getAttribute("x")))));
  


    /* tick function */

  const mainGameStream = merge(
    gameClock,
    moveLeft,
    moveRight,
    moveUp,
    moveDown,
  ).pipe(scan(currentState, initialState)).subscribe(updateView);


  function updateView(main_state: GameState){
    
    const updateBodyView = (body: Body, canvas: HTMLElement) => {
      
      const createBodyView = () => {
        // shape of enemy
        const updateBody = document.createElementNS(canvas.namespaceURI, body.shape);
        
        //Set its id
        updateBody.setAttribute("id", body.ID);
        
        //Different steps for different shapes
        body.shape == "rect" ?
        (updateBody.setAttribute("x", String(body.pos_x)),
        updateBody.setAttribute("y", String(body.pos_y)),
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
      

    //Updating ellipses
    const updateEllipse = () =>
    {
      updateBody.setAttribute("cx", String(body.pos_x))
      updateBody.setAttribute("cy", String(body.pos_y))
      updateBody.setAttribute("rx", String(FrogConstants.frogRadius))  
      updateBody.setAttribute("ry", String(FrogConstants.frogRadius))
    }

    //Updating rects
    const updatingRect = () =>
    {
      updateBody.setAttribute("x", String(body.pos_x))
      updateBody.setAttribute("y", String(body.pos_y))
      updateBody.setAttribute("width", String(EnemyConstants.enemySize[1]))   
      updateBody.setAttribute("height", String(EnemyConstants.enemySize[0]))
    }

    const updateBody = document.getElementById(body.ID) || createBodyView()

    body.shape == "ellipse" ? updateEllipse() : updatingRect()
    }

    // Update FROG
    updateBodyView(main_state.frog , svg)
    
    // update enemy
    main_state.enemy.forEach((enemy => updateBodyView(enemy, svg)))
  
  }


  // function showKeys() {
  //   function showKey(k:Key) {
  //     const arrowKey = document.getElementById(k)!,
  //       o = (e:Event) => fromEvent<KeyboardEvent>(document,e).pipe(
  //         filter(({code})=>code === k))
  //     o('keydown').subscribe(e => arrowKey.classList.add("highlight"))
  //     o('keyup').subscribe(_=>arrowKey.classList.remove("highlight"))
  //   }
  //   showKey('W');
  //   showKey('A');
  //   showKey('S');
  //   showKey('D');
  // }
  
  // setTimeout(showKeys, 0)

}
    /* merge into 1 stream */

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main()
  };
}

