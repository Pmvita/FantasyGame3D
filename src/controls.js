// Input controls
import * as THREE from 'three';

export class Controls {
    constructor(character, camera, scene) {
        this.character = character;
        this.camera = camera;
        this.scene = scene;
        
        this.keys = {};
        
        // Camera rotation angles (WoW-style)
        this.cameraAngleX = 0.3; // Vertical rotation (pitch) - slight downward angle
        this.cameraAngleY = 0; // Horizontal rotation (yaw)
        this.cameraDistance = 15; // Distance from character (default WoW-style)
        this.cameraHeight = 5; // Height above character
        
        // Double-tap detection for running
        this.lastKeyPress = {}; // Track last key press time and key
        this.doubleTapDelay = 300; // milliseconds
        this.isRunning = false; // Running state
        
        // Mouse controls (WoW-style)
        this.isLeftMouseDown = false;
        this.isRightMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseSensitivity = 0.002; // Camera rotation sensitivity (WoW-style)
        this.cameraPitchMin = -Math.PI / 3; // Maximum upward camera angle
        this.cameraPitchMax = Math.PI / 6; // Maximum downward camera angle (45 degrees down)
        
        // Mouse wheel zoom
        this.cameraDistanceMin = 5;
        this.cameraDistanceMax = 30;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            this.handleKeyPress(key);
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            
            // Stop running when movement key is released
            const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
            if (movementKeys.includes(key)) {
                // Check if any movement key is still pressed
                const anyMovementKeyPressed = movementKeys.some(k => this.keys[k]);
                if (!anyMovementKeyPressed) {
                    this.isRunning = false;
                }
            }
        });

        // Mouse controls (WoW-style)
        // Left-click drag: Rotate camera only
        // Right-click drag: Rotate both camera and character
        canvas.addEventListener('mousedown', (e) => {
            // Prevent context menu on right-click
            if (e.button === 2) {
                e.preventDefault();
            }
            
            if (e.button === 0) { // Left mouse button
                this.isLeftMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            } else if (e.button === 2) { // Right mouse button
                this.isRightMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            // Left-click drag: Rotate camera only (WoW-style)
            if (this.isLeftMouseDown) {
                // Horizontal movement rotates camera horizontally
                this.cameraAngleY -= deltaX * this.mouseSensitivity;
                
                // Vertical movement adjusts camera pitch (vertical angle)
                this.cameraAngleX -= deltaY * this.mouseSensitivity;
                // Clamp camera pitch
                this.cameraAngleX = Math.max(this.cameraPitchMin, Math.min(this.cameraPitchMax, this.cameraAngleX));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
            
            // Right-click drag: Rotate both camera and character (WoW-style)
            if (this.isRightMouseDown && this.character && this.character.mesh) {
                // Horizontal movement rotates both camera and character
                const rotationDelta = deltaX * this.mouseSensitivity;
                this.cameraAngleY -= rotationDelta;
                this.character.mesh.rotation.y -= rotationDelta;
                
                // Vertical movement adjusts camera pitch only
                this.cameraAngleX -= deltaY * this.mouseSensitivity;
                this.cameraAngleX = Math.max(this.cameraPitchMin, Math.min(this.cameraPitchMax, this.cameraAngleX));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left mouse button
                this.isLeftMouseDown = false;
                canvas.style.cursor = 'default';
            } else if (e.button === 2) { // Right mouse button
                this.isRightMouseDown = false;
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            this.isLeftMouseDown = false;
            this.isRightMouseDown = false;
            canvas.style.cursor = 'default';
        });

        // Prevent context menu on right-click
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse wheel: Zoom camera in/out (WoW-style)
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.01; // Negative deltaY = scroll up = zoom in
            this.cameraDistance = Math.max(
                this.cameraDistanceMin, 
                Math.min(this.cameraDistanceMax, this.cameraDistance - zoomDelta)
            );
        }, { passive: false });
    }

    handleKeyPress(key) {
        // Detect double-tap for WASD/Arrow keys to trigger running
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        
        if (movementKeys.includes(key)) {
            const currentTime = Date.now();
            const lastPress = this.lastKeyPress[key];
            
            // Check if this is a double-tap (same key pressed within doubleTapDelay)
            if (lastPress && (currentTime - lastPress) < this.doubleTapDelay) {
                // Double-tap detected - enable running only if enough energy
                if (this.character && this.character.energy >= this.character.minEnergyToRun) {
                    this.isRunning = true;
                }
                this.lastKeyPress[key] = 0; // Reset to prevent triple-tap
            } else {
                // Single tap - normal movement (running will be disabled if key is released)
                this.lastKeyPress[key] = currentTime;
            }
        }
    }

    update(deltaTime) {
        if (!this.character || !this.character.mesh) return;

        // Q/E keys: Rotate character left/right (WoW-style)
        if (this.keys['q']) {
            this.character.mesh.rotation.y += 2.0 * deltaTime; // Turn left
        }
        if (this.keys['e']) {
            this.character.mesh.rotation.y -= 2.0 * deltaTime; // Turn right
        }

        // WASD/Arrow keys movement (WoW-style)
        // W/↑: Move forward in character's facing direction
        // S/↓: Move backward (opposite of facing direction)
        // A/←: Strafe left (move left while maintaining facing direction)
        // D/→: Strafe right (move right while maintaining facing direction)
        
        const moveVector = new THREE.Vector3();
        const characterRotation = this.character.mesh.rotation.y;
        const characterForward = new THREE.Vector3(0, 0, -1);
        const characterRight = new THREE.Vector3(1, 0, 0);
        
        // Apply character rotation to forward/right vectors
        characterForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRotation);
        characterRight.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRotation);

        // Forward/Backward movement (relative to character facing)
        if (this.keys['w'] || this.keys['arrowup']) {
            moveVector.add(characterForward); // Move forward in character's facing direction
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            moveVector.sub(characterForward); // Move backward
        }
        
        // Strafe left/right (relative to character facing, not camera)
        if (this.keys['a'] || this.keys['arrowleft']) {
            moveVector.sub(characterRight); // Strafe left
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            moveVector.add(characterRight); // Strafe right
        }

        // Apply movement
        if (moveVector.length() > 0) {
            // Normalize movement vector
            moveVector.normalize();
            
            // Check energy before allowing running
            if (this.isRunning && this.character && this.character.energy < this.character.minEnergyToRun) {
                this.isRunning = false;
            }
            
            // Move character with running state
            this.character.move(moveVector, this.isRunning);
            
            // In WoW, character doesn't auto-rotate when moving - only Q/E or right-click drag rotate the character
            // Movement keeps the character facing the same direction unless explicitly rotated
        } else {
            // No movement keys pressed - stop running
            if (this.isRunning) {
                this.isRunning = false;
            }
        }
    }
}

