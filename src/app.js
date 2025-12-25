// Main game application
import * as THREE from 'three';
import { Character } from './character.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { Minimap } from './minimap.js';

class Fantasy3D {
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
        // Set initial background to null (will be set to sky color when game starts)
        this.scene.background = null;
        // No fog initially (will be set when game starts)
        this.scene.fog = null;

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

        // Create renderer - NO alpha, show the actual 3D world
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            alpha: false  // Opaque renderer to show 3D world properly
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Clear to black (will be replaced by scene background or world)
        this.renderer.setClearColor(0x000000, 1); // Opaque black

        // Initialize UI
        this.ui = new UI(this);
        
        // Show landing page first - user will choose Sign Up or Sign In
        // Auto-login check will happen when user clicks Sign In (handled in UI)
        this.ui.showLandingPage();
        
        // Check for auto-login in background (if user was previously logged in, skip landing page)
        this.ui.checkAutoLogin().then((autoLoggedIn) => {
            if (autoLoggedIn) {
                console.log('Auto-login successful, skipping landing page');
                // Hide landing page and show main menu directly
                this.ui.hideLandingPage();
                // Main menu should already be visible from checkAutoLogin
            } else {
                console.log('No auto-login, showing landing page');
                // Landing page is already shown, user will choose Sign Up or Sign In
            }
        }).catch((error) => {
            console.error('Error during auto-login check:', error);
            // On error, keep landing page visible
        });

