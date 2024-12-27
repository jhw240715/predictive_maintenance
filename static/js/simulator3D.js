// simulator3D.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class MillingMachineVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error('시각화 컨테이너를 찾을 수 없습니다: ' + containerId);
        }

        // 상태 및 부품 참조 초기화
        this.state = {
            isOperating: false,
            rotationSpeed: 0,
            toolWear: 0,
            airTemperature: 295.3,
            processTemperature: 305.7,
            torque: 3.8,
            currentFailureType: 0 // 0: 정상, 1: 공구마모, 2: 열발산, 3: 전력, 4: 과변형
        };

        // 상태별 색상 정의
        this.colors = {
            normal: 0x22c55e,    // 초록색
            warning: 0xeab308,   // 노란색
            danger: 0xef4444     // 빨간색
        };

        // 고장 부위 메시 참조
        this.failureParts = null;
        this.defaultMaterials = {};
        this.currentFailurePart = null;

        // 고장 상태 재질 생성
        this.failureMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });

        // 깜빡임 효과를 위한 재질
        this.failureBlinkMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 1
        });

        this.init();
    }

    init() {
        if (!this.checkWebGLSupport()) {
            throw new Error('WebGL이 지원되지 않습니다.');
        }

        try {
            this.initScene();
            this.initCamera();
            this.initRenderer();
            this.initLights();
            this.initControls();
            this.initMaterials();
            this.createMachine();
            this.addEventListeners();
            this.animate();
        } catch (error) {
            console.error('초기화 오류:', error);
            throw error;
        }
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (error) {
            return false;
        }
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8fafc);

        // 바닥 그리드 추가
        const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0xcccccc);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);

        // 반사를 위한 바닥면 추가
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
    }

    initCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
        this.camera.position.set(40, 35, 40);
        this.camera.lookAt(0, 5, 0);
    }

    initRenderer() {
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
    }

    initLights() {
        // 주변광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 주 조명
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(15, 15, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        // 보조 조명
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(0, 8, -12);
        this.scene.add(backLight);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 60;
        this.controls.maxPolarAngle = Math.PI / 2;
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
        };
    }

    createMachine() {
        this.machine = new THREE.Group();

        // 베이스 유닛 생성 및 추가
        const base = this.createBase();
        base.position.y = 0;
        this.machine.add(base);

        // 컬럼 생성 및 추가
        const column = this.createColumn();
        column.position.set(0, 0, -2);
        this.machine.add(column);

        // 헤드 유닛 생성 및 추가
        const head = this.createHead();
        head.position.set(0, 14, -2);
        this.machine.add(head);

        // 작업 테이블 생성 및 추가
        const table = this.createWorkTable();
        table.position.set(0, 4, 0);
        this.machine.add(table);

        // 머신 씬에 추가
        this.scene.add(this.machine);

        // 고장 부위 메시 참조 설정
        this.failureParts = {
            toolWear: this.scene.getObjectByName('tool_part'),
            heatDissipation: this.scene.getObjectByName('heat_part'),
            powerFailure: this.scene.getObjectByName('power_part'),
            overstrain: this.scene.getObjectByName('strain_part')
        };

        // 기본 재질 저장
        Object.entries(this.failureParts).forEach(([key, mesh]) => {
            if (mesh) {
                this.defaultMaterials[key] = mesh.material.clone();
            }
        });
    }

    createBase() {
        const baseGroup = new THREE.Group();

        // 메인 베이스 바디
        const baseGeometry = new THREE.BoxGeometry(8, 2, 6);
        const baseMesh = new THREE.Mesh(baseGeometry, this.materials.mainBody);
        baseMesh.position.y = 1;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseGroup.add(baseMesh);

        // 레벨링 피트 추가
        const footGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 8);
        const footPositions = [
            [-3.5, 0.2, -2.5], [-3.5, 0.2, 2.5],
            [3.5, 0.2, -2.5], [3.5, 0.2, 2.5]
        ];

        footPositions.forEach(pos => {
            const foot = new THREE.Mesh(footGeometry, this.materials.darkMetal);
            foot.position.set(...pos);
            foot.castShadow = true;
            baseGroup.add(foot);
        });

        // 제어 패널 추가
        const panelGroup = this.createControlPanel();
        panelGroup.position.set(-3.8, 1.5, 0);
        baseGroup.add(panelGroup);

        return baseGroup;
    }

    createControlPanel() {
        const panelGroup = new THREE.Group();

        // 메인 패널 박스
        const panelGeometry = new THREE.BoxGeometry(2, 2.5, 0.3);
        const panel = new THREE.Mesh(panelGeometry, this.materials.darkMetal);
        panel.rotation.y = -Math.PI / 6;
        panelGroup.add(panel);

        // 전원 패널 섹션 추가
        const powerPanelGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
        const powerPanel = new THREE.Mesh(powerPanelGeometry, new THREE.MeshPhysicalMaterial({
            color: 0x2c3e50,
            metalness: 0.7,
            roughness: 0.3
        }));
        powerPanel.position.set(0, 0.5, 0.2);
        powerPanel.name = 'power_part';
        panelGroup.add(powerPanel);

        // 전원 LED 표시등
        const ledGeometry = new THREE.CircleGeometry(0.1, 32);
        const ledLight = new THREE.Mesh(ledGeometry, new THREE.MeshPhysicalMaterial({
            color: 0x2ecc71,
            emissive: 0x2ecc71,
            emissiveIntensity: 0.5
        }));
        ledLight.position.set(0.4, 0.7, 0.25);
        panelGroup.add(ledLight);

        // 전원 스위치
        const switchGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const powerSwitch = new THREE.Mesh(switchGeometry, new THREE.MeshPhysicalMaterial({
            color: 0xe74c3c,
            metalness: 0.6,
            roughness: 0.2
        }));
        powerSwitch.position.set(0, 0.7, 0.25);
        panelGroup.add(powerSwitch);

        // 전압 디스플레이 추가
        const displayGeometry = new THREE.PlaneGeometry(0.8, 0.3);
        const displayMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x34495e,
            emissive: 0x34495e,
            emissiveIntensity: 0.2
        });
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(0, 0, 0.25);
        panelGroup.add(display);

        return panelGroup;
    }

    createColumn() {
        const columnGroup = new THREE.Group();

        // 메인 컬럼
        const columnGeometry = new THREE.BoxGeometry(2.5, 14, 2);
        const columnMesh = new THREE.Mesh(columnGeometry, this.materials.mainBody);
        columnMesh.position.y = 7;
        columnMesh.castShadow = true;
        columnGroup.add(columnMesh);

        // 가이드 레일 추가
        const railGeometry = new THREE.BoxGeometry(0.4, 13, 0.3);
        [-0.9, 0.9].forEach(x => {
            const rail = new THREE.Mesh(railGeometry, this.materials.lightMetal);
            rail.position.set(x, 7, 1);
            rail.castShadow = true;
            columnGroup.add(rail);

            // 레일 마운트 추가
            for (let y = 1; y <= 12; y += 2) {
                const mount = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.4, 0.4),
                    this.materials.darkMetal
                );
                mount.position.set(x, y, 1);
                columnGroup.add(mount);
            }
        });

        return columnGroup;
    }

    createHead() {
        const headGroup = new THREE.Group();

        // 메인 헤드 바디
        const headGeometry = new THREE.BoxGeometry(4, 5, 3);
        const headMesh = new THREE.Mesh(headGeometry, this.materials.mainBody);
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        // 스핀들 시스템 추가
        const spindleSystem = this.createSpindleSystem();
        spindleSystem.position.set(0, -2.5, 1.5);
        headGroup.add(spindleSystem);

        return headGroup;
    }

    createSpindleSystem() {
        const spindleGroup = new THREE.Group();

        // 스핀들 하우징
        const housingGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 32);
        const housing = new THREE.Mesh(housingGeometry, this.materials.darkMetal);
        housing.castShadow = true;
        spindleGroup.add(housing);
        housing.name = 'heat_part'; // 열 발산 부위

        // 스핀들 샤프트
        this.spindleShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 32),
            this.materials.lightMetal
        );
        this.spindleShaft.position.y = -2.5;
        this.spindleShaft.castShadow = true;
        spindleGroup.add(this.spindleShaft);

        // 툴 홀더
        this.toolHolder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.3, 2.5, 32),
            this.materials.lightMetal
        );
        this.toolHolder.position.y = -3.75;
        this.toolHolder.castShadow = true;
        this.toolHolder.name = 'tool_part'; // 공구 마모 부위
        spindleGroup.add(this.toolHolder);

        return spindleGroup;
    }

    createWorkTable() {
        const tableGroup = new THREE.Group();

        // 메인 테이블 상판
        const tableGeometry = new THREE.BoxGeometry(12, 1, 4);
        const tableMesh = new THREE.Mesh(tableGeometry, this.materials.mainBody);
        tableMesh.castShadow = true;
        tableMesh.receiveShadow = true;
        tableMesh.name = 'strain_part'; // 과변형 부위
        tableGroup.add(tableMesh);

        // T-슬롯 추가
        const slotCount = 3;
        const slotSpacing = 1.2;

        for (let i = 0; i < slotCount; i++) {
            const z = (i - 1) * slotSpacing;

            const topSlot = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.2, 0.3),
                this.materials.darkMetal
            );
            topSlot.position.set(0, 0.5, z);
            tableGroup.add(topSlot);

            const bottomSlot = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.3, 0.6),
                this.materials.darkMetal
            );
            bottomSlot.position.set(0, 0.3, z);
            tableGroup.add(bottomSlot);
        }

        return tableGroup;
    }

    // 고장 상태 업데이트 메서드
    updateFailureState(failureType) {
        // 이전 상태 초기화
        this.currentFailurePart = null;
        Object.entries(this.failureParts).forEach(([key, mesh]) => {
            if (mesh && this.defaultMaterials[key]) {
                mesh.material = this.defaultMaterials[key].clone();
            }
        });

        // 새로운 고장 상태 적용
        switch (failureType) {
            case 1: // 공구 마모 실패
                if (this.failureParts.toolWear) {
                    this.failureParts.toolWear.material = this.failureBlinkMaterial;
                    this.currentFailurePart = this.failureParts.toolWear;
                    this.focusOnPart(this.failureParts.toolWear);
                }
                break;
            case 2: // 열 발산 실패
                if (this.failureParts.heatDissipation) {
                    this.failureParts.heatDissipation.material = this.failureBlinkMaterial;
                    this.currentFailurePart = this.failureParts.heatDissipation;
                    this.focusOnPart(this.failureParts.heatDissipation);
                }
                break;
            case 3: // 전력 고장
                if (this.failureParts.powerFailure) {
                    this.failureParts.powerFailure.material = this.failureBlinkMaterial;
                    this.currentFailurePart = this.failureParts.powerFailure;
                    this.focusOnPart(this.failureParts.powerFailure);
                }
                break;
            case 4: // 제품 과변형
                if (this.failureParts.overstrain) {
                    this.failureParts.overstrain.material = this.failureBlinkMaterial;
                    this.currentFailurePart = this.failureParts.overstrain;
                    this.focusOnPart(this.failureParts.overstrain);
                }
                break;
            case 0: // 정상
            default:
                // 모든 부품을 기본 상태로 복구
                this.resetCamera();
                break;
        }

        this.state.currentFailureType = failureType;
    }

    // 카메라 포커스 메서드
    focusOnPart(part) {
        if (!part) return;

        const box = new THREE.Box3().setFromObject(part);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2));

        // 부드러운 카메라 이동
        const duration = 1000;
        const startPosition = this.camera.position.clone();
        const endPosition = center.clone().add(new THREE.Vector3(distance, distance, distance));

        const start = Date.now();
        const animate = () => {
            const progress = (Date.now() - start) / duration;
            if (progress < 1) {
                this.camera.position.lerpVectors(startPosition, endPosition, progress);
                this.camera.lookAt(center);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    // 카메라 리셋 메서드
    resetCamera() {
        const duration = 1000;
        const startPosition = this.camera.position.clone();
        const endPosition = new THREE.Vector3(40, 35, 40);

        const start = Date.now();
        const animate = () => {
            const progress = (Date.now() - start) / duration;
            if (progress < 1) {
                this.camera.position.lerpVectors(startPosition, endPosition, progress);
                this.camera.lookAt(0, 5, 0);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    updateMachineState(data) {
        if (!data || typeof data !== 'object') {
            console.warn('유효하지 않은 데이터 형식');
            return;
        }

        try {
            // 회전 속도 상태 업데이트
            if (data.rotational_speed !== undefined) {
                const rpm = parseFloat(data.rotational_speed);
                this.state.rotationSpeed = rpm;
                this.state.isOperating = rpm > 0;
            }

            // 공구 마모 상태 업데이트
            if (data.tool_wear !== undefined) {
                this.state.toolWear = parseFloat(data.tool_wear);
            }
        } catch (error) {
            console.error('상태 업데이트 오류:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 컨트롤 업데이트
        if (this.controls) {
            this.controls.update();
        }

        // 머신 작동 상태 업데이트
        if (this.state.isOperating) {
            this.updateOperatingState();
        }

        // 고장 부위 깜빡임 효과
        if (this.currentFailurePart) {
            const time = Date.now() * 0.001;
            const blinkIntensity = (Math.sin(time * 4) + 1) / 2;
            this.failureBlinkMaterial.emissiveIntensity = blinkIntensity * 0.5;
            this.failureBlinkMaterial.opacity = 0.7 + blinkIntensity * 0.3;
        }

        // 렌더링
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateOperatingState() {
        // 스핀들 회전 애니메이션
        if (this.spindleShaft && this.toolHolder) {
            const rotationSpeed = (this.state.rotationSpeed / 60) * Math.PI * 2 / 60;
            this.spindleShaft.rotation.y += rotationSpeed;
            this.toolHolder.rotation.y = this.spindleShaft.rotation.y;
        }

        // 고속 회전시 진동 효과
        if (this.machine && this.state.rotationSpeed > 2500) {
            const vibrationAmount = 0.0002 * (this.state.rotationSpeed / 3000);
            this.machine.position.x = (Math.random() - 0.5) * vibrationAmount;
            this.machine.position.y = (Math.random() - 0.5) * vibrationAmount;
        }
    }

    onWindowResize() {
        if (this.camera && this.renderer && this.container) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    dispose() {
        window.removeEventListener('resize', () => this.onWindowResize());

        if (this.controls) {
            this.controls.dispose();
        }

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

        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

export default MillingMachineVisualization;