// 3D Character Preview for Character Creation
import * as THREE from 'three';

export class CharacterPreview {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.characterMesh = null;
        this.characterGroup = null;
        this.currentRace = 'human';
        this.animationId = null;
        
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
        this.camera.position.set(0, 3, 8);
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

        // Create initial character
        this.updateCharacter('human', '#8B4513', 0.5);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    updateCharacter(race, hairColor, skinTone) {
        // Remove old character
        if (this.characterGroup) {
            this.scene.remove(this.characterGroup);
        }

        this.currentRace = race;
        this.characterGroup = new THREE.Group();

        // Get race-specific properties
        const raceProps = this.getRaceProperties(race);

        // Create body based on race
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

        // Race-specific features
        if (race === 'elf') {
            // Pointed ears
            const earGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
            const earMaterial = new THREE.MeshStandardMaterial({
                color: this.getSkinColor(skinTone, race)
            });
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(-raceProps.headSize / 2 - 0.1, raceProps.bodyHeight + raceProps.headSize * 0.7, 0);
            leftEar.rotation.z = -Math.PI / 6;
            this.characterGroup.add(leftEar);

            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(raceProps.headSize / 2 + 0.1, raceProps.bodyHeight + raceProps.headSize * 0.7, 0);
            rightEar.rotation.z = Math.PI / 6;
            this.characterGroup.add(rightEar);
        } else if (race === 'dwarf') {
            // Beard
            const beardGeometry = new THREE.BoxGeometry(raceProps.headSize * 0.8, 0.4, raceProps.headSize * 0.6);
            const beardMaterial = new THREE.MeshStandardMaterial({
                color: hairColor
            });
            const beard = new THREE.Mesh(beardGeometry, beardMaterial);
            beard.position.set(0, raceProps.bodyHeight + raceProps.headSize * 0.3, raceProps.headSize / 2 + 0.1);
            this.characterGroup.add(beard);
        } else if (race === 'demon') {
            // Horns
            const hornGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
            const hornMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a
            });
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-raceProps.headSize * 0.3, raceProps.bodyHeight + raceProps.headSize + 0.3, 0);
            leftHorn.rotation.z = -Math.PI / 6;
            this.characterGroup.add(leftHorn);

            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(raceProps.headSize * 0.3, raceProps.bodyHeight + raceProps.headSize + 0.3, 0);
            rightHorn.rotation.z = Math.PI / 6;
            this.characterGroup.add(rightHorn);

            // Red tint for demon
            bodyMaterial.color.setRGB(0.7, 0.4, 0.4);
            headMaterial.color.setRGB(0.7, 0.4, 0.4);
        }

        // Add arms
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

        // Add legs
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

        this.characterGroup.position.set(0, 0, 0);
        this.scene.add(this.characterGroup);
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
                // Elves have lighter, more ethereal skin
                baseColor = { r: 0.9, g: 0.8, b: 0.7 };
                break;
            case 'dwarf':
                // Dwarves have more tanned, earthy skin
                baseColor = { r: 0.6, g: 0.5, b: 0.4 };
                break;
            case 'demon':
                // Demons have reddish tint
                baseColor = { r: 0.7, g: 0.4, b: 0.4 };
                break;
            default: // human
                baseColor = { r: 0.8, g: 0.6, b: 0.5 };
        }

        // Apply tone variation
        const r = baseColor.r + (tone * 0.2);
        const g = baseColor.g + (tone * 0.2);
        const b = baseColor.b + (tone * 0.2);

        return new THREE.Color(r, g, b);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate character slowly
        if (this.characterGroup) {
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
        // Clean up resources if needed
    }
}

