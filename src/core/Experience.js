import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STORY_CONFIG } from '../config/story';

export default class Experience {
    constructor(canvas) {
        window.experience = this;
        this.canvas = canvas;

        this.scene = new THREE.Scene();
        this.config = STORY_CONFIG;
        this.currentPartIndex = 0;
        
        // Continuous flow state
        this.scrollProgress = 0;
        this.targetScrollProgress = 0;
        this.textureLoader = new THREE.TextureLoader();
        this.assets = [];
        
        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.interactableObjects = []; // Add objects you want to be clickable here

        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupWorld();
        this.setupSky();
        this.setupExtraSkyElements();
        this.setupCacti();
        this.setupRocks();
        this.setupBushes();
        this.setupDeadTrees();
        this.setupSignposts();
        this.setupTumbleweeds();
        this.setupAdvancedFeatures();
        this.setupRoadDebris();
        this.setupBeetles();
        this.setupCityObjects();
        this.setupOasisObjects();
        this.currentBiomeIndex = 0; // 0: Desert, 1: City, 2: Oasis/River
        this.currentSeasonIndex = 0;
        // Player State
        this.playerType = 'car';
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpY = 0;
        this.isAutoDriving = false;
        this.autoSpeed = 1.0;
        this.playerModel = null;
        this.playerWheels = [];
        this.mixers = []; // Store multiple mixers for animation
        this.playerGroup = new THREE.Group();
        this.playerGroup.position.set(2.5, -3.5, 0);
        this.scene.add(this.playerGroup);

        this.setupCar(); 
        this.setupTropicalAssets();
        this.setupMilestones();
        this.setupRelics();
        this.setupFuelStation();
        this.setupPowerLines();
        this.setupSmallDetails();
        this.setupPedestrians();     // 👤 Người ven đường
        this.setupSeasonalEffects(); // 🍂 Hiệu ứng 4 mùa
        this.setupMusic(); 
        this.setupEvents();
        this.setupUI();

        this.update();
        this.goToPart(0);
        
        this.initVehicleMenu(); // Initialize UI listeners

        setTimeout(() => {
            const loader = document.querySelector('.loading-screen');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 1000);
            }
        }, 1500);
    }

    setupCamera() {
        // Tăng FOV (Field of View) lên 95 góc nhìn sẽ rộng và bao quát được nhiều cảnh hơn
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Đưa camera tiến lại gần một chút (z=12) và hơi nghiêng xuống (y=1) để bù đắp cho góc nhìn siêu rộng
        this.camera.position.set(0, 1, 12);
        this.scene.add(this.camera);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupLights() {
        this.ambientLight = new THREE.AmbientLight(0xffcc80, 0.4); // Warm ambient
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.dirLight.position.set(-20, 15, 10); // Low angle for long shadows
        this.dirLight.castShadow = true;
        
        // Shadow optimization
        this.dirLight.shadow.camera.left = -50;
        this.dirLight.shadow.camera.right = 50;
        this.dirLight.shadow.camera.top = 50;
        this.dirLight.shadow.camera.bottom = -50;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.bias = -0.0005;
        
        this.scene.add(this.dirLight);
    }

    setupWorld() {
        const initialColor = this.config.parts[0].theme.backgroundColor.substring(0, 7);
        this.scene.background = new THREE.Color(initialColor);
        this.scene.fog = new THREE.FogExp2(initialColor, 0.015);

        // Remove old track line, replaced with detailed dusty road below 

        // --- Low Poly Desert Ground (Endless Horizontal Treadmill) ---
        // Increased resolution for vertex coloring and finer road details
        const terrainGeo = new THREE.PlaneGeometry(160, 80, 160, 60);
        terrainGeo.rotateX(-Math.PI / 2); 
        
        const posAttribute = terrainGeo.attributes.position;
        const colorAttribute = new THREE.Float32BufferAttribute(new Float32Array(posAttribute.count * 3), 3);
        terrainGeo.setAttribute('color', colorAttribute);
        
        const cSand = new THREE.Color('#d2b48c'); // Base sand
        const cRoad = new THREE.Color('#aa8760'); // Packed, darker dirt
        const cTrack = new THREE.Color('#8d6e63'); // Darker tire tracks
        const tempColor = new THREE.Color();

        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const z = posAttribute.getZ(i);
            const angle = (x / 160) * Math.PI * 2;
            
            // Dunes & ripples
            const bump = Math.sin(angle * 4 + z * 0.1) * 2.5 
                       + Math.cos(angle * 7 - z * 0.2) * 1.0
                       + Math.sin(angle * 14 + z * 0.3) * 0.5
                       + Math.sin(angle * 40 + z * 2.5) * 0.15;
            
            const roadWidth = 3.0; 
            const blendWidth = 8; 
            const distZ = Math.abs(z);
            
            let intensity = 1.0;
            let roadBump = 0;
            
            if (distZ < roadWidth) {
                intensity = 0;
                // Irregularity on road surface
                roadBump = (Math.sin(x * 3.5) * 0.05) + (Math.sin(x * 12.0) * 0.02);
                
                // Indent tire tracks
                const isTrackL = Math.abs(z - 0.7) < 0.4;
                const isTrackR = Math.abs(z + 0.7) < 0.4;
                if (isTrackL || isTrackR) {
                    roadBump -= 0.08; 
                    tempColor.copy(cTrack); 
                } else {
                    tempColor.copy(cRoad);
                }
                
                // Add color noise/dust
                tempColor.r += (Math.random() - 0.5) * 0.03;
                tempColor.g += (Math.random() - 0.5) * 0.03;
            } else if (distZ < roadWidth + blendWidth) {
                const t = (distZ - roadWidth) / blendWidth;
                intensity = t * t * (3 - 2 * t);
                tempColor.copy(cRoad).lerp(cSand, t);
                
                // Mottled blending edge
                if (Math.random() > 0.8) {
                    tempColor.multiplyScalar(0.95);
                }
            } else {
                tempColor.copy(cSand);
            }
            
            posAttribute.setY(i, (bump * intensity) + roadBump);
            colorAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
        terrainGeo.computeVertexNormals();

        const groundMat = new THREE.MeshStandardMaterial({ 
            vertexColors: true,
            roughness: 0.9,
            flatShading: true
        });
        
        this.ground1 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground2 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground1.receiveShadow = true;
        this.ground2.receiveShadow = true;
        
        // Place them side-by-side to create an endless loop
        this.ground1.position.set(0, 0, 0); // World center
        this.ground2.position.set(160, 0, 0); // Next to it

        this.groundGroup = new THREE.Group();
        this.groundGroup.add(this.ground1);
        this.groundGroup.add(this.ground2);
        
        // Base is at -3.5 down, so wheels exactly touch the flat road
        this.groundGroup.position.set(0, -3.5, 0);
        this.scene.add(this.groundGroup);

        this.assetsGroup = new THREE.Group();
        this.scene.add(this.assetsGroup);
    }

    setupCar() {
        console.log("Setting up car...");
        if (this.playerModel) this.playerGroup.remove(this.playerModel);
        this.playerWheels = [];
        
        const loader = new GLTFLoader();
        loader.load('/assets/models/low-poly_truck_car_drifter.glb', (gltf) => {
            this.playerType = 'car';
            this.playerModel = gltf.scene;
            this.playerModel.scale.set(0.01, 0.01, 0.01);
            this.playerModel.position.y = 0.3; 
            this.playerGroup.add(this.playerModel);

            if (gltf.animations && gltf.animations.length > 0) {
                this.carMixer = new THREE.AnimationMixer(this.playerModel);
                gltf.animations.forEach((clip) => {
                    this.carMixer.clipAction(clip).play();
                });
            }

            this.playerModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    const name = child.name.toLowerCase();
                    if (name.includes('wheel') || name.includes('rim') || name.includes('tire')) {
                        this.playerWheels.push(child);
                    }
                    this.interactableObjects.push(child);
                }
            });
        }, undefined, (error) => {
            console.error('Error loading car model:', error);
            // Fallback simple car
            this.setupProceduralVehicle('car');
        });
    }

    setupBike() {
        if (this.playerModel) this.playerGroup.remove(this.playerModel);
        this.playerWheels = [];
        this.playerType = 'bike';
        
        const bikeGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#2ecc71', flatShading: true }); // Green superbike
        const metalMat = new THREE.MeshStandardMaterial({ color: '#333', metalness: 0.9, roughness: 0.1 }); // Black metal
        const seatMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8 });
        const screenMat = new THREE.MeshStandardMaterial({ color: '#3498db', transparent: true, opacity: 0.6 });
        
        // --- Main Chassis ---
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 1.4), metalMat);
        frame.position.y = 0.8;
        bikeGroup.add(frame);
        
        // --- Fairing (Vỏ xe hầm hố) ---
        const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 1.0), bodyMat);
        fairing.position.set(0, 1.1, 0.4);
        bikeGroup.add(fairing);

        // Windshield
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), screenMat);
        screen.rotation.x = -Math.PI * 0.2;
        screen.position.set(0, 1.5, 0.8);
        bikeGroup.add(screen);

        // Engine detail
        const engine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.7), metalMat);
        engine.position.set(0, 0.6, 0);
        bikeGroup.add(engine);

        // Gas Tank (Nhô cao)
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8), bodyMat);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(0, 1.3, 0.2);
        bikeGroup.add(tank);
        
        // Seat (Hai tầng)
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.5), seatMat);
        seat.position.set(0, 1.25, -0.3);
        bikeGroup.add(seat);
        const rearSeat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), seatMat);
        rearSeat.position.set(0, 1.35, -0.6);
        bikeGroup.add(rearSeat);

        // Swingarm (Gắp xe)
        const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), metalMat);
        swingarm.position.set(0, 0.5, -0.6);
        bikeGroup.add(swingarm);

        // Exhaust (Ống xả lớn)
        const exhaust = new THREE.Group();
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.8), metalMat);
        pipe.rotation.x = Math.PI / 2 + 0.2;
        exhaust.add(pipe);
        exhaust.position.set(0.25, 0.6, -0.6);
        bikeGroup.add(exhaust);
        
        // Wheels (Lốp to béo)
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 24);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.9 });
        
        const wheelF = new THREE.Mesh(wheelGeo, wheelMat);
        wheelF.position.set(0, 0.4, 1.1);
        bikeGroup.add(wheelF);
        this.playerWheels.push(wheelF);
        
        const wheelB = new THREE.Mesh(wheelGeo, wheelMat);
        wheelB.position.set(0, 0.4, -1.0);
        bikeGroup.add(wheelB);
        this.playerWheels.push(wheelB);
        
        this.playerModel = bikeGroup;
        this.playerGroup.add(this.playerModel);
        this.playerModel.traverse(c => { if(c.isMesh) c.castShadow = true; });
        this.interactableObjects.push(...bikeGroup.children);
    }

    setupRunner() {
        if (this.playerModel) this.playerGroup.remove(this.playerModel);
        this.playerWheels = [];
        this.mixers = this.mixers.filter(m => m !== this.carMixer); // Clear player mixer
        
        const loader = new GLTFLoader();
        // Dùng model Soldier hầm hố hơn cho "Người"
        loader.load('/assets/models/soldier.glb', (gltf) => {
            this.playerType = 'runner';
            this.playerModel = gltf.scene;
            this.playerModel.scale.set(1.5, 1.5, 1.5);
            this.playerModel.position.y = 0;
            this.playerGroup.add(this.playerModel);
            
            // Xử lý animation
            const mixer = new THREE.AnimationMixer(this.playerModel);
            this.carMixer = mixer;
            this.mixers.push(mixer);
            
            // Tìm clip Walk hoặc Run
            const clip = gltf.animations.find(a => a.name === 'Run' || a.name === 'Walk') || gltf.animations[0];
            if (clip) {
                const action = mixer.clipAction(clip);
                action.play();
            }
            
            this.playerModel.rotation.y = -Math.PI / 2; // Xoay lại 180 độ so với hướng PI/2 vừa rồi
            this.playerModel.traverse(c => { if(c.isMesh) c.castShadow = true; });
        });
    }

    setupChicken() {
        if (this.playerModel) this.playerGroup.remove(this.playerModel);
        this.playerWheels = [];
        this.mixers = this.mixers.filter(m => m !== this.carMixer);
        
        const loader = new GLTFLoader();
        // Thay con gà bằng mô hình Flamingo đẹp hơn nhiều
        loader.load('/assets/models/flamingo.glb', (gltf) => {
            this.playerModel = gltf.scene;
            this.playerModel.scale.set(0.04, 0.04, 0.04);
            this.playerType = 'chicken';
            this.playerModel.userData.baseY = 2.5; // Tiếp tục hạ thấp theo yêu cầu
            this.playerModel.position.y = 2.5;
            this.playerModel.rotation.y = Math.PI / 2;
            this.playerGroup.add(this.playerModel);
            
            const mixer = new THREE.AnimationMixer(this.playerModel);
            this.carMixer = mixer;
            this.mixers.push(mixer);
            
            if (gltf.animations.length > 0) {
                mixer.clipAction(gltf.animations[0]).play();
            }
            
            this.playerModel.traverse(c => { 
                if(c.isMesh) {
                    c.castShadow = true; 
                    c.receiveShadow = true;
                }
            });
        });
    }

    setupPlane() {
        if (this.playerModel) this.playerGroup.remove(this.playerModel);
        this.playerWheels = [];
        
        const planeGroup = new THREE.Group();
        const mainMat = new THREE.MeshStandardMaterial({ color: '#f25346', flatShading: true }); // Red
        const whiteMat = new THREE.MeshStandardMaterial({ color: '#d8d0d1', flatShading: true }); // Off-white
        const metalMat = new THREE.MeshStandardMaterial({ color: '#b3b3b3', flatShading: true }); // Silver
        const woodMat  = new THREE.MeshStandardMaterial({ color: '#59332e', flatShading: true }); // Propeller wood

        // Cockpit (Cabin)
        const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mainMat);
        cockpit.position.y = 0.5;
        planeGroup.add(cockpit);

        // Engine
        const engine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.5), whiteMat);
        engine.position.set(0.4, 0.5, 0);
        planeGroup.add(engine);

        // Tail
        const tailIdx = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 1.0), mainMat);
        tailIdx.position.set(-0.35, 0.5, 0);
        planeGroup.add(tailIdx);

        // Vertical Fin
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.35), mainMat);
        fin.position.set(-0.7, 0.75, 0);
        planeGroup.add(fin);

        // Wings
        const wings = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 2.5), mainMat);
        wings.position.set(0, 0.5, 0);
        planeGroup.add(wings);

        // Propeller
        this.propeller = new THREE.Group();
        const propHub = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), metalMat);
        this.propeller.add(propHub);
        
        const bladeGeo = new THREE.BoxGeometry(0.04, 0.8, 0.15);
        const blade1 = new THREE.Mesh(bladeGeo, woodMat);
        blade1.position.x = 0.1;
        this.propeller.add(blade1);
        
        const blade2 = blade1.clone();
        blade2.rotation.x = Math.PI / 2;
        this.propeller.add(blade2);

        this.propeller.position.set(0.5, 0.5, 0);
        planeGroup.add(this.propeller);

        // Pilot
        const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: '#333' }));
        pilot.position.set(0, 0.75, 0);
        planeGroup.add(pilot);

        this.playerType = 'plane';
        this.playerModel = planeGroup;
        this.playerModel.scale.set(3.5, 3.5, 3.5); // Phóng to máy bay hơn nữa
        this.playerGroup.add(this.playerModel);
        this.playerModel.traverse(c => { if(c.isMesh) c.castShadow = true; });
        this.interactableObjects.push(...planeGroup.children);
    }

    setupProceduralVehicle(type) {
        if (type === 'car') {
             const group = new THREE.Group();
             const bodyMat = new THREE.MeshStandardMaterial({ color: '#e74c3c' });
             const windowMat = new THREE.MeshStandardMaterial({ color: '#34495e' });
             
             const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 4), bodyMat);
             base.position.y = 0.5;
             group.add(base);
             
             const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.8), windowMat);
             cabin.position.set(0, 1.1, -0.2);
             group.add(cabin);

             const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
             wheelGeo.rotateZ(Math.PI / 2);
             const wheelMat = new THREE.MeshStandardMaterial({ color: '#111' });
             
             [[-0.9, 0.4, 1.2], [0.9, 0.4, 1.2], [-0.9, 0.4, -1.2], [0.9, 0.4, -1.2]].forEach(pos => {
                 const w = new THREE.Mesh(wheelGeo, wheelMat);
                 w.position.set(...pos);
                 group.add(w);
                 this.playerWheels.push(w);
             });
             
             this.playerModel = group;
             this.playerGroup.add(this.playerModel);
        }
    }

    setupTropicalAssets() {
        this.config.tropicalAssets.forEach(data => {
            const texture = this.textureLoader.load(data.texture);
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0.85
            });
            const sprite = new THREE.Sprite(material);
            
            sprite.position.set(data.pos.x, data.pos.y, data.pos.z);
            sprite.scale.set(data.scale, data.scale, 1);
            
            sprite.userData = {
                originalX: data.pos.x,
                originalY: data.pos.y,
                parallax: data.parallax,
                phase: Math.random() * Math.PI * 2
            };

            this.assets.push(sprite);
            this.assetsGroup.add(sprite);
        });
    }


    setupSky() {
        this.skyGroup = new THREE.Group();
        this.scene.add(this.skyGroup);

        // --- Create a group to hold the celestial body (can be sun or moon) ---
        this.celestialBody = new THREE.Group();
        this.skyGroup.add(this.celestialBody);

        // ===== DETAILED MOON =====
        this.moonGroup = new THREE.Group();

        // 1. Create Moon surface with crater canvas texture
        const moonCanvas = document.createElement('canvas');
        moonCanvas.width = 1024;
        moonCanvas.height = 512;
        const moonCtx = moonCanvas.getContext('2d');

        // Bright base color - warm white
        moonCtx.fillStyle = '#f0eadc';
        moonCtx.fillRect(0, 0, 1024, 512);

        // Draw craters (subtle, not too dark)
        const craters = [
            { x: 200, y: 150, r: 70, depth: 0.25 },
            { x: 500, y: 280, r: 100, depth: 0.2 },
            { x: 750, y: 120, r: 55, depth: 0.3 },
            { x: 850, y: 350, r: 80, depth: 0.22 },
            { x: 300, y: 370, r: 45, depth: 0.28 },
            { x: 100, y: 340, r: 35, depth: 0.25 },
            { x: 620, y: 180, r: 30, depth: 0.3 },
            { x: 920, y: 200, r: 40, depth: 0.2 },
            { x: 400, y: 100, r: 28, depth: 0.3 },
        ];

        craters.forEach(c => {
            // Shadow rim (very subtle)
            const rimGrad = moonCtx.createRadialGradient(c.x, c.y, c.r * 0.6, c.x, c.y, c.r * 1.1);
            rimGrad.addColorStop(0, `rgba(160,145,125,${c.depth * 0.5})`);
            rimGrad.addColorStop(1, 'rgba(240,234,220,0)');
            moonCtx.fillStyle = rimGrad;
            moonCtx.beginPath();
            moonCtx.arc(c.x, c.y, c.r * 1.1, 0, Math.PI * 2);
            moonCtx.fill();

            // Inner basin (light grey)
            const innerGrad = moonCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            innerGrad.addColorStop(0, `rgba(170,160,145,${c.depth * 0.7})`);
            innerGrad.addColorStop(0.8, `rgba(220,210,195,${c.depth * 0.3})`);
            innerGrad.addColorStop(1, 'rgba(240,234,220,0)');
            moonCtx.fillStyle = innerGrad;
            moonCtx.beginPath();
            moonCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            moonCtx.fill();
        });

        // Light surface noise
        for(let i = 0; i < 2000; i++) {
            const nx = Math.random() * 1024;
            const ny = Math.random() * 512;
            const alpha = Math.random() * 0.04;
            moonCtx.fillStyle = `rgba(160,150,130,${alpha})`;
            moonCtx.fillRect(nx, ny, Math.random() * 2, Math.random() * 2);
        }

        const moonTexture = new THREE.CanvasTexture(moonCanvas);

        // Moon sphere - bright emissive so it glows in the dark sky
        const moonGeo = new THREE.SphereGeometry(1, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.9,
            metalness: 0.0,
            emissive: new THREE.Color('#d4c8a8'),
            emissiveIntensity: 0.6, // Makes it glow brightly on its own
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.moonGroup.add(moonMesh);

        // Soft outer glow halo (blue-white)
        const haloGeo = new THREE.SphereGeometry(1.35, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: '#c8dce8',
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.moonGroup.add(new THREE.Mesh(haloGeo, haloMat));

        // Second larger halo for atmosphere
        const halo2Geo = new THREE.SphereGeometry(1.7, 32, 32);
        const halo2Mat = new THREE.MeshBasicMaterial({
            color: '#a0b8cc',
            transparent: true,
            opacity: 0.04,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.moonGroup.add(new THREE.Mesh(halo2Geo, halo2Mat));

        // ===== DETAILED SUN =====
        this.sunGroup = new THREE.Group();

        const sunGeo = new THREE.SphereGeometry(1, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: '#ffb703' });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);

        // Sun glow layers
        for (let i = 0; i < 3; i++) {
            const glowR = 1.2 + i * 0.3;
            const glowGeo = new THREE.SphereGeometry(glowR, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: '#ffe566',
                transparent: true,
                opacity: 0.05 - i * 0.012,
                side: THREE.BackSide,
                depthWrite: false
            });
            this.sunGroup.add(new THREE.Mesh(glowGeo, glowMat));
        }
        this.sunGroup.add(sunMesh);

        // Both start hidden; goToPart toggles them
        this.moonGroup.visible = false;
        this.sunGroup.visible = true;

        this.celestialBody.add(this.moonGroup);
        this.celestialBody.add(this.sunGroup);

        // Keep a material ref for legacy color tween compatibility
        this.celestialBody.material = sunMat;

        // Massive Stylized Architectural Clouds
        this.clouds = [];
        this.cloudMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            flatShading: true,
            roughness: 0.6,
            opacity: 0.8,
            transparent: true,
            emissive: new THREE.Color('#000000'),
            emissiveIntensity: 0.2
        });

        for(let i=0; i<6; i++) { 
            const cloudGroup = new THREE.Group();
            const numSegments = 6 + Math.floor(Math.random() * 6);
            
            for (let j = 0; j < numSegments; j++) {
                // Flat layered boxes for a more "designed" cloud look
                const w = 5 + Math.random() * 10;
                const h = 0.6 + Math.random() * 1.2;
                const d = 4 + Math.random() * 6;
                const geo = new THREE.BoxGeometry(w, h, d);
                const part = new THREE.Mesh(geo, this.cloudMat);
                
                part.position.x = j * 4.0;
                part.position.y = (Math.random() - 0.5) * 1.2;
                part.position.z = (Math.random() - 0.5) * 2.5;

                part.rotation.y = (Math.random() - 0.5) * 0.3;
                part.castShadow = true;
                cloudGroup.add(part);
            }
            
            const x = (Math.random() - 0.5) * 140;
            const y = 28 + Math.random() * 12;
            const z = -30 - Math.random() * 15;
            cloudGroup.position.set(x, y, z);
            
            cloudGroup.userData = {
                speed: 0.005 + Math.random() * 0.01
            };
            
            this.skyGroup.add(cloudGroup);
            this.clouds.push(cloudGroup);
        }

        // --- Low Poly Stars (for night parts) ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 4000;
        const posArray = new Float32Array(starsCount * 3);
        
        for(let i=0; i < starsCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 250;    // x wider
            posArray[i+1] = (Math.random() * 50) + 2;     // y higher
            posArray[i+2] = (Math.random() - 0.5) * 60 - 40; // z pushed back
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        this.starsMat = new THREE.PointsMaterial({
            size: 0.08,
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starsGeo, this.starsMat);
        this.scene.add(this.stars);

        // --- Milky Way Spiral Galaxy (from milkyway.html) ---
        const galaxyParams = {
            count: 15000,           
            size: 0.15,             
            radius: 50,
            branches: 3,
            spin: 0.8,
            randomness: 0.25,
            insideColor: 0xffffff,  
            middleColor: 0xffa500,  
            outsideColor: 0x0033ff  
        };

        const mwGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(galaxyParams.count * 3);
        const colors = new Float32Array(galaxyParams.count * 3);

        const colorInside = new THREE.Color(galaxyParams.insideColor);
        const colorMiddle = new THREE.Color(galaxyParams.middleColor);
        const colorOutside = new THREE.Color(galaxyParams.outsideColor);

        for (let i = 0; i < galaxyParams.count; i++) {
            const i3 = i * 3;
            
            const radius = Math.pow(Math.random(), 1.5) * galaxyParams.radius;
            const spinAngle = radius * galaxyParams.spin;
            const branchAngle = ((i % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2;

            const randomX = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius);
            const randomY = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius * 0.5);
            const randomZ = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius);

            // Positioning it in the back sky
            positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = 25 + Math.sin(branchAngle + spinAngle) * (radius * 0.2) + randomY;
            positions[i3 + 2] = -60 + randomZ;

            let mixedColor;
            const ratio = radius / galaxyParams.radius;
            if (ratio < 0.2) {
                mixedColor = colorInside.clone().lerp(colorMiddle, ratio * 5);
            } else {
                mixedColor = colorMiddle.clone().lerp(colorOutside, (ratio - 0.2) * 1.25);
            }

            colors[i3 + 0] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        mwGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.mwMat = new THREE.PointsMaterial({
            size: galaxyParams.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            transparent: true,
            opacity: 0
        });
        
        this.milkyWay = new THREE.Points(mwGeo, this.mwMat);
        this.skyGroup.add(this.milkyWay);

        // Core Light for the Galaxy
        this.galaxyCoreLight = new THREE.PointLight(0xffaa00, 0, 100);
        this.galaxyCoreLight.position.set(0, 30, -60);
        this.skyGroup.add(this.galaxyCoreLight);

        // --- Shooting Stars ---
        this.shootingStars = [];
        const ssGeo = new THREE.CylinderGeometry(0, 0.05, 4, 3);
        ssGeo.rotateX(Math.PI / 2); // Point along Z initially so lookAt aligns length correctly
        const ssMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        for(let i=0; i<3; i++) {
            const ss = new THREE.Mesh(ssGeo, ssMat);
            this.scene.add(ss);
            this.shootingStars.push({
                mesh: ss,
                active: false,
                life: 0,
                velocity: new THREE.Vector3()
            });
        }
    }

    setupExtraSkyElements() {
        // --- Low-Poly Paper Planes ---
        this.paperPlanes = [];
        const planeGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0.4,    // tip
            -0.4, 0.1, -0.2, // left wing back
            0, 0, 0.3,    // spine back
            
            0, 0, 0.4,
            0, 0, 0.3,
            0.4, 0.1, -0.2, // right wing back
            
            0, 0, 0.4,
            0, -0.15, 0.3, // bottom fold back
            0, 0, 0.3
        ]);
        planeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        planeGeo.computeVertexNormals();
        const planeMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide, 
            flatShading: true 
        });

        for(let i=0; i<8; i++) {
            const paperPlane = new THREE.Mesh(planeGeo, planeMat);
            paperPlane.position.set(20 + i*5, 7 + Math.random()*3, -15 + Math.random()*5);
            paperPlane.rotation.y = Math.PI; // Face forward
            
            paperPlane.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.04 + Math.random() * 0.04
            };
            
            this.paperPlanes.push(paperPlane);
            this.skyGroup.add(paperPlane);
        }

        // --- Low-Poly Hot Air Balloon ---
        this.balloons = [];
        const balloonGroup = new THREE.Group();
        
        const balloonGeo = new THREE.SphereGeometry(2, 8, 6); // Low res
        const balloonMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, flatShading: true });
        const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
        balloonGroup.add(balloonMesh);

        const basketGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -3;
        balloonGroup.add(basket);

        // Add 4 simple ropes
        const ropeMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true });
        for(let i=0; i<4; i++) {
            const ropeGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(i%2?0.3:-0.3, -3, i<2?0.3:-0.3)
            ]);
            balloonGroup.add(new THREE.Line(ropeGeo, ropeMat));
        }

        balloonGroup.position.set(-20, 10, -30);
        this.balloons.push(balloonGroup);
        this.skyGroup.add(balloonGroup);

        // --- God Rays (Volumetric Sunbeams) ---
        this.rayGroup = new THREE.Group();
        this.scene.add(this.rayGroup);
        this.rays = [];
        const rayGeo = new THREE.CylinderGeometry(0.1, 8, 40, 4, 1, true); // Tapered cone
        const rayMat = new THREE.MeshBasicMaterial({ 
            color: 0xfff9e6, 
            transparent: true, 
            opacity: 0, 
            depthWrite: false,
            side: THREE.DoubleSide
        });

        for(let i=0; i<6; i++) {
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.rotation.x = Math.PI/2;
            ray.rotation.z = (i / 6) * Math.PI * 2;
            this.rays.push(ray);
            this.rayGroup.add(ray);
        }
    }

    getTerrainHeight(x, z) {
        const angle = (x / 160) * Math.PI * 2;
        const bump = Math.sin(angle * 4 + z * 0.1) * 2.5 
                   + Math.cos(angle * 7 - z * 0.2) * 1.0
                   + Math.sin(angle * 14 + z * 0.3) * 0.5
                   + Math.sin(angle * 40 + z * 2.5) * 0.15; 
        
        const roadWidth = 3.0;
        const blendWidth = 8;
        const distZ = Math.abs(z);
        
        let intensity = 1.0;
        let roadBump = 0;
        
        if (distZ < roadWidth) {
            intensity = 0;
            roadBump = (Math.sin(x * 3.5) * 0.05) + (Math.sin(x * 12.0) * 0.02);
            if (Math.abs(z - 0.7) < 0.4 || Math.abs(z + 0.7) < 0.4) {
                roadBump -= 0.08;
            }
        } else if (distZ < roadWidth + blendWidth) {
            const t = (distZ - roadWidth) / blendWidth;
            intensity = t * t * (3 - 2 * t);
        }
        
        return (bump * intensity) + roadBump - 3.5; 
    }

    setupCacti() {
        this.cactiGroup = new THREE.Group();
        this.groundGroup.add(this.cactiGroup);
        this.cacti = [];
        
        const cactusMat = new THREE.MeshStandardMaterial({ 
            color: '#43a047', 
            flatShading: true,
            roughness: 0.9 
        });

        const flowerMat = new THREE.MeshStandardMaterial({
            color: '#ff4081', // Pink/red flower
            flatShading: true, 
            roughness: 0.5
        });

        const totalWidth = 160;
        
        // Base geometries
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 7);
        trunkGeo.translate(0, 0.75, 0); 
        const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
        armGeo.translate(0, 0.4, 0);
        const elbowGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const flowerGeo = new THREE.DodecahedronGeometry(0.1, 0);
        
        // --- Variant 2: Prickly Pear (Paddle shape) geometries
        const paddleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
        paddleGeo.rotateX(Math.PI / 2); // flatten

        for(let i = 0; i < 70; i++) {
            const cactusGroup = new THREE.Group();
            
            // Randomly choose Saguaro (tall) vs Prickly Pear (short flat)
            const type = Math.random() > 0.3 ? 'saguaro' : 'prickly';
            
            if (type === 'saguaro') {
                const trunk = new THREE.Mesh(trunkGeo, cactusMat);
                const scaleY = 0.8 + Math.random() * 1.5;
                const scaleXZ = 0.8 + Math.random() * 0.5;
                trunk.scale.set(scaleXZ, scaleY, scaleXZ);
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                cactusGroup.add(trunk);

                const numArms = 1 + Math.floor(Math.random() * 3);
                for (let a = 0; a < numArms; a++) {
                    const armWrapper = new THREE.Group();
                    
                    // The horizontal stalk out from the trunk
                    const hStalk = new THREE.Mesh(armGeo, cactusMat);
                    hStalk.scale.set(scaleXZ * 0.8, 0.5 * scaleXZ, scaleXZ * 0.8);
                    hStalk.rotation.z = Math.PI / 2;
                    hStalk.castShadow = true;
                    hStalk.receiveShadow = true;
                    armWrapper.add(hStalk);
                    
                    // Elbow joint
                    const elbow = new THREE.Mesh(elbowGeo, cactusMat);
                    elbow.scale.setScalar(scaleXZ * 0.9);
                    elbow.position.x = 0.4 * scaleXZ;
                    elbow.castShadow = true;
                    armWrapper.add(elbow);

                    // The vertical stalk going up
                    const vStalk = new THREE.Mesh(armGeo, cactusMat);
                    const vLen = 0.5 + Math.random() * 0.8;
                    vStalk.scale.set(scaleXZ * 0.8, vLen, scaleXZ * 0.8);
                    vStalk.position.x = 0.4 * scaleXZ;
                    vStalk.castShadow = true;
                    vStalk.receiveShadow = true;
                    armWrapper.add(vStalk);
                    
                    // Attach arm to trunk
                    armWrapper.position.y = 0.5 + Math.random() * (1.5 * scaleY - 0.7);
                    armWrapper.rotation.y = (Math.PI * 2 / numArms) * a + Math.random();
                    
                    // Maybe add a flower on top of vertical stalk
                    if (Math.random() > 0.7) {
                        const flower = new THREE.Mesh(flowerGeo, flowerMat);
                        flower.position.set(0.4 * scaleXZ, vLen * 0.8, 0);
                        armWrapper.add(flower);
                    }
                    
                    cactusGroup.add(armWrapper);
                }
            } else {
                // Prickly Pear style
                const numPaddles = 3 + Math.floor(Math.random() * 5);
                const paddles = []; // Keep track of positions to attach to
                
                for(let p = 0; p < numPaddles; p++) {
                    const paddle = new THREE.Mesh(paddleGeo, cactusMat);
                    const pScale = 0.5 + Math.random() * 0.8;
                    paddle.scale.setScalar(pScale);
                    paddle.castShadow = true;
                    paddle.receiveShadow = true;
                    
                    if (p === 0) {
                        // Base paddle
                        paddle.position.y = 0.2 * pScale;
                        paddle.rotation.y = Math.random() * Math.PI;
                        paddle.rotation.z = (Math.random() - 0.5) * 0.3;
                    } else {
                        // Pick a random existing paddle to grow out of
                        const parent = paddles[Math.floor(Math.random() * paddles.length)];
                        paddle.position.copy(parent.position);
                        
                        // Move up and out
                        paddle.position.y += 0.3 * parent.scale.y + 0.1 * pScale;
                        paddle.position.x += (Math.random() - 0.5) * 0.5;
                        paddle.position.z += (Math.random() - 0.5) * 0.5;
                        
                        paddle.rotation.y = Math.random() * Math.PI;
                        paddle.rotation.z = (Math.random() - 0.5) * 0.8;
                        paddle.rotation.x = (Math.random() - 0.5) * 0.8;
                    }
                    
                    if(Math.random() > 0.8) {
                        const flower = new THREE.Mesh(flowerGeo, flowerMat);
                        flower.position.y = 0.2 * pScale;
                        paddle.add(flower);
                    }
                    
                    paddles.push(paddle);
                    cactusGroup.add(paddle);
                }
            }

            const lx = (Math.random() * totalWidth) - 80; 
            const lz = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 25);
            const ly = this.getTerrainHeight(lx, lz) + 3.5; 
            
            cactusGroup.position.set(lx, ly, lz);
            cactusGroup.rotation.y = Math.random() * Math.PI;

            const cactusCopy = cactusGroup.clone();
            cactusCopy.position.x += 160;
            
            this.cactiGroup.add(cactusGroup);
            this.cactiGroup.add(cactusCopy);
            this.cacti.push(cactusGroup, cactusCopy);
        }
    }

    setupRocks() {
        this.rocksGroup = new THREE.Group();
        this.groundGroup.add(this.rocksGroup);
        const rockGeo = new THREE.DodecahedronGeometry(1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: '#a1887f', 
            flatShading: true,
            roughness: 0.9 
        });

        for(let i=0; i<40; i++) {
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const scale = 0.5 + Math.random() * 1.5;
            rock.scale.set(scale, scale * 0.8, scale);
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 20);
            const y = this.getTerrainHeight(x, z) + 3.5;
            
            rock.position.set(x, y - (scale * 0.2), z); // Embed slightly
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            
            const copy = rock.clone();
            copy.position.x += 160;
            this.rocksGroup.add(rock, copy);
        }
    }

    setupBushes() {
        this.bushesGroup = new THREE.Group();
        this.groundGroup.add(this.bushesGroup);
        const bushGeo = new THREE.IcosahedronGeometry(0.5, 0);
        const bushMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', flatShading: true });

        for(let i=0; i<25; i++) {
            const bush = new THREE.Group();
            const numPuffs = 2 + Math.floor(Math.random() * 3);
            for(let j=0; j<numPuffs; j++) {
                const puff = new THREE.Mesh(bushGeo, bushMat);
                puff.position.set(Math.random()-0.5, Math.random()*0.3, Math.random()-0.5);
                puff.scale.setScalar(0.5 + Math.random());
                bush.add(puff);
            }
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 15);
            bush.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            
            const copy = bush.clone();
            copy.position.x += 160;
            this.bushesGroup.add(bush, copy);
        }
    }

    setupCityObjects() {
        this.cityGroup = new THREE.Group();
        this.groundGroup.add(this.cityGroup);
        const boxGeo = new THREE.BoxGeometry(4, 1, 4);
        const winMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#444' });

        for(let i=0; i<30; i++) {
            const h = 5 + Math.random() * 20;
            const building = new THREE.Mesh(new THREE.BoxGeometry(4, h, 4), new THREE.MeshStandardMaterial({ color: '#555' }));
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10);
            building.position.set(x, h/2 - 3.5, z);
            
            // Add simplified windows
            const windows = new THREE.Mesh(new THREE.BoxGeometry(4.1, h * 0.8, 4.1), winMat);
            windows.position.copy(building.position);
            
            this.cityGroup.add(building);
        }
        this.cityGroup.visible = false;
    }

    setupOasisObjects() {
        this.oasisGroup = new THREE.Group();
        this.groundGroup.add(this.oasisGroup);
        
        // Simple palm trees using blocks
        for(let i=0; i<40; i++) {
            const palm = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 6), new THREE.MeshStandardMaterial({ color: '#5d4037' }));
            trunk.position.y = 3;
            palm.add(trunk);
            
            for(let j=0; j<5; j++) {
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1), new THREE.MeshStandardMaterial({ color: '#2e7d32' }));
                leaf.position.y = 6;
                leaf.rotation.y = (j / 5) * Math.PI * 2;
                leaf.rotation.z = 0.2;
                palm.add(leaf);
            }
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 10);
            palm.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            this.oasisGroup.add(palm);
        }
        this.oasisGroup.visible = false;
    }

    setupSignposts() {
        this.signsGroup = new THREE.Group();
        this.groundGroup.add(this.signsGroup);
        
        const postGeo = new THREE.BoxGeometry(0.15, 2.5, 0.15);
        const boardGeo = new THREE.BoxGeometry(1.4, 0.6, 0.1); // Slightly larger
        const woodMat = new THREE.MeshStandardMaterial({ color: '#5d4037', flatShading: true });

        // Create canvas text once for reuse
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("Glutisify", 256, 64);
        const labelTexture = new THREE.CanvasTexture(canvas);

        for(let i=0; i<6; i++) {
            const sign = new THREE.Group();
            const post = new THREE.Mesh(postGeo, woodMat);
            sign.add(post);
            
            const board = new THREE.Mesh(boardGeo, woodMat);
            board.position.y = 0.8;
            board.rotation.z = (Math.random() - 0.5) * 0.1;
            sign.add(board);

            // Add text label
            const labelGeo = new THREE.PlaneGeometry(1.3, 0.5);
            const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
            const label = new THREE.Mesh(labelGeo, labelMat);
            label.position.set(0, 0.8, 0.06);
            board.add(label);
            
            const x = (i * 30) - 70;
            const z = (i % 2 === 0 ? 3.5 : -3.5); // Near road edges
            sign.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            sign.rotation.y = (i % 2 === 0 ? -0.5 : 0.5);
            
            const copy = sign.clone();
            copy.position.x += 160;
            this.signsGroup.add(sign, copy);
        }
    }

    setupTumbleweeds() {
        this.tumbles = [];
        this.tumblesGroup = new THREE.Group();
        this.groundGroup.add(this.tumblesGroup);
        
        const loader = new GLTFLoader();
        loader.load('/assets/models/tumbleweed.glb', (gltf) => {
            const model = gltf.scene;
            
            // Optimize model
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            for(let i=0; i<12; i++) {
                const tumble = model.clone();
                const x = (Math.random() * 160) - 80;
                // Place them near the road (Z between -3.5 and 3.5)
                const z = (Math.random() - 0.5) * 7; 
                
                const scale = 0.001 + Math.random() * 0.001;
                tumble.scale.set(scale, scale, scale);
                tumble.position.set(x, this.getTerrainHeight(x, z) + 3.5 + 0.5, z);
                
                tumble.userData = {
                    phase: Math.random() * Math.PI * 2,
                    rollSpeed: 3 + Math.random() * 4,
                    bounceHeight: 0.4 + Math.random() * 0.4,
                    zSpeed: (Math.random() - 0.5) * 0.1, // Added speed to cross the road
                    zRange: 30 // Range to wander before wrapping
                };
                
                const copy = tumble.clone();
                copy.position.x += 160;
                
                this.tumbles.push(tumble, copy);
                this.tumblesGroup.add(tumble, copy);
            }
        });
    }

    setupAdvancedFeatures() {
        this.featuresGroup = new THREE.Group();
        this.groundGroup.add(this.featuresGroup);

        // 1. Rock Formations (Buttes) - Layered distant features
        const butteMat = new THREE.MeshStandardMaterial({ 
            color: '#a1887f', // Warm reddish brown
            flatShading: true,
            roughness: 0.9
        });

        for(let i=0; i<6; i++) {
            const butteGroup = new THREE.Group();
            const numLayers = 3 + Math.floor(Math.random() * 2);
            for(let j=0; j<numLayers; j++) {
                const radius = (numLayers - j) * 4;
                const height = 4 + Math.random() * 3;
                const layerGeo = new THREE.CylinderGeometry(radius * 0.6, radius, height, 5 + Math.floor(Math.random() * 3));
                const layer = new THREE.Mesh(layerGeo, butteMat);
                layer.position.y = j * 4;
                layer.rotation.y = Math.random() * Math.PI;
                layer.castShadow = true;
                layer.receiveShadow = true;
                butteGroup.add(layer);
            }

            const x = (i * 30) - 70 + (Math.random() * 20);
            const z = (Math.random() > 0.5 ? 45 : -45); 
            const totalScale = 0.5 + Math.random() * 1.0;
            butteGroup.scale.set(totalScale, totalScale, totalScale);
            butteGroup.position.set(x, this.getTerrainHeight(x, z) + 3.5 - 1, z);
            
            const copy = butteGroup.clone();
            copy.position.x += 160;
            this.featuresGroup.add(butteGroup, copy);
        }

        // 2. Teepee Tents
        const tentMat = new THREE.MeshStandardMaterial({ color: '#d7ccc8', flatShading: true });
        const poleMat = new THREE.MeshStandardMaterial({ color: '#5d4037' });
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4);

        for(let i=0; i<3; i++) {
            const teepee = new THREE.Group();
            
            // Tent body - open cone
            const bodyGeo = new THREE.ConeGeometry(2, 2.5, 6, 1, true);
            const body = new THREE.Mesh(bodyGeo, tentMat);
            body.position.y = 1.25;
            body.castShadow = true;
            teepee.add(body);

            // Poles sticking out
            for(let p=0; p<6; p++) {
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.rotation.z = 0.4;
                pole.rotation.y = (p / 6) * Math.PI * 2;
                pole.position.y = 2.0;
                teepee.add(pole);
            }

            const x = (i * 50) - 50;
            const z = (i % 2 === 0 ? 12 : -12);
            teepee.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            teepee.rotation.y = Math.random() * Math.PI;
            
            const copy = teepee.clone();
            copy.position.x += 160;
            this.featuresGroup.add(teepee, copy);
        }

        // 3. Cow Skulls
        const skullMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', flatShading: true });
        for(let i=0; i<4; i++) {
            const skull = this.createCowSkull(skullMat);
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 4 : -4);
            skull.position.set(x, this.getTerrainHeight(x, z) + 3.4, z); // Slightly embedded
            skull.rotation.set(0.5, Math.random(), 0.2);
            skull.scale.setScalar(1.2);
            
            const copy = skull.clone();
            copy.position.x += 160;
            this.featuresGroup.add(skull, copy);
        }
    }

    createCowSkull(material) {
        const group = new THREE.Group();
        const headGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
        const head = new THREE.Mesh(headGeo, material);
        head.castShadow = true;
        group.add(head);

        const hornGeo = new THREE.CylinderGeometry(0.05, 0.02, 0.5);
        hornGeo.rotateZ(Math.PI/2);
        
        const hornL = new THREE.Mesh(hornGeo, material);
        hornL.position.set(0.3, 0.1, 0.1);
        hornL.rotation.y = 0.6;
        hornL.castShadow = true;
        group.add(hornL);

        const hornR = hornL.clone();
        hornR.position.x = -0.3;
        hornR.rotation.y = -0.6;
        group.add(hornR);

        return group;
    }

    setupRoadDebris() {
        this.debrisGroup = new THREE.Group();
        this.groundGroup.add(this.debrisGroup);
        
        // 1. Small edge stones (sỏi đá ven đường)
        const stoneGeo = new THREE.DodecahedronGeometry(0.15, 0);
        const stoneMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', flatShading: true });
        
        for(let i=0; i<60; i++) {
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            const x = (Math.random() * 160) - 80;
            const side = Math.random() > 0.5 ? 1 : -1;
            const z = side * (3.0 + Math.random() * 0.8);
            const scale = 0.3 + Math.random() * 1.2;
            
            stone.scale.set(scale, scale * 0.6, scale);
            stone.position.set(x, this.getTerrainHeight(x, z) + 3.5 - 0.05, z);
            stone.rotation.set(Math.random(), Math.random(), Math.random());
            
            const copy = stone.clone();
            copy.position.x += 160;
            this.debrisGroup.add(stone, copy);
        }

        // 2. Dried Cracked Mud / Planks (Gỗ vụn/mảnh rác trên đường)
        const woodMat = new THREE.MeshStandardMaterial({ color: '#5d4037', flatShading: true });
        
        for(let i=0; i<10; i++) {
            const plankGrp = new THREE.Group();
            
            const numPieces = 1 + Math.floor(Math.random() * 3);
            for(let p=0; p<numPieces; p++) {
                const plankGeo = new THREE.BoxGeometry(0.6 + Math.random(), 0.08, 0.2 + Math.random()*0.2);
                const plank = new THREE.Mesh(plankGeo, woodMat);
                plank.position.set((Math.random()-0.5)*1, 0, (Math.random()-0.5)*1);
                plank.rotation.y = Math.random() * Math.PI;
                plank.rotation.z = (Math.random()-0.5)*0.1;
                plankGrp.add(plank);
            }
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() - 0.5) * 1.8; 
            plankGrp.position.set(x, this.getTerrainHeight(x, z) + 3.5, z); 
            
            const copy = plankGrp.clone();
            copy.position.x += 160;
            this.debrisGroup.add(plankGrp, copy);
        }
    }

    setupDeadTrees() {
        this.treesGroup = new THREE.Group();
        this.groundGroup.add(this.treesGroup);
        
        const barkMat = new THREE.MeshStandardMaterial({ color: '#4e342e', flatShading: true });
        
        // Use a recursive function to generate fractal-like branching trees
        const generateBranch = (radius, length, depth) => {
            const branchGroup = new THREE.Group();
            
            // The segment geometry
            const geo = new THREE.CylinderGeometry(radius * 0.6, radius, length, 5 - depth);
            geo.translate(0, length / 2, 0); // Origin at bottom of branch
            const mesh = new THREE.Mesh(geo, barkMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            branchGroup.add(mesh);
            
            if (depth > 0) {
                const numSubBranches = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < numSubBranches; i++) {
                    const subRadius = radius * 0.6;
                    const subLength = length * (0.6 + Math.random() * 0.3);
                    const subBranch = generateBranch(subRadius, subLength, depth - 1);
                    
                    // Attach somewhere along the upper half of the current branch
                    subBranch.position.y = length * (0.5 + Math.random() * 0.5);
                    
                    // Angle outwards
                    subBranch.rotation.z = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.6);
                    subBranch.rotation.x = (Math.random() - 0.5) * 0.8;
                    subBranch.rotation.y = Math.random() * Math.PI * 2;
                    
                    branchGroup.add(subBranch);
                }
            }
            return branchGroup;
        };
        
        for(let i = 0; i < 20; i++) {
            const tree = generateBranch(0.15 + Math.random() * 0.1, 1.5 + Math.random() * 1.5, 2);
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 25);
            tree.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.rotation.z = (Math.random() - 0.5) * 0.2; // Slight global tilt
            
            const copy = tree.clone();
            copy.position.x += 160;
            this.treesGroup.add(tree, copy);
        }
    }

    setupBeetles() {
        this.beetles = [];
        const bodyGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
        const ballGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const ballMat = new THREE.MeshStandardMaterial({ color: '#4e342e' });

        for(let i=0; i<5; i++) {
            const group = new THREE.Group();
            const beetle = new THREE.Mesh(bodyGeo, bodyMat);
            beetle.position.z = 0.3;
            group.add(beetle);
            const ball = new THREE.Mesh(ballGeo, ballMat);
            group.add(ball);

            const x = (Math.random() * 160) - 80;
            const z = (Math.random() - 0.5) * 10;
            group.position.set(x, -3.5, z);
            
            group.userData = {
                originalX: x,
                zSpeed: (Math.random() - 0.5) * 0.05,
                phase: Math.random() * Math.PI * 2
            };

            const copy = group.clone();
            copy.position.x += 160;
            this.groundGroup.add(group, copy);
            this.beetles.push(group, copy);
        }
    }

    setupUI() {
        const sideNav = document.querySelector('.side-nav');
        if (!sideNav) return;
        sideNav.innerHTML = '';
        this.config.parts.forEach((part, index) => {
            const dot = document.createElement('div');
            dot.classList.add('nav-dot');
            dot.setAttribute('data-title', part.title);
            dot.addEventListener('click', () => this.goToPart(index));
            sideNav.appendChild(dot);
        });
        this.updateNav();
    }

    updateNav() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPartIndex);
        });
    }

    goToPart(index) {
        if (this.currentPartIndex === index && this.uiInited) return;
        this.uiInited = true;
        this.currentPartIndex = index;
        const part = this.config.parts[index];

        const content = document.querySelector('.story-content');
        if (content) {
            content.classList.remove('visible');
            setTimeout(() => {
                document.querySelector('.subtitle').textContent = part.subtitle;
                document.querySelector('.title').textContent = part.title;
                document.querySelector('.description').textContent = part.content;
                document.documentElement.style.setProperty('--primary-color', part.theme.primaryColor);

                // Hiển thị nhãn thời gian
                const timeEl = document.getElementById('time-label');
                if (timeEl) timeEl.textContent = part.timeLabel || '';

                // Hiển thị tên mùa
                const season = this.config.seasons[this.currentSeasonIndex || 0];
                const seasonEl = document.getElementById('season-label');
                if (seasonEl) seasonEl.textContent = season ? season.name : '';
                
                // Update 3D Background and Fog smoothly
                const cleanColor = part.theme.backgroundColor.substring(0, 7);
                const targetColor = new THREE.Color(cleanColor);
                
                gsap.to(this.scene.background, {
                    r: targetColor.r,
                    g: targetColor.g,
                    b: targetColor.b,
                    duration: 1.5,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        if (this.scene.fog) {
                            this.scene.fog.color.copy(this.scene.background);
                        }
                    }
                });

                // Cập nhật ánh sáng môi trường theo thời gian
                if (this.ambientLight && part.theme.ambientColor) {
                    const ambCol = new THREE.Color(part.theme.ambientColor);
                    gsap.to(this.ambientLight.color, { r: ambCol.r, g: ambCol.g, b: ambCol.b, duration: 2.0 });
                    gsap.to(this.ambientLight, { intensity: part.theme.ambientIntensity ?? 0.4, duration: 2.0 });
                }
                if (this.dirLight && part.theme.dirLightColor) {
                    const dlCol = new THREE.Color(part.theme.dirLightColor);
                    gsap.to(this.dirLight.color, { r: dlCol.r, g: dlCol.g, b: dlCol.b, duration: 2.0 });
                    gsap.to(this.dirLight, { intensity: part.theme.dirLightIntensity ?? 1.5, duration: 2.0 });
                    if (part.theme.dirLightPos) {
                        gsap.to(this.dirLight.position, {
                            x: part.theme.dirLightPos.x,
                            y: part.theme.dirLightPos.y,
                            z: part.theme.dirLightPos.z,
                            duration: 3.0,
                            ease: 'power1.inOut'
                        });
                    }
                }

                // Update Celestial Body - toggle Sun vs Moon
                const celestialData = part.theme.celestial;
                const isNight = celestialData.type === 'moon';
                const isDawn = part.id === 'dawn' || part.id === 'predawn';
                const isNoon = part.id === 'noon';
                const isAfternoon = part.id === 'afternoon';

                if (this.celestialBody && celestialData) {
                    // Toggle between detailed moon and sun
                    if (this.sunGroup) this.sunGroup.visible = !isNight;
                    if (this.moonGroup) this.moonGroup.visible = isNight;

                    // Đổi màu mặt trời theo thời gian
                    if (!isNight && this.sunGroup) {
                        const sunMesh = this.sunGroup.children[this.sunGroup.children.length - 1];
                        if (sunMesh && sunMesh.material) {
                            const sc = new THREE.Color(celestialData.color);
                            gsap.to(sunMesh.material.color, { r: sc.r, g: sc.g, b: sc.b, duration: 2.0 });
                        }
                    }

                    // Scale the whole celestial group
                    gsap.to(this.celestialBody.scale, {
                        x: celestialData.scale,
                        y: celestialData.scale,
                        z: celestialData.scale,
                        duration: 2.0,
                        ease: "elastic.out(1, 0.7)"
                    });
                }

                // Stars / Milky Way - chỉ hiện khi đêm
                const starOpacity = isNight ? (part.id === 'predawn' ? 0.5 : 0.8) : 0;
                if (this.starsMat) {
                    gsap.to(this.starsMat, { opacity: starOpacity, duration: 3.0, ease: "power2.inOut" });
                }
                if (this.mwMat) {
                    gsap.to(this.mwMat, { opacity: isNight ? 0.8 : 0, duration: 3.0, ease: "power2.inOut" });
                }

                // Cloud colors theo thời gian
                if (this.cloudMat) {
                    let cloudHex = '#ffffff';
                    let emissiveHex = '#000000';
                    if (part.id === 'dawn' || part.id === 'afternoon') {
                        cloudHex = '#ff9a5c'; emissiveHex = '#e65100';
                    } else if (part.id === 'noon') {
                        cloudHex = '#ffffff'; emissiveHex = '#e0e0e0';
                    } else if (isNight) {
                        cloudHex = '#1a237e'; emissiveHex = '#3949ab';
                    }
                    const tc = new THREE.Color(cloudHex);
                    const te = new THREE.Color(emissiveHex);
                    gsap.to(this.cloudMat.color, { r: tc.r, g: tc.g, b: tc.b, duration: 2.5 });
                    gsap.to(this.cloudMat.emissive, { r: te.r, g: te.g, b: te.b, duration: 2.5 });
                }

                if (this.galaxyCoreLight) {
                    gsap.to(this.galaxyCoreLight, { intensity: isNight ? 10 : 0, duration: 3.0 });
                }

                // God rays: chỉ ban ngày không phải bình minh và đêm
                const rayVisible = !isNight && !isDawn;
                const rayOpacity = rayVisible ? (isNoon ? 0.12 : 0.06) : 0;
                this.rays.forEach(ray => {
                    gsap.to(ray.material, { opacity: rayOpacity, duration: 2.0 });
                });

                // Paper planes & balloons chỉ ban ngày
                const skyShow = isNight ? 0 : 1;
                this.paperPlanes.forEach(plane => {
                    gsap.to(plane.scale, { x: skyShow, y: skyShow, z: skyShow, duration: 1.5 });
                });
                this.balloons.forEach(balloon => {
                    gsap.to(balloon.scale, { x: skyShow, y: skyShow, z: skyShow, duration: 2.0 });
                });

                // Người ven đường: Tint màu và độ trong suốt theo thời gian
                if (this.pedestriansGroup) {
                    const pedOpacity = (part.id === 'predawn') ? 0.3 : (isNight ? 0.5 : 1.0);
                    
                    // Màu tint tùy theo buổi
                    let tintColor = '#ffffff';
                    if (isNight) tintColor = '#3949ab'; // Xanh đêm
                    else if (isDawn || isAfternoon) tintColor = '#ffccbc'; // Cam bình minh/hoàng hôn
                    else if (isNoon) tintColor = '#ffffff'; // Sáng trưng
                    
                    const tCol = new THREE.Color(tintColor);

                    this.pedestriansGroup.traverse(c => {
                        if (c.isMesh && c.material) {
                            gsap.to(c.material, { opacity: pedOpacity, duration: 2.0 });
                            if (c.material.color) {
                                gsap.to(c.material.color, { r: tCol.r, g: tCol.g, b: tCol.b, duration: 2.0 });
                            }
                        }
                    });
                }

                content.classList.add('visible');
            }, 600);
        }

        this.updateNav();
    }

    // --- Setup Camels ---
    setupCamels() {
        this.camels = [];
        this.camelsGroup = new THREE.Group();
        this.groundGroup.add(this.camelsGroup); 

        const camelVariants = ['TANK', 'BABY', 'SNOW'];
        const numCamels = 12; 
        
        for (let i = 0; i < numCamels; i++) {
            const type = camelVariants[Math.floor(Math.random() * camelVariants.length)];
            const cData = this.createCamel(type);
            const camel = cData.mesh;
            
            const x = (Math.random() * 160) - 80; 
            
            let z;
            const rand = Math.random();
            if (rand < 0.2) { 
                z = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2);
            } else if (rand < 0.6) {
                z = -12 - Math.random() * 20;
            } else {
                z = 12 + Math.random() * 15;
            }

            camel.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            this.camelsGroup.add(camel);
            this.camels.push({ ...cData, phase: Math.random() * Math.PI * 2 });
        }
    }

    createCamel(type) {
        const group = new THREE.Group();
        let config = {
            color: 0xD2B48C,
            scale: 1,
            humps: 2,
            bodyScale: [2, 1.3, 1.2],
            neckLen: 1.2,
            legH: 1.5
        };

        if (type === 'TANK') {
            config = { color: 0x8B5A2B, scale: 1.3, humps: 1, bodyScale: [2.2, 1.5, 1.5], neckLen: 1.4, legH: 1.6 };
        } else if (type === 'BABY') {
            config = { color: 0xE6C291, scale: 0.6, humps: 2, bodyScale: [1.8, 1.2, 1.1], neckLen: 1.0, legH: 0.9 };
        } else if (type === 'SNOW') {
            config = { color: 0xF5F5F5, scale: 1, humps: 2, bodyScale: [2, 1.4, 1.3], neckLen: 0.8, legH: 1.3 };
        } else {
            // Default ADULT fallback
            config = { color: 0xD2B48C, scale: 1, humps: 2, bodyScale: [2, 1.3, 1.2], neckLen: 1.2, legH: 1.5 };
        }

        const mat = new THREE.MeshStandardMaterial({ color: config.color, flatShading: true, roughness: 0.8 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(...config.bodyScale), mat);
        body.castShadow = true;
        group.add(body);

        if (config.humps === 1) {
            const h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 0.8, 6), mat);
            h.position.y = config.bodyScale[1]/2 + 0.3;
            h.castShadow = true;
            group.add(h);
        } else {
            [-0.4, 0.4].forEach(x => {
                const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 0.6, 6), mat);
                h.position.set(x, config.bodyScale[1]/2 + 0.2, 0);
                h.castShadow = true;
                group.add(h);
            });
        }

        const neckGroup = new THREE.Group();
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, config.neckLen, 0.5), mat);
        neck.position.set(config.bodyScale[0]/2 + 0.2, 0.5, 0);
        neck.rotation.z = -Math.PI / 4;
        neck.castShadow = true;
        neckGroup.add(neck);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), mat);
        head.position.set(config.bodyScale[0]/2 + 0.7, 1.1, 0);
        head.castShadow = true;
        neckGroup.add(head);
        group.add(neckGroup);

        const legGeom = new THREE.BoxGeometry(0.2, config.legH, 0.2);
        const legs = [];
        const positions = [[0.7, 0.4], [0.7, -0.4], [-0.7, 0.4], [-0.7, -0.4]];
        positions.forEach(p => {
            const leg = new THREE.Mesh(legGeom, mat);
            leg.position.set(p[0], -config.bodyScale[1]/2 - config.legH/2 + 0.2, p[1]);
            leg.castShadow = true;
            group.add(leg);
            legs.push(leg);
        });

        group.scale.set(config.scale, config.scale, config.scale);
        return { mesh: group, legs, neckGroup, type, config, baseY: group.position.y };
    }

    setupMilestones() {
        const createSign = (text) => {
            const group = new THREE.Group();
            
            // Post
            const postGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
            const postMat = new THREE.MeshStandardMaterial({ color: '#4e342e' });
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.y = 1.5;
            post.castShadow = true;
            group.add(post);
            
            // Board
            const boardGeo = new THREE.BoxGeometry(2.5, 1.2, 0.1);
            const boardMat = new THREE.MeshStandardMaterial({ color: '#5d4037' });
            const board = new THREE.Mesh(boardGeo, boardMat);
            board.position.y = 2.5;
            board.castShadow = true;
            group.add(board);
            
            // Canvas Text
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(0, 0, 512, 256);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 128);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelGeo = new THREE.PlaneGeometry(2.3, 1);
            const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            const label = new THREE.Mesh(labelGeo, labelMat);
            label.position.set(0, 2.5, 0.06);
            group.add(label);
            
            return group;
        };

        const milestones = [
            { text: "Glutisify", x: -40, z: -4 },
            { text: "Glutisify", x: 0, z: 4 },
            { text: "Glutisify", x: 40, z: -4.2 }
        ];

        milestones.forEach(m => {
            const sign = createSign(m.text);
            sign.position.set(m.x, this.getTerrainHeight(m.x, m.z) + 3.5, m.z);
            if (m.z > 0) sign.rotation.y = Math.PI;
            
            const copy = sign.clone();
            copy.position.x += 160;
            this.groundGroup.add(sign, copy);
        });
    }

    setupRelics() {
        const createSkull = () => {
            const skull = new THREE.Group();
            const boneMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, flatShading: true });
            
            const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), boneMat);
            cranium.position.y = 0.8;
            cranium.scale.set(1, 1.1, 1);
            skull.add(cranium);
            
            const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), boneMat);
            jaw.position.set(0, 0.2, 0.2);
            skull.add(jaw);
            
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), eyeMat);
            eye.position.set(-0.3, 0.8, 0.55);
            skull.add(eye);
            const eye2 = eye.clone();
            eye2.position.x = 0.3;
            skull.add(eye2);
            
            return skull;
        };

        // Add Skull
        const skull = createSkull();
        // Move skull closer and scale up for impact
        skull.position.set(-20, this.getTerrainHeight(-20, 5) + 3.2, 5);
        skull.rotation.set(-0.2, Math.PI / 4, 0);
        skull.scale.set(1.5, 1.5, 1.5);
        
        const skullCopy = skull.clone();
        skullCopy.position.x += 160;
        this.groundGroup.add(skull, skullCopy);

        // Add Giant Camera body
        const cameraGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 2), new THREE.MeshStandardMaterial({ color: '#333' }));
        body.position.y = 1.25;
        cameraGroup.add(body);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12), new THREE.MeshStandardMaterial({ color: '#222' }));
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 1.25, 1.25);
        cameraGroup.add(lens);
        
        cameraGroup.position.set(25, this.getTerrainHeight(25, -5.5) + 3.0, -5.5);
        cameraGroup.rotation.y = -Math.PI / 6;
        
        const camCopy = cameraGroup.clone();
        camCopy.position.x += 160;
        this.groundGroup.add(cameraGroup, camCopy);
    }

    setupFuelStation() {
        const createStation = () => {
            const group = new THREE.Group();
            
            // 1. Concrete Platform (Slab)
            const platformGeo = new THREE.BoxGeometry(10, 0.4, 6);
            const platformMat = new THREE.MeshStandardMaterial({ color: '#555' });
            const platform = new THREE.Mesh(platformGeo, platformMat);
            platform.receiveShadow = true;
            group.add(platform);

            // 2. Main Building
            const buildingGeo = new THREE.BoxGeometry(5, 4, 3.5);
            const buildingMat = new THREE.MeshStandardMaterial({ color: '#2c3e50', flatShading: true });
            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.position.set(-2, 2, -1);
            building.castShadow = true;
            group.add(building);

            // 3. Large Window (Glowing at night)
            const windowGeo = new THREE.PlaneGeometry(2.5, 1.8);
            const windowMat = new THREE.MeshStandardMaterial({ 
                color: '#f1c40f', 
                emissive: '#f1c40f', 
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const win = new THREE.Mesh(windowGeo, windowMat);
            win.position.set(-1.8, 2.2, 0.76);
            group.add(win);

            // 4. Fuel Pumps
            const createPump = (x) => {
                const pumpGroup = new THREE.Group();
                const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.6), new THREE.MeshStandardMaterial({ color: '#e74c3c' }));
                pBody.position.y = 0.9;
                pumpGroup.add(pBody);
                
                const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ color: '#00ff00' }));
                pScreen.position.set(0, 1.3, 0.31);
                pumpGroup.add(pScreen);
                
                pumpGroup.position.set(x, 0.2, 1.5);
                return pumpGroup;
            };
            group.add(createPump(1.5), createPump(3.5));

            // 5. Roof Overhang
            const roofGeo = new THREE.BoxGeometry(10.5, 0.3, 7);
            const roof = new THREE.Mesh(roofGeo, buildingMat);
            roof.position.set(0, 4.2, 0.5);
            group.add(roof);

            // 6. Vertical Neon Pole
            const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 7);
            const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: '#333' }));
            pole.position.set(4, 3.5, 2.5);
            group.add(pole);

            const signGeo = new THREE.BoxGeometry(2, 1.2, 0.2);
            const signMat = new THREE.MeshStandardMaterial({ 
                color: '#e67e22', 
                emissive: '#e67e22', 
                emissiveIntensity: 2 
            });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(4, 6, 2.5);
            
            // Add "Glutisify" text to station sign
            const sCanvas = document.createElement('canvas');
            sCanvas.width = 256;
            sCanvas.height = 128;
            const sCtx = sCanvas.getContext('2d');
            sCtx.fillStyle = '#e67e22';
            sCtx.fillRect(0, 0, 256, 128);
            sCtx.fillStyle = '#ffffff';
            sCtx.font = 'bold 40px Outfit';
            sCtx.textAlign = 'center';
            sCtx.textBaseline = 'middle';
            sCtx.fillText("Glutisify", 128, 64);
            const sTexture = new THREE.CanvasTexture(sCanvas);
            const sLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), new THREE.MeshBasicMaterial({ map: sTexture, transparent: true }));
            sLabel.position.z = 0.11;
            sign.add(sLabel);
            
            group.add(sign);

            // Light from the station
            const light = new THREE.PointLight('#f1c40f', 5, 20);
            light.position.set(0, 3, 3);
            group.add(light);

            return group;
        };

        const station = createStation();
        const x = -75;
        const z = -6.0; // Pushed right up against the road edge (road is ~3 wide)
        station.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
        
        const copy = station.clone();
        copy.position.x += 160;
        this.groundGroup.add(station, copy);
    }

    setupPowerLines() {
        const createPole = () => {
            const group = new THREE.Group();
            const poleMat = new THREE.MeshStandardMaterial({ color: '#3d2b1f' });
            
            // Main Pole
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 8), poleMat);
            pole.position.y = 4;
            group.add(pole);
            
            // Crossbeams
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.2), poleMat);
            beam.position.y = 7;
            group.add(beam);
            
            const beam2 = beam.clone();
            beam2.position.y = 6;
            group.add(beam2);
            
            return group;
        };

        for(let i = 0; i < 8; i++) {
            const pole = createPole();
            const x = (i * 20) - 80;
            const z = -5.5; // Always on the same side for cable logic feel
            pole.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            
            const copy = pole.clone();
            copy.position.x += 160;
            this.groundGroup.add(pole, copy);
        }
    }

    setupSmallDetails() {
        const createMailbox = () => {
            const group = new THREE.Group();
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: '#444' }));
            post.position.y = 0.6;
            group.add(post);
            
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
            box.position.y = 1.3;
            group.add(box);
            
            return group;
        };

        const details = [
            { type: 'mailbox', x: -10, z: 4 },
            { type: 'mailbox', x: 55, z: -4.5 },
            { type: 'barrel', x: -50, z: -4.2 },
            { type: 'barrel', x: -52, z: -3.8 }
        ];

        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ color: '#7f8c8d' });

        details.forEach(d => {
            let obj;
            if (d.type === 'mailbox') {
                obj = createMailbox();
                if (d.z < 0) obj.rotation.y = Math.PI;
            } else {
                obj = new THREE.Mesh(barrelGeo, barrelMat);
                obj.position.y = 0.6;
            }
            
            obj.position.set(d.x, this.getTerrainHeight(d.x, d.z) + 3.5, d.z);
            
            const copy = obj.clone();
            copy.position.x += 160;
            this.groundGroup.add(obj, copy);
        });
    }

    // ═══════════════════════════════════════════════
    //  👤 NGƯỜI VEN ĐƯỜNG (Mô hình 3D)
    // ═══════════════════════════════════════════════
    setupPedestrians() {
        if (this.pedestriansGroup) this.groundGroup.remove(this.pedestriansGroup);
        if (this.pedestrians) {
            this.pedestrians.forEach(p => {
                if (p.mixer) {
                    const idx = this.mixers.indexOf(p.mixer);
                    if (idx > -1) this.mixers.splice(idx, 1);
                }
            });
        }
        this.pedestrians = [];
        this.pedestriansGroup = new THREE.Group();
        this.groundGroup.add(this.pedestriansGroup);

        const loader = new GLTFLoader();
        const gltfModels = ['/assets/models/soldier.glb', '/assets/models/robot.glb'];
        
        // Tạo 15 nhân vật ngẫu nhiên
        for (let i = 0; i < 15; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = (Math.random() - 0.5) * 120;
            const z = side * (Math.random() * 5 + 6);
            
            // Tỷ lệ: 30% Soldier, 30% Robot, 20% Lạc đà (procedural), 20% Người (procedural)
            const rand = Math.random();
            if (rand < 0.6) {
                const modelPath = gltfModels[rand < 0.3 ? 0 : 1];
                loader.load(modelPath, (gltf) => {
                    const model = gltf.scene;
                    const isSoldier = modelPath.includes('soldier');
                    const scale = isSoldier ? 1.0 : 0.4;
                    model.scale.set(scale, scale, scale);
                    model.position.set(x, 0, z);
                    
                    const mixer = new THREE.AnimationMixer(model);
                    this.mixers.push(mixer);
                    const animName = Math.random() > 0.3 ? 'Walk' : 'Idle';
                    const clip = gltf.animations.find(a => a.name.includes(animName)) || gltf.animations[0];
                    mixer.clipAction(clip).play();
                    
                    let speed = (animName === 'Idle') ? 0 : (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
                    model.rotation.y = speed > 0 ? 0 : Math.PI;

                    this.pedestrians.push({ mesh: model, mixer, speed, originZ: z, walkRange: 3 + Math.random() * 5 });
                    this.pedestriansGroup.add(model);
                    model.traverse(c => { if(c.isMesh) c.castShadow = true; });
                });
            } else if (rand < 0.8) {
                // Lạc đà (Procedural từ camel code)
                const camelData = this.createCamel(Math.random() > 0.8 ? 'BABY' : 'ADULT');
                const model = camelData.mesh;
                model.scale.set(0.6, 0.6, 0.6);
                model.position.set(x, 0, z);
                model.rotation.y = Math.PI / 2;
                
                this.pedestrians.push({
                    mesh: model,
                    isProcedural: true,
                    camelData: camelData,
                    speed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
                    originZ: z,
                    walkRange: 4 + Math.random() * 4,
                    phase: Math.random() * Math.PI * 2
                });
                this.pedestriansGroup.add(model);
                model.traverse(c => { if(c.isMesh) c.castShadow = true; });
            } else {
                // Người (Procedural - Hình khối như lúc đầu)
                const human = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.25), new THREE.MeshStandardMaterial({ color: '#5d4037' }));
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: '#8d6e63' }));
                head.position.y = 0.6;
                human.add(body, head);
                human.position.set(x, 1, z);
                
                this.pedestrians.push({
                    mesh: human,
                    isStylized: true,
                    speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
                    originZ: z,
                    walkRange: 3 + Math.random() * 5,
                    phase: Math.random() * Math.PI * 2
                });
                this.pedestriansGroup.add(human);
            }
        }
    }

    // ═══════════════════════════════════════════════
    //  🍂 HIỆU ỨNG 4 MÙA
    // ═══════════════════════════════════════════════
    setupSeasonalEffects() {
        // Tạo hệ thống hạt cho tuyết rơi (Winter)
        const count = 2000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count); // Tốc độ rơi

        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 160;
            pos[i*3 + 1] = Math.random() * 40;
            pos[i*3 + 2] = (Math.random() - 0.5) * 80;
            vel[i] = 0.05 + Math.random() * 0.1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.seasonParticleVel = vel;

        this.seasonParticleMat = new THREE.PointsMaterial({
            color: '#ffffff',
            size: 0.15,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.seasonParticles = new THREE.Points(geo, this.seasonParticleMat);
        this.scene.add(this.seasonParticles);
    }

    applySeasonTheme(seasonIndex) {
        const season = this.config.seasons[seasonIndex];
        if (!season) return;

        // Tuyết rơi vào mùa đông (index 3)
        const isWinter = (season.name.toLowerCase().includes('đông') || seasonIndex === 3);
        if (this.seasonParticleMat) {
            gsap.to(this.seasonParticleMat, { opacity: isWinter ? 0.8 : 0, duration: 3.0 });
        }

        // Cập nhật màu cây cỏ
        const vegColor = new THREE.Color(season.vegetationColor);
        [this.cactiGroup, this.bushesGroup, this.assetsGroup, this.oasisGroup].forEach(group => {
            if (group) {
                group.traverse(c => {
                    if (c.isMesh && c.material && c.material.color) {
                        gsap.to(c.material.color, { r: vegColor.r, g: vegColor.g, b: vegColor.b, duration: 3.0 });
                    }
                });
            }
        });

        // Cập nhật nhãn mùa trên UI
        const seasonEl = document.getElementById('season-label');
        if (seasonEl) {
            seasonEl.textContent = `${this.getBiomeName(this.currentBiomeIndex)} - ${season.name}`;
            seasonEl.style.color = season.particleColor;
        }
    }

    getBiomeName(index) {
        const names = ['Sa mạc', 'Thành phố', 'Vùng sông nước'];
        return names[index % 3];
    }

    applyBiomeTheme(biomeIndex) {
        this.currentBiomeIndex = biomeIndex;
        const type = biomeIndex % 3;
        
        let groundHue, fogColor, skyColor;
        
        if (type === 0) { // Desert
            groundHue = '#d2b48c';
            fogColor = '#ff9a5c';
            skyColor = '#ff9a5c';
            if (this.cactiGroup) this.cactiGroup.visible = true;
            if (this.bushesGroup) this.bushesGroup.visible = false;
            if (this.cityGroup) this.cityGroup.visible = false;
            if (this.oasisGroup) this.oasisGroup.visible = false;
        } else if (type === 1) { // City (Industrial/Dark)
            groundHue = '#333333'; // Nhựa đường
            fogColor = '#111111';
            skyColor = '#222222';
            if (this.cactiGroup) this.cactiGroup.visible = false;
            if (this.bushesGroup) this.bushesGroup.visible = true;
            if (this.cityGroup) this.cityGroup.visible = true;
            if (this.oasisGroup) this.oasisGroup.visible = false;
        } else { // Oasis / Green River
            groundHue = '#1b5e20'; // Xanh đậm
            fogColor = '#81c784';
            skyColor = '#4fc3f7';
            if (this.cactiGroup) this.cactiGroup.visible = false;
            if (this.bushesGroup) this.bushesGroup.visible = true;
            if (this.cityGroup) this.cityGroup.visible = false;
            if (this.oasisGroup) this.oasisGroup.visible = true;
        }

        // Smoothly transition environment colors
        const targetSky = new THREE.Color(skyColor);
        const targetFog = new THREE.Color(fogColor);
        const targetGround = new THREE.Color(groundHue);
        
        gsap.to(this.scene.background, { r: targetSky.r, g: targetSky.g, b: targetSky.b, duration: 5 });
        gsap.to(this.scene.fog.color, { r: targetFog.r, g: targetFog.g, b: targetFog.b, duration: 5 });
        
        if (this.ground1 && this.ground1.material) {
            gsap.to(this.ground1.material.color, { r: targetGround.r, g: targetGround.g, b: targetGround.b, duration: 5 });
        }
        
        // Re-setup pedestrians for the new area
        this.setupPedestrians();
    }

    setupMusic() {
        this.musicPlaying = false;
        this.playerReady = false;
        const toggleBtn = document.getElementById('music-toggle');
        
        window.onYouTubeIframeAPIReady = () => {
            this.player = new YT.Player('youtube-player', {
                height: '0',
                width: '0',
                videoId: 's76BtB81Oms',
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'loop': 1,
                    'playlist': 's76BtB81Oms'
                },
                events: {
                    'onReady': () => {
                        this.playerReady = true;
                        this.player.playVideo();
                        setTimeout(() => {
                            if (this.player.getPlayerState() === 1) {
                                this.musicPlaying = true;
                                if (toggleBtn) toggleBtn.classList.add('playing');
                            }
                        }, 1000);
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.ENDED) this.player.playVideo();
                    }
                }
            });
        };

        if (!document.getElementById('yt-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-api-script';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else if (window.YT && window.YT.Player) {
            window.onYouTubeIframeAPIReady();
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (!this.playerReady) return;
                if (this.musicPlaying) {
                    this.player.pauseVideo();
                    toggleBtn.classList.remove('playing');
                } else {
                    this.player.playVideo();
                    toggleBtn.classList.add('playing');
                }
                this.musicPlaying = !this.musicPlaying;
            });
        }
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('wheel', (event) => {
            // Reduced sensitivity to make the map longer
            const sensitivity = 0.0001; 
            this.targetScrollProgress += event.deltaY * sensitivity;
            
            // Only update the UI/Text, do NOT animate or snap the scrollProgress
            this.syncPartToProgress();
        });

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('click', () => {
            if (this.hoveredObject) {
                // Click vào nhân vật -> Hiện menu chọn xe
                this.showVehicleMenu();
            } else {
                // Click vào vị trí trống -> Nhảy lên
                if (this.jumpY === 0) {
                    this.jumpVelocity = 0.25;
                }
                
                // Nếu đang mở menu khác thì ẩn đi
                const menu = document.getElementById('vehicle-menu');
                if (menu && menu.classList.contains('visible')) {
                    menu.classList.remove('visible');
                }
            }
        });

        // UI Events
        const carCard = document.getElementById('car-card');
        const closeBtn = document.querySelector('.card-close');
        if (closeBtn && carCard) {
            closeBtn.addEventListener('click', () => {
                carCard.classList.remove('visible');
            });
        }
    }

    showVehicleMenu() {
        const menu = document.getElementById('vehicle-menu');
        if (menu) {
            menu.classList.add('visible');
        }
    }

    initVehicleMenu() {
        // Close button
        const closeBtn = document.querySelector('.menu-close');
        const menu = document.getElementById('vehicle-menu');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.remove('visible');
            });
        }

        // Vehicle Options
        const options = document.querySelectorAll('.v-opt');
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                options.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                const type = opt.getAttribute('data-type');
                this.switchVehicle(type);
            });
        });

        // Auto Drive Toggle
        const autoToggle = document.getElementById('auto-drive-toggle');
        if (autoToggle) {
            autoToggle.addEventListener('change', (e) => {
                this.isAutoDriving = e.target.checked;
            });
        }

        // Speed Slider
        const speedSlider = document.getElementById('auto-speed-slider');
        const speedValLabel = document.getElementById('speed-value');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.autoSpeed = parseFloat(e.target.value);
                speedValLabel.textContent = this.autoSpeed.toFixed(1);
            });
        }
    }

    switchVehicle(type) {
        if (this.playerType === type) return;
        this.playerType = type;
        
        switch(type) {
            case 'car': this.setupCar(); break;
            case 'bike': this.setupBike(); break;
            case 'plane': this.setupPlane(); break;
            case 'runner': this.setupRunner(); break;
            case 'chicken': this.setupChicken(); break;
        }
        
        // Visual feedback
        gsap.from(this.playerGroup.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
    }

    showCarCard() {
        // Disabled as per user request to remove all screen text
        return;
        /*
        const card = document.getElementById('car-card');
        if (card) {
            card.classList.add('visible');
            setTimeout(() => {
                card.classList.remove('visible');
            }, 5000);
        }
        */
    }

    syncPartToProgress() {
        const numParts = this.config.parts.length; // 6
        const total = this.config.settings.totalCycle; // 6.0
        const progress = this.targetScrollProgress % total;
        const normalized = progress < 0 ? total + progress : progress;
        
        // Mỗi giai đoạn chiếm 1.0 đơn vị scroll
        const bestIndex = Math.min(Math.floor(normalized), numParts - 1);

        if (bestIndex !== this.currentPartIndex) {
            this.goToPart(bestIndex);
        }

        // Cập nhật mùa: mỗi 10.0 chu kỳ thay đổi một mùa (kéo dài map cực độ)
        const seasonIndex = Math.floor(this.targetScrollProgress / 10.0) % 4;
        if (seasonIndex !== this.currentSeasonIndex) {
            this.currentPartIndex = -1; // Force label update
            this.currentSeasonIndex = seasonIndex;
            this.applySeasonTheme(seasonIndex);
        }

        // Cập nhật Biome: mỗi 40.0 chu kỳ (hết 4 mùa) đổi một vùng cảnh quan
        const biomeIndex = Math.floor(this.targetScrollProgress / 40.0);
        if (biomeIndex !== this.currentBiomeIndex) {
            this.applyBiomeTheme(biomeIndex);
        }
    }

    update() {
        const elapsedTime = performance.now() * 0.001;

        // Calculate scroll velocity
        const diff = (this.targetScrollProgress - this.scrollProgress);
        const velocity = diff * 0.08;
        this.scrollProgress += velocity;

        // --- Animate Seasonal Particles (Snow) ---
        if (this.seasonParticles && this.seasonParticleMat && this.seasonParticleMat.opacity > 0) {
            const positions = this.seasonParticles.geometry.attributes.position.array;
            for(let i=0; i<this.seasonParticleVel.length; i++) {
                positions[i*3 + 1] -= this.seasonParticleVel[i];
                if (positions[i*3 + 1] < 0) positions[i*3 + 1] = 40;
            }
            this.seasonParticles.geometry.attributes.position.needsUpdate = true;
        }

        // --- Animate the Ground ---
        if (this.groundGroup) {
            // Move ground left as car goes right (opposite of scroll velocity)
            let groundX = this.groundGroup.position.x;
            groundX -= velocity * 60; // 60 is the world parallax speed for background
            
            // Endless loop wrap logic (width = 160)
            groundX = groundX % 160;
            if (groundX > 0) groundX -= 160;
            
            this.groundGroup.position.x = groundX;
        }

        // --- Animate the Clouds ---
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                cloud.position.x -= cloud.userData.speed;
                // Subtle floating motion
                cloud.position.y += Math.sin(elapsedTime * 0.5 + cloud.position.x) * 0.005;
                
                // Wrap around when moving off screen to the left
                if (cloud.position.x < -60) {
                    cloud.position.x = 60;
                }
            });
        }

        // --- Animate the Celestial Body (Cinematic Arc) ---
        // 6 giai đoạn × 1.0 đơn vị mỗi giai đoạn = 6.0 tổng
        // dawn(0), morning(1), noon(2), afternoon(3), night(4), predawn(5)
        if (this.celestialBody) {
            const totalRange = this.config.settings.totalCycle; // 6.0
            const progress   = this.scrollProgress % totalRange;
            const normalized = progress < 0 ? totalRange + progress : progress;

            // Giai đoạn hiện tại (0-5) và vị trí trong giai đoạn (0-1)
            const stageIndex  = Math.min(Math.floor(normalized), 5);
            const stageLocal  = normalized - stageIndex; // 0..1 bên trong giai đoạn

            const currentPart = this.config.parts[stageIndex];
            const celestialData = currentPart?.theme?.celestial;

            // Mặt trời xuất hiện giai đoạn 0-3, Mặt trăng giai đoạn 4-5
            const isNightStage = (stageIndex === 4 || stageIndex === 5);

            if (this.sunGroup)  this.sunGroup.visible  = !isNightStage;
            if (this.moonGroup) this.moonGroup.visible = isNightStage;

            this.celestialBody.visible = true;

            // Vị trí cung theo giai đoạn:
            //   - Bình minh (0): mặt trời mọc phía đông thấp → giữa trời
            //   - Sáng (1): giữa trời → hơi nghiêng
            //   - Trưa (2): đỉnh cao nhất
            //   - Chiều (3): hơi nghiêng → lặn phía tây
            //   - Đêm (4): mặt trăng mọc, cung ngang bầu trời
            //   - Rạng sáng (5): mặt trăng lặn dần

            // arc từ trái sang phải: x từ -130 → +170 (span 300)
            // Với 6 giai đoạn, mỗi giai đoạn chiếm 1/6 cung
            const totalSpan = 300;
            const stageWidth = totalSpan / 6;

            const xStart = -130 + stageIndex * stageWidth;
            const xCur   = xStart + stageLocal * stageWidth;

            // chiều cao cung: sin theo toàn bộ hành trình
            const globalProgress = (stageIndex + stageLocal) / 6; // 0..1 toàn chu kỳ
            
            let yOffset = 0;
            if (!isNightStage) {
                // Mặt trời: arc sin nửa đầu (0..0.66)
                const sunT = globalProgress / 0.667;
                yOffset = Math.sin(Math.min(sunT, 1) * Math.PI) * 50;
            } else {
                // Mặt trăng: arc sin nửa sau (0.67..1)
                const moonT = (globalProgress - 0.667) / 0.333;
                yOffset = Math.sin(Math.min(moonT, 1) * Math.PI) * 40;
            }

            const basePosZ  = celestialData?.pos?.z ?? -60;
            const baseY     = celestialData?.pos?.y ?? 4;

            this.celestialBody.position.x = xCur;
            this.celestialBody.position.y = baseY + yOffset;
            this.celestialBody.position.z = basePosZ;

            // Update God Rays position to match Sun
            if (this.rayGroup) {
                this.rayGroup.position.copy(this.celestialBody.position);
                this.rayGroup.visible = (!isNightStage && stageIndex > 0 && stageIndex < 4);
                this.rayGroup.rotation.y += 0.005;
            }

            // Stars Twinkle & Milky Way drift
            if (this.starsMat && this.starsMat.opacity > 0) {
                this.starsMat.size = 0.08 + Math.sin(elapsedTime * 3) * 0.02;
                
                // Shooting stars logic
                this.shootingStars.forEach(ss => {
                    if (ss.active) {
                        ss.mesh.position.add(ss.velocity);
                        ss.life -= 0.015; // Speed of fading
                        
                        // Fade in and out
                        if (ss.life > 0.8) {
                            ss.mesh.material.opacity = (1 - ss.life) * 5; 
                        } else if (ss.life < 0.2) {
                            ss.mesh.material.opacity = ss.life * 5;
                        } else {
                            ss.mesh.material.opacity = 1;
                        }
                        
                        if (ss.life <= 0) ss.active = false;
                        
                    } else {
                        // Randomly spawn new shooting star (only if night)
                        if (Math.random() < 0.003) { // Rare spawn rate
                            ss.active = true;
                            ss.life = 1.0;
                            
                            // Random start position high in the sky
                            ss.mesh.position.set(
                                (Math.random() - 0.5) * 120, // Wide spawn map
                                25 + Math.random() * 20,
                                -30 - Math.random() * 30
                            );
                            
                            // Velocity vector (falling diagonally)
                            ss.velocity.set(
                                -0.5 - Math.random() * 0.8, // Move left very fast
                                -0.3 - Math.random() * 0.4, // Moving down
                                (Math.random() - 0.5) * 0.4 // Slight Z curve
                            );
                            
                            // Scale length of the mesh depending on total speed
                            const speed = ss.velocity.length();
                            ss.mesh.scale.set(1, 1, speed * 2);

                            // Align cylinder to velocity 
                            ss.mesh.lookAt(
                                ss.mesh.position.x + ss.velocity.x,
                                ss.mesh.position.y + ss.velocity.y,
                                ss.mesh.position.z + ss.velocity.z
                            );
                        }
                    }
                });
            } else {
                // If daytime, force hide any lingering shooting stars
                if (this.shootingStars) {
                    this.shootingStars.forEach(ss => {
                        ss.mesh.material.opacity = 0;
                        ss.active = false;
                    });
                }
            }
        }

        // --- Animate Milky Way ---
        if (this.milkyWay) {
            this.milkyWay.rotation.y = elapsedTime * 0.02;
            if (this.mwMat && this.starsMat && this.starsMat.opacity > 0) {
                 this.milkyWay.rotation.z = Math.sin(elapsedTime * 0.1) * 0.02;
            }
        }
        if (this.galaxyCoreLight && (this.currentPartIndex === 4 || this.currentPartIndex === 5)) {
            // Pulse the intensity at night
            const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.2;
            this.galaxyCoreLight.intensity = 10 * pulse;
        }

        // --- Animate Extra Elements ---
        this.paperPlanes.forEach(plane => {
            plane.position.x -= plane.userData.speed;
            
            // Banking / Wobble animation (sliding through air)
            plane.rotation.z = Math.sin(elapsedTime * 2 + plane.userData.phase) * 0.2;
            plane.rotation.y = Math.PI + Math.sin(elapsedTime * 1 + plane.userData.phase) * 0.1;
            
            // Subtle height variation
            plane.position.y += Math.sin(elapsedTime * 1.5 + plane.userData.phase) * 0.005;

            if (plane.position.x < -60) plane.position.x = 60;
        });

        this.balloons.forEach(balloon => {
            balloon.position.y += Math.sin(elapsedTime * 0.5) * 0.01;
            balloon.rotation.z = Math.sin(elapsedTime * 0.3) * 0.05;
        });

        // --- Animate the Cacti (Wobble only) ---
        this.cacti.forEach((cactus, index) => {
            // Subtle wind sway (based on index for variety)
            cactus.rotation.x = Math.sin(elapsedTime * 1.5 + index) * 0.03;
            cactus.rotation.z = Math.cos(elapsedTime * 1.8 + index) * 0.03;
        });

        // --- Animate Tumbleweeds ---
        this.tumbles.forEach(t => {
            t.rotation.z -= t.userData.rollSpeed * 0.05;
            t.rotation.x += t.userData.rollSpeed * 0.02;

            // Move across the road (Z axis)
            t.position.z += t.userData.zSpeed;
            
            // Wrap Z position so they stay within visibility
            if (t.position.z > t.userData.zRange) t.position.z = -t.userData.zRange;
            if (t.position.z < -t.userData.zRange) t.position.z = t.userData.zRange;

            // Bouncing motion
            const bounce = Math.abs(Math.sin(elapsedTime * t.userData.rollSpeed + t.userData.phase)) * t.userData.bounceHeight;
            // Recalculate Y based on new X and Z
            t.position.y = this.getTerrainHeight(t.position.x, t.position.z) + 3.5 + 0.6 + bounce;
        });

        // --- Animate Beetles ---
        this.beetles.forEach(b => {
            b.position.z += b.userData.zSpeed;
            if (b.position.z > 15) b.position.z = -15;
            if (b.position.z < -15) b.position.z = 15;
            b.position.y = this.getTerrainHeight(b.position.x, b.position.z) + 3.5 + 0.1;
            // Wobble beetle
            b.children[0].position.y = Math.sin(elapsedTime * 10 + b.userData.phase) * 0.05;
            // Roll ball
            b.children[1].rotation.x += 0.1;
        });

        // --- Animate Pedestrians (Người ven đường) ---
        if (this.pedestrians) {
            this.pedestrians.forEach((p) => {
                if (!p.mesh) return;
                
                if (p.isProcedural && p.camelData) {
                    // Cử động Lạc đà procedural
                    const { mesh, legs, neckGroup, phase } = p.camelData;
                    const walkT = elapsedTime * 2.0 + p.phase;
                    mesh.position.y = Math.sin(walkT) * 0.1;
                    neckGroup.rotation.z = Math.sin(walkT) * 0.05;
                    legs.forEach((leg, i) => {
                        const offset = (i % 2 === 0) ? 0 : Math.PI;
                        leg.rotation.z = Math.sin(walkT + offset) * 0.2;
                    });
                }

                if (p.isProcedural && p.camelData) {
                    // Cử động Lạc đà procedural
                    const { mesh, legs, neckGroup } = p.camelData;
                    const walkT = elapsedTime * 2.0 + p.phase;
                    mesh.position.y = Math.sin(walkT) * 0.1;
                    neckGroup.rotation.z = Math.sin(walkT) * 0.05;
                    legs.forEach((leg, i) => {
                        const offset = (i % 2 === 0) ? 0 : Math.PI;
                        leg.rotation.z = Math.sin(walkT + offset) * 0.2;
                    });
                } else if (p.isStylized) {
                    // Hình khối nhảy nhót
                    const t = elapsedTime * 5 + p.phase;
                    p.mesh.position.y = 1 + Math.abs(Math.sin(t)) * 0.2;
                    p.mesh.rotation.z = Math.sin(t) * 0.1;
                }

                // Di chuyển vị trí
                if (Math.abs(p.mesh.position.z - p.originZ) > p.walkRange) {
                    p.speed *= -1;
                    if (p.isProcedural || p.isStylized) {
                        p.mesh.rotation.y += Math.PI;
                    } else {
                        p.mesh.rotation.y = p.speed > 0 ? Math.PI : 0;
                    }
                }
                p.mesh.position.z += p.speed;
            });
        }

        // --- Animate Seasonal Particles ---
        if (this.seasonParticles && this.seasonParticleMat && this.seasonParticleMat.opacity > 0.01) {
            const pos = this.seasonParticles.geometry.attributes.position;
            for (let i = 0; i < this.seasonParticleCount; i++) {
                const v = this.seasonParticleVelocities[i];
                pos.setX(i, pos.getX(i) + v.x);
                let py = pos.getY(i) + v.y;
                if (py < -5) py = 25 + Math.random() * 5;
                pos.setY(i, py);
                pos.setZ(i, pos.getZ(i) + v.z);
            }
            pos.needsUpdate = true;
        }

        // --- Animate the Player (Car/Bike/Human/etc.) ---
        if (this.playerGroup) {
            // Auto driving logic - Slower for longer experience
            if (this.isAutoDriving) {
                this.targetScrollProgress += 0.003 * this.autoSpeed;
                this.syncPartToProgress();
            }

            // Wheels spin proportional to speed (only if wheels exist)
            const wheelSpinSpeed = velocity * 150;
            this.playerWheels.forEach(wheel => {
                wheel.rotation.z -= wheelSpinSpeed;
            });
            
            // Suspension: player body slightly bounces based on speed
            const speedFact = Math.abs(velocity);
            const bounce = Math.abs(Math.sin(elapsedTime * 15)) * speedFact * 1.2;
            
            // Jump physics
            this.jumpVelocity -= 0.01;
            this.jumpY += this.jumpVelocity;
            if (this.jumpY < 0) {
                this.jumpY = 0;
                this.jumpVelocity = 0;
            }

            if (this.playerModel) {
                // Determine vertical offset based on type
                if (this.playerType === 'chicken') {
                    // Flying flamingo: constant height + subtle hover wing flap motion
                    const hover = Math.sin(elapsedTime * 3) * 0.3;
                    this.playerModel.position.y = (this.playerModel.userData.baseY || 2.5) + hover + this.jumpY;
                } else if (this.playerType === 'plane') {
                    // Plane flying height (Original low height)
                    const hover = Math.sin(elapsedTime * 3) * 0.2;
                    this.playerModel.position.y = 1.0 + hover + this.jumpY;
                } else {
                    // Ground vehicles (car/bike/runner)
                    this.playerModel.position.y = bounce + this.jumpY;
                }
                
                // Bike leaning
                if (this.playerType === 'bike') {
                    this.playerModel.rotation.z = Math.sin(elapsedTime * 2) * 0.03 + velocity * 2;
                }
            }

            // Chassis tilts backwards on acceleration, forwards on deceleration
            const targetTilt = velocity * 10; 
            this.playerGroup.rotation.z += (targetTilt - this.playerGroup.rotation.z) * 0.1;
        }

        // Advance Mixer animations (car smoke, camel walk, etc.)
        this.mixers.forEach(mixer => {
            mixer.update(1/60);
        });

        // Spin Airplane Propeller
        if (this.playerType === 'plane' && this.propeller) {
            this.propeller.rotation.x += 0.3 + Math.abs(velocity) * 5;
            // Float effect already handled above
            this.playerModel.rotation.z = Math.sin(elapsedTime * 2) * 0.05 + velocity * 5;
        }

        // (Assets section removed as we are using cacti)
        this.assets.length = 0; 

        // --- Handle Interaction (Raycasting) ---
        if (this.raycaster && this.mouse) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactableObjects);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                this.hoveredObject = object;
                document.body.style.cursor = 'pointer';
                
                // Simple Highlight: Change emissive on hover
                if (object.material && object.material.emissive) {
                    object.material.emissive.setHex(0x333333);
                    object.material.emissiveIntensity = 2.0;
                }
            } else {
                if (this.hoveredObject) {
                    // Reset Highlight
                    if (this.hoveredObject.material && this.hoveredObject.material.emissive) {
                        this.hoveredObject.material.emissive.setHex(0x000000);
                        this.hoveredObject.material.emissiveIntensity = 1.0;
                    }
                }
                this.hoveredObject = null;
                document.body.style.cursor = 'default';
            }
        }

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.update());
    }
}
