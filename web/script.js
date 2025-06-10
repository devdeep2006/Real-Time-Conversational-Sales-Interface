/**
 * AI Cold Caller Application
 * Enhanced JavaScript implementation with WebSocket integration
 */

class AIColdCaller {
    constructor() {
        // DOM Elements
        this.resetButton = document.getElementById('resetButton');
        this.botSelector = document.getElementById('botSelector');
        this.salesBot = document.getElementById('salesBot');
        this.callManager = document.getElementById('callManager');
        this.callSummary = document.getElementById('callSummary');
        this.startSalesCallButton = document.getElementById('startSalesCall');
        this.activeCalls = document.getElementById('activeCalls');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // State variables
        this.currentSection = 'botSelector';
        this.activeBotType = null;
        this.isListening = false;
        this.isResponding = false;
        
        // Audio/WebSocket variables
        this.mediaRecorder = null;
        this.recordingInterval = null;
        this.audioChunks = [];
        this.socket = null;
        this.conversationSocket = null;
        this.CHUNK_DURATION = 5000; // 5 seconds in milliseconds
        this.calls = [];
        
        // Initialize application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.showSection('botSelector');
        console.log('AI Cold Caller application initialized');
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Reset button
        this.resetButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        // Bot selection
        const botOptions = document.querySelectorAll('.bot-option');
        botOptions.forEach(bot => {
            bot.addEventListener('click', (e) => {
                const botType = e.currentTarget.getAttribute('data-bot-type');
                this.selectBot(botType);
            });
        });
        
        // Start sales call button
        this.startSalesCallButton.addEventListener('click', () => {
            const callInterface = this.createCallInterface('sales');
            this.activeCalls.appendChild(callInterface);
            this.showSection('callManager');
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.location.reload();
            }
            if (e.code === 'Space' && this.currentSection === 'callManager') {
                const voiceCircle = document.querySelector('.voice-circle');
                if (voiceCircle && !this.isResponding) {
                    voiceCircle.click();
                    e.preventDefault();
                }
            }
        });
    }
    
    /**
     * Show a specific section and hide others
     * @param {string} sectionId - ID of the section to show
     */
    showSection(sectionId) {
        if (this.currentSection && this.currentSection !== sectionId) {
            const currentSectionElement = document.getElementById(this.currentSection);
            if (currentSectionElement) {
                currentSectionElement.classList.add('completed');
            }
        }
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.currentSection = sectionId;
            
            // Update status indicator if showing call manager
            if (sectionId === 'callManager') {
                this.updateStatusIndicator('ready');
            }
        }
    }
    
    /**
     * Handle bot selection
     * @param {string} botType - Type of bot selected
     */
    selectBot(botType) {
        this.activeBotType = botType;
        
        // Disable bot selection after choice is made
        document.querySelectorAll('.bot-option').forEach(btn => {
            btn.disabled = true;
        });
        
        if (botType === 'sales') {
            this.showSection('salesBot');
        }
    }
    
    /**
     * Create call interface for active calls
     * @param {string} callType - Type of call to create
     * @param {string} scenario - Optional scenario for the call
     * @returns {HTMLElement} - The created call interface
     */
    createCallInterface(callType, scenario) {
        const callId = Date.now().toString();
        const callContainer = document.createElement('div');
        callContainer.className = 'call-container';
        
        callContainer.innerHTML = `
            <div class="call-interface">
                <h3>${callType === 'sales' ? 'Sales Call' : `Lead Call: ${scenario || 'Custom'}`}</h3>
                <div class="voice-circle user">
                    <i class="fas fa-microphone voice-circle-icon"></i>
                    <span class="circle-text">Start The Call</span>
                </div>
                <div class="transcript">
                    <h4><i class="fas fa-comment"></i> Transcript:</h4>
                    <p></p>
                </div>
                <div class="ai-response" style="display: none;">
                    <h4><i class="fas fa-robot"></i> AI Response:</h4>
                    <p></p>
                </div>
                <button class="end-call">
                    <i class="fas fa-phone-slash"></i> End Call
                </button>
            </div>
        `;
        
        const voiceCircle = callContainer.querySelector('.voice-circle');
        const endCallButton = callContainer.querySelector('.end-call');
        
        let isListening = false;
        
        // Voice circle click handler
        voiceCircle.addEventListener('click', () => {
            if (!isListening) {
                if (!this.conversationSocket) {
                    this.initializeConversation();
                    this.updateVoiceCircleState(voiceCircle, 'processing');
                    return;
                }
                this.startRecording();
                isListening = true;
                this.updateVoiceCircleState(voiceCircle, 'listening');
            } else {
                this.stopRecording();
                isListening = false;
                this.updateVoiceCircleState(voiceCircle, 'ai');
                
                const transcriptText = document.querySelector('.transcript p').textContent;
                if (this.conversationSocket && this.conversationSocket.readyState === WebSocket.OPEN) {
                    this.conversationSocket.send(JSON.stringify({
                        type: "transcript",
                        text: transcriptText
                    }));
                }
            }
        });
        
        // End call button handler
        endCallButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        // Add call to list
        this.calls.push({ id: callId, type: callType, scenario });
        
        return callContainer;
    }
    
    /**
     * Start recording audio
     */
    startRecording() {
        navigator.mediaDevices.getUserMedia({ 
            audio: { 
                sampleRate: 16000,  // Match the sample rate with backend
                channelCount: 1     // Mono audio
            } 
        })
        .then((stream) => {
            this.mediaRecorder = new MediaRecorder(stream);
            this.socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/speech-to-text/`);
            
            this.socket.onopen = () => {
                console.log("Transcription connection established");
                this.startAudioChunking();
                this.updateStatusIndicator('recording');
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleTranscription(data);
            };

            this.socket.onerror = (error) => {
                console.error("Transcription error:", error);
                this.updateStatusIndicator('error');
            };

            this.socket.onclose = () => {
                console.log("Transcription connection closed");
                this.stopRecording();
            };

            this.mediaRecorder.start();
        })
        .catch((error) => {
            console.error("Error accessing microphone:", error);
            this.updateStatusIndicator('error');
            alert("Error accessing microphone. Please ensure you have given permission to use the microphone.");
        });
    }
    
    /**
     * Start chunking audio data for streaming
     */
    startAudioChunking() {
        this.recordingInterval = setInterval(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                this.mediaRecorder.stop();
                this.mediaRecorder.start();
            }
        }, this.CHUNK_DURATION);

        this.mediaRecorder.ondataavailable = async (event) => {
            const audioBlob = event.data;
            if (audioBlob.size > 0) {
                try {
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioContext = new AudioContext({ sampleRate: 16000 });
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    const float32Array = audioBuffer.numberOfChannels > 1
                        ? audioBuffer.getChannelData(0) 
                        : audioBuffer.getChannelData(0);

                    const normalizedArray = float32Array.map(sample =>
                        Math.max(-1.0, Math.min(1.0, sample))
                    );

                    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                        this.socket.send(new Float32Array(normalizedArray).buffer);
                    }
                    audioContext.close();
                } catch (error) {
                    console.error("Error processing audio:", error);
                }
            }
        };
    }
    
    /**
     * Stop recording audio
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }

        if (this.mediaRecorder) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.mediaRecorder = null;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
        
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }
    
    /**
     * Handle transcription data from WebSocket
     * @param {Object} data - Transcription data
     */
    handleTranscription(data) {
        const transcriptElement = document.querySelector('.transcript p');
        if (transcriptElement) {
            transcriptElement.textContent = data.complete_transcript;
            transcriptElement.parentElement.classList.add('active');
        }
    }
    
    /**
     * Initialize conversation with LLM
     */
    initializeConversation() {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/generate-response/`;
        this.conversationSocket = new WebSocket(wsUrl);
        
        this.showLoadingOverlay(true);
        
        this.conversationSocket.onopen = () => {
            console.log("LLM WebSocket connected");
            this.conversationSocket.send(JSON.stringify({
                type: "transcript",
                text: "Hello, who is this?"
            }));
        };
        
        this.conversationSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleAIResponse(data);
            this.showLoadingOverlay(false);
        };
        
        this.conversationSocket.onerror = (error) => {
            console.error("LLM WebSocket error:", error);
            this.showLoadingOverlay(false);
            this.updateStatusIndicator('error');
        };
        
        this.conversationSocket.onclose = () => {
            console.log("LLM ended");
            this.conversationSocket = null;
            this.showLoadingOverlay(false);
        };
    }
    
    /**
     * Handle AI response from WebSocket
     * @param {Object} data - AI response data
     */
    handleAIResponse(data) {
        const aiResponseElement = document.querySelector('.ai-response p');
        const voiceCircle = document.querySelector('.voice-circle');
        
        if (data.response) {
            let audio = new Audio(data.audio);
            audio.play();
            
            const transcriptElement = document.querySelector('.transcript p');
            transcriptElement.textContent = " ";
            
            const responseText = typeof data.response === 'object' ? 
                data.response.text || data.response.toString() : 
                data.response;

            aiResponseElement.textContent = responseText;
            document.querySelector('.ai-response').style.display = 'block';
            this.updateVoiceCircleState(voiceCircle, 'idle');
        }
        
        if (data.path) {
            console.log(data.path);
            let audio = new Audio(data.path);
            audio.play();
            this.updateVoiceCircleState(voiceCircle, 'idle');
        }
        
        this.updateStatusIndicator('ready');
    }
    
    /**
     * Update voice circle visual state
     * @param {HTMLElement} voiceCircle - Voice circle element
     * @param {string} state - New state ('idle', 'listening', 'ai', 'processing', 'error')
     */
    updateVoiceCircleState(voiceCircle, state) {
        // Reset all states
        voiceCircle.classList.remove('active', 'listening', 'ai');
        
        const iconElement = voiceCircle.querySelector('.voice-circle-icon');
        const textElement = voiceCircle.querySelector('.circle-text');
        
        switch (state) {
            case 'idle':
                iconElement.className = 'fas fa-microphone voice-circle-icon';
                textElement.textContent = 'Tap to Speak';
                break;
                
            case 'listening':
                voiceCircle.classList.add('active', 'listening');
                iconElement.className = 'fas fa-microphone-alt voice-circle-icon';
                textElement.textContent = 'Speaking...';
                break;
                
            case 'ai':
                voiceCircle.classList.add('active', 'ai');
                iconElement.className = 'fas fa-robot voice-circle-icon';
                textElement.textContent = 'AI is responding...';
                break;
                
            case 'processing':
                voiceCircle.classList.add('active');
                iconElement.className = 'fas fa-cog fa-spin voice-circle-icon';
                textElement.textContent = 'Processing...';
                break;
                
            case 'error':
                iconElement.className = 'fas fa-exclamation-triangle voice-circle-icon';
                textElement.textContent = 'Error';
                break;
        }
    }
    
    /**
     * Update status indicator in the call manager
     * @param {string} status - New status ('ready', 'recording', 'responding', 'error')
     */
    updateStatusIndicator(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            // Reset all states
            statusIndicator.classList.remove('recording', 'responding', 'error');
            
            switch (status) {
                case 'ready':
                    statusText.textContent = 'Ready';
                    break;
                    
                case 'recording':
                    statusIndicator.classList.add('recording');
                    statusText.textContent = 'Recording';
                    break;
                    
                case 'responding':
                    statusIndicator.classList.add('responding');
                    statusText.textContent = 'AI Responding';
                    break;
                    
                case 'error':
                    statusIndicator.classList.add('error');
                    statusText.textContent = 'Error';
                    break;
            }
        }
    }
    
    /**
     * Show or hide loading overlay
     * @param {boolean} show - Whether to show or hide the overlay
     */
    showLoadingOverlay(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AIColdCaller();
});
