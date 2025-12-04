// Input controls
import * as THREE from 'three';

export class Controls {
    constructor(character, camera, scene) {
        this.character = character;
        this.camera = camera;
        this.scene = scene;
        
        this.keys = {};
        
        // Camera rotation angles (fixed or controlled by keys)
        this.cameraAngleX = 0.3; // Vertical rotation (pitch) - slight downward angle
        this.cameraAngleY = 0; // Horizontal rotation (yaw)
        this.cameraDistance = 10; // Distance from character
        this.cameraHeight = 5; // Height above character
        
        // Double-tap detection for running
        this.lastKeyPress = {}; // Track last key press time and key
        this.doubleTapDelay = 300; // milliseconds
        this.isRunning = false; // Running state

        this.setupEventListeners();
    }

    setupEventListeners() {
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

        // Camera rotation with Q/E keys (optional)
        // Q/E can rotate camera around character if needed
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

        const moveVector = new THREE.Vector3();

        // WASD movement
        if (this.keys['w'] || this.keys['arrowup']) {
            moveVector.z -= 1;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            moveVector.z += 1;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            moveVector.x -= 1;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            moveVector.x += 1;
        }

        // Apply movement relative to camera direction
        if (moveVector.length() > 0) {
            // Normalize movement vector
            moveVector.normalize();
            
            // Rotate movement vector based on camera's horizontal rotation
            const worldMoveVector = moveVector.clone();
            worldMoveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleY);
            
            // Check energy before allowing running
            if (this.isRunning && this.character && this.character.energy < this.character.minEnergyToRun) {
                this.isRunning = false;
            }
            
            // Move character with running state
            this.character.move(worldMoveVector, this.isRunning);
            
            // Make character face movement direction smoothly
            const targetAngle = Math.atan2(-worldMoveVector.x, -worldMoveVector.z);
            // Smooth rotation towards target angle
            let currentAngle = this.character.mesh.rotation.y;
            let angleDiff = targetAngle - currentAngle;
            
            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Smoothly rotate towards target
            this.character.mesh.rotation.y += angleDiff * 0.2;
        } else {
            // No movement keys pressed - stop running
            if (this.isRunning) {
                this.isRunning = false;
            }
        }

        // Camera rotation with Q/E keys (continuous while held)
        if (this.keys['e']) {
            this.cameraAngleY -= 0.07 * deltaTime * 60; // Pan left (counter-clockwise) - reduced from 0.1
        }
        if (this.keys['q']) {
            this.cameraAngleY += 0.07 * deltaTime * 60; // Pan right (clockwise) - reduced from 0.1
        }
    }
}

