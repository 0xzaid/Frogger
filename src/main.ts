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
  
    const keydown = fromEvent<KeyboardEvent>(document, "keydown")

    const mapKeys : (keyClicked:string) => (distance:number) => () => void = 
      keyClicked => distance => () => frog.setAttribute(keyClicked, `${parseFloat(frog.getAttribute(keyClicked) as string) + distance}`),
      wKey = keydown.pipe(filter(k => k.key == "w"), map(_ => ["y", -10])),
      aKey = keydown.pipe(filter(k => k.key == "a"), map(_ => ["x", -10])),
      sKey = keydown.pipe(filter(k => k.key == "s"), map(_ => ["y", 10])),
      dKey = keydown.pipe(filter(k => k.key == "d"), map(_ => ["x", 10]))

      function movement(data: [string, number]) {
        frog.setAttribute(data[0], String(data[1] + Number(frog.getAttribute(data[0]))))
      }
  
      merge(wKey, aKey, sKey, dKey).subscribe(movement as any)

    }
  

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
