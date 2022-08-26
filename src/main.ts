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

  // Example on adding an element
//   const circle = document.createElementNS(svg.namespaceURI, "circle");
//   circle.setAttribute("r", "15");
//   circle.setAttribute("cx", "300");
//   circle.setAttribute("cy", "575");
//   circle.setAttribute(
//     "style",
//     "fill: green; stroke: green; stroke-width: 1px;"
//   )
//   svg.appendChild(circle);
// }
     
    //const frog = document.createElementNS(svg.namespaceURI, "circle");
    // Object.entries({
    //     r: "15",
    //     cx: "300",
    //     cy: "575",
    //     style: "fill: green; stroke: green; stroke-width: 1px;"
    // }).forEach(([key, value]) => frog.setAttribute(key, value));

    // frog.setAttribute("r", "15");
    // frog.setAttribute("cx", "300");
    // frog.setAttribute("cy", "575");
    // frog.setAttribute(
    //   "style",
    //   "fill: green; stroke: green; stroke-width: 1px;"
    // );

    // Object.entries(frog).forEach(([key, value]) => frog.setAttribute(key, value));
    
    // svg.appendChild(frog);


    // const keydown = fromEvent<KeyboardEvent>(document, "keydown"),
    // wKey = keydown.pipe(filter(key => key.key == "w"), map(_ => ["y", -10])),
    // aKey = keydown.pipe(filter(key => key.key == "a"), map(_ => ["x", -10])),
    // sKey = keydown.pipe(filter(key => key.key == "s"), map(_ => ["y", 10])),
    // dKey = keydown.pipe(filter(key => key.key == "d"), map(_ => ["x", 10]))

    //   function coord(curr: string, value: number) {
    //     frog.setAttribute(curr, String(value + Number(frog.getAttribute(curr))));
    //   }

    // merge(wKey, aKey, sKey, dKey).subscribe(coord as any);

    // let frog = document.getElementById("frog-svgrepo-com.svg") as SVGElement & HTMLElement;
    let frog = document.createElementNS(svg.namespaceURI, "rect");
    Object.entries({
      x: 275, y: 550, r: 50,
      width: 20, height: 20,
      fill: 'green',
    }).forEach(([key,val])=>frog.setAttribute(key,String(val)))
    svg.appendChild(frog);
  
    const key = fromEvent<KeyboardEvent>(document, "keydown")
  
    const setWrapper : (_:string) => (__:number) => () => void = 
      key => number => () => frog.setAttribute(key, `${parseFloat(frog.getAttribute(key) as string) + number}`)
  
  
    const left = key.pipe(filter(({code}) => code == "ArrowLeft"))
      .pipe(map(() => setWrapper('x')(-10)))
  
    const up = key.pipe(filter(({code}) => code == "ArrowUp"))
      .pipe(map(() => setWrapper('y')(-10)))
  
    const right = key.pipe(filter(({code}) => code == "ArrowRight"))
      .pipe(map(() => setWrapper('x')(10)))
  
    const down = key.pipe(filter(({code}) => code == "ArrowDown"))
      .pipe(map(() => setWrapper('y')(10)))
        
    merge(left, down, up, right)
    .subscribe(x => x())
  }

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
