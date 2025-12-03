// World creation
import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.createWorld();
    }

    createWorld() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5d23,
            roughness: 0.8,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add some simple buildings/structures
        this.createBuilding(10, 0, 10, 4, 4, 6);
        this.createBuilding(-10, 0, 10, 4, 4, 6);
        this.createBuilding(10, 0, -10, 4, 4, 6);
        this.createBuilding(-10, 0, -10, 4, 4, 6);

        // Add some trees (simple representation)
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            this.createTree(x, z);
        }

        // Add lighting
        this.createLighting();
    }

    createBuilding(x, y, z, width, depth, height) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.7
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, y + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Add roof
        const roofGeometry = new THREE.ConeGeometry(width * 0.8, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + height + 1, z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.scene.add(roof);
    }

    createTree(x, z) {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1.5, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Leaves
        const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 4, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
    }

    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
}

