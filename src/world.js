// World creation
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
        this.treeModel = null;
        this.rockModel = null;
        this.lowTreePondModel = null;
        this.modelsLoaded = false;
        this.createWorld();
    }

    async createWorld() {
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

        // Add lighting
        this.createLighting();

        // Load 3D models and then create trees/rocks
        await this.loadModels();

        // Add trees using 3D models
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            this.createTree(x, z);
        }

        // Add rocks using 3D models
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            this.createRock(x, z);
        }

        // Add LowTreePond features
        for (let i = 0; i < 5; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            this.createLowTreePond(x, z);
        }
    }

    async loadModels() {
        try {
            // Load tree model
            const treeData = await this.loader.loadAsync('src/World/Enviroment/TallTree.glb');
            this.treeModel = treeData.scene;
            console.log('Tree model loaded');

            // Load rock model
            const rockData = await this.loader.loadAsync('src/World/Enviroment/Rocks.glb');
            this.rockModel = rockData.scene;
            console.log('Rock model loaded');

            // Load fantasy-login-bg model (optional - fallback geometry will be used if missing)
            try {
                const fantasyBgData = await this.loader.loadAsync('assets/backgrounds/fantasy-login-bg.glb');
                this.lowTreePondModel = fantasyBgData.scene; // Keep same variable name for compatibility
                
                // Debug: Inspect the model structure
                const box = new THREE.Box3().setFromObject(this.lowTreePondModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                console.log('fantasy-login-bg model loaded');
                console.log('fantasy-login-bg - Size:', size, 'Center:', center);
                console.log('fantasy-login-bg - Bounding box min:', box.min, 'max:', box.max);
                
                // Log model children to see what it contains
                this.lowTreePondModel.traverse((child) => {
                    if (child.isMesh) {
                        console.log('fantasy-login-bg mesh:', child.name || 'unnamed', 'position:', child.position);
                    }
                });
            } catch (fantasyBgError) {
                // File doesn't exist (404) or other error - fallback geometry will be used
                // This is expected if fantasy-login-bg.glb doesn't exist yet
                if (fantasyBgError.message && (fantasyBgError.message.includes('<!DOCTYPE') || fantasyBgError.message.includes('not valid JSON'))) {
                    // Suppress expected 404 errors - file doesn't exist, fallback will be used
                    console.log('fantasy-login-bg.glb not found - using fallback geometry (this is expected if the file doesn\'t exist)');
                } else {
                    console.log('fantasy-login-bg model unavailable - using fallback geometry');
                }
            }

            this.modelsLoaded = true;
        } catch (error) {
            console.warn('Failed to load 3D models, using fallback geometry:', error);
            this.modelsLoaded = false;
        }
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
        // Mark as interactive object
        building.userData.interactive = true;
        building.userData.type = 'building';
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
        // Mark roof as part of interactive building
        roof.userData.interactive = true;
        roof.userData.type = 'building';
        this.scene.add(roof);
    }

    createTree(x, z) {
        // Create a group for the tree
        const treeGroup = new THREE.Group();
        treeGroup.userData.interactive = true;
        treeGroup.userData.type = 'tree';
        
        if (this.treeModel && this.modelsLoaded) {
            // Use 3D model
            const treeClone = this.treeModel.clone();
            
            // Random scale for trees (0.7 to 1.4 for variety)
            const treeScale = 0.7 + Math.random() * 0.7;
            treeClone.scale.set(treeScale, treeScale, treeScale);
            
            // Random rotation for variety
            treeClone.rotation.y = Math.random() * Math.PI * 2;
            
            // Calculate bounding box AFTER scaling to position tree correctly
            treeClone.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(treeClone);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Position tree so bottom is at y=0
            treeClone.position.set(0, -center.y + size.y / 2, 0);
            
            // Enable shadows
            treeClone.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            treeGroup.add(treeClone);
        } else {
            // Fallback to simple geometry
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(0, 1.5, 0);
            trunk.castShadow = true;
            treeGroup.add(trunk);

            const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(0, 4, 0);
            leaves.castShadow = true;
            treeGroup.add(leaves);
        }
        
        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
    }

    createRock(x, z) {
        // Create a group for the rock
        const rockGroup = new THREE.Group();
        rockGroup.userData.interactive = true;
        rockGroup.userData.type = 'rock';
        
        if (this.rockModel && this.modelsLoaded) {
            // Use 3D model
            const rockClone = this.rockModel.clone();
            
            // Random scale for rocks (0.5 to 1.0 for smaller variety)
            const rockScale = 0.5 + Math.random() * 0.5;
            rockClone.scale.set(rockScale, rockScale, rockScale);
            
            // Random rotation for variety
            rockClone.rotation.y = Math.random() * Math.PI * 2;
            
            // Calculate bounding box AFTER scaling to position rock correctly
            rockClone.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(rockClone);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Position rock so bottom is at y=0
            // If the model's bounding box bottom is below y=0, we need to adjust
            const bottomY = box.min.y;
            const offsetY = -bottomY; // Move up by the amount it's below ground
            rockClone.position.set(0, offsetY, 0);
            
            // Enable shadows
            rockClone.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            rockGroup.add(rockClone);
        } else {
            // Fallback to simple geometry
            const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x555555,
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(0, 0.5, 0);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rockGroup.add(rock);
        }
        
        rockGroup.position.set(x, 0, z);
        this.scene.add(rockGroup);
    }

    createLowTreePond(x, z) {
        // Create a group for the low tree pond
        const pondGroup = new THREE.Group();
        pondGroup.userData.interactive = true;
        pondGroup.userData.type = 'pond';
        
        if (this.lowTreePondModel && this.modelsLoaded) {
            // Use 3D model
            const pondClone = this.lowTreePondModel.clone();
            
            // Random scale for variety (0.8 to 1.2)
            const pondScale = 0.8 + Math.random() * 0.4;
            pondClone.scale.set(pondScale, pondScale, pondScale);
            
            // Random rotation for variety
            pondClone.rotation.y = Math.random() * Math.PI * 2;
            
            // Calculate bounding box AFTER scaling to position pond correctly
            pondClone.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(pondClone);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Debug: Log positioning info
            console.log('LowTreePond instance - Size:', size, 'Center:', center, 'Scale:', pondScale);
            
            // Position pond so bottom is at y=0
            // If the model's bounding box bottom is below y=0, we need to adjust
            const bottomY = box.min.y;
            const offsetY = -bottomY; // Move up by the amount it's below ground
            pondClone.position.set(0, offsetY, 0);
            
            console.log('LowTreePond positioned at y offset:', offsetY);
            
            // Enable shadows
            pondClone.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            pondGroup.add(pondClone);
        } else {
            // Fallback to simple geometry - create a pond with a tree
            // Create water (flat circle)
            const waterGeometry = new THREE.CircleGeometry(2, 16);
            const waterMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x4a90e2,
                roughness: 0.1,
                metalness: 0.3
            });
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.y = 0.1;
            water.receiveShadow = true;
            pondGroup.add(water);
            
            // Create a small tree next to pond
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(1.5, 1, 0);
            trunk.castShadow = true;
            pondGroup.add(trunk);

            const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(1.5, 2.5, 0);
            leaves.castShadow = true;
            pondGroup.add(leaves);
        }
        
        pondGroup.position.set(x, 0, z);
        this.scene.add(pondGroup);
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

