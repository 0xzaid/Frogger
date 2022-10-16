import "./style.css";
import { fromEvent, interval, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';

function main() {
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;

  // storing custom colors
  const Colors = {
    RED: "#ab2e46",
    LIGHT_GREEN: "#90EE90",
    LIGHT_BLUE: "#add8e6",
    DARK_BLUE: "#0000FF",
    DARK_GREEN: "#228B22",
    NEON_GREEN: "#0FFF50",
    GREEN: "#7cfc00",
    GREEN_GRADIENT: "linear-gradient(to bottom, #339933 0%, #003300 100%)",
    BROWN: "#8B4513",
    CREAM: "#fff0c3",
    YELLOW: "#fff700",
  }

  document.body.style.background = Colors.GREEN_GRADIENT;  // changing background color
  svg.style.border = "5px solid blueviolet";               // adding a border around canvas
  svg.style.transform = "translate(540px, -30px)";         // centering canvas

  // Store constants

  /*
  * All the constants variables are stored her
  */
  const GameConstants =
    {
      points: 50
    } as const;
  const riverConstants = {
    start: 280,
    end: 120,
  }
  const FrogConstants =
  {
    start: { x: 400, y: 540 },
    distance: 40,
    radius: 14,
  }
  const EnemyConstants =
  {
    size: 38,
  }
  const CanvasConstants =
  {
    size: 800,
  }

  /* 
  * Game transitions
  * taken from: https://tgdwyer.github.io/asteroids/
  */
  class Tick { constructor(public readonly elapsed: number) { } }
  class Movement { constructor(public readonly x_move: number, readonly y_move: number) { } }  // A move state

  /* 
  * Object types and interface
  * taken from: https://tgdwyer.github.io/asteroids/
  */
  type Circle = Readonly<{ x_coord: number, y_coord: number }>
  type Rectangle = Readonly<{ x_coord: number, y_coord: number }>
  type Key = 'KeyA' | 'KeyD' | 'KeyW' | 'KeyS' | 'KeyR'
  type Event = 'keydown' | 'keyup'
  interface IBody extends Circle, Rectangle {
    ID: string,
    size: number,
    shape: string,
    speed: number,
    lifeCount: number,
    func: (_: Body) => Body
    width: number,
    color: string,
  }
  type Body = Readonly<IBody>;

  /*
   * Taken from: https://tgdwyer.github.io/asteroids/
   */
  type State = Readonly<{
    time: number,
    gameScore: number,
    frogger: Body,
    gameOver: boolean,

    /*
    * Creating objects for the game
    */
    vehicles: ReadonlyArray<Body>,
    logs: ReadonlyArray<Body>,
    safety: ReadonlyArray<Body>,
    outOfBounds: ReadonlyArray<Body>,
  }>

  /*
   * Creating the frogger main character
   * Similar to createShip function in https://tgdwyer.github.io/asteroids/
   */

  const createFrogger = (ID: string, shapeID: string, x: number, y: number, speed: number, size: number, width: number, lifeCount: number) =>
    <Body>{
      ID: ID,
      shape: shapeID,
      x_coord: x,
      y_coord: y,
      speed: speed,
      size: size,
      width: width,
      lifeCount: lifeCount
    }
  /*
  * This function is used to create the vehicles, logs, safety, and the outOfBounds objects
  * This is because all of those objects have the similar properties due their shape
  */
  const createRectangle = (ID: string, x: number, y: number, speed: number, shape: string,
    color: string, size: number, width: number) =>
    <Body>{
      x_coord: x,
      y_coord: y,
      ID: ID,
      shape: shape,
      speed: speed,
      size: size,
      width: width,
      color: color,
    }

  /*
  * Getter function for number of lives of frogger
  */
  const alive = (frogger: Body): boolean => {
    return (frogger.lifeCount >= 1)
  }


  /*
  * What happens when it is game over
  */
  const endGame = (theState: State) => <State>
    {
      ...theState,
      frogger:
      {
        // resetting the frogger to the starting position
        ...theState.frogger,
        x_coord: FrogConstants.start.x,
        y_coord: FrogConstants.start.y
      },
      // end game
      gameOver: true
    }

  /*
  * Collision between frogger and various objects functions are here
  */

  /* 
  * Similar to BackToSpawn function, but reduces the lifeCount by 1
  */
  const deductLife = (frogger: Body) => <Body>
    {
      ...frogger,
      lifeCount: frogger.lifeCount - 1,
      x_coord: FrogConstants.start.x,
      y_coord: FrogConstants.start.y,

    }

  /*
  * Teleport frogger back to starting x and y positions
  */
  const backToSpawn = (frogger: Body) => <Body>
    {
      ...frogger,
      x_coord: FrogConstants.start.x,
      y_coord: FrogConstants.start.y,
    }

  /*
   * The initial state of the game
   * Inspired from: https://tgdwyer.github.io/asteroids/
   */
  const initialState: State =
  {
    time: 0,
    gameScore: 0,
    frogger:
      createFrogger("FROGGER", "ellipse", FrogConstants.start.x, FrogConstants.start.y, 0, 0, 0, 5),

    /*
    
    * CREATING OBJECTS FOR LOGS, VEHICLES, SAFETY, AND OUTOFBOUNDS

    */

    vehicles:
      [
        /* FIRST ROW */
        createRectangle("enemy1", 200, 440, 1, "rect", Colors.RED, EnemyConstants.size, 3),
        createRectangle("enemy2", 400, 440, 1, "rect", Colors.RED, EnemyConstants.size, 3),
        createRectangle("enemy3", 600, 440, 1, "rect", Colors.RED, EnemyConstants.size, 3),

        /* SECOND ROW */
        createRectangle("enemy4", 100, 400, -2, "rect", Colors.YELLOW, EnemyConstants.size, 2),
        createRectangle("enemy5", 250, 400, -2, "rect", Colors.YELLOW, EnemyConstants.size, 2),
        createRectangle("enemy6", 450, 400, -2, "rect", Colors.YELLOW, EnemyConstants.size, 2),
        createRectangle("enemy7", 600, 400, -2, "rect", Colors.YELLOW, EnemyConstants.size, 2),

        /* THIRD ROW */
        createRectangle("enemy8", 100, 360, 1, "rect", Colors.CREAM, EnemyConstants.size, 3),
        createRectangle("enemy9", 300, 360, 1, "rect", Colors.CREAM, EnemyConstants.size, 3),
        createRectangle("enemy10", 500, 360, 1, "rect", Colors.CREAM, EnemyConstants.size, 3),

        /* FOURTH ROW */
        createRectangle("enemy11", 0, 320, -2, "rect", Colors.LIGHT_BLUE, EnemyConstants.size, 2),
        createRectangle("enemy12", 250, 320, -2, "rect", Colors.LIGHT_BLUE, EnemyConstants.size, 2),
        createRectangle("enemy13", 500, 320, -2, "rect", Colors.LIGHT_BLUE, EnemyConstants.size, 2),

      ],
    logs: [

      /* FIRST ROW */
      createRectangle("log1", 0, 240, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),
      createRectangle("log2", 300, 240, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),
      createRectangle("log3", 600, 240, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),

      /* SECOND ROW */
      createRectangle("log4", 0, 200, -1, "rect", Colors.BROWN, EnemyConstants.size, 2),
      createRectangle("log5", 160, 200, -1, "rect", Colors.BROWN, EnemyConstants.size, 2),
      createRectangle("log6", 320, 200, -1, "rect", Colors.BROWN, EnemyConstants.size, 2),
      createRectangle("log7", 480, 200, -1, "rect", Colors.BROWN, EnemyConstants.size, 2),

      /* THIRD ROW */

      createRectangle("log8", 0, 160, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),
      createRectangle("log9", 300, 160, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),
      createRectangle("log10", 600, 160, 1, "rect", Colors.BROWN, EnemyConstants.size, 3),

      /* FOURTH ROW */
      createRectangle("log11", 50, 120, -2, "rect", Colors.BROWN, EnemyConstants.size, 2.4),
      createRectangle("log12", 250, 120, -2, "rect", Colors.BROWN, EnemyConstants.size, 2.4),
      createRectangle("log13", 450, 120, -2, "rect", Colors.BROWN, EnemyConstants.size, 2.4),

    ],

    safety: [
      createRectangle("safety1", 70, 82, 0, "rect", Colors.DARK_BLUE, EnemyConstants.size, 1.5),
      createRectangle("safety2", 220, 82, 0, "rect", Colors.DARK_BLUE, EnemyConstants.size, 1.5),
      createRectangle("safety3", 370, 82, 0, "rect", Colors.DARK_BLUE, EnemyConstants.size, 1.5),
      createRectangle("safety4", 520, 82, 0, "rect", Colors.DARK_BLUE, EnemyConstants.size, 1.5),
      createRectangle("safety5", 670, 82, 0, "rect", Colors.DARK_BLUE, EnemyConstants.size, 1.5),
    ],

    outOfBounds: [
      createRectangle("danger1", 0, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 1.85),
      createRectangle("danger2", 129, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 2.4),
      createRectangle("danger3", 279, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 2.4),
      createRectangle("danger4", 429, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 2.4),
      createRectangle("danger5", 579, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 2.4),
      createRectangle("danger6", 729, 82, 0, "rect", Colors.GREEN, EnemyConstants.size, 1.85),
    ],
    gameOver: false
  }

  /* 
  * All collision related functions are here
  */
  // Empty constructor class for Restart

  class Restart { constructor() { } }

  /*
 * Due to having all the enemy/obstacle objects in a single array, we can check for collisions in that array
 */
  const VehicleCollision = (Vehicles: ReadonlyArray<Body>, Frogger: Body, theState: State, i: number = Vehicles.length - 1): boolean => {
    return i <= 0 ? false : DetectCollision(Vehicles[i - 1], Frogger) ? true : VehicleCollision(Vehicles, Frogger, theState, i - 1)
  }
  /*
* Check if frogger steps on river
*/
  const riverCollision = (frogger: Body): boolean => {
    return (frogger.y_coord > riverConstants.end && frogger.y_coord < riverConstants.start)
  }


  const DetectCollision = (frogger: Body, enemy: Body): boolean => {
    if (enemy.y_coord >= (frogger.y_coord + EnemyConstants.size) || enemy.y_coord <= frogger.y_coord) {
      return false
    } else if (enemy.x_coord >= (frogger.x_coord + ((frogger.size * 2.7))) || enemy.x_coord <= frogger.x_coord) {
      return false
    } else {
      return true
    }
  }
  /*
   * Reduce the number of safety areas when frogger enters 
   * By changing its position to outside the canvas
   */
  const removeSafetyArea = (safety: Body): Body => {
    return <Body>{
      ...safety,
      x_coord: safety.x_coord * - 999999
    }
  }


  /**
   * All collisions rules and what should happen to each type of collision
   */
  const CollisionRules = (objects: Body[], frogger: Body, state: State): Body => {
    // Get the all the bodies that can result in a collision and restarting back to the spawn position
    const VehicleCollision = (objects.map((_) => DetectCollision(_, frogger) ? _ : null).filter((_) => _ ? _ : null))[0]
    const RiverCollision = riverCollision(frogger)

    // Touched river so we reduce life count
    if (RiverCollision && !VehicleCollision) {
      console.log("River Collision")
      return deductLife(frogger)
    } else if (VehicleCollision && !RiverCollision) {
      if (VehicleCollision.ID === "safety1" ||
        VehicleCollision.ID === "safety2" ||
        VehicleCollision.ID === "safety3" ||
        VehicleCollision.ID === "safety4" ||
        VehicleCollision.ID === "safety5") {
        console.log("Safety Collision")
        return backToSpawn(frogger)
      } else {
        console.log("Vehicle Collision")
        return deductLife(frogger)
      }
      // Touched vehicle so we reduce life count
    } else {
      // No collision, move body along the long using the velocity
      return moveBody(frogger, VehicleCollision?.speed)
    }
  }

  /*
 * Tick function taken from: https://tgdwyer.github.io/asteroids/
 */
  const tick = (s: State, elapsed: number): State => {
    const Objects = s.vehicles.concat(s.logs).concat(s.safety).concat(s.safety).concat(s.outOfBounds);

    //Check if the frogger is still alive or nottt
    return alive(s.frogger) ?
      {
        ...s,
        vehicles: s.vehicles.map(enemy => moveBody(enemy)),
        logs: s.logs.map(log => moveBody(log)),
        safety: s.safety.map(win => DetectCollision(win, s.frogger) ? removeSafetyArea(win) : win),
        frogger: CollisionRules(Objects, s.frogger, s),
        gameScore: VehicleCollision(s.safety, s.frogger, s) ? s.gameScore + GameConstants.points : s.gameScore,
        time: elapsed,
      }
      :
      endGame(s)
  }

  /* 
  * Inspired from: https://tgdwyer.github.io/asteroids/
  */
  const reduceState = (s: State, e: Movement | Tick | Restart): State =>
    // When frogger dies we restart game and reset the lives
    e instanceof Restart ?
      s.gameOver ?
        {
          ...s, frogger:
          {
            ...s.frogger,
            x_coord: FrogConstants.start.x,
            y_coord: FrogConstants.start.y,
            lifeCount: 5
          },
          safety: s.safety.map((win) => win.y_coord < 0 ? removeSafetyArea(win) : win),
          gameScore: 0,
          gameOver: false
        }
        :
        {
          ...s
        }
      :
      e instanceof Movement ?
        {
          ...s,
          frogger:
          {
            ...s.frogger,
            x_coord: s.frogger.x_coord + e.x_move,
            y_coord: s.frogger.y_coord + e.y_move
          }
        }
        : tick(s, e.elapsed)


  /*
  * Frogger user controlled movement functions 
  */

  /*
  * Taken from https://tgdwyer.github.io/asteroids/
  * What happens when WASD and R keys are pressed
   */
  const
    gameClock = interval(10).
      pipe(map(elapsed => new Tick(elapsed))),

    keyObservable = <T>(e: Event, k: Key, result: () => T) =>
      fromEvent<KeyboardEvent>(document, e)
        .pipe(
          filter(({ code }) => code === k),
          filter(({ repeat }) => !repeat),
          map(result)),

    // Key events
    clickedA = keyObservable('keydown', 'KeyA', () => new Movement(-FrogConstants.distance, 0)),
    clickedD = keyObservable('keydown', 'KeyD', () => new Movement(FrogConstants.distance, 0)),
    clickedW = keyObservable('keydown', 'KeyW', () => new Movement(0, -FrogConstants.distance)),
    clickedS = keyObservable('keydown', 'KeyS', () => new Movement(0, FrogConstants.distance)),
    fullRestart = keyObservable('keydown', 'KeyR', () => new Restart())


  /*
  * Inspired from https://tgdwyer.github.io/asteroids/
  */
  const moveBody = (enemy: Body, speed: number = enemy.speed) => <Body>
    {
      ...enemy,
      x_coord:
        Number(enemy.x_coord) + enemy.size * enemy.width < 0 ?
          CanvasConstants.size + enemy.x_coord + enemy.size * enemy.width + speed :
          Number(enemy.x_coord) > CanvasConstants.size ?
            CanvasConstants.size - enemy.x_coord - enemy.size * enemy.width + speed :
            enemy.x_coord + enemy.speed
    }

  /*
   * Merges all game states into one stream
   * Derived from: https://tgdwyer.github.io/asteroids/
   */
  const mainGameStream = merge(
    gameClock,
    fullRestart,
    clickedW,
    clickedA,
    clickedS,
    clickedD,
  ).
    pipe(scan(reduceState, initialState)).
    subscribe(updateView);

  // to update the score, lives
  const updateLives = document.getElementById("lives")!,
    updateScore = document.getElementById("score")!,
    showGameOverMessage = document.getElementById("gameover")!,
    showRestartGameMessage = document.getElementById("restart")!
  /* 
  * Update the svg scene.  
  * This is the only impure function in this program
  * Taken from: https://tgdwyer.github.io/asteroids/
  */
  function updateView(s: State) {


    updateScore.textContent = String("Score: " + s.gameScore);
    updateLives.textContent = String("Lives: " + s.frogger.lifeCount);

    // end the game
    const GameOverScreen = () => {
      showRestartGameMessage.textContent = "Press \"R\" to Restart"
      showGameOverMessage.textContent = "Game over!!"
      svg.appendChild(showRestartGameMessage)
      svg.appendChild(showGameOverMessage)
    }

    const continueGame = () => {
      showRestartGameMessage.textContent = ""
      showGameOverMessage.textContent = ""
      svg.appendChild(showRestartGameMessage)
      svg.appendChild(showGameOverMessage)
    }

    // check if game is over
    if (s.gameOver) {
      GameOverScreen()
    } else {
      continueGame()
    }


    /*
    * Derived from https://tgdwyer.github.io/asteroids/
    */
    const
      updateBodyView = (b: Body, canvas: HTMLElement) => {
        const createBodyView = () => {
          // set its attributes
          const body = document.createElementNS(canvas.namespaceURI, b.shape);
          body.setAttribute("id", b.ID);

          b.shape == "rect" ?
            (body.setAttribute("x", String(b.x_coord)),
              body.setAttribute("y", String(b.y_coord)),
              body.setAttribute("width", String((b.size * b.width) - 2)),
              body.setAttribute("height", String(b.size)),
              b.color ?
                (body.setAttribute("style", "fill: " + b.color)) : null,
              canvas.appendChild(body))
            :
            canvas.appendChild(body)
          return body;
        }
        // update objects
        const rectangle = () => {
          updateBody.setAttribute("x", String(b.x_coord))
          updateBody.setAttribute("y", String(b.y_coord))
          updateBody.setAttribute("width", String(b.size * b.width)),
            updateBody.setAttribute("height", String(b.size))
        }

        // update frog
        const frog = () => {
          updateBody.setAttribute("cx", String(b.x_coord))
          updateBody.setAttribute("cy", String(b.y_coord))
          updateBody.setAttribute("rx", String(FrogConstants.radius))
          updateBody.setAttribute("ry", String(FrogConstants.radius))
          canvas.appendChild(updateBody)
        }
        const updateBody = document.getElementById(b.ID) || createBodyView()
        // check which object to update

        if (b.ID == "FROGGER") {
          frog()
        } else {
          rectangle()
        }
      }

    // Update objects
    s.vehicles.forEach((body) => updateBodyView(body, svg))
    s.logs.forEach((body) => updateBodyView(body, svg))
    s.safety.forEach((body) => updateBodyView(body, svg))
    s.outOfBounds.forEach((body) => updateBodyView(body, svg))
    updateBodyView(s.frogger, svg)
  }



}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  }
}
