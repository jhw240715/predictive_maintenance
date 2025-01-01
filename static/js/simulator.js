// simulator/static/js/simulator.js

console.log('simulator.js loaded');  // 파일이 로드되었는지 확인하는 로그

document.addEventListener('DOMContentLoaded', function () {  // DOM이 로드된 후 실행되는 메인 함수
    console.log('DOM Content Loaded');
    // DOM 요소 선택 - 필요한 HTML 요소들을 변수에 저장
    const parameterForm = document.getElementById('parameter-form');  // 파라미터 입력 폼
    const resultDiv = document.getElementById('prediction-result');   // 예측 결과를 표시할 div
    const typeTabs = document.querySelectorAll('.type-tab');        // 제품 유형 선택 탭들
    const typeInput = document.querySelector('input[name="type"]');  // 선택된 제품 유형 저장 input
    const sliders = document.querySelectorAll('input[type="range"]'); // 모든 슬라이더 입력

    // 온도 관련 슬라이더 요소
    const airTempSlider = document.querySelector('input[name="air_temperature"]');      // 공기 온도 슬라이더
    const processTempSlider = document.querySelector('input[name="process_temperature"]'); // 공정 온도 슬라이더

    // Air Temperature 변경 시 이벤트 처리
    airTempSlider.addEventListener('input', function() {
        const airTemp = parseFloat(this.value);
        const processTemp = parseFloat(processTempSlider.value);
        
        // 공기 온도가 공정 온도보다 높아지지 않도록 제한
        if (airTemp >= processTemp) {
            this.value = (processTemp - 0.1).toFixed(1);  // 공정 온도보다 0.1 낮게 설정
            updateSliderStatus(this, this.value);
        }
    });

    // Process Temperature 변경 시 이벤트 처리
    processTempSlider.addEventListener('input', function() {
        const processTemp = parseFloat(this.value);
        const airTemp = parseFloat(airTempSlider.value);
        
        // 공정 온도가 공기 온도보다 낮아지지 않도록 제한
        if (processTemp <= airTemp) {
            airTempSlider.value = (processTemp - 0.1).toFixed(1);
            updateSliderStatus(airTempSlider, airTempSlider.value);
        }
    });

    // 각 슬라이더의 현재 값을 표시할 요소들
    const sliderValues = {
        air_temperature: document.getElementById('air-temperature-value'),      // 공기 온도 값 표시
        process_temperature: document.getElementById('process-temperature-value'), // 공정 온도 값 표시
        rotational_speed: document.getElementById('rotational-speed-value'),    // 회전 속도 값 표시
        torque: document.getElementById('torque-value'),                       // 토크 값 표시
        tool_wear: document.getElementById('tool-wear-value')                  // 공구 마모 값 표시
    };

    // 각 파라미터의 경고/위험 임계값 정의
    const parameterThresholds = {
        air_temperature: {
            warning: 300,  // 경고 임계값
            danger: 303,   // 위험 임계값
            description: '공기 온도: 300K 이상 경고(주황색), 303K 이상 위험(빨간색)'
        },
        process_temperature: {
            warning: 310,
            danger: 312,
            description: '공정 온도: 310K 이상 경고(주황색), 312K 이상 위험(빨간색)'
        },
        rotational_speed: {
            warning: 2500,
            danger: 2800,
            description: '회전 속도: 2500rpm 이상 경고(주황색), 2800rpm 이상 위험(빨간색)'
        },
        torque: {
            warning: 60,
            danger: 70,
            description: '토크: 60Nm 이상 경고(주황색), 70Nm 이상 위험(빨간색)'
        },
        tool_wear: {
            warning: 0,
            danger: 0,
            description: '200을 초과해서는 안 됩니다. 작업 시 유의해주시기 바랍니다.'
        }
    };

    // 입력된 데이터를 서버에 전송하기 전에 처리하는 함수
    function calculateDerivedFeatures(formData) {
        // 입력값 파싱 및 유효성 검사
        const values = {};
        const requiredFields = ['air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear', 'type'];

        // 모든 필수 필드가 있는지 확인
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

        // 파생 특성 계산 (추가 분석을 위한 값들)
        const tempDiff = values.process_temperature - values.air_temperature;  // 온도 차이
        const power = (2 * Math.PI * values.rotational_speed * values.torque) / 60;  // 동력
        const wearDegree = values.tool_wear * values.torque;  // 마모도

        // 서버로 전송할 데이터 준비
        const processedData = new FormData();
        processedData.append('type', values.type);
        processedData.append('air_temperature', values.air_temperature.toString());
        processedData.append('process_temperature', values.process_temperature.toString());
        processedData.append('rotational_speed', values.rotational_speed.toString());
        processedData.append('torque', values.torque.toString());
        processedData.append('tool_wear', values.tool_wear.toString());

        return processedData;
    }

    // 연속적인 이벤트 처리를 제한하는 디바운스 함수
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

    // 예측 요청을 디바운스 처리하는 함수
    const debouncedRequestPrediction = debounce((formData) => {
        requestPrediction(formData);
    }, 500); // 500ms 딜레이로 연속 호출 제한

    // 슬라이더 상태 업데이트 함수 (값과 시각적 표시 업데이트)
    function updateSliderStatus(slider, value) {
        const container = slider.closest('.slider-container');
        if (!container) return;

        const valueDisplay = container.querySelector('.slider-value');
        const track = container.querySelector('.slider-track');

        if (valueDisplay && track) {
            valueDisplay.textContent = value;  // 현재 값 표시

            const status = evaluateParameterStatus(slider.name, value);  // 상태 평가

            // 이전 상태 클래스 제거
            track.classList.remove('normal', 'warning', 'danger');
            valueDisplay.classList.remove('normal', 'warning', 'danger');

            // 새로운 상태 클래스 추가
            track.classList.add(status);
            valueDisplay.classList.add(status);

            // 툴팁에 설명 추가
            const description = parameterThresholds[slider.name]?.description || '';
            valueDisplay.title = description;
            slider.title = description;
            track.title = description;
        }
    }

    // 파라미터 값의 상태를 평가하는 함수 (정상/경고/위험)
    function evaluateParameterStatus(paramName, value) {
        // Tool Wear는 항상 normal 상태 반환
        if (paramName === 'tool_wear') {
            return 'normal';
        }

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

    // 예측 결과를 화면에 표시하는 함수
    function updatePredictionDisplay(prediction) {
        const displayElement = document.getElementById('prediction-display');
        if (!displayElement) {
            console.error('예측 결과 표시 요소를 찾을 수 없습니다.');
            return;
        }
        
        console.log('고장 상태 업데이트:', prediction);
        
        // 이전 상태 클래스 제거
        displayElement.classList.remove('normal', 'heat-failure', 'power-failure', 'overstrain', 'error');
        
        // 예측 결과가 없는 경우 처리
        if (!prediction || typeof prediction.class === 'undefined') {
            displayElement.textContent = '예측 결과를 받아올 수 없습니다.';
            displayElement.classList.add('error');
            return;
        }

        // 예측 결과에 따라 상태 표시
        switch(prediction.class) {
            case 0:
                displayElement.classList.add('normal');
                displayElement.textContent = '정상';
                break;
            case 2:
                displayElement.classList.add('heat-failure');
                displayElement.textContent = '열 발산 실패';
                break;
            case 3:
                displayElement.classList.add('power-failure');
                displayElement.textContent = '전력 고장';
                break;
            case 4:
                displayElement.classList.add('overstrain');
                displayElement.textContent = '제품 과변형';
                break;
            default:
                displayElement.classList.add('error');
                displayElement.textContent = '알 수 없는 고장';
        }
    }

    // 예측 상태에 따른 CSS 클래스 반환 함수
    function getStatusClass(prediction) {
        const classMap = {
            'No Failure': 'status-normal',
            'HDF': 'status-hdf',
            'PWF': 'status-pwf',
            'OSF': 'status-osf'
        };
        return classMap[prediction] || 'status-normal';
    }

    // 서버에 예측 요청을 보내는 함수
    async function requestPrediction(formData) {
        try {
            // 데이터 전처리
            const processedData = calculateDerivedFeatures(formData);
            
            // CSRF 토큰 추가
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            processedData.append('csrfmiddlewaretoken', csrfToken);
            
            console.log('전송할 데이터:', Object.fromEntries(processedData));
            
            // 서버에 예측 요청
            const response = await fetch('/api/predict/', {
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
            
            // 예측 결과 변환
            const predictionMap = {
                'none': 0,  // 정상
                'HDF': 2,   // 열 발산 고장
                'PWF': 3,   // 전력 고장
                'OSF': 4    // 과부하 고장
            };
            
            const prediction = {
                class: predictionMap[result.prediction]
            };

            console.log('변환된 예측 결과:', prediction);
            
            // 1. 고장 상태 모니터링 업데이트
            updatePredictionDisplay(prediction);
            
            // 2. 예측 결과 표시 업데이트
            const predictionResult = document.getElementById('prediction-result');
            const predictionText = document.getElementById('prediction-text');
            
            if (predictionResult && predictionText) {
                predictionResult.classList.remove('hidden');
                predictionText.textContent = getPredictionText(prediction.class);
            }
            
            // 3. 3D 모델 상태 업데이트
            if (window.millingMachineVisualization) {
                try {
                    if (typeof window.millingMachineVisualization.updateMachineState === 'function') {
                        setTimeout(() => {
                            window.millingMachineVisualization.updateMachineState(prediction.class);
                        }, 300);
                    } else {
                        console.warn('3D 모델의 updateMachineState 함수를 찾을 수 없습니다.');
                    }
                } catch (error) {
                    console.warn('3D 모델 업데이트 중 오류:', error);
                }
            }
            
        } catch (error) {
            console.error('예측 요청 오류:', error);
            const predictionResult = document.getElementById('prediction-result');
            const predictionDisplay = document.getElementById('prediction-display');
            
            // 에러 메시지 표시
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
            2: '열 발산 실패 (Heat Dissipation Failure)',
            3: '전력 고장 (Power Failure)',
            4: '제품 과변형 (Overstrain Failure)'
        };
        return predictionMap[predictionClass] || '알 수 없는 예측 결과';
    }

    // 이벤트 리스너 설정
    sliders.forEach(slider => {  // 각 슬라이더에 이벤트 리스너 추가
        slider.addEventListener('input', function () {
            const value = this.value;
            updateSliderStatus(this, value);
        });
    });

    typeTabs.forEach(tab => {  // 제품 유형 탭에 이벤트 리스너 추가
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

    // 초기화 - 첫 번째 탭 선택
    const firstTab = document.querySelector('.type-tab[data-value="L"]');
    if (firstTab) {
        firstTab.click();
    }

    // 초기 슬라이더 상태 설정
    sliders.forEach(slider => {
        updateSliderStatus(slider, slider.value);
    });
});

// 가이드 토글 함수 - 사용자 가이드 표시/숨김
function toggleGuide() {
    const content = document.getElementById('guide-content');
    const icon = document.querySelector('.toggle-icon');
    content.classList.toggle('expanded');
    icon.textContent = content.classList.contains('expanded') ? '▲' : '▼';
}

// WebGL 지원 여부 확인 함수
function checkWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// 에러 메시지 표시 함수
function showErrorMessage(message) {
    console.error('시뮬레이터 오류:', message);
    const errorDiv = document.getElementById('webgl-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    hideLoadingIndicator();
}

// 로딩 인디케이터 숨기기 함수
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 시뮬레이터 초기화 함수
async function initializeSimulator() {
    try {
        // WebGL 지원 확인
        if (!checkWebGL()) {
            throw new Error('WebGL이 지원되지 않습니다. 최신 브라우저를 사용하시거나 그래픽 드라이버를 업데이트해주세요.');
        }

        // 3D 시각화 초기화
        const { MillingMachineVisualization } = await import('/static/js/simulator3D.js');
        window.millingMachineVisualization = new MillingMachineVisualization('machine-visualization');
        hideLoadingIndicator();
        console.log('시뮬레이터 초기화 완료');
        
    } catch (error) {
        showErrorMessage(`시뮬레이터 초기화 실패: ${error.message}`);
        console.error('초기화 상세 오류:', error);
    }
}

// DOM 로드 시 시뮬레이터 초기화
document.addEventListener('DOMContentLoaded', initializeSimulator);