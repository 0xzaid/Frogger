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
   */

  /**
   * This is the view for your game to add and update your game elements.
   */
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;


    // let frog = document.getElementById("frog-svgrepo-com.svg") as SVGElement & HTMLElement;
    let frog = document.createElementNS(svg.namespaceURI, "rect");
    Object.entries({
      x: 275, y: 550, r: 50,
      width: 20, height: 20,
      fill: 'green',
    }).forEach(([key,val])=>frog.setAttribute(key,String(val)))
    svg.appendChild(frog);
  
    const key = fromEvent<KeyboardEvent>(document, "keydown")

    const mapKeys : (keyClicked:string) => (distance:number) => () => void = 
      keyClicked => distance => () => frog.setAttribute(keyClicked, `${parseFloat(frog.getAttribute(keyClicked) as string) + distance}`)
  
  
    const move_left = key.pipe(filter(({code}) => code == "ArrowLeft"))
      .pipe(map(() => mapKeys('x')(-10)))
  
    const move_up = key.pipe(filter(({code}) => code == "ArrowUp"))
      .pipe(map(() => mapKeys('y')(-10)))
  
    const move_right = key.pipe(filter(({code}) => code == "ArrowRight"))
      .pipe(map(() => mapKeys('x')(10)))
  
    const move_down = key.pipe(filter(({code}) => code == "ArrowDown"))
      .pipe(map(() => mapKeys('y')(10)))
        
    merge(move_left, move_down, move_up, move_right)
    .subscribe(_ => _())
  }

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
