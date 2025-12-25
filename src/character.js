// Character system
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Character {
    constructor(scene, data = null) {
        this.scene = scene;
        this.data = data || this.createDefaultData();
        this.mesh = null;
        this.velocity = new THREE.Vector3();
        this.loader = new GLTFLoader();
        this.readyPromise = null;
        this.mixer = null; // Animation mixer for GLTF animations
        this.animations = {}; // Store animation actions
        this.currentAnimation = null;
        this.isMoving = false;
        this.isRunning = false; // Running state (double-tap)
        this.targetPosition = null; // Target position for click-to-move
        this.moveThreshold = 0.1; // Distance threshold to stop moving
        this.baseSpeed = 3.0 * (0.5 + (this.data.stats.speed / 100.0) * 1.5); // Base speed (reduced from 3.5)
        this.speed = this.baseSpeed; // Current speed (can be modified for running)
        
        // Energy system (starts at 100, uses speed stat as max)
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDepletionRate = 100 / 300; // Energy per second when running (0.33/sec = 300 seconds/5 minutes from full to empty)
        this.energyRegenRate = 1; // Energy per 10 seconds
        this.energyRegenInterval = 10; // seconds
        this.energyRegenTimer = 0; // current timer
        this.minEnergyToRun = 10; // Minimum energy needed to run
        
        // Create character (async, but don't wait)
        this.readyPromise = this.createCharacter().catch(err => {
            console.log('Error creating character:', err);
        });
    }

    async waitForReady() {
        if (this.readyPromise) {
            await this.readyPromise;
        }
        // Additional wait to ensure mesh is set
        let attempts = 0;
        while (!this.mesh && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        return this.mesh !== null;
    }

    createDefaultData() {
        return {
            name: 'New Character',
            race: 'human',
            gender: 'male', // 'male' or 'female'
            appearance: {
                hairColor: '#8B4513',
                skinTone: 0.5,
                bodyShape: 0.5,
                faceType: 0, // Face variation (0-9)
                hairStyle: 0, // Hair style variation (0-9)
                facialFeatures: 0 // Facial hair/features (0-9)
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
        const gender = this.data.gender || 'male';
        
        // Try to load 3D model first
        const gltfData = await this.loadModel(race, gender);
        
        if (gltfData && gltfData.scene) {
            const model = gltfData.scene;
            const animations = gltfData.animations || [];
            
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
            
            // Character starts facing forward (no rotation needed - will be controlled by movement)
            this.mesh.rotation.y = 0; // No initial rotation - character faces -Z (forward in Three.js)
            
            // Setup animations if available
            if (animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(model);
                
                console.log(`Found ${animations.length} animations:`);
                animations.forEach((clip) => {
                    console.log(`  - ${clip.name}`);
                });
                
                // Find walking/idle/run animations
                animations.forEach((clip) => {
                    const action = this.mixer.clipAction(clip);
                    const clipName = clip.name.toLowerCase();
                    
                    // Store animations by type - more flexible matching
                    if (clipName.includes('run') || clipName.includes('sprint')) {
                        if (!this.animations['run']) {
                            this.animations['run'] = action;
                            console.log(`  → Assigned as RUN: ${clip.name}`);
                        }
                    } else if (clipName.includes('walk') || clipName.includes('move') || 
                               clipName.includes('forward') || clipName.includes('locomotion') ||
                               clipName.includes('motion')) {
                        // "Motion" is typically a walking animation
                        if (!this.animations['walk']) {
                            this.animations['walk'] = action;
                            console.log(`  → Assigned as WALK: ${clip.name}`);
                        }
                    } else if (clipName.includes('idle') || clipName.includes('stand') || 
                               clipName.includes('breathing') || clipName.includes('wait')) {
                        if (!this.animations['idle']) {
                            this.animations['idle'] = action;
                            console.log(`  → Assigned as IDLE: ${clip.name}`);
                        }
                    }
                });
                
                // If we only have one animation and it's called "Motion", use it as walk
                if (animations.length === 1 && !this.animations['walk'] && !this.animations['idle']) {
                    const clip = animations[0];
                    const clipName = clip.name.toLowerCase();
                    if (clipName.includes('motion') || clipName.includes('walk') || clipName.includes('move')) {
                        this.animations['walk'] = this.mixer.clipAction(clip);
                        console.log(`  → Using as WALK: ${clip.name}`);
                    } else {
                        // Use as both walk and idle if it's the only animation
                        this.animations['walk'] = this.mixer.clipAction(clip);
                        this.animations['idle'] = this.mixer.clipAction(clip);
                        console.log(`  → Using as WALK and IDLE: ${clip.name}`);
                    }
                } else {
                    // If we didn't find a walk animation, use the first non-idle animation
                    if (!this.animations['walk'] && animations.length > 0) {
                        const firstNonIdle = animations.find(clip => {
                            const name = clip.name.toLowerCase();
                            return !name.includes('idle') && !name.includes('stand');
                        });
                        if (firstNonIdle) {
                            this.animations['walk'] = this.mixer.clipAction(firstNonIdle);
                            console.log(`  → Using as WALK (fallback): ${firstNonIdle.name}`);
                        }
                    }
                    
                    // If we didn't find an idle animation, try to find one or use walk
                    if (!this.animations['idle']) {
                        const idleClip = animations.find(clip => {
                            const name = clip.name.toLowerCase();
                            return name.includes('idle') || name.includes('stand');
                        });
                        if (idleClip) {
                            this.animations['idle'] = this.mixer.clipAction(idleClip);
                            console.log(`  → Using as IDLE: ${idleClip.name}`);
                        } else if (this.animations['walk']) {
                            // If no idle, use walk animation but at slower speed
                            this.animations['idle'] = this.animations['walk'];
                            console.log(`  → Using WALK as IDLE (no idle animation found)`);
                        }
                    }
                }
                
                // Play idle animation by default
                if (this.animations['idle']) {
                    this.animations['idle'].play();
                    this.currentAnimation = 'idle';
                }
            }
            
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
        
        // Fallback to enhanced geometric character
        const fallbackGender = this.data.gender || 'male';
        const appearance = this.data.appearance || {};
        const skinTone = appearance.skinTone || 0.5;
        const faceType = appearance.faceType || 0;
        const hairStyle = appearance.hairStyle || 0;
        const facialFeatures = appearance.facialFeatures || 0;
        const hairColor = appearance.hairColor || '#8B4513';
        
        this.createFallbackCharacter(race, fallbackGender, hairColor, skinTone, faceType, hairStyle, facialFeatures);
    }

    createFallbackCharacter(race, gender, hairColor, skinTone, faceType = 0, hairStyle = 0, facialFeatures = 0) {
        // Enhanced fallback character with race and gender-specific features
        const raceProps = this.getRaceProperties(race, gender);
        const isFemale = gender === 'female';
        const skinColor = this.getSkinColor(skinTone, race);
        this.mesh = new THREE.Group();

        // Create torso (more detailed for gender differences)
        const torsoGeometry = new THREE.BoxGeometry(
            raceProps.bodyWidth,
            raceProps.bodyHeight * 0.6,
            raceProps.bodyDepth
        );
        const torsoMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = raceProps.bodyHeight * 0.3;
        torso.castShadow = true;
        this.mesh.add(torso);

        // Create hips (wider for females, narrower for males)
        const hipWidth = isFemale ? raceProps.bodyWidth * 1.1 : raceProps.bodyWidth * 0.9;
        const hipGeometry = new THREE.BoxGeometry(
            hipWidth,
            raceProps.bodyHeight * 0.2,
            raceProps.bodyDepth * 1.1
        );
        const hipMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const hips = new THREE.Mesh(hipGeometry, hipMaterial);
        hips.position.y = raceProps.bodyHeight * 0.1;
        hips.castShadow = true;
        this.mesh.add(hips);

        // Create head with face type variation
        const headSize = raceProps.headSize * (1 + faceType * 0.05);
        const headGeometry = new THREE.BoxGeometry(
            headSize,
            headSize,
            headSize * 0.9
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = raceProps.bodyHeight + headSize / 2;
        head.castShadow = true;
        this.mesh.add(head);

        // Create hair with style variations
        const hairStyles = this.getHairStyleGeometry(hairStyle, headSize, raceProps.hairHeight, isFemale);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor,
            metalness: 0.2,
            roughness: 0.9
        });
        
        hairStyles.forEach((hairGeom, index) => {
            const hair = new THREE.Mesh(hairGeom, hairMaterial);
            hair.position.y = raceProps.bodyHeight + headSize + (index * 0.1);
            this.mesh.add(hair);
        });

        // Race-specific features
        this.addRaceSpecificFeatures(race, gender, raceProps, headSize, skinColor, facialFeatures);

        // Add arms
        const armGeometry = new THREE.BoxGeometry(
            isFemale ? 0.25 : 0.3,
            raceProps.armLength,
            isFemale ? 0.25 : 0.3
        );
        const armMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.1,
            roughness: 0.8
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-raceProps.bodyWidth / 2 - 0.15, raceProps.bodyHeight * 0.6, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(raceProps.bodyWidth / 2 + 0.15, raceProps.bodyHeight * 0.6, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        // Add legs (slightly different for gender)
        const legWidth = isFemale ? 0.35 : 0.4;
        const legGeometry = new THREE.BoxGeometry(legWidth, raceProps.legLength, legWidth);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
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

        // Position fallback character so feet are at y=0
        this.mesh.position.set(0, 0, 0);
        
        // Character starts facing forward (no rotation needed)
        this.mesh.rotation.y = 0; // No initial rotation - character faces -Z (forward in Three.js)
        
        this.scene.add(this.mesh);
    }

    getHairStyleGeometry(hairStyle, headSize, hairHeight, isFemale) {
        const geometries = [];
        
        // Different hair styles based on hairStyle value (0-9)
        switch (hairStyle % 5) {
            case 0: // Short hair
                geometries.push(new THREE.BoxGeometry(headSize * 1.05, hairHeight * 0.8, headSize * 1.05));
                break;
            case 1: // Medium length
                geometries.push(new THREE.BoxGeometry(headSize * 1.1, hairHeight * 1.2, headSize * 1.1));
                break;
            case 2: // Long hair (more common for females)
                if (isFemale) {
                    geometries.push(new THREE.BoxGeometry(headSize * 1.1, hairHeight * 1.5, headSize * 1.1));
                    geometries.push(new THREE.BoxGeometry(headSize * 0.4, hairHeight * 1.2, headSize * 0.3));
                } else {
                    geometries.push(new THREE.BoxGeometry(headSize * 1.1, hairHeight * 1.0, headSize * 1.1));
                }
                break;
            case 3: // Ponytail (if female) or spiky (if male)
                if (isFemale) {
                    geometries.push(new THREE.BoxGeometry(headSize * 1.05, hairHeight * 0.6, headSize * 1.05));
                    geometries.push(new THREE.CylinderGeometry(headSize * 0.15, headSize * 0.1, hairHeight * 0.8, 8));
                } else {
                    geometries.push(new THREE.BoxGeometry(headSize * 1.1, hairHeight * 0.7, headSize * 1.1));
                    for (let i = 0; i < 3; i++) {
                        geometries.push(new THREE.ConeGeometry(0.05, 0.2, 4));
                    }
                }
                break;
            case 4: // Bun (female) or bald/very short (male)
                if (isFemale) {
                    geometries.push(new THREE.SphereGeometry(headSize * 0.2, 8, 8));
                } else {
                    geometries.push(new THREE.BoxGeometry(headSize * 1.02, hairHeight * 0.3, headSize * 1.02));
                }
                break;
        }
        
        return geometries;
    }

    addRaceSpecificFeatures(race, gender, raceProps, headSize, skinColor, facialFeatures) {
        const isFemale = gender === 'female';
        
        switch (race) {
            case 'elf':
                // Pointed ears
                const earHeight = isFemale ? 0.35 : 0.4;
                const earGeometry = new THREE.ConeGeometry(0.12, earHeight, 8);
                const earMaterial = new THREE.MeshStandardMaterial({
                    color: skinColor,
                    metalness: 0.1,
                    roughness: 0.8
                });
                
                const leftEar = new THREE.Mesh(earGeometry, earMaterial);
                leftEar.position.set(-headSize / 2 - 0.08, raceProps.bodyHeight + headSize * 0.6, 0);
                leftEar.rotation.z = -Math.PI / 5;
                this.mesh.add(leftEar);

                const rightEar = new THREE.Mesh(earGeometry, earMaterial);
                rightEar.position.set(headSize / 2 + 0.08, raceProps.bodyHeight + headSize * 0.6, 0);
                rightEar.rotation.z = Math.PI / 5;
                this.mesh.add(rightEar);
                break;

            case 'dwarf':
                // Beard (only for males, or based on facialFeatures for females)
                if (!isFemale || facialFeatures > 5) {
                    const beardSize = isFemale ? 0.3 : 0.5;
                    const beardGeometry = new THREE.BoxGeometry(
                        headSize * 0.7,
                        beardSize,
                        headSize * 0.5
                    );
                    const beardMaterial = new THREE.MeshStandardMaterial({
                        color: '#4a4a4a'
                    });
                    const beard = new THREE.Mesh(beardGeometry, beardMaterial);
                    beard.position.set(0, raceProps.bodyHeight + headSize * 0.2, headSize / 2 + 0.08);
                    this.mesh.add(beard);
                }
                
                // Broader shoulders
                const shoulderGeometry = new THREE.BoxGeometry(
                    raceProps.bodyWidth * 1.2,
                    raceProps.bodyHeight * 0.15,
                    raceProps.bodyDepth * 0.8
                );
                const shoulderMaterial = new THREE.MeshStandardMaterial({
                    color: skinColor,
                    metalness: 0.1,
                    roughness: 0.8
                });
                const shoulders = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
                shoulders.position.y = raceProps.bodyHeight * 0.5;
                this.mesh.add(shoulders);
                break;

            case 'demon':
                // Horns
                const hornSize = isFemale ? 0.5 : 0.6;
                const hornGeometry = new THREE.ConeGeometry(0.08, hornSize, 8);
                const hornMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    metalness: 0.3,
                    roughness: 0.7
                });
                
                const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
                leftHorn.position.set(-headSize * 0.25, raceProps.bodyHeight + headSize + 0.25, 0);
                leftHorn.rotation.z = -Math.PI / 8;
                this.mesh.add(leftHorn);

                const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
                rightHorn.position.set(headSize * 0.25, raceProps.bodyHeight + headSize + 0.25, 0);
                rightHorn.rotation.z = Math.PI / 8;
                this.mesh.add(rightHorn);

                // Reddish skin tint
                const demonSkinColor = new THREE.Color(0.7, 0.4, 0.4);
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (child.material.color && child.material.color.r > 0.5) {
                            child.material.color.lerp(demonSkinColor, 0.3);
                        }
                    }
                });
                break;

            case 'human':
            default:
                // Human characters can have facial features based on facialFeatures value
                if (facialFeatures > 0 && !isFemale) {
                    const facialHairSize = facialFeatures * 0.1;
                    const facialHairGeometry = new THREE.BoxGeometry(
                        headSize * (0.4 + facialHairSize),
                        facialHairSize * 0.3,
                        headSize * 0.2
                    );
                    const facialHairMaterial = new THREE.MeshStandardMaterial({
                        color: '#3a3a3a'
                    });
                    const facialHair = new THREE.Mesh(facialHairGeometry, facialHairMaterial);
                    facialHair.position.set(0, raceProps.bodyHeight + headSize * 0.3, headSize / 2 + 0.05);
                    this.mesh.add(facialHair);
                }
                break;
        }
    }

    async loadModel(race, gender = 'male') {
        // Try new folder structure first: Race/Gender/FullSet.glb
        const raceFolder = race.charAt(0).toUpperCase() + race.slice(1); // Capitalize first letter
        const genderFolder = gender.charAt(0).toUpperCase() + gender.slice(1); // Capitalize first letter
        const extensions = ['.glb', '.gltf'];
        
        // Try new structure: Human/Male/FullSet.glb
        for (const ext of extensions) {
            const modelPath = `assets/characters/${raceFolder}/${genderFolder}/FullSet${ext}`;
            
            try {
                const gltf = await new Promise((resolve, reject) => {
                    // Set the path for resolving relative texture/bin files
                    this.loader.setPath(`assets/characters/${raceFolder}/${genderFolder}/`);
                    
                    this.loader.load(
                        `FullSet${ext}`,
                        (gltf) => {
                            console.log(`Successfully loaded ${modelPath} for game`);
                            console.log(`Animations found: ${gltf.animations.length}`);
                            
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
                            resolve(gltf); // Return full GLTF object with animations
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
                                console.error(`Error: ${modelPath} appears to be an FBX file, not GLB/GLTF. Please convert it to GLB format.`);
                            } else if (error.message && error.message.includes('scene.bin')) {
                                console.error(`Error: ${modelPath} is missing required external files (scene.bin). Make sure all files are in the assets/characters/ folder.`);
                            } else {
                                console.log(`Error loading ${modelPath}:`, error.message || error);
                            }
                            reject(error);
                        }
                    );
                });
                return gltf; // Return full GLTF object
            } catch (error) {
                // Try next extension
                console.log(`Failed to load ${modelPath}, trying next format...`);
                continue;
            }
        }

        // Fallback: Try legacy path format (for backward compatibility)
        for (const ext of extensions) {
            const modelPath = `assets/characters/${race}${ext}`;
            
            try {
                const gltf = await new Promise((resolve, reject) => {
                    // Set the path for resolving relative texture/bin files
                    this.loader.setPath('assets/characters/');
                    
                    this.loader.load(
                        `${race}${ext}`,
                        (gltf) => {
                            console.log(`Successfully loaded ${modelPath} for game (legacy path)`);
                            console.log(`Animations found: ${gltf.animations.length}`);
                            
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
                            resolve(gltf); // Return full GLTF object with animations
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
                return gltf; // Return full GLTF object
            } catch (error) {
                // Try next extension
                console.log(`Failed to load ${modelPath}, trying next format...`);
                continue;
            }
        }
        
        console.log(`Model not found for ${race}/${gender}, using fallback`);
        return null;
    }

    fixMaterialTextures(material) {
        // Fix texture paths if they're broken
        // GLB files should have textures embedded
        if (material.map && material.map.image) {
            // Texture already loaded, no fix needed
        }
    }

    getRaceProperties(race, gender = 'male') {
        const isFemale = gender === 'female';
        const baseProps = {
            human: {
                bodyWidth: isFemale ? 0.9 : 1.0,
                bodyHeight: isFemale ? 1.15 : 1.2,
                bodyDepth: isFemale ? 0.55 : 0.6,
                headSize: isFemale ? 0.55 : 0.6,
                hairHeight: 0.3,
                armLength: isFemale ? 0.95 : 1.0,
                legLength: isFemale ? 1.15 : 1.2
            },
            elf: {
                bodyWidth: isFemale ? 0.85 : 0.9,
                bodyHeight: isFemale ? 1.35 : 1.4,
                bodyDepth: isFemale ? 0.45 : 0.5,
                headSize: isFemale ? 0.5 : 0.55,
                hairHeight: 0.35,
                armLength: isFemale ? 1.05 : 1.1,
                legLength: isFemale ? 1.25 : 1.3
            },
            dwarf: {
                bodyWidth: isFemale ? 1.1 : 1.2,
                bodyHeight: isFemale ? 0.95 : 1.0,
                bodyDepth: isFemale ? 0.65 : 0.7,
                headSize: isFemale ? 0.65 : 0.7,
                hairHeight: 0.3,
                armLength: isFemale ? 0.85 : 0.9,
                legLength: isFemale ? 0.85 : 0.9
            },
            demon: {
                bodyWidth: isFemale ? 1.0 : 1.1,
                bodyHeight: isFemale ? 1.25 : 1.3,
                bodyDepth: isFemale ? 0.55 : 0.6,
                headSize: isFemale ? 0.6 : 0.65,
                hairHeight: 0.3,
                armLength: isFemale ? 1.05 : 1.1,
                legLength: isFemale ? 1.15 : 1.2
            }
        };
        return baseProps[race] || baseProps.human;
    }

    getSkinColor(skinToneOrRace, race = null) {
        // Support both signatures: getSkinColor(race) or getSkinColor(skinTone, race)
        let tone;
        let actualRace;
        
        if (race === null) {
            // Old signature: getSkinColor(race) - uses this.data.appearance.skinTone
            actualRace = skinToneOrRace;
            tone = this.data.appearance ? (this.data.appearance.skinTone || 0.5) : 0.5;
        } else {
            // New signature: getSkinColor(skinTone, race)
            tone = skinToneOrRace;
            actualRace = race;
        }
        
        let baseColor;
        
        switch(actualRace) {
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

    move(direction, isRunning = false) {
        // Normalize direction and apply speed
        direction.normalize();
        
        // Check if we can run (need energy >= minEnergyToRun)
        if (isRunning && this.energy < this.minEnergyToRun) {
            isRunning = false; // Force walking if not enough energy
        }
        
        // Set running state and adjust speed
        this.isRunning = isRunning;
        if (isRunning) {
            this.speed = this.baseSpeed * 1.5;
        } else {
            this.speed = this.baseSpeed;
        }
        
        this.velocity.x = direction.x * this.speed;
        this.velocity.z = direction.z * this.speed;
        
        // Clear click-to-move target when using keyboard
        this.targetPosition = null;
        
        // Update moving state for animation
        const wasMoving = this.isMoving;
        const wasRunning = this.isRunning;
        this.isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1;
        
        // Switch animations based on movement or running state change
        if (this.isMoving !== wasMoving || this.isRunning !== wasRunning) {
            this.updateAnimation();
        }
    }
    
    moveTo(targetPosition, isRunning = false) {
        // Check if we can run (need energy >= minEnergyToRun)
        if (isRunning && this.energy < this.minEnergyToRun) {
            isRunning = false; // Force walking if not enough energy
        }
        
        // Set target position for click-to-move
        this.targetPosition = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        this.isRunning = isRunning;
        
        // Adjust speed for running
        if (isRunning) {
            this.speed = this.baseSpeed * 1.5;
        } else {
            this.speed = this.baseSpeed;
        }
        
        // Update animation immediately
        if (this.isMoving !== true) {
            this.isMoving = true;
            this.updateAnimation();
        }
    }
    
    updateAnimation() {
        if (!this.mixer) return;
        
        // Determine which animation to play
        let targetAnimation = null;
        if (this.isMoving) {
            if (this.isRunning && this.animations['run']) {
                targetAnimation = 'run';
            } else if (this.animations['walk']) {
                targetAnimation = 'walk';
            }
        } else {
            if (this.animations['idle']) {
                targetAnimation = 'idle';
            }
        }
        
        // Only switch if animation changed
        if (targetAnimation && targetAnimation !== this.currentAnimation) {
            // Fade out current animation
            if (this.currentAnimation && this.animations[this.currentAnimation]) {
                this.animations[this.currentAnimation].fadeOut(0.2);
            }
            
            // Play new animation
            if (this.animations[targetAnimation]) {
                const action = this.animations[targetAnimation];
                action.reset().fadeIn(0.2).play();
                
                // Adjust speed for running
                if (targetAnimation === 'run' || (targetAnimation === 'walk' && this.isRunning)) {
                    action.timeScale = 1.5; // Run animation 1.5x faster
                } else {
                    action.timeScale = 1.0; // Normal speed
                }
                
                this.currentAnimation = targetAnimation;
                console.log(`Playing ${targetAnimation} animation`);
            }
        }
    }

    rotate(angle) {
        this.mesh.rotation.y += angle;
    }

    update(deltaTime) {
        if (!this.mesh) return;
        
        // Update energy system
        this.updateEnergy(deltaTime);
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Handle click-to-move
        if (this.targetPosition) {
            const currentPos = this.mesh.position;
            const direction = new THREE.Vector3(
                this.targetPosition.x - currentPos.x,
                0,
                this.targetPosition.z - currentPos.z
            );
            
            const distance = direction.length();
            
            if (distance > this.moveThreshold) {
                // Move towards target
                direction.normalize();
                this.velocity.x = direction.x * this.speed;
                this.velocity.z = direction.z * this.speed;
                
                // Rotate character to face movement direction
                // Use -direction.z because character models often face -Z by default
                const targetAngle = Math.atan2(-direction.x, -direction.z);
                let currentAngle = this.mesh.rotation.y;
                let angleDiff = targetAngle - currentAngle;
                
                // Normalize angle difference to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // Smoothly rotate towards target
                this.mesh.rotation.y += angleDiff * 0.15;
                
                // Update moving state and animation
                if (!this.isMoving) {
                    this.isMoving = true;
                    this.updateAnimation();
                }
            } else {
                // Reached target
                this.targetPosition = null;
                this.isRunning = false;
                this.speed = this.baseSpeed; // Reset to base speed
                this.velocity.x = 0;
                this.velocity.z = 0;
                if (this.isMoving) {
                    this.isMoving = false;
                    this.updateAnimation();
                }
            }
        }
        
        // Apply velocity
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;

        // Keep character on ground (y=0 is ground level)
        // For 3D models, the mesh is already positioned so feet are at y=0
        // For fallback geometry, we need to maintain the correct height
        if (this.mesh.position.y < 0) {
            this.mesh.position.y = 0;
        }

        // Apply friction (only if not moving to target)
        if (!this.targetPosition) {
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
            
            // Update animation state if velocity changed (for keyboard movement)
            const isMovingNow = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1;
            if (isMovingNow !== this.isMoving) {
                this.isMoving = isMovingNow;
                this.updateAnimation();
            }
        }
    }

    updateEnergy(deltaTime) {
        // Deplete energy when running
        if (this.isRunning && this.isMoving) {
            this.energy -= this.energyDepletionRate * deltaTime;
            if (this.energy <= 0) {
                this.energy = 0;
                // Force stop running if energy depleted
                this.isRunning = false;
                this.speed = this.baseSpeed;
                this.updateAnimation();
            }
        }
        
        // Regenerate energy when not running (only if below max)
        if (!this.isRunning && this.energy < this.maxEnergy) {
            this.energyRegenTimer += deltaTime;
            
            // Regenerate 1 energy every 10 seconds
            if (this.energyRegenTimer >= this.energyRegenInterval) {
                this.energy += this.energyRegenRate;
                if (this.energy > this.maxEnergy) {
                    this.energy = this.maxEnergy;
                }
                this.energyRegenTimer = 0; // Reset timer
            }
        } else if (this.isRunning) {
            // Reset regeneration timer when running
            this.energyRegenTimer = 0;
        }
    }

    getData() {
        return this.data;
    }
    
    getEnergy() {
        return {
            current: Math.floor(this.energy),
            max: this.maxEnergy,
            regenTimer: this.energyRegenTimer,
            regenInterval: this.energyRegenInterval
        };
    }
}

