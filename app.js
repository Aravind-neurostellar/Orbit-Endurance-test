// Orbit Cognitive Assessment Suite - Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // STATE MANAGEMENT
    const state = {
        username: 'User',
        sessionMode: 'standard', // 'standard' or 'demo'
        testDurations: {
            standard: 300000, // 5 minutes in ms
            demo: 15000       // 15 seconds in ms
        },
        breakDurations: {
            standard: 3600,   // 1 hour in seconds
            demo: 5           // 5 seconds in seconds
        },
        currentTest: null,    // 'sart2' or 'nback'
        sartLogs: [],
        nbackLogs: [],
        sartKeyHandler: null,
        nbackKeyHandler: null,
        sheetsUrl: localStorage.getItem('sheetsUrl') || ''
    };

    // DOM ELEMENTS
    const screens = {
        welcome: document.getElementById('screen-welcome'),
        sartPrompt: document.getElementById('screen-sart-prompt'),
        sartTest: document.getElementById('screen-sart-test'),
        break: document.getElementById('screen-break'),
        nbackPrompt: document.getElementById('screen-nback-prompt'),
        nbackTest: document.getElementById('screen-nback-test'),
        results: document.getElementById('screen-results')
    };

    // Setup Form
    const setupForm = document.getElementById('setup-form');
    const usernameInput = document.getElementById('username');
    const sessionModeSelect = document.getElementById('session-mode');

    // SART Elements
    const btnSartStarted = document.getElementById('btn-sart-started');
    const sartCountdownDisplay = document.getElementById('sart-countdown-display');
    const sartCountdownNumber = document.getElementById('sart-countdown-number');
    const sartCountdownRing = document.getElementById('sart-countdown-ring');
    const sartDigitDisplay = document.getElementById('sart-digit');
    const sartMaskDisplay = document.getElementById('sart-mask');
    const sartFeedbackDisplay = document.getElementById('sart-feedback');
    const sartTimerDisplay = document.getElementById('sart-timer');

    // Break Elements
    const btnSkipBreak = document.getElementById('btn-skip-break');
    const btnProceedNback = document.getElementById('btn-proceed-nback');
    const breakHourVal = document.getElementById('break-hour');
    const breakMinuteVal = document.getElementById('break-minute');
    const breakSecondVal = document.getElementById('break-second');

    // N-Back Elements
    const btnNbackStarted = document.getElementById('btn-nback-started');
    const nbackCountdownDisplay = document.getElementById('nback-countdown-display');
    const nbackCountdownNumber = document.getElementById('nback-countdown-number');
    const nbackCountdownRing = document.getElementById('nback-countdown-ring');
    const nbackLetterDisplay = document.getElementById('nback-letter');
    const nbackFixationDisplay = document.getElementById('nback-fixation');
    const nbackTimerDisplay = document.getElementById('nback-timer');

    // Results Elements
    const resParticipantName = document.getElementById('res-participant-name');
    const resDate = document.getElementById('res-date');
    const btnDownloadCsv = document.getElementById('btn-download-csv');
    const btnRestart = document.getElementById('btn-restart');
    
    // Results Metrics
    const metrics = {
        sartAcc: document.getElementById('sart-acc'),
        sartRt: document.getElementById('sart-rt'),
        sartRtsd: document.getElementById('sart-rtsd'),
        sartComm: document.getElementById('sart-comm'),
        sartOmis: document.getElementById('sart-omis'),
        nbackAcc: document.getElementById('nback-acc'),
        nbackRt: document.getElementById('nback-rt'),
        nbackHitRate: document.getElementById('nback-hitrate'),
        nbackFaRate: document.getElementById('nback-farate'),
        nbackHitMiss: document.getElementById('nback-hitmiss')
    };

    // Chart reference
    let rtChartInstance = null;

    // HELPER: Screen Navigation
    function showScreen(screenId) {
        Object.keys(screens).forEach(key => {
            if (key === screenId) {
                screens[key].classList.add('active');
            } else {
                screens[key].classList.remove('active');
            }
        });
    }

    // HELPER: Format Time (MM:SS)
    function formatTimerString(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // HELPER: Setup SVG Progress Ring
    function setProgressRing(ringElement, percent) {
        const radius = ringElement.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        ringElement.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percent / 100) * circumference;
        ringElement.style.strokeDashoffset = offset;
    }

    // Load sheetsUrl from localStorage if available
    const savedSheetsUrl = localStorage.getItem('sheetsUrl') || '';
    const sheetsUrlInput = document.getElementById('sheets-url');
    if (sheetsUrlInput) {
        sheetsUrlInput.value = savedSheetsUrl;
    }

    // EVENT: Setup Form Submit
    setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.username = usernameInput.value.trim() || 'Participant';
        state.sessionMode = sessionModeSelect.value;
        state.sheetsUrl = sheetsUrlInput ? sheetsUrlInput.value.trim() : '';
        localStorage.setItem('sheetsUrl', state.sheetsUrl);
        
        state.sartLogs = [];
        state.nbackLogs = [];
        
        showScreen('sartPrompt');
    });

    // SART2 ORBIT PROMPT & COUNTDOWN
    btnSartStarted.addEventListener('click', () => {
        btnSartStarted.classList.add('hidden');
        sartCountdownDisplay.classList.remove('hidden');
        run10SecondCountdown(sartCountdownNumber, sartCountdownRing, () => {
            showScreen('sartTest');
            startSartTest();
        });
    });

    // N-BACK ORBIT PROMPT & COUNTDOWN
    btnNbackStarted.addEventListener('click', () => {
        btnNbackStarted.classList.add('hidden');
        nbackCountdownDisplay.classList.remove('hidden');
        run10SecondCountdown(nbackCountdownNumber, nbackCountdownRing, () => {
            showScreen('nbackTest');
            startNbackTest();
        });
    });

    // 10-Second Countdown logic
    function run10SecondCountdown(numDisplay, ringDisplay, onComplete) {
        let secondsLeft = 10;
        numDisplay.textContent = secondsLeft;
        setProgressRing(ringDisplay, 100);

        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                onComplete();
            } else {
                numDisplay.textContent = secondsLeft;
                setProgressRing(ringDisplay, (secondsLeft / 10) * 100);
            }
        }, 1000);
    }

    // SART2 ENGINE
    function startSartTest() {
        state.currentTest = 'sart2';
        const startTime = Date.now();
        const durationLimit = state.testDurations[state.sessionMode];
        
        // Update timer display
        sartTimerDisplay.textContent = formatTimerString(durationLimit);
        
        const timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = durationLimit - elapsed;
            sartTimerDisplay.textContent = formatTimerString(remaining);
            
            if (remaining <= 0) {
                clearInterval(timerInterval);
                endSartTest();
            }
        }, 200);

        let trialNum = 0;
        let isTrialActive = false;
        let stimulusTimer = null;
        let maskTimer = null;

        // Spacebar handler
        let spacePressed = false;
        let pressRT = null;
        let trialStartTimestamp = 0;
        let currentDigit = 0;
        let currentSize = 48;

        const fontSizes = [48, 72, 94, 100, 120];

        function runTrial() {
            if (Date.now() - startTime >= durationLimit) {
                return; // timer interval will handle completion
            }

            trialNum++;
            isTrialActive = true;
            spacePressed = false;
            pressRT = null;

            // Select digit randomly 1-9 (equal chance)
            currentDigit = Math.floor(Math.random() * 9) + 1;
            // Select random font size
            currentSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];

            // Setup display
            sartDigitDisplay.textContent = currentDigit;
            sartDigitDisplay.style.fontSize = `${currentSize}px`;
            sartDigitDisplay.classList.remove('hidden');
            sartMaskDisplay.classList.add('hidden');
            sartMaskDisplay.className = 'sart-mask hidden'; // reset success/error status classes
            sartFeedbackDisplay.classList.add('hidden');

            trialStartTimestamp = performance.now();

            // Stimulus duration: 250ms
            stimulusTimer = setTimeout(() => {
                sartDigitDisplay.classList.add('hidden');
                sartMaskDisplay.classList.remove('hidden');
                
                // Show feedback states on mask when showing
                if (spacePressed) {
                    if (currentDigit !== 3) {
                        sartMaskDisplay.classList.add('success');
                    } else {
                        sartMaskDisplay.classList.add('error');
                        sartFeedbackDisplay.textContent = 'Error! Do not press on 3!';
                        sartFeedbackDisplay.classList.remove('hidden');
                    }
                }

                // Mask duration: 900ms (Total trial = 1150ms)
                maskTimer = setTimeout(() => {
                    logSartTrial();
                    runTrial();
                }, 900);

            }, 250);
        }

        function handleSpace(e) {
            if (e.code === 'Space') {
                e.preventDefault(); // Stop window scrolling
                
                if (!isTrialActive || spacePressed) return;
                
                spacePressed = true;
                pressRT = Math.round(performance.now() - trialStartTimestamp);

                // SART2 Visual Feedback (Response feedback)
                if (currentDigit !== 3) {
                    // Correct keypress on non-target
                    if (sartDigitDisplay.classList.contains('hidden')) {
                        // We are already in the mask period
                        sartMaskDisplay.classList.add('success');
                    }
                } else {
                    // Error commission keypress on target 3
                    if (sartDigitDisplay.classList.contains('hidden')) {
                        sartMaskDisplay.classList.add('error');
                    }
                    sartFeedbackDisplay.textContent = 'Error! Do not press on 3!';
                    sartFeedbackDisplay.classList.remove('hidden');
                }
            }
        }

        function logSartTrial() {
            isTrialActive = false;
            let isCorrect = false;
            let errorType = 'none';

            if (currentDigit === 3) {
                if (!spacePressed) {
                    isCorrect = true; // Correct rejection
                } else {
                    isCorrect = false; // Commission error
                    errorType = 'commission';
                }
            } else {
                if (spacePressed) {
                    isCorrect = true; // Correct hit
                } else {
                    isCorrect = false; // Omission error
                    errorType = 'omission';
                }
            }

            state.sartLogs.push({
                trialNum: trialNum,
                digit: currentDigit,
                fontSize: currentSize,
                keyPressed: spacePressed ? 'Space' : 'None',
                reactionTime: pressRT,
                isCorrect: isCorrect,
                errorType: errorType
            });
        }

        // Add Key Listener
        state.sartKeyHandler = handleSpace;
        window.addEventListener('keydown', state.sartKeyHandler);

        // Start first trial
        runTrial();

        // End task function
        function endSartTest() {
            clearTimeout(stimulusTimer);
            clearTimeout(maskTimer);
            window.removeEventListener('keydown', state.sartKeyHandler);
            startBreak();
        }
    }

    // BREAK SCREEN ENGINE
    function startBreak() {
        showScreen('break');
        
        let secondsLeft = state.breakDurations[state.sessionMode];
        updateBreakDisplay(secondsLeft);

        const breakInterval = setInterval(() => {
            secondsLeft--;
            updateBreakDisplay(secondsLeft);

            if (secondsLeft <= 0) {
                clearInterval(breakInterval);
                enableProceedToNback();
            }
        }, 1000);

        btnSkipBreak.addEventListener('click', () => {
            clearInterval(breakInterval);
            enableProceedToNback();
        });

        btnProceedNback.addEventListener('click', () => {
            showScreen('nbackPrompt');
        });
    }

    function updateBreakDisplay(secs) {
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const seconds = secs % 60;

        breakHourVal.textContent = hours.toString().padStart(2, '0');
        breakMinuteVal.textContent = minutes.toString().padStart(2, '0');
        breakSecondVal.textContent = seconds.toString().padStart(2, '0');
    }

    function enableProceedToNback() {
        btnProceedNback.disabled = false;
        btnProceedNback.focus();
        breakHourVal.textContent = "00";
        breakMinuteVal.textContent = "00";
        breakSecondVal.textContent = "00";
    }

    // N-BACK (2-BACK) ENGINE
    function startNbackTest() {
        state.currentTest = 'nback';
        const startTime = Date.now();
        const durationLimit = state.testDurations[state.sessionMode];
        
        nbackTimerDisplay.textContent = formatTimerString(durationLimit);
        
        const timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = durationLimit - elapsed;
            nbackTimerDisplay.textContent = formatTimerString(remaining);
            
            if (remaining <= 0) {
                clearInterval(timerInterval);
                endNbackTest();
            }
        }, 200);

        let trialNum = 0;
        let history = [];
        let isTrialActive = false;
        let letterTimer = null;
        let fixationTimer = null;

        // Trial states
        let keyResponse = 'None';
        let pressRT = null;
        let trialStartTimestamp = 0;
        let currentLetter = '';
        let isMatch = false;

        const letters = ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'K', 'L', 'M', 'O', 'P', 'R', 'S', 'T'];

        function runTrial() {
            if (Date.now() - startTime >= durationLimit) {
                return;
            }

            trialNum++;
            isTrialActive = true;
            keyResponse = 'None';
            pressRT = null;

            // Generate letter with controlled probability of match (~30% matching 2-back)
            if (history.length >= 2 && Math.random() < 0.3) {
                currentLetter = history[history.length - 2];
                isMatch = true;
            } else {
                isMatch = false;
                // Get a random letter
                let randLetter = letters[Math.floor(Math.random() * letters.length)];
                
                // If it accidentally matches 2-back, and we decided NOT to match, change it
                if (history.length >= 2 && randLetter === history[history.length - 2]) {
                    // Pick the next letter in the list to avoid duplicate
                    const idx = (letters.indexOf(randLetter) + 1) % letters.length;
                    randLetter = letters[idx];
                }
                currentLetter = randLetter;
            }

            history.push(currentLetter);

            // Display stimulus letter
            nbackLetterDisplay.textContent = currentLetter;
            nbackLetterDisplay.classList.remove('hidden');
            nbackFixationDisplay.classList.add('hidden');

            trialStartTimestamp = performance.now();

            // Stimulus duration: 500ms
            letterTimer = setTimeout(() => {
                nbackLetterDisplay.classList.add('hidden');
                nbackFixationDisplay.classList.remove('hidden');

                // Fixation duration: 2500ms (Total trial = 3000ms)
                fixationTimer = setTimeout(() => {
                    logNbackTrial();
                    runTrial();
                }, 2500);

            }, 500);
        }

        function handleNbackKey(e) {
            if (e.code === 'KeyM' || e.code === 'Space') {
                e.preventDefault();
                
                if (!isTrialActive || keyResponse !== 'None') return;
                
                keyResponse = e.code === 'KeyM' ? 'M' : 'Space';
                pressRT = Math.round(performance.now() - trialStartTimestamp);
            }
        }

        function logNbackTrial() {
            isTrialActive = false;
            let isCorrect = false;
            let outcome = '';

            const pressed = (keyResponse !== 'None');

            if (isMatch) {
                if (pressed) {
                    isCorrect = true;
                    outcome = 'Hit';
                } else {
                    isCorrect = false;
                    outcome = 'Miss';
                }
            } else {
                if (pressed) {
                    isCorrect = false;
                    outcome = 'False Alarm';
                } else {
                    isCorrect = true;
                    outcome = 'Correct Rejection';
                }
            }

            state.nbackLogs.push({
                trialNum: trialNum,
                letter: currentLetter,
                isMatch: isMatch,
                keyPressed: keyResponse,
                reactionTime: pressRT,
                isCorrect: isCorrect,
                outcome: outcome
            });
        }

        state.nbackKeyHandler = handleNbackKey;
        window.addEventListener('keydown', state.nbackKeyHandler);

        // Start first trial
        runTrial();

        function endNbackTest() {
            clearTimeout(letterTimer);
            clearTimeout(fixationTimer);
            window.removeEventListener('keydown', state.nbackKeyHandler);
            finishAssessment();
        }
    }

    // RESULTS PRESENTATION
    function finishAssessment() {
        showScreen('results');
        
        // Metadata
        resParticipantName.textContent = state.username;
        const now = new Date();
        resDate.textContent = now.toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Compute metrics
        const sartMetrics = calculateSartMetrics(state.sartLogs);
        const nbackMetrics = calculateNbackMetrics(state.nbackLogs);

        // Display SART2 Metrics
        metrics.sartAcc.textContent = `${sartMetrics.accuracy}%`;
        metrics.sartRt.textContent = sartMetrics.meanRT !== null ? `${sartMetrics.meanRT} ms` : 'N/A';
        metrics.sartRtsd.textContent = sartMetrics.sdRT !== null ? `${sartMetrics.sdRT} ms` : 'N/A';
        metrics.sartComm.textContent = sartMetrics.commissionErrors;
        metrics.sartOmis.textContent = sartMetrics.omissionErrors;

        // Display N-Back Metrics
        metrics.nbackAcc.textContent = `${nbackMetrics.accuracy}%`;
        metrics.nbackRt.textContent = nbackMetrics.meanRT !== null ? `${nbackMetrics.meanRT} ms` : 'N/A';
        metrics.nbackHitRate.textContent = `${nbackMetrics.hitRate}%`;
        metrics.nbackFaRate.textContent = `${nbackMetrics.faRate}%`;
        metrics.nbackHitMiss.textContent = `${nbackMetrics.hits} / ${nbackMetrics.misses}`;

        // Render chart
        renderChart(state.sartLogs, state.nbackLogs);

        // Google Sheets Integration
        syncToGoogleSheets(sartMetrics, nbackMetrics);
    }

    function syncToGoogleSheets(sartMetrics, nbackMetrics) {
        const syncBox = document.getElementById('sync-status-box');
        const syncText = document.getElementById('sync-status-text');
        
        if (!state.sheetsUrl) {
            if (syncBox) syncBox.classList.add('hidden');
            return;
        }

        if (syncBox && syncText) {
            syncBox.className = 'sync-status-box syncing';
            syncBox.classList.remove('hidden');
            syncText.textContent = 'Syncing results to Google Sheets...';
        }

        const payload = {
            participantName: state.username,
            timestamp: new Date().toISOString(),
            sessionMode: state.sessionMode,
            sartMetrics: sartMetrics,
            nbackMetrics: nbackMetrics,
            sartLogs: state.sartLogs,
            nbackLogs: state.nbackLogs
        };

        fetch(state.sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(() => {
            if (syncBox && syncText) {
                syncBox.className = 'sync-status-box success';
                syncText.textContent = 'Results synced to Google Sheets! ✅';
            }
        })
        .catch(err => {
            console.error('Google Sheets sync error:', err);
            if (syncBox && syncText) {
                syncBox.className = 'sync-status-box error';
                syncText.textContent = 'Sync failed. Please download CSV instead. ❌';
            }
        });
    }

    // MATH: Calculate SART2 Metrics
    function calculateSartMetrics(logs) {
        if (logs.length === 0) return { accuracy: 0, meanRT: null, sdRT: null, commissionErrors: 0, omissionErrors: 0 };

        let correct = 0;
        let commissionErrors = 0; // Space pressed on 3
        let omissionErrors = 0;   // No press on non-3
        let rts = [];

        logs.forEach(t => {
            if (t.isCorrect) correct++;
            
            if (t.digit === 3 && t.keyPressed !== 'None') {
                commissionErrors++;
            }
            if (t.digit !== 3 && t.keyPressed === 'None') {
                omissionErrors++;
            }
            // Log RT only for correct Go trials (non-3 keypresses)
            if (t.digit !== 3 && t.keyPressed !== 'None' && t.reactionTime !== null) {
                rts.push(t.reactionTime);
            }
        });

        const accuracy = Math.round((correct / logs.length) * 100);
        
        let meanRT = null;
        let sdRT = null;

        if (rts.length > 0) {
            const sum = rts.reduce((a, b) => a + b, 0);
            meanRT = Math.round(sum / rts.length);

            const variance = rts.reduce((a, b) => a + Math.pow(b - meanRT, 2), 0) / rts.length;
            sdRT = Math.round(Math.sqrt(variance));
        }

        return { accuracy, meanRT, sdRT, commissionErrors, omissionErrors };
    }

    // MATH: Calculate N-Back Metrics
    function calculateNbackMetrics(logs) {
        if (logs.length === 0) {
            return { accuracy: 0, meanRT: null, hitRate: 0, faRate: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
        }

        let correct = 0;
        let hits = 0;
        let misses = 0;
        let falseAlarms = 0;
        let correctRejections = 0;
        let rts = [];

        logs.forEach(t => {
            if (t.isCorrect) correct++;

            if (t.isMatch) {
                if (t.keyPressed !== 'None') {
                    hits++;
                    if (t.reactionTime !== null) rts.push(t.reactionTime);
                } else {
                    misses++;
                }
            } else {
                if (t.keyPressed !== 'None') {
                    falseAlarms++;
                } else {
                    correctRejections++;
                }
            }
        });

        const accuracy = Math.round((correct / logs.length) * 100);
        
        const totalTargets = hits + misses;
        const totalNonTargets = falseAlarms + correctRejections;

        const hitRate = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;
        const faRate = totalNonTargets > 0 ? Math.round((falseAlarms / totalNonTargets) * 100) : 0;

        let meanRT = null;
        if (rts.length > 0) {
            const sum = rts.reduce((a, b) => a + b, 0);
            meanRT = Math.round(sum / rts.length);
        }

        return { accuracy, meanRT, hitRate, faRate, hits, misses, falseAlarms, correctRejections };
    }

    // CHART: Render using Chart.js
    function renderChart(sartLogs, nbackLogs) {
        const ctx = document.getElementById('rt-chart').getContext('2d');
        
        // Destory previous instance if exists
        if (rtChartInstance) {
            rtChartInstance.destroy();
        }

        // Get trial numbers and RTs for correct responses
        const sartData = sartLogs
            .filter(t => t.digit !== 3 && t.keyPressed !== 'None' && t.reactionTime !== null)
            .map(t => ({ x: t.trialNum, y: t.reactionTime }));

        const nbackData = nbackLogs
            .filter(t => t.isMatch && t.keyPressed !== 'None' && t.reactionTime !== null)
            .map(t => ({ x: t.trialNum, y: t.reactionTime }));

        rtChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'SART2 (Correct Go RT)',
                        data: sartData,
                        borderColor: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.5)',
                        showLine: true,
                        tension: 0.2
                    },
                    {
                        label: '2-Back (Hit RT)',
                        data: nbackData,
                        borderColor: '#c084fc',
                        backgroundColor: 'rgba(192, 132, 252, 0.5)',
                        showLine: true,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Trial Number', color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        title: { display: true, text: 'Reaction Time (ms)', color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#9ca3af' },
                        min: 0
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#f3f4f6', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    // EXPORT: CSV File Generation
    btnDownloadCsv.addEventListener('click', () => {
        let csvRows = [];
        
        // CSV Metadata & Headers
        csvRows.push(`Participant Name,${state.username}`);
        csvRows.push(`Session Date,${new Date().toISOString()}`);
        csvRows.push(`Session Mode,${state.sessionMode}`);
        csvRows.push("");
        
        csvRows.push("Task,Trial_Number,Stimulus,Stimulus_Param_Size_Or_N,Is_Target,Response_Key,Reaction_Time_MS,Is_Correct,Trial_Outcome_Details");

        // SART2 Data rows
        state.sartLogs.forEach(t => {
            const isTarget = (t.digit === 3);
            csvRows.push(`SART2,${t.trialNum},${t.digit},${t.fontSize},${isTarget},${t.keyPressed},${t.reactionTime !== null ? t.reactionTime : 'N/A'},${t.isCorrect},${t.errorType}`);
        });

        csvRows.push(""); // separating spacer

        // N-Back Data rows
        state.nbackLogs.forEach(t => {
            csvRows.push(`2-Back,${t.trialNum},${t.letter},2,${t.isMatch},${t.keyPressed},${t.reactionTime !== null ? t.reactionTime : 'N/A'},${t.isCorrect},${t.outcome}`);
        });

        const csvContent = csvRows.join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `orbit_session_${state.username.replace(/\s+/g, '_')}_${Date.now()}.csv`);
        document.body.appendChild(link); // Required for FF
        
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });

    // ACTION: Restart Session
    btnRestart.addEventListener('click', () => {
        // Reset inputs and screens
        usernameInput.value = '';
        sessionModeSelect.value = 'standard';
        btnSartStarted.classList.remove('hidden');
        sartCountdownDisplay.classList.add('hidden');
        btnNbackStarted.classList.remove('hidden');
        nbackCountdownDisplay.classList.add('hidden');
        btnProceedNback.disabled = true;

        showScreen('welcome');
    });
});
