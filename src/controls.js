// Input controls
import * as THREE from 'three';

export class Controls {
    constructor(character, camera, scene) {
        this.character = character;
        this.camera = camera;
        this.scene = scene;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;

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

        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDelta.x = e.movementX * 0.002;
                this.mouseDelta.y = e.movementY * 0.002;
            }
        });

        // Pointer lock
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });

        // Arrow keys
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.character.move(new THREE.Vector3(0, 0, -1));
            if (e.key === 'ArrowDown') this.character.move(new THREE.Vector3(0, 0, 1));
            if (e.key === 'ArrowLeft') this.character.rotate(-0.1);
            if (e.key === 'ArrowRight') this.character.rotate(0.1);
        });
    }

    handleKeyPress(key) {
        // ESC to unlock pointer
        if (key === 'Escape') {
            document.exitPointerLock();
        }
    }

    update(deltaTime) {
        if (!this.character) return;

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

        // Apply movement
        if (moveVector.length() > 0) {
            // Rotate movement vector based on character rotation
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.character.mesh.rotation.y);
            this.character.move(moveVector);
        }

        // Mouse look
        if (this.isPointerLocked) {
            // Rotate character horizontally
            this.character.mesh.rotation.y -= this.mouseDelta.x;
            
            // Rotate camera vertically (with limits)
            this.camera.rotation.x -= this.mouseDelta.y;
            this.camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.camera.rotation.x));
            
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
    }
}

