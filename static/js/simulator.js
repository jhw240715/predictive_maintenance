// Import the 3D visualization module
import initMachine from './simulator3D.js';

class MillingSimulator {
    constructor() {
        console.log('Initializing MillingSimulator');

        // Set up thresholds first
        this.setupParameterThresholds();

        // Then initialize elements and event listeners
        this.initializeElements();
        this.setupEventListeners();

        // Initialize 3D visualization after a short delay
        setTimeout(() => {
            this.init3DVisualization();
        }, 100);
    }

    setupParameterThresholds() {
        // Define parameter thresholds for visual feedback
        this.parameterThresholds = {
            Air_Temperature: {
                warning: 300,
                danger: 303,
                description: '공기 온도: 300K 이상 경고, 303K 이상 위험'
            },
            Process_Temperature: {
                warning: 310,
                danger: 312,
                description: '공정 온도: 310K 이상 경고, 312K 이상 위험'
            },
            Rotational_Speed: {
                warning: 2500,
                danger: 2800,
                description: '회전 속도: 2500rpm 이상 경고, 2800rpm 이상 위험'
            },
            Torque: {
                warning: 60,
                danger: 70,
                description: '토크: 60Nm 이상 경고, 70Nm 이상 위험'
            },
            Tool_Wear: {
                warning: 180,
                danger: 220,
                description: '공구 마모: 180분 이상 경고, 220분 이상 위험'
            }
        };
    }

    initializeElements() {
        console.log('Initializing elements');

        // Form elements
        this.form = document.getElementById('parameter-form');
        if (!this.form) console.error('Parameter form not found');

        this.typeButtons = document.querySelectorAll('.type-tab');
        this.typeInput = document.querySelector('input[name="type"]');
        this.sliders = document.querySelectorAll('input[type="range"]');

        // Monitoring elements
        this.predictionResult = document.getElementById('prediction-result');
        this.failureStatus = document.getElementById('failure-status');
        this.failureType = document.getElementById('failure-type');
        this.failureExplanation = document.getElementById('failure-explanation');
        this.predictionProbability = document.getElementById('prediction-probability');
        this.predictionTimestamp = document.getElementById('prediction-timestamp');

        // Log element initialization status
        console.log('Elements initialized:', {
            form: !!this.form,
            typeButtons: this.typeButtons.length,
            typeInput: !!this.typeInput,
            sliders: this.sliders.length,
            predictionResult: !!this.predictionResult,
            failureStatus: !!this.failureStatus,
            failureType: !!this.failureType,
            failureExplanation: !!this.failureExplanation,
            predictionProbability: !!this.predictionProbability,
            predictionTimestamp: !!this.predictionTimestamp
        });

        // Hide loading indicator and show error overlay if needed
        const loadingOverlay = document.getElementById('loading-overlay');
        const errorOverlay = document.getElementById('error-overlay');

        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }

