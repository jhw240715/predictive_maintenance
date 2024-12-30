import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class MillingMachine3D {
    constructor(containerId) {
        console.log('Initializing MillingMachine3D with container:', containerId);
        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Initialize components object
        this.components = {};

        this.state = {
            isOperating: false,
            rotationSpeed: 0,
            toolWear: 0,
            airTemperature: 295.3,
            processTemperature: 305.7,
            torque: 3.8,
            currentFailureType: 0
        };

        this.colors = {
            normal: 0x22c55e,    // 초록색
            warning: 0xeab308,   // 노란색
            danger: 0xef4444     // 빨간색
        };

        try {
            this.initScene();
            this.initLights();
            this.createMachine();
            this.setupOrbitControls();
            this.animate();
            console.log('3D scene initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    initScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8fafc);

        // Camera setup
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
        this.camera.position.set(60, 50, 60);
        this.camera.lookAt(0, 5, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(40, 40);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.7,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add grid
        const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0xcccccc);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);
    }

    initLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(15, 15, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        // Back light
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(0, 8, -12);
        this.scene.add(backLight);
    }

    initMaterials() {
        this.materials = {
            mainBody: new THREE.MeshPhysicalMaterial({
                color: 0x9ca3af,
                metalness: 0.6,
                roughness: 0.3,
                clearcoat: 0.4
            }),
            lightMetal: new THREE.MeshPhysicalMaterial({
                color: 0xd1d5db,
                metalness: 0.7,
                roughness: 0.2,
                clearcoat: 0.3
            }),
            darkMetal: new THREE.MeshPhysicalMaterial({
                color: 0x4b5563,
                metalness: 0.8,
                roughness: 0.4
            }),
            failureMaterial: new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            })
        };
    }

    createMachine() {
        this.initMaterials();
        this.machineGroup = new THREE.Group();

        // Create main components
        this.createBase();
        this.createColumn();
        this.createHead();
        this.createWorkTable();
        this.createControlPanel();

        // Add machine group to scene
        this.scene.add(this.machineGroup);
    }

    createBase() {
        // Main base
        const baseGeometry = new THREE.BoxGeometry(8, 2, 6);
        const base = new THREE.Mesh(baseGeometry, this.materials.mainBody);
        base.position.y = 1;
        base.castShadow = true;
        base.receiveShadow = true;
        this.machineGroup.add(base);

        // Leveling feet
        const footGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 8);
        const footPositions = [
            [-3.5, 0.2, -2.5], [-3.5, 0.2, 2.5],
            [3.5, 0.2, -2.5], [3.5, 0.2, 2.5]
        ];

        footPositions.forEach(pos => {
            const foot = new THREE.Mesh(footGeometry, this.materials.darkMetal);
            foot.position.set(...pos);
            foot.castShadow = true;
            this.machineGroup.add(foot);
        });
    }

    createColumn() {
        // Main column
        const columnGeometry = new THREE.BoxGeometry(2.5, 14, 2);
        this.components.column = new THREE.Mesh(columnGeometry, this.materials.mainBody);
        this.components.column.position.set(0, 7, -2);
        this.components.column.castShadow = true;
        this.machineGroup.add(this.components.column);

        // Guide rails
        const railGeometry = new THREE.BoxGeometry(0.4, 13, 0.3);
        [-0.9, 0.9].forEach(x => {
            const rail = new THREE.Mesh(railGeometry, this.materials.lightMetal);
            rail.position.set(x, 7, -1);
            rail.castShadow = true;
            this.machineGroup.add(rail);

            // Rail mounts
            for (let y = 1; y <= 12; y += 2) {
                const mount = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.4, 0.4),
                    this.materials.darkMetal
                );
                mount.position.set(x, y, -1);
                this.machineGroup.add(mount);
            }
        });

        // Add power system
        this.createPowerSystem();
    }

    createPowerSystem() {
        const powerBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1.5),
            this.materials.darkMetal
        );
        powerBox.position.set(-1.65, 7, -2);
        powerBox.name = 'power_part';
        this.machineGroup.add(powerBox);

        // Power cable
        this.createPowerCable();
    }

    createPowerCable() {
        const cableGroup = new THREE.Group();
        const cableRadius = 0.05;
        const cableSegments = 8;

        // Vertical section
        const verticalCable = new THREE.Mesh(
            new THREE.CylinderGeometry(cableRadius, cableRadius, 5),
            new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.7 })
        );
        verticalCable.position.set(-1.65, 4.5, -2);
        cableGroup.add(verticalCable);

        // Curved section
        for (let i = 0; i < cableSegments; i++) {
            const angle = (i / cableSegments) * Math.PI * 0.5;
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(cableRadius, cableRadius, 0.5),
                new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.7 })
            );

            segment.position.set(
                -1.65 - Math.sin(angle) * 0.5,
                2 - Math.cos(angle) * 0.5,
                -2
            );
            segment.rotation.z = -angle;
            cableGroup.add(segment);
        }

        this.machineGroup.add(cableGroup);
    }

    createHead() {
        // Head unit
        const headGeometry = new THREE.BoxGeometry(4, 5, 3);
        this.components.head = new THREE.Mesh(headGeometry, this.materials.mainBody);
        this.components.head.position.set(0, 14, -2);
        this.components.head.castShadow = true;
        this.machineGroup.add(this.components.head);

        // Create spindle system
        this.createSpindleSystem();
    }

    createSpindleSystem() {
        const spindleGroup = new THREE.Group();
        spindleGroup.position.set(0, 11.5, -0.5);

        // Spindle housing
        const housing = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 3, 32),
            this.materials.darkMetal
        );
        housing.castShadow = true;
        housing.name = 'heat_part';
        spindleGroup.add(housing);

        // Spindle shaft
        this.components.spindleShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 32),
            this.materials.lightMetal
        );
        this.components.spindleShaft.position.y = -2.5;
        this.components.spindleShaft.castShadow = true;
        spindleGroup.add(this.components.spindleShaft);

        // Tool holder
        this.components.toolHolder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.3, 2.5, 32),
            this.materials.lightMetal
        );
        this.components.toolHolder.position.y = -3.75;
        this.components.toolHolder.castShadow = true;
        this.components.toolHolder.name = 'tool_part';
        spindleGroup.add(this.components.toolHolder);

        this.machineGroup.add(spindleGroup);
    }

    createWorkTable() {
        const tableGroup = new THREE.Group();
        tableGroup.position.set(0, 4, 0);

        // Main table
        const tableMesh = new THREE.Mesh(
            new THREE.BoxGeometry(12, 1, 4),
            this.materials.mainBody
        );
        tableMesh.castShadow = true;
        tableMesh.receiveShadow = true;
        tableMesh.name = 'strain_part';
        tableGroup.add(tableMesh);

        // Add T-slots
        this.createTableTSlots(tableGroup);

        // Add handle wheels
        this.createTableHandles(tableGroup);

        this.machineGroup.add(tableGroup);
    }

    createTableTSlots(tableGroup) {
        const slotCount = 3;
        const slotSpacing = 1.2;

        for (let i = 0; i < slotCount; i++) {
            const z = (i - 1) * slotSpacing;

            // Top slot
            const topSlot = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.2, 0.3),
                this.materials.darkMetal
            );
            topSlot.position.set(0, 0.5, z);
            tableGroup.add(topSlot);

            // Bottom slot
            const bottomSlot = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.3, 0.6),
                this.materials.darkMetal
            );
            bottomSlot.position.set(0, 0.3, z);
            tableGroup.add(bottomSlot);
        }
    }

    createTableHandles(tableGroup) {
        const handleRadius = 1.2;
        [-6.2, 6.2].forEach(x => {
            // Wheel
            const wheel = new THREE.Mesh(
                new THREE.TorusGeometry(handleRadius, 0.1, 16, 32),
                this.materials.darkMetal
            );
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(x, 0, 0);
            tableGroup.add(wheel);

            // Spokes
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spoke = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.04, handleRadius * 0.9, 8),
                    this.materials.darkMetal
                );
                spoke.position.set(
                    x,
                    handleRadius * Math.sin(angle),
                    handleRadius * Math.cos(angle)
                );
                spoke.rotation.x = angle;
                tableGroup.add(spoke);
            }

            // Handle axis
            const axis = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16),
                this.materials.lightMetal
            );
            axis.rotation.z = Math.PI / 2;
            axis.position.set(x, 0, 0);
            tableGroup.add(axis);
        });
    }

    createControlPanel() {
        const panelGroup = new THREE.Group();

        // Main panel
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 2, 1.5),
            this.materials.darkMetal
        );
        panel.position.set(1.65, 7, 0);
        panelGroup.add(panel);

        // Controls section
        const controlsPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 1.5, 1),
            new THREE.MeshPhysicalMaterial({
                color: 0x2c3e50,
                metalness: 0.7,
                roughness: 0.3
            })
        );
        controlsPanel.position.set(1.75, 7, 0);
        panelGroup.add(controlsPanel);

        // Add buttons and indicators
        this.createPanelControls(panelGroup);

        this.machineGroup.add(panelGroup);
    }

    createPanelControls(panelGroup) {
        // Status lights
        const createLight = (color, y, z) => {
            const light = new THREE.Mesh(
                new THREE.CircleGeometry(0.1, 32),
                new THREE.MeshPhysicalMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5
                })
            );
            light.position.set(1.81, y, z);
            light.rotation.y = Math.PI / 2;
            return light;
        };

        const lights = [
            createLight(0x2ecc71, 7.7, 0),  // Power
            createLight(0xe74c3c, 7.4, 0),  // Error
            createLight(0xf1c40f, 7.1, 0)   // Warning
        ];
        lights.forEach(light => panelGroup.add(light));

        // Control buttons
        const createButton = (color, y, z) => {
            const button = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.1, 32),
                new THREE.MeshPhysicalMaterial({
                    color: color,
                    metalness: 0.5,
                    roughness: 0.3
                })
            );
            button.rotation.x = Math.PI / 2;
            button.position.set(1.81, y, z);
            return button;
        };

        // Add control buttons
        const buttons = [
            createButton(0x2ecc71, 7.3, 0.2),  // Start
            createButton(0xe74c3c, 7.3, -0.2), // Stop
            createButton(0xff0000, 6.7, 0)     // Emergency Stop
        ];
        buttons.forEach(button => panelGroup.add(button));
    }

    setupOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 20;    // Changed from 3 to allow closer zoom
        this.controls.maxDistance = 100;   // Changed from 15 to allow further zoom
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 2, 0);
        this.controls.update();
    }

    updateFailureState(failureType) {
        // Reset previous state
        this.resetAllParts();

        // Apply new failure state
        switch (failureType) {
            case 1: // Tool wear failure
                this.highlightPart('tool_part');
                break;
            case 2: // Heat dissipation failure
                this.highlightPart('heat_part');
                break;
            case 3: // Power failure
                this.highlightPart('power_part');
                break;
            case 4: // Overstrain failure
                this.highlightPart('strain_part');
                break;
            default:
                // Normal state - already handled by resetAllParts
                break;
        }

        this.state.currentFailureType = failureType;
    }

    highlightPart(partName) {
        const part = this.scene.getObjectByName(partName);
        if (part) {
            if (!this.defaultMaterials) this.defaultMaterials = {};
            if (!this.defaultMaterials[partName]) {
                this.defaultMaterials[partName] = part.material.clone();
            }

            part.material = this.materials.failureMaterial.clone();
            this.currentFailurePart = part;
            this.focusOnPart(part);
            this.startBlinkingEffect(part);
        }
    }

    resetAllParts() {
        if (this.defaultMaterials) {
            ['tool_part', 'heat_part', 'power_part', 'strain_part'].forEach(partName => {
                const part = this.scene.getObjectByName(partName);
                if (part && this.defaultMaterials[partName]) {
                    part.material = this.defaultMaterials[partName].clone();
                }
            });
        }
        this.currentFailurePart = null;
        this.resetCamera();
    }

    focusOnPart(part) {
        if (!part) return;

        const box = new THREE.Box3().setFromObject(part);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2));

        // Smooth camera transition
        this.animateCamera(
            this.camera.position.clone(),
            center.clone().add(new THREE.Vector3(distance, distance, distance)),
            center,
            1000
        );
    }

    resetCamera() {
        const endPosition = new THREE.Vector3(40, 35, 40);
        const target = new THREE.Vector3(0, 5, 0);
        this.animateCamera(this.camera.position.clone(), endPosition, target, 1000);
    }

    animateCamera(startPos, endPos, target, duration) {
        const start = Date.now();
        const animate = () => {
            const progress = (Date.now() - start) / duration;
            if (progress < 1) {
                this.camera.position.lerpVectors(startPos, endPos, progress);
                this.camera.lookAt(target);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    startBlinkingEffect(part) {
        if (this.blinkInterval) clearInterval(this.blinkInterval);

        this.blinkInterval = setInterval(() => {
            if (part.material) {
                part.material.opacity = part.material.opacity === 1 ? 0.3 : 1;
            }
        }, 500);
    }

    updateParameter(name, value) {
        switch (name) {
            case 'Rotational_Speed':
                this.state.rotationSpeed = value;
                break;
            case 'Tool_Wear':
                this.state.toolWear = value;
                break;
            case 'Air_Temperature':
                this.state.airTemperature = value;
                break;
            case 'Process_Temperature':
                this.state.processTemperature = value;
                break;
            case 'Torque':
                this.state.torque = value;
                break;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        if (this.controls) {
            this.controls.update();
        }

        // Animate machine components
        if (this.state.isOperating) {
            if (this.components.spindleShaft) {
                const rotationSpeed = (this.state.rotationSpeed / 60) * Math.PI * 2 / 60;
                this.components.spindleShaft.rotation.y += rotationSpeed;
            }
            if (this.components.toolHolder) {
                this.components.toolHolder.rotation.y = this.components.spindleShaft.rotation.y;
            }
        }

        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        // Clear blink interval
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }

        // Dispose of controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Dispose of geometries and materials
        if (this.scene) {
            this.scene.traverse(object => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
    }
}

// Create and export initialization function
const initMachine = (containerId) => {
    console.log('Creating machine instance');
    const machine = new MillingMachine3D(containerId);
    window.millingMachine = machine; // Store for debugging
    return machine;
};

export default initMachine;