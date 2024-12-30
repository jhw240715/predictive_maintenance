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
        const processedData = new FormData();

        // 서버가 기대하는 형식으로 데이터 추가
        processedData.append('Air_Temperature', values.Air_Temperature.toString());
        processedData.append('Process_Temperature', values.Process_Temperature.toString());
        processedData.append('Rotational_Speed', values.Rotational_Speed.toString());
        processedData.append('Torque', values.Torque.toString());
        processedData.append('Tool_Wear', values.Tool_Wear.toString());
        processedData.append('Type_encoded', typeEncoded.toString());
        processedData.append('Temperature_difference', tempDiff.toString());
        processedData.append('Power', power.toString());
        processedData.append('Wear_degree', wearDegree.toString());

        return processedData;
    }

    // 디바운스 함수
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 디바운스된 예측 요청 함수
    const debouncedRequestPrediction = debounce((formData) => {
        requestPrediction(formData);
    }, 500); // 500ms 딜레이

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

            // 실시간 예측 업데이트 (디바운스 적용)
            if (parameterForm) {
                const formData = new FormData(parameterForm);
                debouncedRequestPrediction(formData);
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
    function updatePredictionDisplay(prediction) {
        const displayElement = document.getElementById('prediction-display');
        if (!displayElement) {
            console.error('예측 결과 표시 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 클래스 제거
        displayElement.classList.remove('normal', 'tool-wear', 'heat-failure', 'power-failure', 'overstrain');
        
        // prediction이 undefined이거나 class 속성이 없는 경우 처리
        if (!prediction || typeof prediction.class === 'undefined') {
            displayElement.textContent = '예측 결과를 받아올 수 없습니다.';
            displayElement.className = 'error';
            return;
        }

        // 예측 결과에 따라 클래스 추가
        let resultClass = '';
        let resultText = '';
        
        switch(prediction.class) {
            case 0:
                resultClass = 'normal';
                resultText = '정상';
                break;
            case 1:
                resultClass = 'tool-wear';
                resultText = '공구 마모 실패';
                break;
            case 2:
                resultClass = 'heat-failure';
                resultText = '열 발산 실패';
                break;
            case 3:
                resultClass = 'power-failure';
                resultText = '전력 고장';
                break;
            case 4:
                resultClass = 'overstrain';
                resultText = '제품 과변형';
                break;
            default:
                resultClass = 'error';
                resultText = '알 수 없는 예측 결과';
        }
        
        displayElement.classList.add(resultClass);
        displayElement.textContent = resultText;

        // 3D 모델 상태 업데이트
        if (window.millingMachineVisualization) {
            window.millingMachineVisualization.updateMachineState(prediction.class);
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

    // 예측 요청 함수
    async function requestPrediction(formData) {
        try {
            // 파생 특성이 포함된 FormData 생성
            const processedData = calculateDerivedFeatures(formData);
            
            // CSRF 토큰 추가
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            processedData.append('csrfmiddlewaretoken', csrfToken);
            
            console.log('전송할 데이터:', Object.fromEntries(processedData));
            
            const response = await fetch('/simulator/predict/', {
                method: 'POST',
                body: processedData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('서버 응답:', result);
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            // 응답 형식 확인 및 변환
            const prediction = {
                class: result.prediction_class !== undefined ? parseInt(result.prediction_class) : 
                       result.prediction !== undefined ? parseInt(result.prediction) : undefined,
                probability: result.probability !== undefined ? parseFloat(result.probability) : 1.0
            };

            console.log('변환된 예측 결과:', prediction);
            
            // 예측 결과 표시 업데이트
            const predictionResult = document.getElementById('prediction-result');
            const predictionText = document.getElementById('prediction-text');
            const predictionProb = document.getElementById('prediction-probability');
            const predictionDisplay = document.getElementById('prediction-display');
            
            // prediction-result 업데이트
            if (predictionResult && predictionText && predictionProb) {
                predictionResult.classList.remove('hidden');
                predictionText.textContent = getPredictionText(prediction.class);
                predictionProb.textContent = `${(prediction.probability * 100).toFixed(1)}%`;
            }

            // prediction-display 업데이트
            if (predictionDisplay) {
                updatePredictionDisplay(prediction);
            }
            
            // 3D 모델 상태 업데이트
            if (window.millingMachineVisualization && prediction.class !== undefined) {
                window.millingMachineVisualization.updateMachineState(prediction.class);
            }
            
        } catch (error) {
            console.error('예측 요청 오류:', error);
            const predictionResult = document.getElementById('prediction-result');
            const predictionDisplay = document.getElementById('prediction-display');
            
            if (predictionResult) {
                predictionResult.classList.remove('hidden');
                predictionResult.innerHTML = `
                    <div class="error-message">
                        예측 중 오류가 발생했습니다: ${error.message}
                    </div>
                `;
            }

            if (predictionDisplay) {
                predictionDisplay.textContent = '예측 오류';
                predictionDisplay.className = 'error';
            }
        }
    }

    // 예측 결과 텍스트 반환 함수
    function getPredictionText(predictionClass) {
        const predictionMap = {
            0: '정상 (Normal)',
            1: '공구 마모 실패 (Tool Wear Failure)',
            2: '열 발산 실패 (Heat Dissipation Failure)',
            3: '전력 고장 (Power Failure)',
            4: '제품 과변형 (Overstrain Failure)'
        };
        return predictionMap[predictionClass] || '알 수 없는 예측 결과';
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

// 가이드 토글 함수
function toggleGuide() {
    const content = document.getElementById('guide-content');
    const icon = document.querySelector('.toggle-icon');
    content.classList.toggle('expanded');
    icon.textContent = content.classList.contains('expanded') ? '▲' : '▼';
}

// WebGL 지원 확인
function checkWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// 에러 메시지 표시
function showErrorMessage(message) {
    console.error('시뮬레이터 오류:', message);
    const errorDiv = document.getElementById('webgl-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    hideLoadingIndicator();
}

// 로딩 인디케이터 숨기기
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 시뮬레이터 초기화
async function initializeSimulator() {
    try {
        if (!checkWebGL()) {
            throw new Error('WebGL이 지원되지 않습니다. 최신 브라우저를 사용하시거나 그래픽 드라이버를 업데이트해주세요.');
        }

        const { MillingMachineVisualization } = await import('/static/js/simulator3D.js');
        window.millingMachineVisualization = new MillingMachineVisualization('machine-visualization');
        hideLoadingIndicator();
        console.log('시뮬레이터 초기화 완료');
        
    } catch (error) {
        showErrorMessage(`시뮬레이터 초기화 실패: ${error.message}`);
        console.error('초기화 상세 오류:', error);
    }
}

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', initializeSimulator);