// OrbitControls.js
// Three.js의 카메라 컨트롤을 위한 확장 클래스입니다.
// 마우스와 터치 입력을 통해 3D 장면을 조작할 수 있게 해줍니다.

class OrbitControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // 컨트롤 설정
        this.enabled = true;
        this.target = new THREE.Vector3();

        // 줌 제한
        this.minDistance = 1;
        this.maxDistance = 100;

        // 회전 제한
        this.minPolarAngle = 0; // 위쪽으로 회전 제한
        this.maxPolarAngle = Math.PI; // 아래쪽으로 회전 제한

        // 현재 상태
        this.position = {
            start: new THREE.Vector2(),
            end: new THREE.Vector2(),
            delta: new THREE.Vector2(),
            old: new THREE.Vector2()
        };

        // 마우스 이벤트 바인딩
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // 터치 이벤트 바인딩
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));

        // 초기 상태
        this.isMouseDown = false;
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.2;
    }

    // 마우스 이벤트 핸들러
    onMouseDown(event) {
        if (!this.enabled) return;

        event.preventDefault();

        this.isMouseDown = true;
        this.position.start.set(event.clientX, event.clientY);
        this.position.old.copy(this.position.start);
    }

    onMouseMove(event) {
        if (!this.enabled || !this.isMouseDown) return;

        this.position.end.set(event.clientX, event.clientY);
        this.position.delta.subVectors(this.position.end, this.position.old);

        // 카메라 회전
        this.rotateCamera();

        this.position.old.copy(this.position.end);
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    onMouseWheel(event) {
        if (!this.enabled) return;

        event.preventDefault();

        // 휠 델타값에 따라 확대/축소
        if (event.deltaY > 0) {
            this.dollyOut();
        } else {
            this.dollyIn();
        }
    }

    // 터치 이벤트 핸들러
    onTouchStart(event) {
        if (!this.enabled) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1: // 회전
                this.isMouseDown = true;
                this.position.start.set(event.touches[0].pageX, event.touches[0].pageY);
                this.position.old.copy(this.position.start);
                break;
            case 2: // 핀치 줌
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                this.position.start.set(0, Math.sqrt(dx * dx + dy * dy));
                break;
        }
    }

    onTouchMove(event) {
        if (!this.enabled) return;

        event.preventDefault();

        switch (event.touches.length) {
            case 1: // 회전
                if (!this.isMouseDown) return;
                this.position.end.set(event.touches[0].pageX, event.touches[0].pageY);
                this.position.delta.subVectors(this.position.end, this.position.old);
                this.rotateCamera();
                this.position.old.copy(this.position.end);
                break;
            case 2: // 핀치 줌
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                this.position.end.set(0, Math.sqrt(dx * dx + dy * dy));
                this.position.delta.subVectors(this.position.end, this.position.start);
                if (this.position.delta.y > 0) {
                    this.dollyIn();
                } else {
                    this.dollyOut();
                }
                this.position.start.copy(this.position.end);
                break;
        }
    }

    onTouchEnd() {
        this.isMouseDown = false;
    }

    // 카메라 조작 메서드
    rotateCamera() {
        const rotateAngleX = 2 * Math.PI * this.position.delta.x / this.domElement.clientWidth;
        const rotateAngleY = 2 * Math.PI * this.position.delta.y / this.domElement.clientHeight;

        // 카메라 위치를 target을 중심으로 회전
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        const radialDistance = offset.length();

        // 수평 회전
        offset.x = radialDistance * Math.sin(rotateAngleX);
        offset.z = radialDistance * Math.cos(rotateAngleX);

        // 수직 회전 (제한 적용)
        const theta = Math.atan2(offset.x, offset.z);
        let phi = Math.acos(offset.y / radialDistance);
        phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi + rotateAngleY));

        offset.y = radialDistance * Math.cos(phi);
        const sinPhiRadius = radialDistance * Math.sin(phi);
        offset.x = sinPhiRadius * Math.sin(theta);
        offset.z = sinPhiRadius * Math.cos(theta);

        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
    }

    dollyIn() {
        const zoomScale = Math.pow(0.95, this.zoomSpeed);
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        offset.multiplyScalar(zoomScale);

        // 최소 거리 제한 확인
        if (offset.length() >= this.minDistance) {
            this.camera.position.copy(this.target).add(offset);
        }
    }

    dollyOut() {
        const zoomScale = Math.pow(1.05, this.zoomSpeed);
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        offset.multiplyScalar(zoomScale);

        // 최대 거리 제한 확인
        if (offset.length() <= this.maxDistance) {
            this.camera.position.copy(this.target).add(offset);
        }
    }

    // 공개 메서드
    update() {
        // 애니메이션 프레임에서 호출될 수 있는 업데이트 로직
        return false;
    }

    dispose() {
        // 이벤트 리스너 제거
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        this.domElement.removeEventListener('touchstart', this.onTouchStart);
        this.domElement.removeEventListener('touchmove', this.onTouchMove);
        this.domElement.removeEventListener('touchend', this.onTouchEnd);
    }
}

// Three.js의 전역 네임스페이스에 OrbitControls 추가
THREE.OrbitControls = OrbitControls;