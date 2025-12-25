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
        this.worldCreated = false;
        // Create world immediately - don't wait
        this.createWorld().then(() => {
            this.worldCreated = true;
            console.log('✅ World creation complete! Objects in scene:', this.scene.children.length);
        }).catch((error) => {
            console.error('❌ Error creating world:', error);
        });
    }

    async createWorld() {
        // Create realistic fantasy world terrain
        // Larger, more detailed ground plane with varied terrain
        const groundGeometry = new THREE.PlaneGeometry(800, 800, 100, 100);
        
        // Add realistic terrain variation with multiple noise layers
        const vertices = groundGeometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getZ(i);
            
            // Multi-layer terrain noise for realistic variation
            const noise1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
            const noise2 = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.8;
            const noise3 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.3;
            
            // Combine noise layers for natural terrain
            const height = noise1 + noise2 + noise3;
            vertices.setY(i, height);
        }
        vertices.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        // Realistic fantasy grass material with texture variation
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a6b2f, // Rich fantasy green
            roughness: 0.95,
            metalness: 0.0,
            envMapIntensity: 0.5
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        ground.userData.type = 'ground';
        this.scene.add(ground);

        // Add realistic fantasy structures with varied designs
        // Village center with main buildings
        this.createFantasyBuilding(0, 0, -20, 8, 8, 12, 0x8B7355); // Town hall
        this.createFantasyBuilding(-15, 0, -15, 6, 6, 10, 0x6B5B4F); // House 1
        this.createFantasyBuilding(15, 0, -15, 6, 6, 10, 0x7B6B5F); // House 2
        this.createFantasyBuilding(-25, 0, 10, 5, 5, 8, 0x6B5545); // Small house
        this.createFantasyBuilding(25, 0, 10, 5, 5, 8, 0x7B6555); // Small house
        
        // Create fantasy towers
        this.createTower(-30, 0, -30, 4, 15);
        this.createTower(30, 0, -30, 4, 15);
        
        // Add fantasy pathways
        this.createPathway(0, 0.1, -40, 0, 0.1, 40, 3); // North-South path
        this.createPathway(-40, 0.1, 0, 40, 0.1, 0, 3); // East-West path

        // Enhanced lighting for realistic fantasy atmosphere
        this.createLighting();

        // Load 3D models
        await this.loadModels();

        // Create realistic forest clusters with varied density
        // Dense forest area in the north
        for (let i = 0; i < 80; i++) {
            const x = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 600;
            // Avoid placing trees on buildings
            if (Math.abs(x) > 20 || Math.abs(z) > 20) {
                this.createTree(x, z);
            }
        }

        // Scattered rocks and boulders
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 600;
            this.createRock(x, z);
        }

        // Fantasy ponds and water features
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 600;
            const z = (Math.random() - 0.5) * 600;
            if (Math.abs(x) > 30 || Math.abs(z) > 30) {
                this.createLowTreePond(x, z);
            }
        }
        
        // Add decorative fantasy elements
        this.createFantasyDecorations();
        
        console.log('🌍 Fantasy world created! Total objects:', this.scene.children.length);
        console.log('   Ground added: ✅');
        console.log('   Buildings added:', this.scene.children.filter(c => c.userData?.type === 'building').length);
        console.log('   Trees added:', this.scene.children.filter(c => c.userData?.type === 'tree').length);
        console.log('   Rocks added:', this.scene.children.filter(c => c.userData?.type === 'rock').length);
        console.log('   Ponds added:', this.scene.children.filter(c => c.userData?.type === 'pond').length);
        console.log('   Lights added:', this.scene.children.filter(c => c.type.includes('Light')).length);
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
        // Legacy method - redirect to new fantasy building
        this.createFantasyBuilding(x, y, z, width, depth, height, 0x8B7355);
    }
    
    createFantasyBuilding(x, y, z, width, depth, height, color = 0x8B7355) {
        const buildingGroup = new THREE.Group();
        buildingGroup.userData.interactive = true;
        buildingGroup.userData.type = 'building';
        
        // Main structure with more detail
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.75,
            metalness: 0.1
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(0, height / 2, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);

        // Fantasy-style peaked roof
        const roofHeight = Math.min(height * 0.4, 4);
        const roofGeometry = new THREE.ConeGeometry(width * 0.85, roofHeight, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a3d2a,
            roughness: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height + roofHeight / 2, 0);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        buildingGroup.add(roof);
        
        // Add decorative elements - windows
        const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            emissive: 0x1a4a7a,
            emissiveIntensity: 0.3
        });
        
        // Front windows
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(width * 0.3, height * 0.4, depth / 2 + 0.05);
        buildingGroup.add(window1);
        
        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(-width * 0.3, height * 0.4, depth / 2 + 0.05);
        buildingGroup.add(window2);
        
        buildingGroup.position.set(x, y, z);
        this.scene.add(buildingGroup);
    }
    
    createTower(x, y, z, radius, height) {
        const towerGroup = new THREE.Group();
        towerGroup.userData.interactive = true;
        towerGroup.userData.type = 'building';
        
        // Tower base
        const baseGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height * 0.7, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B5B4F,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, height * 0.35, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        towerGroup.add(base);
        
        // Tower top
        const topGeometry = new THREE.CylinderGeometry(radius * 0.8, radius, height * 0.3, 8);
        const top = new THREE.Mesh(topGeometry, baseMaterial);
        top.position.set(0, height * 0.85, 0);
        top.castShadow = true;
        towerGroup.add(top);
        
        // Tower spire
        const spireGeometry = new THREE.ConeGeometry(radius * 0.5, height * 0.2, 8);
        const spireMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.7
        });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0, height * 1.1, 0);
        spire.castShadow = true;
        towerGroup.add(spire);
        
        towerGroup.position.set(x, y, z);
        this.scene.add(towerGroup);
    }
    
    createPathway(x1, y1, z1, x2, y2, z2, width) {
        const pathLength = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        const pathGeometry = new THREE.PlaneGeometry(width, pathLength);
        const pathMaterial = new THREE.MeshStandardMaterial({
            color: 0x6B5B4F,
            roughness: 0.9
        });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        
        const centerX = (x1 + x2) / 2;
        const centerZ = (z1 + z2) / 2;
        const angle = Math.atan2(z2 - z1, x2 - x1);
        
        path.rotation.x = -Math.PI / 2;
        path.rotation.z = angle;
        path.position.set(centerX, y1, centerZ);
        path.receiveShadow = true;
        path.userData.type = 'pathway';
        this.scene.add(path);
    }
    
    createFantasyDecorations() {
        // Add magical glowing crystals scattered around
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 500;
            const z = (Math.random() - 0.5) * 500;
            
            const crystalGeometry = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.3);
            const crystalMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6),
                emissive: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.3),
                emissiveIntensity: 0.5,
                metalness: 0.5,
                roughness: 0.3
            });
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(x, 0.5 + Math.random() * 0.5, z);
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI
            );
            crystal.castShadow = true;
            crystal.userData.type = 'decoration';
            crystal.userData.interactive = true;
            this.scene.add(crystal);
        }
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
        // Ambient light - realistic fantasy atmosphere
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (sun) - realistic fantasy daylight
        const directionalLight = new THREE.DirectionalLight(0xfff5e1, 1.2);
        directionalLight.position.set(80, 120, 60);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.bias = -0.0001;
        this.scene.add(directionalLight);

        // Fill light for better visibility
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
        
        // Atmospheric point lights for fantasy ambiance
        const pointLight1 = new THREE.PointLight(0xffaa44, 0.5, 100);
        pointLight1.position.set(0, 20, -30);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x88aaff, 0.4, 80);
        pointLight2.position.set(-40, 15, 40);
        this.scene.add(pointLight2);
        
        // Hemisphere light for natural sky color
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a5d23, 0.4);
        this.scene.add(hemisphereLight);
    }
}

