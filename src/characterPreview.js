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
        this.currentModel = null;
        this.loader = new GLTFLoader();
        this.animationId = null;
        this.loadedModels = {}; // Cache loaded models
        
        this.init();
    }

    init() {
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.canvas.clientWidth / this.canvas.clientHeight,
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

        // Create initial character (fallback to simple if no model)
        this.updateCharacter('human', '#8B4513', 0.5);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    async loadModel(race) {
        // Check cache first
        if (this.loadedModels[race]) {
            const cloned = this.loadedModels[race].clone(true); // Deep clone to preserve all properties
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

        // Try to load model from assets - try GLB first (preferred), then GLTF
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
                this.loadedModels[race] = gltf.scene.clone(true);
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
        // GLB files should have textures embedded, so this is mainly for GLTF
        if (material.map && material.map.image) {
            // Texture already loaded, no fix needed
        }
    }

    async updateCharacter(race, hairColor, skinTone) {
        // Remove old character
        if (this.characterGroup) {
            this.scene.remove(this.characterGroup);
        }

        this.currentRace = race;
        this.characterGroup = new THREE.Group();

        // Try to load 3D model
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
            this.createFallbackCharacter(race, hairColor, skinTone);
        }

        this.scene.add(this.characterGroup);
    }

    createFallbackCharacter(race, hairColor, skinTone) {
        // Simple fallback character (original code)
        const raceProps = this.getRaceProperties(race);

        // Create body
        const bodyGeometry = new THREE.BoxGeometry(
            raceProps.bodyWidth,
            raceProps.bodyHeight,
            raceProps.bodyDepth
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(skinTone, race),
            metalness: 0.1,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = raceProps.bodyHeight / 2;
        body.castShadow = true;
        this.characterGroup.add(body);

        // Create head
        const headGeometry = new THREE.BoxGeometry(
            raceProps.headSize,
            raceProps.headSize,
            raceProps.headSize
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(skinTone, race),
            metalness: 0.1,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = raceProps.bodyHeight + raceProps.headSize / 2;
        head.castShadow = true;
        this.characterGroup.add(head);

        // Create hair
        const hairGeometry = new THREE.BoxGeometry(
            raceProps.headSize * 1.1,
            raceProps.hairHeight,
            raceProps.headSize * 1.1
        );
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = raceProps.bodyHeight + raceProps.headSize + raceProps.hairHeight / 2;
        this.characterGroup.add(hair);

        // Add arms and legs (simplified)
        const armGeometry = new THREE.BoxGeometry(0.3, raceProps.armLength, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(skinTone, race),
            metalness: 0.1,
            roughness: 0.8
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-raceProps.bodyWidth / 2 - 0.15, raceProps.bodyHeight * 0.7, 0);
        leftArm.castShadow = true;
        this.characterGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(raceProps.bodyWidth / 2 + 0.15, raceProps.bodyHeight * 0.7, 0);
        rightArm.castShadow = true;
        this.characterGroup.add(rightArm);

        const legGeometry = new THREE.BoxGeometry(0.4, raceProps.legLength, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: this.getSkinColor(skinTone, race),
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
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
