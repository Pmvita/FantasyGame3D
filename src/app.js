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
        // Set background to null so CSS background image shows through
        this.scene.background = null;
        // Use a subtle fog that blends with the fantasy background
        this.scene.fog = new THREE.Fog(0x4a5d23, 200, 800); // Green-tinted fog for fantasy atmosphere

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
        
        // Check for auto-login (if user was previously logged in)
        // This will automatically show main menu if logged in, or login screen if not
        this.ui.checkAutoLogin().then((autoLoggedIn) => {
            if (!autoLoggedIn) {
                // Show login screen if auto-login failed or user logged out
                console.log('Showing login screen (auto-login failed or user logged out)');
                this.ui.showLoginScreen();
            } else {
                console.log('Auto-login successful, main menu should be visible');
            }
        }).catch((error) => {
            console.error('Error during auto-login check:', error);
            // On error, show login screen
            this.ui.showLoginScreen();
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
        
        // Remove landing page background - NO BACKGROUND, show the actual 3D world
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            // Remove CSS background completely
            gameContainer.style.backgroundImage = 'none';
            gameContainer.style.backgroundColor = 'transparent';
        }
        
        // NO background color - show the actual 3D world
        this.scene.background = null;
        
        // Renderer should be opaque - world objects will render on top
        this.renderer.setClearColor(0x000000, 1); // Black background, world will show
        
        // Remove fog completely - it was blocking the world
        this.scene.fog = null;
        
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
        
        // Add a test cube to verify rendering works (temporary debug)
        const testGeometry = new THREE.BoxGeometry(5, 5, 5);
        const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 2.5, 0);
        this.scene.add(testCube);
        console.log('🔴 Added test red cube at origin to verify rendering');
        
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
        
        // Initialize camera position - WoW-style third-person view
        // Camera should be behind and above the character, looking down at the world
        this.camera.position.set(
            charPos.x - 8,  // Behind character
            charPos.y + 12,  // Elevated view to see the world
            charPos.z + 15  // Distance from character
        );
        
        // Make sure camera looks at character and can see the ground
        const lookAtY = Math.max(charPos.y + 1, 2); // Look at character or slightly above ground
        this.camera.lookAt(charPos.x, lookAtY, charPos.z);
        
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
        this.renderer.render(this.scene, this.camera);
        
        // Debug: Log if scene is empty (only on first frame)
        if (!this._renderDebugged && this.scene.children.length < 5) {
            console.warn('⚠️ Scene has very few objects:', this.scene.children.length);
            console.warn('Scene children:', this.scene.children.map(c => c.type));
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

