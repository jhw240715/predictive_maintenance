import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class MachineVisualizer {
    constructor() {
        this.container = document.getElementById('machine-visualization');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.init();
        this.loadModel();
        this.animate();
    }

    init() {
        // 렌더러 설정
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // 카메라 위치 설정
        this.camera.position.z = 5;

        // 조명 설정
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('/static/models/milling_machine/model.gltf', (gltf) => {
            this.machine = gltf.scene;
            this.scene.add(this.machine);
        });
    }

    updateState(prediction) {
        if (!this.machine) return;

        // 예측 결과에 따라 모델 색상 변경
        const materials = {
            'No Failure': new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
            'Tool Wear Failure (TWF)': new THREE.MeshStandardMaterial({ color: 0xff0000 }),
            'Heat Dissipation Failure (HDF)': new THREE.MeshStandardMaterial({ color: 0xff6600 }),
            'Power Failure (PWF)': new THREE.MeshStandardMaterial({ color: 0xff0066 }),
            'Overstrain Failure (OSF)': new THREE.MeshStandardMaterial({ color: 0x660066 })
        };

        this.machine.traverse((child) => {
            if (child.isMesh) {
                child.material = materials[prediction];
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.machine) {
            this.machine.rotation.y += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// 시각화 인스턴스 생성
const visualizer = new MachineVisualizer();

// 전역 함수로 상태 업데이트 메서드 노출
window.updateMachineState = (prediction) => {
    visualizer.updateState(prediction);
};