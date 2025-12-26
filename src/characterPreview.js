// 3D Character Preview for Character Creation
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getEquipmentScaleOverride } from './equipmentScaling.js';

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
        
        // Interactive controls (WoW-style)
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.rotationSpeed = 0.005; // Rotation speed when dragging
        this.autoRotate = true; // Auto-rotation enabled by default
        this.autoRotateSpeed = 0.008; // Slower auto-rotation
        this.zoomLevel = 1.0; // Current zoom level (1.0 = default)
        this.minZoom = 0.5; // Minimum zoom (closer)
        this.maxZoom = 2.0; // Maximum zoom (farther)
        this.targetZoom = 1.0;
        this.baseCameraDistance = 7; // Base camera distance
        this.cameraDistance = this.baseCameraDistance;
        this.cameraAngleX = 0; // Vertical angle (pitch)
        this.cameraAngleY = 0; // Horizontal angle (yaw)
        this.targetCameraAngleY = 0;
        
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
        // Default camera position - positioned to see full character
        this.baseCameraDistance = 7;
        this.cameraDistance = this.baseCameraDistance;
        this.zoomLevel = 1.0;
        this.targetZoom = 1.0;
        this.characterCenterY = 1.25; // Default character center
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
        this.targetCameraAngleY = 0;
        
        // Set initial camera position manually (updateCameraPosition will be called after renderer is created)
        this.camera.position.set(0, 1.25, 7);
        this.camera.lookAt(0, 1.25, 0);

        // Create renderer with enhanced settings for realistic character preview
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for realism
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Proper color space
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better tone mapping
        this.renderer.toneMappingExposure = 1.2; // Slightly brighter exposure

        // Enhanced professional lighting setup (WoW-style character preview)
        // Main key light (bright, warm, from front-right)
        const keyLight = new THREE.DirectionalLight(0xfff8e1, 1.2);
        keyLight.position.set(5, 8, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -10;
        keyLight.shadow.camera.right = 10;
        keyLight.shadow.camera.top = 10;
        keyLight.shadow.camera.bottom = -10;
        keyLight.shadow.bias = -0.0001;
        this.scene.add(keyLight);

        // Fill light (softer, cooler, from front-left to reduce harsh shadows)
        const fillLight = new THREE.DirectionalLight(0xb3d9ff, 0.5);
        fillLight.position.set(-4, 6, 5);
        this.scene.add(fillLight);

        // Rim light (backlight for character edge definition)
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(-3, 4, -8);
        this.scene.add(rimLight);

        // Ambient light (subtle overall illumination)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Additional point lights for character details
        const pointLight1 = new THREE.PointLight(0xfff8e1, 0.5, 15);
        pointLight1.position.set(3, 3, 3);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xb3d9ff, 0.3, 15);
        pointLight2.position.set(-3, 3, 3);
        this.scene.add(pointLight2);

        // No pedestal - character will stand on ground plane
        // Create invisible ground plane for shadows only
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 1.0,
            metalness: 0.0,
            visible: false // Make ground invisible but still receive shadows
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Initialize character center Y (will be updated when character loads)
        this.characterCenterY = 1.25;

        // Ensure canvas is properly sized on initialization
        // Wait a frame to ensure CSS has been applied
        requestAnimationFrame(() => {
            const canvasWidth = this.canvas.clientWidth || this.canvas.offsetWidth || 400;
            const canvasHeight = this.canvas.clientHeight || this.canvas.offsetHeight || 400;
            if (canvasWidth > 0 && canvasHeight > 0) {
                this.onResize(canvasWidth, canvasHeight);
            }
        });

        // Setup interactive controls (WoW-style)
        this.setupInteractiveControls();

        // Note: Initial character will be created by UI when character creation screen is shown
        // This allows the UI to set the correct default values

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Handle container resize (more responsive than window resize)
        this.setupResizeObserver();
    }
    
    setupInteractiveControls() {
        // Mouse drag to rotate character
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
                this.autoRotate = false; // Disable auto-rotate while dragging
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                
                // Rotate character horizontally
                this.targetCameraAngleY -= deltaX * this.rotationSpeed;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
                // Optionally re-enable auto-rotate after a delay
                // this.autoRotate = true;
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Mouse wheel to zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY > 0 ? 0.1 : -0.1;
            this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + zoomDelta));
            this.autoRotate = false; // Disable auto-rotate when zooming
        });
        
        // Set initial cursor style
        this.canvas.style.cursor = 'grab';
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

    /**
     * Load a single equipment item from the specified folder
     * @param {string} classPath - Base path to the class folder (e.g., 'assets/Classes/Warrior/C-Rank/Warrior/Male')
     * @param {string} equipmentType - Type of equipment (Armour, Boots, Cape, Helmet, Weapon) - capitalized
     * @param {string} className - The class name (for generating file name patterns)
     * @param {string} gender - The character gender ('male' or 'female')
     * @returns {Promise<THREE.Group|null>} Loaded equipment model or null if not found
     */
    async loadEquipmentItem(classPath, equipmentType, className = null, gender = 'male') {
        // Handle both capitalized and lowercase folder names
        // EquipmentType can be 'Armour' (capitalized) or 'weapon' (lowercase)
        // Folders are capitalized, so we need to capitalize the equipment type for the path
        const equipmentTypeCapitalized = equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1);
        const equipmentPath = `${classPath}/${equipmentTypeCapitalized}/`;
        const classNameCapitalized = className ? className.charAt(0).toUpperCase() + className.slice(1) : '';
        const genderCapitalized = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '';
        
        try {
            // Try multiple naming patterns based on common conventions
            // New structure uses: "{Class} {EquipmentType} {Gender}.glb" (e.g., "Warrior Armour Male.glb")
            const possibleNames = [];
            
            // Add gender-specific class names (e.g., "Warrior Armour Male.glb", "Warrior Armour Female.glb")
            if (className && gender) {
                possibleNames.push(`${classNameCapitalized} ${equipmentTypeCapitalized} ${genderCapitalized}.glb`);
            }
            
            // Add class-specific names without gender (e.g., "Warrior Armour.glb")
            if (className) {
                possibleNames.push(`${classNameCapitalized} ${equipmentTypeCapitalized}.glb`);
            }
            
            // Add generic capitalized names
            possibleNames.push(`${equipmentTypeCapitalized}.glb`);
            
            // Add specific variations for each equipment type
            if (equipmentType === 'Armour') {
                if (className && gender) {
                    possibleNames.push(`${classNameCapitalized} Armour ${genderCapitalized}.glb`);
                    possibleNames.push(`${classNameCapitalized} Armor ${genderCapitalized}.glb`);
                }
                if (className) {
                    possibleNames.push(`${classNameCapitalized} Armour.glb`);
                    possibleNames.push(`${classNameCapitalized} Armor.glb`);
                }
                possibleNames.push('Armour.glb');
                possibleNames.push('Armor.glb');
            } else if (equipmentType.toLowerCase() === 'weapon' || equipmentType === 'Weapon') {
                // Add weapon-specific names
                if (className) {
                    possibleNames.push(`${classNameCapitalized} Sword.glb`);
                    possibleNames.push(`${classNameCapitalized} Weapon.glb`);
                }
                if (className === 'mage') {
                    possibleNames.push('Mage Staff.glb');
                    possibleNames.push('Staff.glb');
                }
                possibleNames.push('Sword.glb');
                possibleNames.push('Weapon.glb');
            } else if (equipmentType === 'Helmet') {
                possibleNames.push('Helmet.glb');
                possibleNames.push('Hat.glb');
            } else if (equipmentType === 'Boots') {
                possibleNames.push('Boots.glb');
                possibleNames.push('Shoes.glb');
            } else if (equipmentType === 'Cape') {
                possibleNames.push('Cape.glb');
                possibleNames.push('Cloak.glb');
            }
            
            // Try lowercase version
            const equipmentTypeLower = equipmentType.toLowerCase();
            possibleNames.push(`${equipmentTypeLower}.glb`);

            for (const fileName of possibleNames) {
                try {
                    const gltf = await new Promise((resolve, reject) => {
                        this.loader.setPath(equipmentPath);
                        this.loader.load(
                            fileName,
                            (gltf) => resolve(gltf),
                            undefined,
                            (error) => reject(error)
                        );
                    });

                    if (gltf && gltf.scene) {
                        console.log(`Loaded equipment: ${equipmentType} from ${equipmentPath}${fileName}`);
                        return gltf.scene;
                    }
                } catch (error) {
                    // Try next filename
                    continue;
                }
            }

            // Equipment not found - this is OK, we'll just skip it
            console.log(`Equipment ${equipmentType} not found in ${equipmentPath} (tried ${possibleNames.length} patterns)`);
            return null;
        } catch (error) {
            console.log(`Error loading equipment ${equipmentType}:`, error.message);
            return null;
        }
    }

    /**
     * Load all equipment for a class from the Classes folder
     * @param {string} className - The class name (warrior, mage, healer)
     * @param {string} classRank - The class rank (null or empty for C-Rank base class, or specific rank name)
     * @param {string} gender - The character gender ('male' or 'female')
     * @returns {Promise<Object>} Object containing loaded equipment items
     */
    async loadClassEquipment(className, classRank = null, gender = 'male') {
        // Determine the class path
        // New structure: assets/Classes/{ClassName}/{Rank}/{ClassName}/{Gender}/
        // For base class (C-Rank), path is: assets/Classes/{ClassName}/C-Rank/{ClassName}/{Gender}/
        // For specific ranks, it would be: assets/Classes/{ClassName}/{Rank}/{RankName}/{Gender}/
        
        const classNameCapitalized = className.charAt(0).toUpperCase() + className.slice(1);
        const genderCapitalized = gender.charAt(0).toUpperCase() + gender.slice(1);
        let classPath;
        
        if (!classRank || classRank === '' || classRank.toLowerCase() === 'c-rank') {
            // Base class (C-Rank)
            classPath = `assets/Classes/${classNameCapitalized}/C-Rank/${classNameCapitalized}/${genderCapitalized}`;
        } else {
            // Specific rank - extract rank name from option value
            // Option values are like "Warrior (C-Rank)", "Knight (B-Rank)", etc.
            const rankMatch = classRank.match(/^([^(]+)\s*\(/);
            const rankName = rankMatch ? rankMatch[1].trim() : classRank;
            
            // Determine rank folder (C-Rank, B-Rank, A-Rank, etc.)
            let rankFolder = 'C-Rank';
            if (classRank.includes('(B-Rank)')) rankFolder = 'B-Rank';
            else if (classRank.includes('(A-Rank)')) rankFolder = 'A-Rank';
            else if (classRank.includes('(S-Rank)')) rankFolder = 'S-Rank';
            else if (classRank.includes('(SS-Rank)')) rankFolder = 'SS-Rank';
            else if (classRank.includes('(SSS-Rank)')) rankFolder = 'SSS-Rank';
            
            classPath = `assets/Classes/${classNameCapitalized}/${rankFolder}/${rankName}/${genderCapitalized}`;
        }

        console.log(`Loading equipment from: ${classPath}`);

        // Determine base class path (without gender) for weapon (weapon is at root level, not in gender folder)
        // classNameCapitalized is already declared above, reuse it
        let baseClassPath;
        if (!classRank || classRank === '' || classRank.toLowerCase() === 'c-rank') {
            baseClassPath = `assets/Classes/${classNameCapitalized}/C-Rank/${classNameCapitalized}`;
        } else {
            const rankMatch = classRank.match(/^([^(]+)\s*\(/);
            const rankName = rankMatch ? rankMatch[1].trim() : classRank;
            let rankFolder = 'C-Rank';
            if (classRank.includes('(B-Rank)')) rankFolder = 'B-Rank';
            else if (classRank.includes('(A-Rank)')) rankFolder = 'A-Rank';
            else if (classRank.includes('(S-Rank)')) rankFolder = 'S-Rank';
            else if (classRank.includes('(SS-Rank)')) rankFolder = 'SS-Rank';
            else if (classRank.includes('(SSS-Rank)')) rankFolder = 'SSS-Rank';
            baseClassPath = `assets/Classes/${classNameCapitalized}/${rankFolder}/${rankName}`;
        }

        // Load all equipment types in parallel
        // Equipment folders are now capitalized: Armour, Boots, Cape, Helmet (in gender folders)
        // Weapon is at root level (not gender-specific)
        const [armour, boots, cape, helmet, weapon] = await Promise.all([
            this.loadEquipmentItem(classPath, 'Armour', className, gender),
            this.loadEquipmentItem(classPath, 'Boots', className, gender),
            this.loadEquipmentItem(classPath, 'Cape', className, gender),
            this.loadEquipmentItem(classPath, 'Helmet', className, gender),
            this.loadEquipmentItem(baseClassPath, 'weapon', className, gender) // Weapon at root level
        ]);

        return {
            armour,
            boots,
            cape,
            helmet,
            weapon,
            classPath // Return the path used for debugging
        };
    }

    async updateCharacter(race, gender, hairColor, skinTone, faceType = 0, hairStyle = 0, facialFeatures = 0, eyeColor = '#4A90E2', raceFeatures = 0, className = null, classRank = null) {
        // Remove old character
        if (this.characterGroup) {
            this.scene.remove(this.characterGroup);
        }

        this.currentRace = race;
        this.currentGender = gender;
        this.characterGroup = new THREE.Group();

        // Try to load 3D model
        const model = await this.loadModel(race, gender);
        
        // Store scale factor for equipment - will be set during character scaling
        let characterScaleFactor = 1.0;
        let characterOriginalHeight = 1.0;
        
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
            
            // Store original height before scaling
            characterOriginalHeight = size.y;
            
            // Check if size is valid
            if (size.y <= 0 || !isFinite(size.y) || size.y > 1000) {
                console.warn(`Invalid model size for ${race} (${size.y}), using default scale`);
                // If model is huge, scale it down significantly
                const defaultScale = size.y > 1000 ? 0.01 : 1.0;
                characterScaleFactor = defaultScale;
                model.scale.set(defaultScale, defaultScale, defaultScale);
                
                // Recalculate after scaling
                box.setFromObject(model);
                const scaledSize = box.getSize(new THREE.Vector3());
                const bottomY = box.min.y;
                
                // Position so bottom of model is at y=0 (ground level), centered on X and Z
                model.position.set(-box.getCenter(new THREE.Vector3()).x, -bottomY, -box.getCenter(new THREE.Vector3()).z);
            } else {
                // Target height for preview (around 2.5 units)
                const targetHeight = 2.5;
                characterScaleFactor = targetHeight / size.y;
                
                console.log(`Scaling ${race} by ${characterScaleFactor} (target height: ${targetHeight}, actual height: ${size.y})`);
                
                // Apply scale
                model.scale.set(characterScaleFactor, characterScaleFactor, characterScaleFactor);
                
                // Recalculate after scaling
                box.setFromObject(model);
                const scaledSize = box.getSize(new THREE.Vector3());
                const bottomY = box.min.y;
                const centerX = box.getCenter(new THREE.Vector3()).x;
                const centerZ = box.getCenter(new THREE.Vector3()).z;
                
                // Position so bottom of model is at y=0 (ground level), centered on X and Z
                model.position.set(-centerX, -bottomY, -centerZ);
                
                // Adjust camera to frame the character nicely and ensure it's fully visible
                const maxDimension = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
                // Base camera distance to fit character in view
                this.baseCameraDistance = maxDimension * 3.5;
                this.cameraDistance = this.baseCameraDistance;
                this.zoomLevel = 1.0; // Reset zoom
                this.targetZoom = 1.0;
                // Camera height to look at center of character
                this.characterCenterY = box.getCenter(new THREE.Vector3()).y;
                this.cameraAngleX = 0; // Reset angles
                this.cameraAngleY = 0;
                this.targetCameraAngleY = 0;
                
                // Update camera position
                this.updateCameraPosition();
            }
            
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Enhance materials for realistic rendering
                    if (child.material) {
                        // Handle both single materials and material arrays
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        
                        materials.forEach(material => {
                            if (material) {
                                // Enable shadows
                                material.shadowSide = THREE.FrontSide;
                                
                                // Apply customization if possible
                                const materialName = material.name ? material.name.toLowerCase() : '';
                                
                                // Hair material improvements
                                if (materialName.includes('hair')) {
                                    material.color.setStyle(hairColor);
                                    material.roughness = 0.8;
                                    material.metalness = 0.1;
                                    // Add slight sheen to hair
                                    material.envMapIntensity = 0.5;
                                }
                                
                                // Skin material improvements for realistic rendering
                                if (materialName.includes('skin') || materialName.includes('face') || materialName.includes('body')) {
                                    const skinColor = this.getSkinColor(skinTone, race);
                                    material.color.copy(skinColor);
                                    // Realistic skin properties
                                    material.roughness = 0.85;
                                    material.metalness = 0.05;
                                    material.specular = new THREE.Color(0xffffff);
                                    material.specularIntensity = 0.3;
                                    material.clearcoat = 0.1; // Subtle skin sheen
                                    material.clearcoatRoughness = 0.9;
                                    material.envMapIntensity = 0.3;
                                }
                                
                                // Eye material
                                if (materialName.includes('eye')) {
                                    material.emissive.setStyle(eyeColor);
                                    material.emissiveIntensity = 0.2;
                                    material.roughness = 0.1;
                                    material.metalness = 0.0;
                                }
                                
                                // Enhance all materials with better default properties
                                if (!materialName.includes('hair') && !materialName.includes('skin') && !materialName.includes('eye')) {
                                    // Improve material quality for clothing/armor
                                    if (material.roughness !== undefined) {
                                        material.roughness = Math.max(0.3, material.roughness || 0.7);
                                    }
                                    if (material.metalness !== undefined) {
                                        material.metalness = Math.min(0.8, material.metalness || 0.1);
                                    }
                                }
                                
                                // Enable material updates
                                material.needsUpdate = true;
                            }
                        });
                        
                        // Update shadow settings
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat) mat.shadowSide = THREE.FrontSide;
                            });
                        } else {
                            child.material.shadowSide = THREE.FrontSide;
                        }
                    }
                }
            });
            
            this.characterGroup.add(model);
            
            // Load and attach class equipment if a class is specified
            if (className) {
                try {
                    const equipment = await this.loadClassEquipment(className, classRank, gender);
                    
                    // Helper function to find skeleton in a model
                    const findSkeleton = (model) => {
                        let skeleton = null;
                        model.traverse((child) => {
                            if (child.isSkinnedMesh && child.skeleton) {
                                skeleton = child.skeleton;
                            }
                        });
                        return skeleton;
                    };
                    
                    // Helper function to find all skinned meshes in a model
                    const findSkinnedMeshes = (model) => {
                        const meshes = [];
                        model.traverse((child) => {
                            if (child.isSkinnedMesh) {
                                meshes.push(child);
                            }
                        });
                        return meshes;
                    };
                    
                    // Helper function to find a bone by name (case-insensitive partial match)
                    const findBone = (skeleton, boneNamePattern) => {
                        if (!skeleton) return null;
                        const bones = skeleton.bones;
                        const lowerPattern = boneNamePattern.toLowerCase();
                        for (let i = 0; i < bones.length; i++) {
                            if (bones[i].name.toLowerCase().includes(lowerPattern)) {
                                return bones[i];
                            }
                        }
                        return null;
                    };
                    
                    // Get character skeleton for equipment binding
                    const characterSkeleton = findSkeleton(model);
                    const characterSkinnedMeshes = findSkinnedMeshes(model);
                    
                    // Helper function to bind equipment meshes to character skeleton
                    // This is the proper way to attach rigged equipment to rigged characters
                    const bindEquipmentToSkeleton = (equipmentClone, charSkeleton) => {
                        if (!charSkeleton) return false;
                        
                        let bound = false;
                        const equipmentMeshes = findSkinnedMeshes(equipmentClone);
                        
                        for (const eqMesh of equipmentMeshes) {
                            // Check if equipment mesh has skeleton and bones
                            if (eqMesh.skeleton && eqMesh.skeleton.bones) {
                                const eqBones = eqMesh.skeleton.bones;
                                const charBones = charSkeleton.bones;
                                
                                // Try to map equipment bones to character bones by name
                                const boneMap = new Map();
                                for (let i = 0; i < eqBones.length; i++) {
                                    const eqBoneName = eqBones[i].name.toLowerCase();
                                    // Find matching character bone
                                    for (let j = 0; j < charBones.length; j++) {
                                        const charBoneName = charBones[j].name.toLowerCase();
                                        if (eqBoneName === charBoneName || 
                                            (eqBoneName.includes('mixamorig') && charBoneName.includes('mixamorig'))) {
                                            boneMap.set(i, j);
                                            break;
                                        }
                                    }
                                }
                                
                                // If we found matching bones, try to bind
                                if (boneMap.size > 0 && boneMap.size >= eqBones.length * 0.5) {
                                    // Update skeleton reference and bone indices
                                    try {
                                        eqMesh.bind(charSkeleton, eqMesh.matrixWorld);
                                        bound = true;
                                        console.log(`Bound ${boneMap.size} bones from equipment to character skeleton`);
                                    } catch (e) {
                                        console.warn('Failed to bind equipment skeleton:', e);
                                    }
                                }
                            }
                        }
                        
                        return bound;
                    };
                    
                    // Helper function to attach equipment to character
                    // For rigged models, we need to bind equipment meshes to character skeleton
                    const attachEquipment = (equipmentMesh, equipmentName) => {
                        if (!equipmentMesh) return null;
                        
                        const equipmentClone = equipmentMesh.clone(true);
                        
                        // Reset equipment to base scale (1,1,1) first
                        equipmentClone.scale.set(1, 1, 1);
                        equipmentClone.position.set(0, 0, 0);
                        equipmentClone.rotation.set(0, 0, 0);
                        equipmentClone.updateMatrixWorld(true);
                        
                        // Try to bind equipment skeleton to character skeleton
                        let skeletonBound = false;
                        if (characterSkeleton) {
                            skeletonBound = bindEquipmentToSkeleton(equipmentClone, characterSkeleton);
                        }
                        
                        let normalizationScale = 1.0;
                        
                        // If skeleton binding worked, we still need to match scale
                        // Calculate scale based on bounding box comparison
                        const equipmentBox = new THREE.Box3();
                        equipmentBox.expandByObject(equipmentClone);
                        const equipmentOriginalSize = equipmentBox.getSize(new THREE.Vector3());
                        const equipmentOriginalHeight = equipmentOriginalSize.y;
                        const equipmentOriginalWidth = equipmentOriginalSize.x;
                        const equipmentOriginalDepth = equipmentOriginalSize.z;
                        
                        // Get character's original dimensions (before applying scale factor)
                        // We need to measure character at scale 1,1,1
                        const tempCharScale = model.scale.clone();
                        model.scale.set(1, 1, 1);
                        model.updateMatrixWorld(true);
                        const charBox = new THREE.Box3();
                        charBox.expandByObject(model);
                        const charOriginalSize = charBox.getSize(new THREE.Vector3());
                        const charOriginalHeight = charOriginalSize.y;
                        const charOriginalWidth = charOriginalSize.x;
                        const charOriginalDepth = charOriginalSize.z;
                        // Restore character scale
                        model.scale.copy(tempCharScale);
                        model.updateMatrixWorld(true);
                        
                        // Use average of height, width, and depth for more accurate scaling
                        if (equipmentOriginalHeight > 0 && charOriginalHeight > 0 &&
                            equipmentOriginalWidth > 0 && charOriginalWidth > 0) {
                            const heightRatio = charOriginalHeight / equipmentOriginalHeight;
                            const widthRatio = charOriginalWidth / equipmentOriginalWidth;
                            // Use weighted average (height is more important for humanoid models)
                            normalizationScale = (heightRatio * 0.6 + widthRatio * 0.4);
                            
                            // Clamp to reasonable range
                            if (normalizationScale < 0.1 || normalizationScale > 10) {
                                // Fallback to height only
                                normalizationScale = heightRatio;
                            }
                        } else if (equipmentOriginalHeight > 0 && charOriginalHeight > 0) {
                            normalizationScale = charOriginalHeight / equipmentOriginalHeight;
                        }
                        
                        // Ensure scale is reasonable
                        if (!isFinite(normalizationScale) || normalizationScale <= 0 || normalizationScale > 10 || normalizationScale < 0.1) {
                            console.warn(`Invalid normalization scale for ${equipmentName}, using 1.0`);
                            normalizationScale = 1.0;
                        }
                        
                        // Apply normalization scale first (to match base sizes), then character scale factor
                        let finalScale = normalizationScale * characterScaleFactor;
                        
                        // Apply manual scale override if configured
                        const scaleOverride = getEquipmentScaleOverride(className || '', equipmentName, gender);
                        if (scaleOverride !== 1.0) {
                            finalScale *= scaleOverride;
                            console.log(`Applied scale override for ${equipmentName}: ${scaleOverride.toFixed(3)}`);
                        }
                        
                        equipmentClone.scale.set(finalScale, finalScale, finalScale);
                        
                        // Reset position and rotation relative to character model
                        equipmentClone.position.set(0, 0, 0);
                        equipmentClone.rotation.set(0, 0, 0);
                        
                        // Update matrices
                        equipmentClone.updateMatrixWorld(true);
                        
                        // Parent to character model for proper alignment
                        model.add(equipmentClone);
                        
                        console.log(`Attached ${equipmentName}:`, {
                            skeletonBound: skeletonBound,
                            normalizationScale: normalizationScale.toFixed(3),
                            characterScaleFactor: characterScaleFactor.toFixed(3),
                            finalScale: finalScale.toFixed(3),
                            charSize: [charOriginalWidth.toFixed(3), charOriginalHeight.toFixed(3), charOriginalDepth.toFixed(3)],
                            eqSize: [equipmentOriginalWidth.toFixed(3), equipmentOriginalHeight.toFixed(3), equipmentOriginalDepth.toFixed(3)]
                        });
                        
                        return equipmentClone;
                    };
                    
                    // Attach each equipment item that was successfully loaded
                    if (equipment.armour) {
                        attachEquipment(equipment.armour, 'armour');
                    }
                    
                    if (equipment.boots) {
                        attachEquipment(equipment.boots, 'boots');
                    }
                    
                    if (equipment.cape) {
                        attachEquipment(equipment.cape, 'cape');
                    }
                    
                    if (equipment.helmet) {
                        attachEquipment(equipment.helmet, 'helmet');
                    }
                    
                    if (equipment.weapon) {
                        attachEquipment(equipment.weapon, 'weapon');
                    }
                } catch (error) {
                    console.error('Error loading class equipment:', error);
                    // Continue without equipment if loading fails
                }
            }
        } else {
            // Fallback to simple geometry if model not found
            this.createFallbackCharacter(race, gender, hairColor, skinTone, faceType, hairStyle, facialFeatures, eyeColor, raceFeatures);
        }

        this.scene.add(this.characterGroup);
        
        // Ensure character is visible - log for debugging
        console.log('Character preview updated:', {
            race,
            gender,
            characterGroup: this.characterGroup,
            childrenCount: this.characterGroup.children.length,
            sceneChildren: this.scene.children.length
        });
    }

    createFallbackCharacter(race, gender, hairColor, skinTone, faceType = 0, hairStyle = 0, facialFeatures = 0, eyeColor = '#4A90E2', raceFeatures = 0) {
        // Enhanced fallback character with race and gender-specific features
        // Using more realistic geometry and materials
        const raceProps = this.getRaceProperties(race, gender);
        const isFemale = gender === 'female';
        const skinColor = this.getSkinColor(skinTone, race);

        // Create torso with more realistic proportions
        const torsoGeometry = new THREE.BoxGeometry(
            raceProps.bodyWidth,
            raceProps.bodyHeight * 0.6,
            raceProps.bodyDepth
        );
        const torsoMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.05,
            roughness: 0.85,
            specular: new THREE.Color(0xffffff),
            specularIntensity: 0.3,
            clearcoat: 0.1,
            clearcoatRoughness: 0.9,
            envMapIntensity: 0.3
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = raceProps.bodyHeight * 0.3;
        torso.castShadow = true;
        torso.receiveShadow = true;
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

        // Create head with more realistic shape (rounded box)
        const headSize = raceProps.headSize * (1 + faceType * 0.05); // Slight variation based on face type
        // Use sphere for more realistic head shape
        const headGeometry = new THREE.BoxGeometry(
            headSize,
            headSize,
            headSize * 0.9,
            8, 8, 8 // More segments for smoother appearance
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            metalness: 0.05,
            roughness: 0.85,
            specular: new THREE.Color(0xffffff),
            specularIntensity: 0.3,
            clearcoat: 0.1,
            clearcoatRoughness: 0.9,
            envMapIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = raceProps.bodyHeight + headSize / 2;
        head.castShadow = true;
        head.receiveShadow = true;
        this.characterGroup.add(head);

        // Create hair with style variations (enhanced materials)
        const hairStyles = this.getHairStyleGeometry(hairStyle, headSize, raceProps.hairHeight, isFemale);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor,
            metalness: 0.1,
            roughness: 0.8,
            envMapIntensity: 0.5, // Hair sheen
            specular: new THREE.Color(0xffffff),
            specularIntensity: 0.4
        });
        
        hairStyles.forEach((hairGeom, index) => {
            const hair = new THREE.Mesh(hairGeom, hairMaterial.clone());
            hair.position.y = raceProps.bodyHeight + headSize + (index * 0.1);
            hair.castShadow = true;
            this.characterGroup.add(hair);
        });

        // Add eyes with eye color
        this.addEyes(head, headSize, eyeColor);
        
        // Race-specific features (now includes raceFeatures parameter)
        this.addRaceSpecificFeatures(race, gender, raceProps, headSize, skinColor, facialFeatures, raceFeatures);

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
        
        // Position so feet are at y=0 (ground level)
        const scaledLegHeight = raceProps.legLength * scale;
        this.characterGroup.position.y = scaledLegHeight / 2;
        
        // Adjust camera to ensure full character is visible
        const characterHeight = totalHeight * scale;
        this.characterCenterY = (raceProps.bodyHeight * scale) / 2 + (headSize * scale) / 2; // Character center
        this.baseCameraDistance = characterHeight * 3.5; // Base distance to fit character
        this.cameraDistance = this.baseCameraDistance;
        this.zoomLevel = 1.0; // Reset zoom
        this.targetZoom = 1.0;
        this.cameraAngleX = 0; // Reset angles
        this.cameraAngleY = 0;
        this.targetCameraAngleY = 0;
        
        // Update camera position
        this.updateCameraPosition();
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

    /**
     * Adds eyes with eye color to the character head
     */
    addEyes(head, headSize, eyeColor) {
        const eyeSize = headSize * 0.08;
        const eyeGeometry = new THREE.SphereGeometry(eyeSize, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 0.3
        });

        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
        leftEye.position.set(-headSize * 0.2, 0, headSize * 0.45);
        head.add(leftEye);

        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
        rightEye.position.set(headSize * 0.2, 0, headSize * 0.45);
        head.add(rightEye);
    }

    addRaceSpecificFeatures(race, gender, raceProps, headSize, skinColor, facialFeatures, raceFeatures = 0) {
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

                // Elf markings (raceFeatures 0-9 variations)
                if (raceFeatures > 0) {
                    this.addElfMarkings(headSize, raceProps, skinColor, raceFeatures);
                }
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
                // Horns (horn style varies by raceFeatures 0-9)
                const baseHornSize = isFemale ? 0.5 : 0.6;
                const hornVariation = raceFeatures * 0.05; // Slight size/style variation
                const hornSize = baseHornSize + hornVariation;
                const hornGeometry = new THREE.ConeGeometry(0.08 + hornVariation * 0.5, hornSize, 8);
                const hornMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    metalness: 0.3,
                    roughness: 0.7
                });
                
                const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
                leftHorn.position.set(-headSize * 0.25, raceProps.bodyHeight + headSize + 0.25, 0);
                leftHorn.rotation.z = -Math.PI / 8 - (raceFeatures * 0.02);
                this.characterGroup.add(leftHorn);

                const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
                rightHorn.position.set(headSize * 0.25, raceProps.bodyHeight + headSize + 0.25, 0);
                rightHorn.rotation.z = Math.PI / 8 + (raceFeatures * 0.02);
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
                // Human tattoos (raceFeatures 0-9 variations)
                if (raceFeatures > 0) {
                    this.addHumanTattoos(headSize, raceProps, raceFeatures);
                }
                
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

    /**
     * Adds elf facial/body markings (WoW-style race features)
     */
    addElfMarkings(headSize, raceProps, skinColor, raceFeatures) {
        const markingColor = new THREE.Color(0x8b5cf6); // Purple markings
        const markingIntensity = 0.3 + (raceFeatures * 0.05);
        
        // Add small geometric patterns on face/body
        const markingGeometry = new THREE.PlaneGeometry(headSize * 0.3, headSize * 0.2);
        const markingMaterial = new THREE.MeshStandardMaterial({
            color: markingColor,
            transparent: true,
            opacity: markingIntensity,
            side: THREE.DoubleSide
        });
        
        // Face markings
        const faceMarking = new THREE.Mesh(markingGeometry, markingMaterial);
        faceMarking.position.set(0, raceProps.bodyHeight + headSize * 0.7, headSize * 0.45);
        faceMarking.rotation.y = Math.PI;
        this.characterGroup.add(faceMarking);
    }

    /**
     * Adds human tattoos (WoW-style race features)
     */
    addHumanTattoos(headSize, raceProps, raceFeatures) {
        const tattooColor = new THREE.Color(0x4a4a4a); // Dark tattoo color
        const tattooIntensity = 0.4 + (raceFeatures * 0.03);
        
        // Add tattoo patterns on body
        const tattooGeometry = new THREE.PlaneGeometry(raceProps.bodyWidth * 0.8, raceProps.bodyHeight * 0.6);
        const tattooMaterial = new THREE.MeshStandardMaterial({
            color: tattooColor,
            transparent: true,
            opacity: tattooIntensity,
            side: THREE.DoubleSide
        });
        
        // Body tattoos
        const bodyTattoo = new THREE.Mesh(tattooGeometry, tattooMaterial);
        bodyTattoo.position.set(0, raceProps.bodyHeight * 0.4, raceProps.bodyDepth / 2 + 0.05);
        bodyTattoo.rotation.y = Math.PI;
        this.characterGroup.add(bodyTattoo);
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
    
    updateCameraPosition() {
        // Apply zoom smoothly
        const actualDistance = this.baseCameraDistance * this.zoomLevel;
        this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, actualDistance, 0.15);
        
        // Smooth camera angle transitions
        let angleDiff = this.targetCameraAngleY - this.cameraAngleY;
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        this.cameraAngleY += angleDiff * 0.15;
        
        // Calculate camera position using spherical coordinates
        const horizontalDistance = Math.cos(this.cameraAngleX) * this.cameraDistance;
        const verticalOffset = Math.sin(this.cameraAngleX) * this.cameraDistance;
        
        // Use stored character center Y (updated when character loads)
        const characterCenterY = this.characterCenterY || 1.25;
        
        // Calculate camera position
        const cameraX = Math.sin(this.cameraAngleY) * horizontalDistance;
        const cameraY = characterCenterY + verticalOffset;
        const cameraZ = Math.cos(this.cameraAngleY) * horizontalDistance;
        
        this.camera.position.set(cameraX, cameraY, cameraZ);
        this.camera.lookAt(0, characterCenterY, 0);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Auto-rotate character when not dragging (WoW-style)
        if (this.autoRotate && !this.isDragging) {
            this.targetCameraAngleY += this.autoRotateSpeed;
        }
        
        // Smooth zoom interpolation
        this.zoomLevel = THREE.MathUtils.lerp(this.zoomLevel, this.targetZoom, 0.1);
        
        // Update camera position (handles rotation, zoom, and smooth transitions)
        this.updateCameraPosition();

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
