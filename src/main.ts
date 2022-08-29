import "./style.css";
import { interval, fromEvent , zip, merge} from "rxjs";
import { map, filter , scan} from "rxjs/operators";

const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;

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
  

  document.body.style.background = "#90EE90"; // green blackground
  
  // change canvas size
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "600");
  svg.style.background = "#add8e6"; // light blue background
  svg.style.backgroundImage = "url('https://art.pixilart.com/f3a78cc98592f29.png')";
  svg.style.backgroundSize = "900px 600px";

  svg.setAttribute("transform", "translate(550,0)");
  
    let frog = document.createElementNS(svg.namespaceURI, "circle");
    Object.entries({
      cx: 390, cy: 550, r: 19,
      width: 40, height: 40,
      fill: 'green',
      stroke: 'white',
      'stroke-width': 2,


    }).forEach(([key,val])=>frog.setAttribute(key,String(val)))
    svg.appendChild(frog);

    frog.setAttribute("id", "frog");
  
    const keydown = fromEvent<KeyboardEvent>(document, "keydown")

    const mapKeys : (keyClicked:string) => (distance:number) => () => void = 
      keyClicked => distance => () => frog.setAttribute(keyClicked, `${parseFloat(frog.getAttribute(keyClicked) as string) + distance}`),
      wKey = keydown.pipe(filter(k => k.key == "w"), map(_ => ["cy", -18])),
      aKey = keydown.pipe(filter(k => k.key == "a"), map(_ => ["cx", -18])),
      sKey = keydown.pipe(filter(k => k.key == "s"), map(_ => ["cy", 18])),
      dKey = keydown.pipe(filter(k => k.key == "d"), map(_ => ["cx", 18]))

      function movement(data: [string, number]) {
        frog.setAttribute(data[0], String(data[1] + Number(frog.getAttribute(data[0]))))
      }
  
      merge(wKey, aKey, sKey, dKey).subscribe(movement as any)

    }


function enemies(){
  let enemy = document.createElementNS(svg.namespaceURI, "rect");
  Object.entries({
    x: 390, y: 400, r: 19,
    width: 40, height: 40,
    fill: 'RED',
    stroke: 'BLACK',
    'stroke-width': 2,
    
}).forEach(([key,val])=>enemy.setAttribute(key,String(val)))

enemy.setAttribute("id", "enemy");
svg.appendChild(enemy);

const randomNumberStream = interval(50).pipe(map(nextRandom));

// loop around the screen
const a = interval(-10).subscribe(_ => enemy.setAttribute("x", String(1 + Number(enemy.getAttribute("x"))>800 ?
     800-Number(enemy.getAttribute("x")): 1 + Number(enemy.getAttribute("x")))));
// b = interval(30).subscribe(_ => enemy.setAttribute("x", String(-1 + Number(enemy.getAttribute("x")))))
// get current x value then keep adding 2

}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
    enemies();
    
  };
}

class RNG {
  // LCG using GCC's constants
  m = 0x80000000; // 2**31
  a = 1103515245;
  c = 12345;
  state: number;
  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }
  nextInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  nextFloat() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
  }
}
const rng = new RNG(20);
// return a random number in the range [-1,1]
const nextRandom = () => rng.nextFloat() * 2 - 1;