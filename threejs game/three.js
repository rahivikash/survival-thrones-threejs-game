import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import nebula from '../threejs game/src/img/nebula.jpg'
import grass from '../threejs game/src/img/grass.jpg'
import sun from '../threejs game/src/img/sun.jpg'

//setting up scenes
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//camera.position.set(4.61, 2.74, 8)

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

//setting up background of a cube
const textureLoader1 = new THREE.TextureLoader();
const backgroundTexture1 = textureLoader1.load(nebula);
backgroundTexture1.minFilter = THREE.LinearFilter; // Apply minFilter to the texture

//setting up the background of enemies
const textureLoader3 = new THREE.TextureLoader();
const backgroundTexture3 = textureLoader3.load(sun);
backgroundTexture3.minFilter = THREE.LinearFilter;

//setting up the background of ground
const textureLoader2 = new THREE.TextureLoader();
const backgroundTexture2 = textureLoader2.load(grass);
backgroundTexture2.minFilter = THREE.LinearFilter; // Apply minFilter to the texture

//making of class for resuability of code
class Box extends THREE.Mesh {
  constructor(width, height, depth, material, velocity = { x: 0, y: 0, z: 0 },position = { x: 0, y: 0, z: 0 }, zAcceleration = false) {
    super(new THREE.BoxGeometry(width, height, depth), material);
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x,position.y,position.z);

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

  
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2
    
    this.velocity = velocity;
    this.gravity = -0.008;

    this.zAcceleration = zAcceleration;

  }

  //sides of cube and platform used to detect the collision 
  updateSides(){
    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2
  }
  
  update(ground) {

    this.updateSides();
    
    if(this.zAcceleration) this.velocity.z += 0.0006

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground){
    this.velocity.y += this.gravity;

    if (boxCollision({
      box1: this,
      box2: ground
    })){ 
      const friction = 0.5;
      this.velocity.y *= friction; 
      this.velocity.y = -this.velocity.y}
    else this.position.y += this.velocity.y;
  }
}

//code of collision between enemies and cube
function boxCollision({box1,box2}){
  const xCollision = box1.right >= box2.left && box1.left <= box2.right
  const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
  const zCollision = box1.front >= box2.back && box1.back <= box2.front

  return xCollision && yCollision && zCollision
}

//making the cube using class
const cubeMaterial = new THREE.MeshStandardMaterial({ map: backgroundTexture1 });
const cube = new Box(1, 1, 1, cubeMaterial, { x: 0, y: -0.01, z: 0 });
cube.castShadow = true;
scene.add(cube);

//making the ground using class
const groundMaterial = new THREE.MeshStandardMaterial({ map: backgroundTexture2 });
const ground = new Box( 10, 0.5,50, groundMaterial, { x: 0, y: 0, z:0 },{x: 0, y: -2, z: 0});
ground.receiveShadow = true;
scene.add(ground);

//lighting 
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1); // The second parameter (intensity) can be adjusted
scene.add(ambientLight);

//camera
camera.position.z = 5;
console.log(ground.top)
console.log(cube.bottom)

//game controls functioning
const keys = {
   a: {
    pressed: false
   },
   d: {
     pressed: false
   },
   s: {
    pressed: false
   },
   w: {
     pressed: false
   }
}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = true
      break
    
    case 'KeyD':
      keys.d.pressed = true;
      break  

    case 'KeyS':
        keys.s.pressed = true;
        break
        
    case 'KeyW':
      keys.w.pressed = true;
      break
      
    case 'Space':
        cube.velocity.y = 0.12;
        break    
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyA':
      keys.a.pressed = false
      break
    
    case 'KeyD':
      keys.d.pressed = false;
      break
      
    case 'KeyS':
        keys.s.pressed = false
        break
      
    case 'KeyW':
        keys.w.pressed = false;
        break  
  }
})

//making of enemies using class
const enemyMaterial = new THREE.MeshStandardMaterial({ map: backgroundTexture3 });

const enemies = []
let frames = 0
let spawnRate = 200;

//score
let score = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '40px'; // Adjust the top position as needed
scoreElement.style.left = '50%';
scoreElement.style.transform = 'translateX(-50%)'; // Center the element horizontally
scoreElement.style.color = 'white';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.fontSize = '24px';
scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
scoreElement.style.padding = '10px';
scoreElement.style.borderRadius = '5px';
document.body.appendChild(scoreElement);

//code to stop animation if cube will fall down
const detachThreshold = -5;

function animate() {
 
  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  score += 1;
  scoreElement.textContent = `Score: ${score}`;

  song.play();
  isPlaying = true;
  toggleSound.textContent = "🔊";

  if (cube.bottom < detachThreshold) {
    song.pause();
    isPlaying = false;
    toggleSound.textContent = "🔈"; 
    cancelAnimationFrame(animationId);
    return;
  }


  //  movement code
  cube.velocity.x = 0;
  cube.velocity.z = 0;

  if (keys.a.pressed)
    cube.velocity.x = -0.05;

  else if (keys.d.pressed)
    cube.velocity.x = 0.05;

  if (keys.s.pressed) 
    cube.velocity.z = 0.05; 

  else if(keys.w.pressed) 
    cube.velocity.z = -0.05;
    cube.update(ground);

    //for continous enemy generation
    enemies.forEach(enemy =>{
      enemy.update(ground);
      if(
        boxCollision({
          box1: cube,
          box2: enemy
        }) 
      ) {
        song.pause();
        isPlaying = false;
        toggleSound.textContent = "🔈"; 
        cancelAnimationFrame(animationId);
      }
    })
      
    
    //frame rate for spawming of enemies
    if (frames % spawnRate === 0) {
        if (spawnRate > 20) spawnRate -=20

      const enemy = new Box(1, 1, 1, enemyMaterial, { x: 0 , y: 0, z: 0.005 }, {x: (Math.random() - 0.5) * 10, y: 0, z: -20},zAcceleration = true );
      enemy.castShadow = true;
      scene.add(enemy);
      enemies.push(enemy)
      
    }
      frames++
   
  }
animate();
