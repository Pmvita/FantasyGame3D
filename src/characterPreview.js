// 3D Character Preview for Character Creation
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class CharacterPreview {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.characterMesh = null;
        this.characterGroup = null;
        this.currentRace = 'human';
        this.currentGender = 'male'; // 'male' or 'female'
        this.currentModel = null;
        this.loader = new GLTFLoader();
        this.animationId = null;
        this.loadedModels = {}; // Cache loaded models by race-gender key
        
        this.init();
    }

    init() {
        // Get initial canvas dimensions
        const initialWidth = this.canvas.clientWidth || this.canvas.offsetWidth || 400;
        const initialHeight = this.canvas.clientHeight || this.canvas.offsetHeight || 400;
        const initialAspect = initialWidth / initialHeight || 1;
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            initialAspect,
            0.1,
            1000
        );
        // Default camera position (will be adjusted when model loads)
        this.camera.position.set(0, 2, 6);
        this.camera.lookAt(0, 1, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add a subtle rotation light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5d23,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Ensure canvas is properly sized on initialization
        // Wait a frame to ensure CSS has been applied
        requestAnimationFrame(() => {
            const canvasWidth = this.canvas.clientWidth || this.canvas.offsetWidth || 400;
            const canvasHeight = this.canvas.clientHeight || this.canvas.offsetHeight || 400;
            if (canvasWidth > 0 && canvasHeight > 0) {
                this.onResize(canvasWidth, canvasHeight);
            }
        });

        // Create initial character (fallback to simple if no model)
        this.updateCharacter('human', 'male', '#8B4513', 0.5, 0, 0, 0);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Handle container resize (more responsive than window resize)
        this.setupResizeObserver();
    }

    setupResizeObserver() {
        // Use ResizeObserver to watch the canvas for size changes
        // This is more accurate than window resize events
        if (!this.canvas) {
            console.warn('Character preview canvas not found');
            return;
        }

        // Initialize timeout reference
        this.resizeTimeout = null;
        
        this.resizeObserver = new ResizeObserver((entries) => {
            // Clear any pending resize
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            // Debounce resize calls to avoid performance issues
            this.resizeTimeout = setTimeout(() => {
                // Always use the canvas's actual client dimensions
                // This ensures we get the CSS-computed size, not the container size
                const canvasWidth = this.canvas.clientWidth;
                const canvasHeight = this.canvas.clientHeight;
                
                if (canvasWidth > 0 && canvasHeight > 0) {
                    // Use requestAnimationFrame to ensure this happens after layout
                    requestAnimationFrame(() => {
                        this.onResize(canvasWidth, canvasHeight);
                    });
                }
            }, 16); // ~60fps debounce
        });

        // Observe the canvas element directly to get its actual rendered size
        this.resizeObserver.observe(this.canvas);
        
        // Also observe the container in case the canvas size is constrained by it
        const container = this.canvas.parentElement;
        if (container) {
            this.resizeObserver.observe(container);
        }
    }

    async loadModel(race, gender = 'male') {
        const cacheKey = `${race}-${gender}`;
        
        // Check cache first
        if (this.loadedModels[cacheKey]) {
            const cloned = this.loadedModels[cacheKey].clone(true); // Deep clone to preserve all properties
            // Reset transformations on clone
            cloned.scale.set(1, 1, 1);
            cloned.position.set(0, 0, 0);
            cloned.rotation.set(0, 0, 0);
            // Reset all children transformations
            cloned.traverse((child) => {
                if (child !== cloned) {
                    child.scale.set(1, 1, 1);
                }
            });
            return cloned;
        }

        // Try to load model from new folder structure: Race/Gender/FullSet.glb
        const raceFolder = race.charAt(0).toUpperCase() + race.slice(1); // Capitalize first letter
        const genderFolder = gender.charAt(0).toUpperCase() + gender.slice(1); // Capitalize first letter
        const extensions = ['.glb', '.gltf'];
        
        // Try new structure first: Human/Male/FullSet.glb
        for (const ext of extensions) {
            const modelPath = `assets/characters/${raceFolder}/${genderFolder}/FullSet${ext}`;
            
            try {
                const gltf = await new Promise((resolve, reject) => {
                    // Set the path for resolving relative texture/bin files
                    this.loader.setPath(`assets/characters/${raceFolder}/${genderFolder}/`);
                    
                    this.loader.load(
                        `FullSet${ext}`,
                        (gltf) => {
                            console.log(`Successfully loaded ${modelPath}`);
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
                            // Loading progress (optional)
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

                // Cache the original model (before scaling)
                this.loadedModels[cacheKey] = gltf.scene.clone(true);
                return gltf.scene;
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
                            console.log(`Successfully loaded ${modelPath} (legacy path)`);
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
                            // Loading progress (optional)
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

                // Cache the original model (before scaling)
                this.loadedModels[cacheKey] = gltf.scene.clone(true);
                return gltf.scene;
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
        // GLB files should have textures embedded, so this is mainly for GLTF
        if (material.map && material.map.image) {
            // Texture already loaded, no fix needed
        }
    }

    async updateCharacter(race, gender, hairColor, skinTone, faceType = 0, hairStyle = 0, facialFeatures = 0) {
        // Remove old character
        if (this.characterGroup) {
            this.scene.remove(this.characterGroup);
        }

        this.currentRace = race;
        this.currentGender = gender;
        this.characterGroup = new THREE.Group();

        // Try to load 3D model
        const model = await this.loadModel(race, gender);
        
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
            
            console.log(`Model ${race} - Size:`, size, 'Center:', center);
            
            // Check if size is valid
            if (size.y <= 0 || !isFinite(size.y) || size.y > 1000) {
                console.warn(`Invalid model size for ${race} (${size.y}), using default scale`);
                // If model is huge, scale it down significantly
                const defaultScale = size.y > 1000 ? 0.01 : 1.0;
                model.scale.set(defaultScale, defaultScale, defaultScale);
                
                // Recalculate after scaling
                box.setFromObject(model);
                const scaledSize = box.getSize(new THREE.Vector3());
                const bottomY = box.min.y;
                
                // Position so bottom of model is at y=0 (ground level)
                model.position.set(-box.getCenter(new THREE.Vector3()).x, -bottomY, -box.getCenter(new THREE.Vector3()).z);
            } else {
                // Target height for preview (around 2.5 units)
                const targetHeight = 2.5;
                const scale = targetHeight / size.y;
                
                console.log(`Scaling ${race} by ${scale} (target height: ${targetHeight}, actual height: ${size.y})`);
                
                // Apply scale
                model.scale.set(scale, scale, scale);
                
                // Recalculate after scaling
                box.setFromObject(model);
                const scaledSize = box.getSize(new THREE.Vector3());
                const bottomY = box.min.y;
                const centerX = box.getCenter(new THREE.Vector3()).x;
                const centerZ = box.getCenter(new THREE.Vector3()).z;
                
                // Position so bottom of model is at y=0 (ground level), centered on X and Z
                model.position.set(-centerX, -bottomY, -centerZ);
                
                // Adjust camera to frame the character nicely
                const maxDimension = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
                const cameraDistance = maxDimension * 3;
                this.camera.position.set(0, scaledSize.y * 0.6, cameraDistance);
                this.camera.lookAt(0, scaledSize.y * 0.3, 0);
            }
            
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Apply customization if possible
                    if (child.material) {
                        // Try to update hair color
                        if (child.material.name && child.material.name.toLowerCase().includes('hair')) {
                            child.material.color.setStyle(hairColor);
                        }
                        // Try to update skin tone
                        if (child.material.name && child.material.name.toLowerCase().includes('skin')) {
                            const skinColor = this.getSkinColor(skinTone, race);
                            child.material.color.copy(skinColor);
                        }
                    }
                }
            });
            
            this.characterGroup.add(model);
        } else {
            // Fallback to simple geometry if model not found
            this.createFallbackCharacter(race, gender, hairColor, skinTone, faceType, hairStyle, facialFeatures);
        }

        this.scene.add(this.characterGroup);
    }

    createFallbackCharacter(race, gender, hairColor, skinTone, faceType = 0, hairStyle = 0, facialFeatures = 0) {
        // Enhanced fallback character with race and gender-specific features
        const raceProps = this.getRaceProperties(race, gender);
        const isFemale = gender === 'female';
        const skinColor = this.getSkinColor(skinTone, race);

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
        this.characterGroup.add(torso);

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
        this.characterGroup.add(hips);

        // Create head with face type variation
        const headSize = raceProps.headSize * (1 + faceType * 0.05); // Slight variation based on face type
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
        this.characterGroup.add(head);

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
            this.characterGroup.add(hair);
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
        this.characterGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(raceProps.bodyWidth / 2 + 0.15, raceProps.bodyHeight * 0.6, 0);
        rightArm.castShadow = true;
        this.characterGroup.add(rightArm);

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
        this.characterGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(raceProps.bodyWidth / 3, raceProps.legLength / 2, 0);
        rightLeg.castShadow = true;
        this.characterGroup.add(rightLeg);

        // Scale and position the entire character group
        const totalHeight = raceProps.bodyHeight + headSize + raceProps.hairHeight;
        const targetHeight = 2.5;
        const scale = targetHeight / totalHeight;
        this.characterGroup.scale.set(scale, scale, scale);
        
        // Position so feet are at y=0
        const scaledLegHeight = raceProps.legLength * scale;
        this.characterGroup.position.y = scaledLegHeight / 2;
        
        // Adjust camera for fallback character
        this.camera.position.set(0, totalHeight * scale * 0.4, 6);
        this.camera.lookAt(0, totalHeight * scale * 0.2, 0);
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
                    // Add side hair
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
                    // Add spikes
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
                this.characterGroup.add(leftEar);

                const rightEar = new THREE.Mesh(earGeometry, earMaterial);
                rightEar.position.set(headSize / 2 + 0.08, raceProps.bodyHeight + headSize * 0.6, 0);
                rightEar.rotation.z = Math.PI / 5;
                this.characterGroup.add(rightEar);
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
                        color: '#4a4a4a' // Dark beard color
                    });
                    const beard = new THREE.Mesh(beardGeometry, beardMaterial);
                    beard.position.set(0, raceProps.bodyHeight + headSize * 0.2, headSize / 2 + 0.08);
                    this.characterGroup.add(beard);
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
                this.characterGroup.add(shoulders);
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
                this.characterGroup.add(leftHorn);

                const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
                rightHorn.position.set(headSize * 0.25, raceProps.bodyHeight + headSize + 0.25, 0);
                rightHorn.rotation.z = Math.PI / 8;
                this.characterGroup.add(rightHorn);

                // Reddish skin tint
                const demonSkinColor = new THREE.Color(0.7, 0.4, 0.4);
                this.characterGroup.traverse((child) => {
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
                    // Add facial hair variations
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
                    this.characterGroup.add(facialHair);
                }
                break;
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

    getSkinColor(tone, race) {
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

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate character slowly - ensure it always rotates
        if (this.characterGroup && this.characterGroup.children.length > 0) {
            this.characterGroup.rotation.y += 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        // Use actual canvas dimensions
        const width = this.canvas.clientWidth || this.canvas.offsetWidth;
        const height = this.canvas.clientHeight || this.canvas.offsetHeight;
        
        if (width > 0 && height > 0) {
            this.onResize(width, height);
        }
    }

    onResize(width, height) {
        if (width <= 0 || height <= 0) {
            console.warn('Invalid canvas dimensions:', width, height);
            return;
        }
        
        // Ensure we have valid dimensions
        const actualWidth = Math.max(width, 1);
        const actualHeight = Math.max(height, 1);
        
        // Get device pixel ratio (cap at 2 for performance)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        // Update renderer size FIRST - this sets the internal canvas resolution
        // The third parameter (false) means don't update CSS size, which is handled by CSS
        // This ensures the canvas internal resolution (width/height attributes) matches
        // the display size (CSS width/height) multiplied by devicePixelRatio
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(actualWidth, actualHeight, false);
        
        // Update camera aspect ratio AFTER renderer is resized
        if (this.camera) {
            this.camera.aspect = actualWidth / actualHeight;
            this.camera.updateProjectionMatrix();
        }
        
        // Verify the canvas internal resolution matches what we set
        // The canvas.width and canvas.height should now be actualWidth * dpr and actualHeight * dpr
        const expectedWidth = Math.round(actualWidth * dpr);
        const expectedHeight = Math.round(actualHeight * dpr);
        
        if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
            // Force update if there's a mismatch (shouldn't happen, but safety check)
            this.canvas.width = expectedWidth;
            this.canvas.height = expectedHeight;
            this.renderer.setSize(actualWidth, actualHeight, false);
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Clean up ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // Remove window resize listener
        if (this.boundResizeHandler) {
            window.removeEventListener('resize', this.boundResizeHandler);
            this.boundResizeHandler = null;
        }
        
        // Dispose Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clear loaded models cache
        this.loadedModels = {};
    }
}
