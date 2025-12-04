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

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyPress(e.key);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Camera rotation with Q/E keys (optional)
        // Q/E can rotate camera around character if needed
    }

    handleKeyPress(key) {
        // Q/E to rotate camera around character (optional)
        if (key.toLowerCase() === 'q') {
            this.cameraAngleY -= 0.1;
        }
        if (key.toLowerCase() === 'e') {
            this.cameraAngleY += 0.1;
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
            
            // Move character
            this.character.move(worldMoveVector);
            
            // Make character face movement direction smoothly
            const targetAngle = Math.atan2(worldMoveVector.x, worldMoveVector.z);
            // Smooth rotation towards target angle
            let currentAngle = this.character.mesh.rotation.y;
            let angleDiff = targetAngle - currentAngle;
            
            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Smoothly rotate towards target
            this.character.mesh.rotation.y += angleDiff * 0.2;
        }

        // Camera follows character automatically (no mouse control)
    }
}