        // Initialize world (but don't show until game starts)
        this.world = new World(this.scene);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }

    async startGame(characterData) {
        // Log character selection to server (via console)
        const raceName = (characterData.race || 'human').charAt(0).toUpperCase() + (characterData.race || 'human').slice(1);
        const genderName = (characterData.gender || 'male').charAt(0).toUpperCase() + (characterData.gender || 'male').slice(1);
        const level = characterData.level || characterData.stats?.level || 1;
        
        console.log('\n⚔️  === CHARACTER SELECTED - GAME STARTING ===');
        console.log(`👤 Character Name: ${characterData.name || 'Unnamed'}`);
        console.log(`🏹 Race: ${raceName}`);
        console.log(`⚧️  Gender: ${genderName}`);
        console.log(`📊 Level: ${level}`);
        console.log(`❤️  Health: ${characterData.stats?.health || 100}/${characterData.stats?.maxHealth || 100}`);
        console.log(`⚔️  Strength: ${characterData.stats?.strength || 10}`);
        console.log(`✨ Magic: ${characterData.stats?.magic || 10}`);
        console.log(`💨 Speed: ${characterData.stats?.speed || 10}`);
        console.log('==========================================\n');
        
        // Also send to server for logging (if server endpoint exists)
        try {
            await fetch('/api/log/character-selected', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterName: characterData.name,
                    race: raceName,
                    gender: genderName,
                    level: level,
                    stats: characterData.stats
                })
            }).catch(() => {}); // Silently fail if endpoint doesn't exist
        } catch (e) {}
        
        // Remove landing page background - show the actual 3D world
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            // Add class to remove CSS background and show 3D scene
            gameContainer.classList.add('game-active');
            // Also set styles directly as backup
            gameContainer.style.backgroundImage = 'none';
            gameContainer.style.backgroundColor = 'transparent';
        }
        
        // Set a sky blue background color for the 3D world (fantasy sky)
        const skyColor = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.background = skyColor;
        
        // Renderer should be opaque - world objects will render on top
        this.renderer.setClearColor(skyColor, 1); // Sky blue background
        
        // Add subtle fog for depth (fantasy atmosphere) - very subtle
        this.scene.fog = new THREE.Fog(skyColor, 600, 1400); // Sky blue fog for depth, far away
        
        // Ensure world is fully loaded before continuing
        if (this.world) {
            // Wait for world creation to complete (max 5 seconds)
            let waitCount = 0;
            while (!this.world.worldCreated && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            if (this.world.worldCreated) {
                console.log('✅ World is ready!');
            } else {
                console.warn('⚠️ World creation timeout, continuing anyway...');
            }
        }
        
        // Debug: Log what's in the scene
        console.log('🌍 Scene children count:', this.scene.children.length);
        const worldObjects = this.scene.children.filter(c => 
            c.type === 'Mesh' || c.type === 'Group' || c.type === 'Object3D'
        );
        console.log('🌍 World objects:', worldObjects.length);
        console.log('💡 Lights:', this.scene.children.filter(c => c.type.includes('Light')).length);
        
        // Remove test cube - no longer needed
        // The world should be visible now with proper background and lighting
        
        // Hide menus
        this.ui.hideAllMenus();
        this.ui.showHUD();
        
        // Ensure canvas is visible (fade in if not already)
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.classList.add('fadeIn');
            gameCanvas.style.opacity = '1'; // Force visible immediately
        }

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
        
        // Initialize camera position - WoW-style third-person view
        // Position camera to see both character and world (character at origin, world around it)
        // In Three.js: X=right, Y=up, Z=towards camera (so negative Z is "forward/away from camera")
        // Position camera behind and above character, looking down at the world
        this.camera.position.set(
            0,    // Centered on X
            20,   // Elevated view (higher to see more of the world)
            30    // Behind character (positive Z = towards camera = character is "in front" of camera)
        );
        
        // Make sure camera looks at character and can see the ground
        // Character is at origin (0, 0, 0), ground is at y=0, rotated -90deg on X axis (horizontal)
        const lookAtY = 0; // Look at ground level to see the world
        this.camera.lookAt(0, lookAtY, 0); // Look at origin (character position)
        
        // Update camera projection to ensure world is visible
        this.camera.updateProjectionMatrix();
        
        console.log('🎮 Game started - Character position:', charPos);
        console.log('📷 Camera position:', this.camera.position);
        console.log('👀 Camera looking at:', charPos.x, lookAtY, charPos.z);
        console.log('🌍 World objects in scene:', this.scene.children.length);
        console.log('🎨 Scene background:', this.scene.background);
        console.log('💡 Lights in scene:', this.scene.children.filter(c => c.type.includes('Light')).length);
        
        // Force render once to ensure world is visible
        this.renderer.render(this.scene, this.camera);

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
        // Make sure we're rendering with the correct settings
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Debug: Log scene state (only on first frame)
        if (!this._renderDebugged) {
            const worldMeshes = this.scene.children.filter(c => {
                return c.type === 'Mesh' || 
                       c.type === 'Group' || 
                       (c.userData && (c.userData.type === 'ground' || c.userData.type === 'building' || c.userData.type === 'tree'));
            });
            
            console.log('🎨 FIRST FRAME RENDER:', {
                sceneChildren: this.scene.children.length,
                worldMeshes: worldMeshes.length,
                cameraPosition: this.camera.position.toArray(),
                cameraRotation: this.camera.rotation.toArray(),
                cameraNear: this.camera.near,
                cameraFar: this.camera.far,
                sceneBackground: this.scene.background ? this.scene.background.getHexString() : 'null',
                sceneFog: this.scene.fog ? 'yes' : 'no',
                rendererClearColor: this.renderer.getClearColor(new THREE.Color()).getHexString(),
                characterExists: !!this.character,
                characterMeshExists: !!(this.character && this.character.mesh),
                characterPosition: this.character && this.character.mesh ? this.character.mesh.position.toArray() : 'no character',
                controlsExists: !!this.controls
            });
            
            // Log some world object positions
            const ground = this.scene.children.find(c => c.userData && c.userData.type === 'ground');
            if (ground) {
                console.log('🌍 Ground found:', {
                    position: ground.position.toArray(),
                    rotation: ground.rotation.toArray(),
                    visible: ground.visible
                });
            }
            
            this._renderDebugged = true;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
        window.game = new Fantasy3D();
});