        if (!this.form || !this.typeInput || !this.predictionResult) {
            if (errorOverlay) {
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.textContent = 'Required elements not found. Please refresh the page.';
                }
                errorOverlay.classList.remove('hidden');
            }
        }
    }

    init3DVisualization() {
        console.log('Initializing 3D visualization');
        try {
            this.machine3D = initMachine('machine-visualization');

            // Add resize handler
            window.addEventListener('resize', () => {
                if (this.machine3D) {
                    this.machine3D.handleResize();
                }
            });

            console.log('3D visualization initialized successfully');

            // Hide loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error initializing 3D visualization:', error);

            // Show error overlay
            const errorOverlay = document.getElementById('error-overlay');
            const errorMessage = document.getElementById('error-message');
            if (errorOverlay && errorMessage) {
                errorMessage.textContent = 'Error loading 3D visualization: ' + error.message;
                errorOverlay.classList.remove('hidden');
            }
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        if (!this.form) return;

        // Type button selection
        this.typeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleTypeSelection(e.target);
            });
        });

        // Slider value updates with debouncing
        const debouncedPrediction = this.debounce(() => this.makePrediction(), 500);

        this.sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target);
                debouncedPrediction(); // Make prediction after slider value changes
            });

            // Initialize slider values
            this.updateSliderValue(slider);
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.makePrediction();
        });

        // Keyboard navigation for type buttons
        this.setupKeyboardNavigation();
    }

    setupKeyboardNavigation() {
        const typeTabsContainer = document.querySelector('.type-tabs');
        if (!typeTabsContainer) return;

        typeTabsContainer.addEventListener('keydown', (e) => {
            const currentTab = document.activeElement;
            const tabs = Array.from(this.typeButtons);
            const index = tabs.indexOf(currentTab);

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (index - 1 + tabs.length) % tabs.length;
                    tabs[prevIndex].focus();
                    this.handleTypeSelection(tabs[prevIndex]);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (index + 1) % tabs.length;
                    tabs[nextIndex].focus();
                    this.handleTypeSelection(tabs[nextIndex]);
                    break;
            }
        });
    }

    debounce(func, wait) {
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

    handleTypeSelection(button) {
        if (!this.typeInput) return;

        // Update button states
        this.typeButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-checked', 'true');

        // Update hidden input
        this.typeInput.value = button.dataset.value;

        // Trigger prediction update
        this.makePrediction();
    }

    updateSliderValue(slider) {
        const container = slider.closest('.slider-container');
        if (!container) return;

        const valueDisplay = container.querySelector('.slider-value');
        if (!valueDisplay) return;

        // Update display value
        valueDisplay.textContent = slider.value;

        // Update ARIA values
        slider.setAttribute('aria-valuenow', slider.value);

        // Get thresholds for this parameter
        const paramName = slider.name;
        const thresholds = this.parameterThresholds[paramName];

        // Fallback thresholds if none defined for this parameter
        const defaultThresholds = {
            warning: Number(slider.max) * 0.7,
            danger: Number(slider.max) * 0.9,
            description: `${paramName}: ${slider.max * 0.7} 이상 경고, ${slider.max * 0.9} 이상 위험`
        };

        // Update slider status based on thresholds
        this.updateSliderStatus(slider, container, valueDisplay, thresholds || defaultThresholds);

        // Update 3D visualization parameters
        if (this.machine3D) {
            this.machine3D.updateParameter(paramName, parseFloat(slider.value));
        }
    }

    updateSliderStatus(slider, container, valueDisplay, thresholds) {
        const value = parseFloat(slider.value);

        // Remove existing status classes
        ['normal', 'warning', 'danger'].forEach(status => {
            valueDisplay.classList.remove(status);
            container.querySelector('.slider-track').classList.remove(status);
        });

        // Add appropriate status class
        let statusClass = 'normal';
        if (thresholds) {
            if (value >= thresholds.danger) {
                statusClass = 'danger';
            } else if (value >= thresholds.warning) {
                statusClass = 'warning';
            }
        }

        valueDisplay.classList.add(statusClass);
        container.querySelector('.slider-track').classList.add(statusClass);

        // Update ARIA labels and tooltips
        const status = statusClass === 'normal' ? '정상' : statusClass === 'warning' ? '경고' : '위험';
        slider.setAttribute('aria-label', `${slider.name} ${status} 상태: ${value}`);

        // Add tooltip with threshold description
        if (thresholds) {
            valueDisplay.title = thresholds.description;
            slider.title = thresholds.description;
        }
    }

    async makePrediction() {
        try {
            const formData = new FormData(this.form);

            // Show loading state
            this.updatePredictionLoadingState(true);

            // Calculate derived features
            const processedData = this.calculateDerivedFeatures(formData);

            const response = await fetch('/api/predict/', {
                method: 'POST',
                body: processedData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const result = await response.json();
            console.log('Prediction result:', result);

            // Hide loading state
            this.updatePredictionLoadingState(false);

            if (result.status === 'success') {
                this.updatePredictionDisplay(result);
            } else {
                console.error('Prediction failed:', result.message);
                this.showError(result.message);
            }
        } catch (error) {
            console.error('Error making prediction:', error);
            this.updatePredictionLoadingState(false);
            this.showError('예측 중 오류가 발생했습니다.');
        }
    }

    updatePredictionLoadingState(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? '예측 중...' : '예측 실행';
        }
    }

    calculateDerivedFeatures(formData) {
        const processedData = new FormData();

        // Copy original values
        for (let [key, value] of formData.entries()) {
            processedData.append(key, value);
        }

        // Calculate derived features
        const values = {
            Air_Temperature: parseFloat(formData.get('Air_Temperature')),
            Process_Temperature: parseFloat(formData.get('Process_Temperature')),
            Rotational_Speed: parseFloat(formData.get('Rotational_Speed')),
            Torque: parseFloat(formData.get('Torque')),
            Tool_Wear: parseFloat(formData.get('Tool_Wear')),
            Type: formData.get('type')
        };

        // Add derived features
        processedData.append('Temperature_difference',
            (values.Process_Temperature - values.Air_Temperature).toString());
        processedData.append('Power',
            ((2 * Math.PI * values.Rotational_Speed * values.Torque) / 60).toString());
        processedData.append('Tool_wear_minutes',
            (values.Tool_Wear * 60).toString());

        return processedData;
    }

    updatePredictionDisplay(result) {
        if (!this.predictionResult || !this.failureStatus || !this.failureType ||
            !this.failureExplanation || !this.predictionProbability || !this.predictionTimestamp) {
            console.error('Required DOM elements not found');
            return;
        }

        try {
            // Show result container
            this.predictionResult.classList.remove('hidden');

            // Update status and type
            const failureClass = this.getFailureClass(result.prediction);
            this.failureStatus.textContent = failureClass.status;
            this.failureStatus.className = `status-value ${failureClass.className}`;

            // Update failure information
            if (result.failure_info) {
                this.failureType.textContent = result.failure_info.kr;
                this.failureExplanation.textContent = result.failure_info.description;
            }

            // Update probability
            if (result.probabilities && result.probabilities[result.prediction]) {
                const probability = (result.probabilities[result.prediction] * 100).toFixed(2);
                this.predictionProbability.textContent = `${probability}%`;
            }

            // Update timestamp
            const now = new Date();
            this.predictionTimestamp.textContent = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Update 3D visualization
            if (this.machine3D) {
                this.machine3D.updateFailureState(failureClass.machineState);
            }

        } catch (error) {
            console.error('Error updating prediction display:', error);
            this.showError('결과 표시 중 오류가 발생했습니다.');
        }
    }

    getFailureClass(prediction) {
        const classes = {
            'none': { status: '정상', className: 'status-normal', machineState: 0 },
            'TWF': { status: '공구 마모 실패', className: 'status-twf', machineState: 1 },
            'HDF': { status: '열 발산 실패', className: 'status-hdf', machineState: 2 },
            'PWF': { status: '전력 고장', className: 'status-pwf', machineState: 3 },
            'OSF': { status: '과부하', className: 'status-osf', machineState: 4 }
        };
        return classes[prediction] || classes['none'];
    }

    showError(message) {
        if (this.predictionResult) {
            this.predictionResult.classList.remove('hidden');
            this.predictionResult.innerHTML = `
                <div class="error-message bg-red-50 text-red-700 p-4 rounded-lg" role="alert">
                    <p class="font-medium">오류 발생</p>
                    <p>${message}</p>
                </div>
            `;

            // Reset 3D visualization if available
            if (this.machine3D) {
                this.machine3D.updateFailureState(0); // Reset to normal state
            }
        }
    }

    // Clean up event listeners and resources
    dispose() {
        // Remove window resize listener
        window.removeEventListener('resize', this.handleResize);

        // Remove type button listeners
        this.typeButtons.forEach(button => {
            button.removeEventListener('click', this.handleTypeSelection);
        });

        // Remove slider listeners
        this.sliders.forEach(slider => {
            slider.removeEventListener('input', this.updateSliderValue);
        });

        // Remove form submit listener
        if (this.form) {
            this.form.removeEventListener('submit', this.makePrediction);
        }

        // Dispose 3D visualization
        if (this.machine3D) {
            this.machine3D.dispose();
        }
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing simulator');
    const simulator = new MillingSimulator();

    // Store simulator instance for cleanup
    window.millingSimulator = simulator;
});