// Character system
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character {
    constructor(scene, data = null) {
        this.scene = scene;
        this.data = data || this.createDefaultData();
        this.mesh = null;
        this.velocity = new THREE.Vector3();
        this.speed = 5.0 * (0.5 + (this.data.stats.speed / 100.0) * 1.5); // Speed based on stat
        this.loader = new GLTFLoader();
        
        // Create character (async, but don't wait)
        this.createCharacter().catch(err => {
            console.log('Error creating character:', err);
        });
    }

    createDefaultData() {
        return {
            name: 'New Character',
            race: 'human',
            appearance: {
                hairColor: '#8B4513',
                skinTone: 0.5,
                bodyShape: 0.5
            },
            stats: {
                health: 100,
                maxHealth: 100,
                strength: 10,
                magic: 10,
                speed: 10,
                defense: 10
            },
            equipment: {
                weapon: null,
                armor: null,
                helmet: null
            }
        };
    }

    async createCharacter() {
        const race = this.data.race || 'human';
        
        // Try to load 3D model first
        const model = await this.loadModel(race);
        
        if (model) {
            // Use loaded 3D model
            // Reset scale and position first
            model.scale.set(1, 1, 1);
            model.position.set(0, 0, 0);
            model.rotation.set(0, 0, 0);
            
            // Update matrix to ensure bounding box calculation is accurate
            model.updateMatrixWorld(true);
            
            // Calculate bounding box to auto-scale
            const box = new THREE.Box3();
            box.expandByObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            console.log(`Game model ${race} - Size:`, size, 'Center:', center);
            
            // Check if size is valid
            if (size.y <= 0 || !isFinite(size.y) || size.y > 1000) {
                console.warn(`Invalid model size for ${race} (${size.y}), using default scale`);
                const defaultScale = size.y > 1000 ? 0.01 : 1.0;
                model.scale.set(defaultScale, defaultScale, defaultScale);
            } else {
                // Target height for game (around 2 units)
                const targetHeight = 2.0;
                const scale = targetHeight / size.y;
                
                console.log(`Scaling game model ${race} by ${scale} (target: ${targetHeight}, actual: ${size.y})`);
                
                // Apply scale
                model.scale.set(scale, scale, scale);
                
                // Recalculate after scaling
                box.setFromObject(model);
                const scaledSize = box.getSize(new THREE.Vector3());
                const centerX = box.getCenter(new THREE.Vector3()).x;
                const centerZ = box.getCenter(new THREE.Vector3()).z;
                const bottomY = box.min.y;
                
                // Position model so feet are at y=0 (bottom of bounding box at y=0), centered on X and Z
                model.position.set(-centerX, -bottomY, -centerZ);
            }
            
            this.mesh = model;
            
            // Apply customization
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        // Update hair color
                        if (child.material.name && child.material.name.toLowerCase().includes('hair')) {
                            child.material.color.setStyle(this.data.appearance.hairColor);
                        }
                        // Update skin tone
                        if (child.material.name && child.material.name.toLowerCase().includes('skin')) {
                            const skinColor = this.getSkinColor(race);
                            child.material.color.copy(skinColor);
                        }
                    }
                }
            });
            
            this.scene.add(this.mesh);
            return;
        }
        
        // Fallback to simple geometry
        const raceProps = this.getRaceProperties(race);
        this.mesh = new THREE.Group();

        // Create body
        const bodyGeometry = new THREE.BoxGeometry(
            raceProps.bodyWidth,
            raceProps.bodyHeight,
            raceProps.bodyDepth
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(race),
            metalness: 0.1,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = raceProps.bodyHeight / 2;
        body.castShadow = true;
        this.mesh.add(body);

        // Create head
        const headGeometry = new THREE.BoxGeometry(
            raceProps.headSize,
            raceProps.headSize,
            raceProps.headSize
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(race),
            metalness: 0.1,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = raceProps.bodyHeight + raceProps.headSize / 2;
        head.castShadow = true;
        this.mesh.add(head);

        // Create hair
        const hairGeometry = new THREE.BoxGeometry(
            raceProps.headSize * 1.1,
            raceProps.hairHeight,
            raceProps.headSize * 1.1
        );
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: this.data.appearance.hairColor
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = raceProps.bodyHeight + raceProps.headSize + raceProps.hairHeight / 2;
        this.mesh.add(hair);

        // Race-specific features
        if (race === 'elf') {
            const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
            const earMaterial = new THREE.MeshStandardMaterial({
                color: this.getSkinColor(race)
            });
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(-raceProps.headSize / 2 - 0.1, raceProps.bodyHeight + raceProps.headSize * 0.7, 0);
            leftEar.rotation.z = -Math.PI / 6;
            this.mesh.add(leftEar);

            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(raceProps.headSize / 2 + 0.1, raceProps.bodyHeight + raceProps.headSize * 0.7, 0);
            rightEar.rotation.z = Math.PI / 6;
            this.mesh.add(rightEar);
        } else if (race === 'dwarf') {
            const beardGeometry = new THREE.BoxGeometry(raceProps.headSize * 0.8, 0.4, raceProps.headSize * 0.6);
            const beardMaterial = new THREE.MeshStandardMaterial({
                color: this.data.appearance.hairColor
            });
            const beard = new THREE.Mesh(beardGeometry, beardMaterial);
            beard.position.set(0, raceProps.bodyHeight + raceProps.headSize * 0.3, raceProps.headSize / 2 + 0.1);
            this.mesh.add(beard);
        } else if (race === 'demon') {
            const hornGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
            const hornMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a
            });
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-raceProps.headSize * 0.3, raceProps.bodyHeight + raceProps.headSize + 0.3, 0);
            leftHorn.rotation.z = -Math.PI / 6;
            this.mesh.add(leftHorn);

            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(raceProps.headSize * 0.3, raceProps.bodyHeight + raceProps.headSize + 0.3, 0);
            rightHorn.rotation.z = Math.PI / 6;
            this.mesh.add(rightHorn);

            bodyMaterial.color.setRGB(0.7, 0.4, 0.4);
            headMaterial.color.setRGB(0.7, 0.4, 0.4);
        }

        // Add arms and legs
        const armGeometry = new THREE.BoxGeometry(0.3, raceProps.armLength, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(race),
            metalness: 0.1,
            roughness: 0.8
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-raceProps.bodyWidth / 2 - 0.15, raceProps.bodyHeight * 0.7, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(raceProps.bodyWidth / 2 + 0.15, raceProps.bodyHeight * 0.7, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        const legGeometry = new THREE.BoxGeometry(0.4, raceProps.legLength, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(race),
            metalness: 0.1,
            roughness: 0.8
        });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-raceProps.bodyWidth / 3, raceProps.legLength / 2, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(raceProps.bodyWidth / 3, raceProps.legLength / 2, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);

        this.mesh.position.set(0, 1, 0);
        this.scene.add(this.mesh);
    }

    async loadModel(race) {
        // Try GLB first (preferred - single file), then GLTF
        const extensions = ['.glb', '.gltf'];
        
        for (const ext of extensions) {
            const modelPath = `assets/characters/${race}${ext}`;
            
            try {
                const gltf = await new Promise((resolve, reject) => {
                    // Set the path for resolving relative texture/bin files
                    this.loader.setPath('assets/characters/');
                    
                    this.loader.load(
                        `${race}${ext}`,
                        (gltf) => {
                            console.log(`Successfully loaded ${modelPath} for game`);
                            // Fix texture paths if needed
                            gltf.scene.traverse((child) => {
                                if (child.isMesh && child.material) {
                                    if (Array.isArray(child.material)) {
                                        child.material.forEach(mat => this.fixMaterialTextures(mat));
                                    } else {
                                        this.fixMaterialTextures(child.material);
                                    }
                                }
                            });
                            resolve(gltf);
                        },
                        (progress) => {
                            if (progress.lengthComputable) {
                                const percentComplete = progress.loaded / progress.total * 100;
                                console.log(`Loading ${modelPath}: ${percentComplete.toFixed(0)}%`);
                            }
                        },
                        (error) => {
                            // Check if it's a file format error (FBX file renamed to GLB)
                            if (error.message && error.message.includes('Kaydara')) {
                                console.error(`Error: ${race}${ext} appears to be an FBX file, not GLB/GLTF. Please convert it to GLB format.`);
                            } else if (error.message && error.message.includes('scene.bin')) {
                                console.error(`Error: ${race}${ext} is missing required external files (scene.bin). Make sure all files are in the assets/characters/ folder.`);
                            } else {
                                console.log(`Error loading ${modelPath}:`, error.message || error);
                            }
                            reject(error);
                        }
                    );
                });
                return gltf.scene;
            } catch (error) {
                // Try next extension
                console.log(`Failed to load ${modelPath}, trying next format...`);
                continue;
            }
        }
        
        console.log(`Model not found for ${race}, using fallback`);
        return null;
    }

    fixMaterialTextures(material) {
        // Fix texture paths if they're broken
        // GLB files should have textures embedded
        if (material.map && material.map.image) {
            // Texture already loaded, no fix needed
        }
    }

    getRaceProperties(race) {
        const props = {
            human: {
                bodyWidth: 1.0,
                bodyHeight: 1.2,
                bodyDepth: 0.6,
                headSize: 0.6,
                hairHeight: 0.3,
                armLength: 1.0,
                legLength: 1.2
            },
            elf: {
                bodyWidth: 0.9,
                bodyHeight: 1.4,
                bodyDepth: 0.5,
                headSize: 0.55,
                hairHeight: 0.35,
                armLength: 1.1,
                legLength: 1.3
            },
            dwarf: {
                bodyWidth: 1.2,
                bodyHeight: 1.0,
                bodyDepth: 0.7,
                headSize: 0.7,
                hairHeight: 0.3,
                armLength: 0.9,
                legLength: 0.9
            },
            demon: {
                bodyWidth: 1.1,
                bodyHeight: 1.3,
                bodyDepth: 0.6,
                headSize: 0.65,
                hairHeight: 0.3,
                armLength: 1.1,
                legLength: 1.2
            }
        };
        return props[race] || props.human;
    }

    getSkinColor(race) {
        const tone = this.data.appearance.skinTone;
        let baseColor;
        
        switch(race) {
            case 'elf':
                baseColor = { r: 0.9, g: 0.8, b: 0.7 };
                break;
            case 'dwarf':
                baseColor = { r: 0.6, g: 0.5, b: 0.4 };
                break;
            case 'demon':
                baseColor = { r: 0.7, g: 0.4, b: 0.4 };
                break;
            default:
                baseColor = { r: 0.8, g: 0.6, b: 0.5 };
        }

        const r = baseColor.r + (tone * 0.2);
        const g = baseColor.g + (tone * 0.2);
        const b = baseColor.b + (tone * 0.2);

        return new THREE.Color(r, g, b);
    }

    move(direction) {
        // Normalize direction and apply speed
        direction.normalize();
        this.velocity.x = direction.x * this.speed;
        this.velocity.z = direction.z * this.speed;
    }

    rotate(angle) {
        this.mesh.rotation.y += angle;
    }

    update(deltaTime) {
        // Apply velocity
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;

        // Keep character on ground
        if (this.mesh.position.y < 1) {
            this.mesh.position.y = 1;
        }

        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }

    getData() {
        return this.data;
    }
}

