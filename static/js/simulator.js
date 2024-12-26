// simulator/static/js/simulator.js

console.log('simulator.js loaded');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded');
    // DOM 요소 선택
    const parameterForm = document.getElementById('parameter-form');
    const resultDiv = document.getElementById('prediction-result');
    const typeTabs = document.querySelectorAll('.type-tab');
    const typeInput = document.querySelector('input[name="type"]');
    const sliders = document.querySelectorAll('input[type="range"]');

    // 슬라이더 값 표시 요소들
    const sliderValues = {
        Air_Temperature: document.getElementById('air-temperature-value'),
        Process_Temperature: document.getElementById('process-temperature-value'),
        Rotational_Speed: document.getElementById('rotational-speed-value'),
        Torque: document.getElementById('torque-value'),
        Tool_Wear: document.getElementById('tool-wear-value')
    };

    // 파라미터 임계값 정의 및 설명
    const parameterThresholds = {
        Air_Temperature: {
            warning: 300,
            danger: 303,
            description: '공기 온도: 300K 이상 경고(주황색), 303K 이상 위험(빨간색)'
        },
        Process_Temperature: {
            warning: 310,
            danger: 312,
            description: '공정 온도: 310K 이상 경고(주황색), 312K 이상 위험(빨간색)'
        },
        Rotational_Speed: {
            warning: 2500,
            danger: 2800,
            description: '회전 속도: 2500rpm 이상 경고(주황색), 2800rpm 이상 위험(빨간색)'
        },
        Torque: {
            warning: 60,
            danger: 70,
            description: '토크: 60Nm 이상 경고(주황색), 70Nm 이상 위험(빨간색)'
        },
        Tool_Wear: {
            warning: 180,
            danger: 220,
            description: '공구 마모: 180분 이상 경고(주황색), 220분 이상 위험(빨간색)'
        }
    };

    // 파생 특성 계산 함수
    function calculateDerivedFeatures(formData) {
        // 입력값 파싱 및 유효성 검사
        const values = {};
        const requiredFields = ['Air_Temperature', 'Process_Temperature', 'Rotational_Speed', 'Torque', 'Tool_Wear', 'type'];

        for (const field of requiredFields) {
            const value = formData.get(field);
            if (value === null || value === undefined || value === '') {
                throw new Error(`${field} 값이 없습니다.`);
            }
            values[field] = field !== 'type' ? parseFloat(value) : value;
            if (field !== 'type' && isNaN(values[field])) {
                throw new Error(`${field}의 값이 올바른 숫자 형식이 아닙니다.`);
            }
        }

        // 파생 특성 계산
        const tempDiff = values.Process_Temperature - values.Air_Temperature;
        const power = (2 * Math.PI * values.Rotational_Speed * values.Torque) / 60;
        const wearDegree = values.Tool_Wear * values.Torque;
        const typeEncoded = { 'L': 0, 'M': 1, 'H': 2 }[values.type] ?? 0;

        // 새로운 FormData 객체 생성
        const enrichedFormData = new FormData();

        // 원본 데이터 복사
        for (const [key, value] of formData.entries()) {
            enrichedFormData.append(key, value);
        }

        // 계산된 특성 추가
        enrichedFormData.append('Temperature_difference', tempDiff.toString());
        enrichedFormData.append('Power', power.toString());
        enrichedFormData.append('Wear_degree', wearDegree.toString());
        enrichedFormData.append('Type_encoded', typeEncoded.toString());

        return enrichedFormData;
    }

    // 슬라이더 상태 업데이트 함수
    function updateSliderStatus(slider, value) {
        const container = slider.closest('.slider-container');
        if (!container) return;

        const valueDisplay = container.querySelector('.slider-value');
        const track = container.querySelector('.slider-track');

        if (valueDisplay && track) {
            valueDisplay.textContent = value;

            const status = evaluateParameterStatus(slider.name, value);

            track.classList.remove('normal', 'warning', 'danger');
            valueDisplay.classList.remove('normal', 'warning', 'danger');

            track.classList.add(status);
            valueDisplay.classList.add(status);

            // 툴팁 설명 추가
            const description = parameterThresholds[slider.name]?.description || '';
            valueDisplay.title = description;
            slider.title = description;
            track.title = description;

            // 실시간 예측 업데이트
            if (parameterForm) {
                const formData = new FormData(parameterForm);
                requestPrediction(formData);
            }
        }
    }

    // 파라미터 상태 평가 함수
    function evaluateParameterStatus(paramName, value) {
        const threshold = parameterThresholds[paramName];
        if (!threshold) return 'normal';

        const val = parseFloat(value);
        if (val >= threshold.danger) {
            return 'danger';
        }
        if (val >= threshold.warning) {
            return 'warning';
        }
        return 'normal';
    }

    // 예측 결과 표시 함수
    function updatePredictionDisplay(result) {
        const predictionResult = document.getElementById('prediction-result');
        const predictionText = document.getElementById('prediction-text');
        const predictionProb = document.getElementById('prediction-probability');
        const timestamp = document.getElementById('prediction-timestamp');

        if (!predictionResult || !predictionText || !predictionProb || !timestamp) {
            console.error('예측 결과 표시 요소를 찾을 수 없습니다.');
            return;
        }

        predictionResult.classList.remove('hidden');

        // 예측 결과 매핑
        const predictionMap = {
            0: { text: '정상 (Normal)', class: 'status-normal' },
            1: { text: '공구 마모 실패 (Tool Wear Failure)', class: 'status-twf' },
            2: { text: '열 발산 실패 (Heat Dissipation Failure)', class: 'status-hdf' },
            3: { text: '전력 고장 (Power Failure)', class: 'status-pwf' },
            4: { text: '제품 과변형 (Overstrain Failure)', class: 'status-osf' }
        };

        const prediction = predictionMap[result.prediction];
        
        // 이전 상태 클래스 제거
        predictionText.className = '';
        // 새로운 상태 클래스 추가
        predictionText.classList.add(prediction.class);
        predictionText.textContent = prediction.text;

        // 확률 표시
        predictionProb.textContent = `${(result.probability * 100).toFixed(1)}%`;
        
        // 타임스탬프 업데이트
        timestamp.textContent = new Date().toLocaleString();

        // 3D 모델 상태 업데이트
        if (window.millingMachineVisualization) {
            window.millingMachineVisualization.updateMachineState(result.prediction);
        }
    }

    // 상태에 따른 클래스 반환 함수
    function getStatusClass(prediction) {
        const classMap = {
            'No Failure': 'status-normal',
            'TWF': 'status-twf',
            'HDF': 'status-hdf',
            'PWF': 'status-pwf',
            'OSF': 'status-osf'
        };
        return classMap[prediction] || 'status-normal';
    }

    // simulator.js의 requestPrediction 함수 수정

    async function requestPrediction(formData) {
        try {
            // 전송할 데이터 로깅
            console.log('전송할 원본 데이터:', {
                Air_Temperature: formData.get('Air_Temperature'),
                Process_Temperature: formData.get('Process_Temperature'),
                Rotational_Speed: formData.get('Rotational_Speed'),
                Torque: formData.get('Torque'),
                Tool_Wear: formData.get('Tool_Wear'),
                type: formData.get('type')
            });

            // 데이터 검증
            const numericFields = {
                'Air_Temperature': formData.get('Air_Temperature'),
                'Process_Temperature': formData.get('Process_Temperature'),
                'Rotational_Speed': formData.get('Rotational_Speed'),
                'Torque': formData.get('Torque'),
                'Tool_Wear': formData.get('Tool_Wear')
            };

            // 누락된 필드 확인
            for (const [field, value] of Object.entries(numericFields)) {
                if (value === null || value === undefined || value === '') {
                    throw new Error(`${field} 값이 누락되었습니다.`);
                }
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    throw new Error(`${field}의 값이 올바른 숫자 형식이 아닙니다.`);
                }
            }

            // 파생 특성 계산
            const airTemp = parseFloat(numericFields.Air_Temperature);
            const processTemp = parseFloat(numericFields.Process_Temperature);
            const rotSpeed = parseFloat(numericFields.Rotational_Speed);
            const torque = parseFloat(numericFields.Torque);
            const toolWear = parseFloat(numericFields.Tool_Wear);
            const type = formData.get('type');

            // 새로운 FormData 객체 생성
            const processedData = new FormData();

            // 기본 ���드 추가
            processedData.append('Air_Temperature', airTemp.toString());
            processedData.append('Process_Temperature', processTemp.toString());
            processedData.append('Rotational_Speed', rotSpeed.toString());
            processedData.append('Torque', torque.toString());
            processedData.append('Tool_Wear', toolWear.toString());
            processedData.append('type', type);

            // 파생 특성 추가
            const tempDiff = processTemp - airTemp;
            const power = (2 * Math.PI * rotSpeed * torque) / 60;
            const wearDegree = toolWear * torque;
            const typeEncoded = { 'L': 0, 'M': 1, 'H': 2 }[type] ?? 0;

            processedData.append('Temperature_difference', tempDiff.toString());
            processedData.append('Power', power.toString());
            processedData.append('Wear_degree', wearDegree.toString());
            processedData.append('Type_encoded', typeEncoded.toString());

            // CSRF 토큰 추가
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            processedData.append('csrfmiddlewaretoken', csrfToken);

            // 전송할 데이터 확인
            console.log('전송할 가공된 데이터:', Object.fromEntries(processedData));

            // 서버로 요청 전송
            const response = await fetch('/simulator/predict/', {
                method: 'POST',
                body: processedData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '서버 응답 오류');
            }

            const result = await response.json();
            updatePredictionDisplay(result);

        } catch (error) {
            console.error('예측 요청 오류:', error);
            const predictionResult = document.getElementById('prediction-result');
            if (predictionResult) {
                predictionResult.innerHTML = `
                <div class="error-message">
                    예측 중 오류가 발생했습니다: ${error.message}
                </div>
            `;
                predictionResult.classList.remove('hidden');
            }
        }
    }

    // 이벤트 리스너 설정
    sliders.forEach(slider => {
        slider.addEventListener('input', function () {
            const value = this.value;
            updateSliderStatus(this, value);
        });
    });

    typeTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            typeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            typeInput.value = this.dataset.value;
        });
    });

    // 폼 제출 이벤트 처리
    parameterForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        await requestPrediction(formData);
    });

    // 초기화
    const firstTab = document.querySelector('.type-tab[data-value="L"]');
    if (firstTab) {
        firstTab.click();
    }

    // 초기 슬라이더 상태 설정
    sliders.forEach(slider => {
        updateSliderStatus(slider, slider.value);
    });
});