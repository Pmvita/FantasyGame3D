// Main game application
import * as THREE from 'three';
import { Character } from './character.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';

class FantasyGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.world = null;
        this.controls = null;
        this.ui = null;
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
        
        // Wait a bit for model to load if needed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set up camera to follow character
        this.camera.position.set(
            this.character.mesh.position.x,
            this.character.mesh.position.y + 5,
            this.character.mesh.position.z + 10
        );
        this.camera.lookAt(this.character.mesh.position);

        // Initialize controls
        this.controls = new Controls(this.character, this.camera, this.scene);

        // Start game loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update character
        if (this.character) {
            this.character.update(deltaTime);
        }

        // Update controls
        if (this.controls) {
            this.controls.update(deltaTime);
        }

        // Update camera to follow character
        if (this.character && this.controls) {
            const charPos = this.character.mesh.position;
            const targetPos = new THREE.Vector3(
                charPos.x,
                charPos.y + 5,
                charPos.z + 10
            );
            this.camera.position.lerp(targetPos, 0.1);
            this.camera.lookAt(charPos);
        }

        // Render
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

