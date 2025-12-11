// Minimap system
import * as THREE from 'three';

export class Minimap {
    constructor(scene, character, world) {
        this.scene = scene;
        this.character = character;
        this.world = world;
        
        // Minimap size
        this.size = 200; // pixels
        
        // Create minimap container
        this.container = document.getElementById('minimapContainer');
        this.canvas = document.getElementById('minimapCanvas');
        
        if (!this.canvas) {
            console.error('Minimap canvas not found');
            return;
        }
        
        // Create minimap camera (orthographic, top-down view)
        // Show a smaller area around the character for better focus
        this.viewSize = 80;
        this.camera = new THREE.OrthographicCamera(
            -this.viewSize / 2, this.viewSize / 2, // left, right
            this.viewSize / 2, -this.viewSize / 2, // top, bottom
            1, 1000    // near, far
        );
        this.camera.position.set(0, 150, 0); // High above the world
        this.camera.lookAt(0, 0, 0);
        // Render all layers (we'll use layers to hide markers from main camera)
        this.camera.layers.enableAll();
        
        // Create minimap renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0x2a4a2a, 0.8); // Semi-transparent dark green background
        
        // Set main camera to not see minimap layer
        if (scene.userData.mainCamera) {
            scene.userData.mainCamera.layers.disable(1);
        }
        
        // Create minimap markers for objects
        this.markers = {
            character: null,
            buildings: [],
            trees: [],
            rocks: []
        };
        
        this.createMarkers();
    }
    
    createMarkers() {
        // Character marker (blue dot)
        const charGeometry = new THREE.CircleGeometry(2, 16);
        const charMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4a90e2,
            side: THREE.DoubleSide
        });
        this.markers.character = new THREE.Mesh(charGeometry, charMaterial);
        this.markers.character.rotation.x = -Math.PI / 2; // Lay flat
        this.markers.character.position.y = 1; // Slightly above ground
        this.markers.character.layers.set(1); // Only visible to minimap camera
        this.scene.add(this.markers.character);
        
        // Building markers (brown squares)
        this.scene.traverse((object) => {
            if (object.userData && object.userData.type === 'building' && !object.userData.isMinimapMarker) {
                const buildingGeometry = new THREE.BoxGeometry(3, 0.1, 3);
                const buildingMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x8B7355
                });
                const marker = new THREE.Mesh(buildingGeometry, buildingMaterial);
                marker.position.set(
                    object.position.x,
                    1,
                    object.position.z
                );
                marker.userData.isMinimapMarker = true;
                marker.layers.set(1); // Only visible to minimap camera
                this.markers.buildings.push(marker);
                this.scene.add(marker);
            }
            
            // Tree markers (green circles)
            if (object.userData && object.userData.type === 'tree' && object.isGroup && !object.userData.isMinimapMarker) {
                const treeGeometry = new THREE.CircleGeometry(1.5, 16);
                const treeMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x228B22,
                    side: THREE.DoubleSide
                });
                const marker = new THREE.Mesh(treeGeometry, treeMaterial);
                marker.rotation.x = -Math.PI / 2;
                marker.position.set(
                    object.position.x,
                    1,
                    object.position.z
                );
                marker.userData.isMinimapMarker = true;
                marker.layers.set(1); // Only visible to minimap camera
                this.markers.trees.push(marker);
                this.scene.add(marker);
            }
            
            // Rock markers (gray circles)
            if (object.userData && object.userData.type === 'rock' && object.isGroup && !object.userData.isMinimapMarker) {
                const rockGeometry = new THREE.CircleGeometry(1.2, 16);
                const rockMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x696969,
                    side: THREE.DoubleSide
                });
                const marker = new THREE.Mesh(rockGeometry, rockMaterial);
                marker.rotation.x = -Math.PI / 2;
                marker.position.set(
                    object.position.x,
                    1,
                    object.position.z
                );
                marker.userData.isMinimapMarker = true;
                marker.layers.set(1); // Only visible to minimap camera
                this.markers.rocks.push(marker);
                this.scene.add(marker);
            }
        });
    }
    
    update() {
        if (!this.renderer || !this.camera || !this.scene) return;
        
        // Update character marker position
        if (this.character && this.character.mesh && this.markers.character) {
            const charPos = this.character.mesh.position;
            this.markers.character.position.set(charPos.x, 1, charPos.z);
            
            // Update camera to follow character
            this.camera.position.set(charPos.x, 150, charPos.z);
            this.camera.lookAt(charPos.x, 0, charPos.z);
        }
        
        // Render minimap
        this.renderer.render(this.scene, this.camera);
    }
    
    cleanup() {
        // Remove markers from scene
        if (this.markers.character) {
            this.scene.remove(this.markers.character);
            this.markers.character.geometry.dispose();
            this.markers.character.material.dispose();
        }
        
        this.markers.buildings.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        
        this.markers.trees.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        
        this.markers.rocks.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

