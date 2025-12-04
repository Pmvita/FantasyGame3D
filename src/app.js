// Main game application
import * as THREE from 'three';
import { Character } from './character.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { Minimap } from './minimap.js';

class FantasyGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.world = null;
        this.controls = null;
        this.ui = null;
        this.minimap = null;
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 0, 1000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.layers.disable(1); // Disable minimap layer for main camera
        this.scene.userData.mainCamera = this.camera; // Store for minimap

        // Create renderer
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Initialize UI
        this.ui = new UI(this);
        this.ui.showMainMenu();

        // Initialize world (but don't show until game starts)
        this.world = new World(this.scene);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }

    async startGame(characterData) {
        // Hide menus
        this.ui.hideAllMenus();
        this.ui.showHUD();

        // Create character (will load model if available)
        this.character = new Character(this.scene, characterData);
        
        // Wait for character to be ready
        const isReady = await this.character.waitForReady();
        
        if (!isReady || !this.character.mesh) {
            console.error('Failed to create character mesh');
            alert('Failed to load character. Please try again.');
            this.ui.showMainMenu();
            return;
        }
        
        // Set up camera to follow character (will be positioned by controls)
        const charPos = this.character.mesh.position.clone();
        // Ensure valid position (fallback to origin if invalid)
        if (!isFinite(charPos.x) || !isFinite(charPos.y) || !isFinite(charPos.z)) {
            charPos.set(0, 0, 0);
        }
        
        // Initialize camera position (will be updated by controls in next frame)
        this.camera.position.set(
            charPos.x,
            charPos.y + 5,
            charPos.z + 10
        );
        
        console.log('Game started - Character position:', charPos);

        // Initialize controls
        this.controls = new Controls(this.character, this.camera, this.scene);

        // Setup ripple animation on canvas click
        this.setupRippleEffect();

        // Setup hover detection for interactive objects
        this.setupHoverDetection();

        // Setup click-to-move
        this.setupClickToMove();

        // Update HUD
        this.ui.updateHUD(characterData);

        // Initialize minimap
        this.minimap = new Minimap(this.scene, this.character, this.world);

        // Start game loop
        this.animate();
    }

    setupRippleEffect() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        canvas.addEventListener('click', (e) => {
            // Only create ripple if clicking directly on canvas (not UI elements)
            if (e.target === canvas) {
                this.createRipple(e, canvas);
            }
        });

        // Also handle touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            if (e.target === canvas) {
                e.preventDefault();
                const touch = e.touches[0];
                const fakeEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: canvas
                };
                this.createRipple(fakeEvent, canvas);
            }
        }, { passive: false });
    }

    createRipple(event, canvas) {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;

        const rect = gameContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.position = 'absolute';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.marginLeft = '-10px';
        ripple.style.marginTop = '-10px';
        ripple.style.pointerEvents = 'none';

        gameContainer.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentElement) {
                ripple.remove();
            }
        }, 600);
    }

    setupHoverDetection() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredObject = null;

        const checkHover = (e) => {
            // Only check if game is active (character exists)
            if (!this.character || !this.character.mesh) return;

            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Update raycaster
            raycaster.setFromCamera(mouse, this.camera);

            // Find intersected objects
            const intersects = raycaster.intersectObjects(this.scene.children, true);

            // Check if we're hovering over an interactive object
            let foundInteractive = false;
            for (let i = 0; i < intersects.length; i++) {
                let object = intersects[i].object;
                
                // Check if object or any parent is marked as interactive
                while (object) {
                    if (object.userData && object.userData.interactive) {
                        foundInteractive = true;
                        if (hoveredObject !== object) {
                            hoveredObject = object;
                            canvas.style.cursor = 'pointer';
                        }
                        break;
                    }
                    object = object.parent;
                }
                
                if (foundInteractive) break;
            }

            if (!foundInteractive) {
                hoveredObject = null;
                // Default cursor when hovering over canvas
                if (e.target === canvas) {
                    canvas.style.cursor = 'crosshair';
                }
            }
        };

        canvas.addEventListener('mousemove', checkHover);

        // Reset cursor when mouse leaves canvas
        canvas.addEventListener('mouseleave', () => {
            canvas.style.cursor = 'default';
            hoveredObject = null;
        });
    }

    setupClickToMove() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Ground plane at y=0
        
        // Double-tap detection
        let lastClickTime = 0;
        let lastClickPosition = null;
        const doubleTapDelay = 300; // milliseconds
        const doubleTapDistance = 50; // pixels

        const handleClick = (e, isDoubleTap = false) => {
            // Only handle clicks if game is active and character exists
            if (!this.character || !this.character.mesh) return;
            
            // Don't move if clicking on UI elements
            if (e.target !== canvas) return;

            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Update raycaster
            raycaster.setFromCamera(mouse, this.camera);

            // Find intersection with ground plane
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersectPoint);

            // Move character to clicked position
            if (intersectPoint) {
                // Check energy before allowing running
                let canRun = isDoubleTap;
                if (canRun && this.character.energy < this.character.minEnergyToRun) {
                    canRun = false;
                }
                this.character.moveTo(intersectPoint, canRun);
                
                // Create ripple effect at click position
                this.createRipple(e, canvas);
            }
        };

        // Mouse click with double-tap detection
        canvas.addEventListener('click', (e) => {
            const currentTime = Date.now();
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Check if this is a double-tap
            if (lastClickTime > 0 && 
                (currentTime - lastClickTime) < doubleTapDelay &&
                lastClickPosition &&
                Math.abs(clickX - lastClickPosition.x) < doubleTapDistance &&
                Math.abs(clickY - lastClickPosition.y) < doubleTapDistance) {
                // Double tap detected
                handleClick(e, true);
                lastClickTime = 0; // Reset to prevent triple-tap
            } else {
                // Single tap
                handleClick(e, false);
                lastClickTime = currentTime;
                lastClickPosition = { x: clickX, y: clickY };
            }
        });

        // Touch support for mobile with double-tap
        let lastTouchTime = 0;
        let lastTouchPosition = null;
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                const currentTime = Date.now();
                const touchX = touch.clientX;
                const touchY = touch.clientY;
                
                // Check if this is a double-tap
                const isDoubleTap = lastTouchTime > 0 && 
                    (currentTime - lastTouchTime) < doubleTapDelay &&
                    lastTouchPosition &&
                    Math.abs(touchX - lastTouchPosition.x) < doubleTapDistance &&
                    Math.abs(touchY - lastTouchPosition.y) < doubleTapDistance;
                
                const fakeEvent = {
                    clientX: touchX,
                    clientY: touchY,
                    target: canvas
                };
                
                handleClick(fakeEvent, isDoubleTap);
                
                if (isDoubleTap) {
                    lastTouchTime = 0;
                } else {
                    lastTouchTime = currentTime;
                    lastTouchPosition = { x: touchX, y: touchY };
                }
            }
        }, { passive: false });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update character
        if (this.character && this.character.mesh) {
            this.character.update(deltaTime);
        }

        // Update controls
        if (this.controls) {
            this.controls.update(deltaTime);
        }

        // Update camera to follow character (third-person camera)
        if (this.character && this.character.mesh && this.controls) {
            const charPos = this.character.mesh.position;
            const charRotation = this.character.mesh.rotation.y;
            
            // If character is moving to a target, rotate camera to face character's direction
            if (this.character.targetPosition) {
                // Smoothly rotate camera to match character's facing direction
                const targetCameraAngle = charRotation;
                let angleDiff = targetCameraAngle - this.controls.cameraAngleY;
                
                // Normalize angle difference to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // Smoothly rotate camera
                this.controls.cameraAngleY += angleDiff * 0.1;
            }
            
            // Calculate camera position using spherical coordinates
            // Horizontal distance based on pitch angle
            const horizontalDistance = Math.cos(this.controls.cameraAngleX) * this.controls.cameraDistance;
            const verticalOffset = Math.sin(this.controls.cameraAngleX) * this.controls.cameraDistance;
            
            // Calculate camera offset
            const cameraOffset = new THREE.Vector3(
                Math.sin(this.controls.cameraAngleY) * horizontalDistance,
                this.controls.cameraHeight + verticalOffset,
                Math.cos(this.controls.cameraAngleY) * horizontalDistance
            );
            
            const targetCameraPos = charPos.clone().add(cameraOffset);
            this.camera.position.lerp(targetCameraPos, 0.1);
            
            // Camera looks at character (slightly above ground level)
            const lookAtPos = charPos.clone();
            lookAtPos.y += 1; // Look at character's head/upper body
            this.camera.lookAt(lookAtPos);
        }

        // Update minimap
        if (this.minimap) {
            this.minimap.update();
        }

        // Update UI (energy display, etc.)
        if (this.ui && this.character) {
            this.ui.updateEnergyDisplay(this.character);
        }

        // Always render the scene (even if character isn't ready)
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new FantasyGame();
});

