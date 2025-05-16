import * as PIXI from 'pixi.js';
import { Leaderboard } from './components/leaderboard.js';
import { setupConnectComponentsTask } from './tasks/connectComponents.js';
import { setupDecryptMessageTask } from './tasks/decryptMessage.js';
import { setupFindBugTask } from './tasks/findBug.js';
import { setupCloseVulnerabilityTask } from './tasks/closeVulnerability.js';
import { setupStopDdosAttackTask } from './tasks/stopDdosAttack.js';
import { setupRestoreBackupTask } from './tasks/restoreBackup.js';
import { setupSortDataTask } from './tasks/sortData.js';
import { playSound } from './utils/audio.js';
import { supabase } from './utils/supabase.js';

// Конфигурация игры
const GAME_TIME = 180; // 3 минуты в секундах
const TASK_TYPES = [
    'findBugInCode', 
    'connectComponents', 
    'closeVulnerability', 
    'decryptMessage', 
    'sortData', 
    'stopDdosAttack', 
    'restoreBackup'
];

// Состояние игры
let gameState = {
    isPlaying: false,
    score: 0,
    timeLeft: GAME_TIME,
    countdownInterval: null,
    currentTask: null,
    tasksCompleted: 0
};

// Контекст Web Audio API
let audioContext = null;
const audioBuffers = {};

// Звуковые эффекты - загрузка через Web Audio API
async function loadSound(name, url) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[name] = audioBuffer;
        console.log(`Звук загружен: ${name}`);
    } catch (e) {
        console.error(`Ошибка загрузки звука ${name}:`, e);
    }
}

function playSound(name) {
    const buffer = audioBuffers[name];
    if (buffer && audioContext) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    } else {
        console.warn(`Sound buffer not found or audio context not initialized: ${name}`);
    }
}

// Load all sounds initially
loadSound('success', 'success.mp3');
loadSound('error', 'error.mp3');
loadSound('click', 'click.mp3');
loadSound('gameOver', 'game-over.mp3');
loadSound('countdown', 'countdown.mp3');

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startButton = document.getElementById('start-button');
const replayButton = document.getElementById('replay-button');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const resultMessageElement = document.getElementById('result-message');
const taskTitleElement = document.getElementById('task-title');
const gameAreaElement = document.getElementById('game-area');
const leaderboardContainer = document.getElementById('leaderboard-container');

// Initialize leaderboard
const leaderboard = new Leaderboard(leaderboardContainer);

// Event listeners
startButton.addEventListener('click', startGame);
replayButton.addEventListener('click', resetGame);

// Game initialization
function initGame() {
    startButton.addEventListener('click', startGame);
    // AudioContext needs user gesture to start, so we initialize it on the first click
    // Loading happens outside of click
}

function startGame() {
    // Ensure audio context is running after the first user interaction
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error("AudioContext resume failed:", e));
    }

    playSound('click');

    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.timeLeft = GAME_TIME;
    gameState.tasksCompleted = 0;

    updateScore();
    updateTimer();

    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Start countdown timer
    gameState.countdownInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();

        if (gameState.timeLeft <= 0) {
            endGame();
        }

        // Play countdown sound in the last 5 seconds
        if (gameState.timeLeft <= 5 && gameState.timeLeft > 0) {
             // Prevent rapid firing if interval is slightly off
             if (gameState.timeLeft > 0 && gameState.timeLeft <= 5 && gameState.timeLeft % 1 === 0) {
                 playSound('countdown');
             }
        }
    }, 1000);

    // Start first task
    showNextTask();
}

async function endGame() {
    playSound('gameOver');

    gameState.isPlaying = false;
    clearInterval(gameState.countdownInterval);

    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    finalScoreElement.textContent = gameState.score;

    // Generate result message based on score
    let resultMessage = '';
    if (gameState.score >= 1000) {
        resultMessage = 'Превосходно! Вы - настоящий IT-специалист!';
    } else if (gameState.score >= 500) {
        resultMessage = 'Отличный результат! Вы разбираетесь в технологиях!';
    } else {
        resultMessage = 'Неплохо! С практикой вы станете лучше!';
    }

    resultMessageElement.textContent = resultMessage;

    // Submit score and refresh leaderboard
    await leaderboard.submitNewScore(gameState.score);
}

function resetGame() {
    playSound('click');

    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // Clear game area
    gameAreaElement.innerHTML = '';
}

function updateScore() {
    scoreElement.textContent = gameState.score;
}

function updateTimer() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showNextTask() {
    // Clear previous task
    gameAreaElement.innerHTML = '';

    // Choose a random task type
    const taskIndex = Math.floor(Math.random() * TASK_TYPES.length);
    const taskType = TASK_TYPES[taskIndex];

    // Initialize the task
    switch (taskType) {
        case 'findBugInCode':
            setupFindBugTask();
            break;
        case 'connectComponents':
            setupConnectComponentsTask();
            break;
        case 'closeVulnerability':
            setupCloseVulnerabilityTask();
            break;
        case 'decryptMessage':
            setupDecryptMessageTask();
            break;
        case 'sortData':
            setupSortDataTask();
            break;
        case 'stopDdosAttack':
            setupStopDdosAttackTask();
            break;
        case 'restoreBackup':
            setupRestoreBackupTask();
            break;
    }

    gameState.tasksCompleted++;
}

function completeTask(success, timeBonus = 0) {
    if (success) {
        playSound('success');
        // Base points + time bonus
        const points = 100 + timeBonus;
        gameState.score += points;

        // Show success animation
        const successMsg = document.createElement('div');
        successMsg.textContent = `+${points}`;
        successMsg.style.position = 'absolute';
        successMsg.style.top = '50%';
        successMsg.style.left = '50%';
        successMsg.style.transform = 'translate(-50%, -50%)';
        successMsg.style.fontSize = '2rem';
        successMsg.style.color = 'var(--success-color)';
        successMsg.style.zIndex = '100';
        gameAreaElement.appendChild(successMsg);

        // Animate the success message
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            successMsg.style.opacity = opacity;
            successMsg.style.transform = `translate(-50%, ${-50 - (1-opacity)*50}%)`;

            if (opacity <= 0) {
                clearInterval(fadeInterval);
                gameAreaElement.removeChild(successMsg);

                // Show next task
                setTimeout(showNextTask, 300);
            }
        }, 30);
    } else {
        playSound('error');
        // Penalty for wrong answer
        gameState.score = Math.max(0, gameState.score - 50);

        // Show error animation
        const errorMsg = document.createElement('div');
        errorMsg.textContent = '-50';
        errorMsg.style.position = 'absolute';
        errorMsg.style.top = '50%';
        errorMsg.style.left = '50%';
        errorMsg.style.transform = 'translate(-50%, -50%)';
        errorMsg.style.fontSize = '2rem';
        errorMsg.style.color = 'var(--error-color)';
        errorMsg.style.zIndex = '100';
        gameAreaElement.appendChild(errorMsg);

        // Animate the error message
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            errorMsg.style.opacity = opacity;

            if (opacity <= 0) {
                clearInterval(fadeInterval);
                gameAreaElement.removeChild(errorMsg);
            }
        }, 30);
    }

    updateScore();
}

// Task 1: Find bug in code
function setupFindBugTask() {
    taskTitleElement.textContent = 'Найди ошибку в коде';

    // Generate code snippet with a bug
    const codeSnippets = [
        {
            code: [
                '<span class="code-keyword">function</span> <span class="code-function">calculateTotal</span><span class="code-bracket">(</span><span class="code-variable">items</span><span class="code-bracket">)</span> <span class="code-bracket">{</span>',
                '  <span class="code-keyword">let</span> <span class="code-variable">sum</span> <span class="code-operator">=</span> <span class="code-number">0</span><span class="code-punctuation">;</span>',
                '  <span class="code-keyword">for</span> <span class="code-bracket">(</span><span class="code-keyword">let</span> <span class="code-variable">i</span> <span class="code-operator">=</span> <span class="code-number">0</span><span class="code-punctuation">;</span> <span class="code-variable">i</span> <span class="code-operator"><</span> <span class="code-variable">items</span><span class="code-punctuation">.</span><span class="code-variable">length</span><span class="code-punctuation">;</span> <span class="code-variable">i</span><span class="code-operator">++</span><span class="code-bracket">)</span> <span class="code-bracket">{</span>',
                '    <span class="code-variable">sum</span> <span class="code-operator">+=</span> <span class="code-variable">items</span><span class="code-bracket">[</span><span class="code-variable">i</span><span class="code-bracket">]</span><span class="code-punctuation">.</span><span class="bug code-variable">prize</span><span class="code-punctuation">;</span> <span class="code-comment">// Error: should be price</span>',
                '  <span class="code-bracket">}</span>',
                '  <span class="code-keyword">return</span> <span class="code-variable">sum</span><span class="code-punctuation">;</span>',
                '<span class="code-bracket">}</span>'
            ],
            bugIndex: 3,
            bugElement: 'prize'
        },
        {
            code: [
                '<span class="code-keyword bug">functoin</span> <span class="code-function">validateUser</span><span class="code-bracket">(</span><span class="code-variable">user</span><span class="code-bracket">)</span> <span class="code-bracket">{</span> <span class="code-comment">// Error: functoin</span>',
                '  <span class="code-keyword">if</span> <span class="code-bracket">(</span><span class="code-variable">user</span><span class="code-punctuation">.</span><span class="code-variable">name</span> <span class="code-operator">&&</span> <span class="code-variable">user</span><span class="code-punctuation">.</span><span class="code-variable">email</span><span class="code-bracket">)</span> <span class="code-bracket">{</span>',
                '    <span class="code-keyword">return</span> <span class="code-keyword">true</span><span class="code-punctuation">;</span>',
                '  <span class="code-bracket">}</span>',
                '  <span class="code-keyword">return</span> <span class="code-keyword">false</span><span class="code-punctuation">;</span>',
                '<span class="code-bracket">}</span>'
            ],
            bugIndex: 0,
            bugElement: 'functoin'
        },
        {
            code: [
                '<span class="code-keyword">const</span> <span class="code-variable">data</span> <span class="code-operator">=</span> <span class="code-bracket">{</span>',
                '  <span class="code-variable">name</span><span class="code-punctuation">:</span> <span class="code-string">"User"</span><span class="code-punctuation">,</span>',
                '  <span class="code-variable">age</span><span class="code-punctuation">:</span> <span class="code-number">25</span><span class="bug code-punctuation">,</span> <span class="code-comment">// Error: extra comma</span>',
                '<span class="code-bracket">}</span><span class="code-punctuation">;</span>'
            ],
            bugIndex: 2,
            bugElement: ','
        }
    ];

    // Select a random code snippet
    const snippetIndex = Math.floor(Math.random() * codeSnippets.length);
    const snippet = codeSnippets[snippetIndex];

    // Create code container
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-snippet';

    // Add code lines
    snippet.code.forEach((line, index) => {
        const codeLine = document.createElement('div');
        codeLine.className = 'code-line';
        codeLine.innerHTML = line;
        codeContainer.appendChild(codeLine);
    });

    gameAreaElement.appendChild(codeContainer);

    // Add event listeners to all elements with the 'bug' class
    const bugElements = codeContainer.querySelectorAll('.bug');
    bugElements.forEach(element => {
        // Ensure event listener is added only once per element click
        element.onclick = () => {
            // Disable further clicks on bug elements for this task
            bugElements.forEach(el => el.onclick = null);
            // Disable clicks on non-bug elements as well
            const nonBugElements = codeContainer.querySelectorAll('.code-element:not(.bug)');
             nonBugElements.forEach(el => el.onclick = null);


            element.style.textDecoration = 'line-through';
            element.style.color = 'var(--success-color)';
            completeTask(true, Math.floor(gameState.timeLeft / 10));
        };
    });

    // Add event listeners to all code elements that are not bugs
    const nonBugElements = codeContainer.querySelectorAll('.code-element:not(.bug)');
    nonBugElements.forEach(element => {
         // Ensure event listener is added only once per element click
        element.onclick = () => {
             // Disable further clicks on bug elements for this task
            bugElements.forEach(el => el.onclick = null);
            // Disable clicks on non-bug elements as well
             nonBugElements.forEach(el => el.onclick = null);

            element.style.color = 'var(--error-color)';
            setTimeout(() => {
                // element.style.color = ''; // Optional: fade back color or leave red
            }, 500);
            completeTask(false);
        };
    });
}

// Task 2: Connect Components
function setupConnectComponentsTask() {
    taskTitleElement.textContent = 'Соедини компоненты правильно';

    // Create SVG container for drawing lines
    const svgContainer = document.createElement('div');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to elements below
    svgContainer.innerHTML = '<svg width="100%" height="100%"></svg>';

    const svg = svgContainer.querySelector('svg');

    gameAreaElement.appendChild(svgContainer);

    // Component definitions
    const components = [
        { id: 'client', label: 'Клиент', x: 150, y: 150 },
        { id: 'server', label: 'Сервер', x: 400, y: 150 },
        { id: 'database', label: 'База данных', x: 650, y: 150 },
        { id: 'cache', label: 'Кэш', x: 400, y: 300 }
    ];

    // Connection rules (what needs to be connected to what)
    // Define connections bidirectionally for easier checking
    const correctConnections = [
        { from: 'client', to: 'server' },
        { from: 'server', to: 'client' }, // Bidirectional
        { from: 'server', to: 'database' },
        { from: 'database', to: 'server' }, // Bidirectional
        { from: 'server', to: 'cache' },
        { from: 'cache', to: 'server' } // Bidirectional
    ];

    // Keep track of user's connections
    const userConnections = [];

    // Create components
    components.forEach(comp => {
        const component = document.createElement('div');
        component.className = 'component';
        component.id = comp.id;
        component.dataset.id = comp.id;
        component.style.left = `${comp.x}px`;
        component.style.top = `${comp.y}px`;

        // Add icon or text - using simple text placeholder
        const icon = document.createElement('div');
        icon.textContent = comp.label; // Use full label for clarity
        icon.style.fontSize = '0.8rem';
        icon.style.textAlign = 'center';
        icon.style.paddingTop = '15px';
        component.appendChild(icon);

        // Add label (optional, if icon isn't text) - removed as label is in icon
        // const label = document.createElement('div');
        // label.className = 'component-label';
        // label.textContent = comp.label;
        // component.appendChild(label);

        gameAreaElement.appendChild(component);
    });

    // Variables for line drawing
    let isDrawing = false;
    let startComponent = null;
    let currentLine = null;

    // Add event listeners for component interaction
    const componentElements = gameAreaElement.querySelectorAll('.component');

    componentElements.forEach(component => {
        component.addEventListener('mousedown', startDrawing);
        component.addEventListener('mouseup', endDrawing);
        component.addEventListener('mouseleave', handleMouseLeave); // Added to stop drawing if mouse leaves component
    });

     // Add mouseup and mouseleave listeners to the game area as well
    gameAreaElement.addEventListener('mouseup', cancelDrawing);
    gameAreaElement.addEventListener('mouseleave', cancelDrawing);


    gameAreaElement.addEventListener('mousemove', updateLine);

    function startDrawing(e) {
         if (!gameState.isPlaying) return; // Only allow interaction if game is playing
        isDrawing = true;
        startComponent = e.currentTarget;

        // Create a new line in the SVG
        currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        currentLine.setAttribute('stroke', 'var(--accent-blue)');
        currentLine.setAttribute('stroke-width', '3');
         currentLine.setAttribute('stroke-linecap', 'round'); // Rounded ends

        // Starting position (center of the component relative to gameAreaElement)
        const startRect = startComponent.getBoundingClientRect();
        const gameRect = gameAreaElement.getBoundingClientRect();

        const x1 = startRect.left + startRect.width / 2 - gameRect.left;
        const y1 = startRect.top + startRect.height / 2 - gameRect.top;

        currentLine.setAttribute('x1', x1);
        currentLine.setAttribute('y1', y1);
        currentLine.setAttribute('x2', x1); // Start with line of zero length
        currentLine.setAttribute('y2', y1);

        svg.appendChild(currentLine);

        playSound('click'); // Play click sound on start draw
        e.preventDefault(); // Prevent default drag behavior
    }

     // Handle case where mouse leaves a component while drawing
     function handleMouseLeave(e) {
         if (isDrawing && e.relatedTarget && e.relatedTarget !== gameAreaElement && !e.relatedTarget.closest('.component')) {
             // If mouse leaves a component and enters something that is not the gameArea or another component
              cancelDrawing();
         }
     }

     // Cancel drawing if mouseup or mouseleave occurs outside a component
     function cancelDrawing() {
         if (isDrawing && currentLine) {
             currentLine.remove(); // Remove the temporary line
         }
         isDrawing = false;
         startComponent = null;
         currentLine = null;
     }


    function updateLine(e) {
        if (!isDrawing || !currentLine) return;

        const gameRect = gameAreaElement.getBoundingClientRect();
        // Calculate mouse position relative to gameAreaElement
        const x2 = e.clientX - gameRect.left;
        const y2 = e.clientY - gameRect.top;

        currentLine.setAttribute('x2', x2);
        currentLine.setAttribute('y2', y2);
    }

    function endDrawing(e) {
        if (!isDrawing || !startComponent) return; // Ensure drawing started and has a source

        const endComponent = e.currentTarget; // The component where mouseup occurred

        // If mouseup was on a component and it's not the start component
        if (endComponent && endComponent.classList.contains('component') && startComponent !== endComponent) {
            const fromId = startComponent.dataset.id;
            const toId = endComponent.dataset.id;

            // Check if this specific directed connection already exists
             const connectionExists = userConnections.some(conn =>
                 conn.from === fromId && conn.to === toId
             );

            if (!connectionExists) {
                // Adjust the line to connect to the center of the end component
                const startRect = startComponent.getBoundingClientRect();
                const endRect = endComponent.getBoundingClientRect();
                const gameRect = gameAreaElement.getBoundingClientRect();

                const x1 = startRect.left + startRect.width / 2 - gameRect.left;
                const y1 = startRect.top + startRect.height / 2 - gameRect.top;
                const x2 = endRect.left + endRect.width / 2 - gameRect.left;
                const y2 = endRect.top + endRect.height / 2 - gameRect.top;

                currentLine.setAttribute('x1', x1);
                currentLine.setAttribute('y1', y1);
                currentLine.setAttribute('x2', x2);
                currentLine.setAttribute('y2', y2);

                 // Add arrow marker (optional, for direction)
                 const markerId = `arrow-${fromId}-${toId}`;
                 // Check if marker already exists
                 if (!svg.querySelector(`#${markerId}`)) {
                      const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svg.firstChild);
                     const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                     marker.setAttribute('id', markerId);
                     marker.setAttribute('viewBox', '0 0 10 10');
                     marker.setAttribute('refX', '9'); // Position marker at the end of the line
                     marker.setAttribute('refY', '5');
                     marker.setAttribute('markerUnits', 'strokeWidth');
                     marker.setAttribute('markerWidth', '6');
                     marker.setAttribute('markerHeight', '6');
                     marker.setAttribute('orient', 'auto');
                     const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                     path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
                     path.setAttribute('fill', 'var(--accent-blue)');
                     marker.appendChild(path);
                     defs.appendChild(marker);
                 }
                 currentLine.setAttribute('marker-end', `url(#${markerId})`);


                // Store the connection (directed connection)
                userConnections.push({ from: fromId, to: toId, line: currentLine });

                playSound('click'); // Play click sound on successful connection

                // Check if all correct connections have been made
                checkConnections();

            } else {
                // Connection already exists, remove the temporary line
                if (currentLine) {
                    currentLine.remove();
                    currentLine = null; // Clear currentLine reference
                }
                 playSound('error'); // Optional: play error sound for duplicate
            }
        } else {
            // Mouseup was not on a different component, remove the temporary line
            if (currentLine) {
                currentLine.remove();
                currentLine = null; // Clear currentLine reference
            }
        }

        isDrawing = false;
        startComponent = null;
        // currentLine is set to null above if removed
    }

    function checkConnections() {
        // Check if all required directed connections are made
        // We only need client -> server, server -> database, server -> cache
        const requiredDirectedConnections = [
             { from: 'client', to: 'server' },
             { from: 'server', to: 'database' },
             { from: 'server', to: 'cache' }
         ];

        const allRequiredMade = requiredDirectedConnections.every(required => {
            return userConnections.some(userConn =>
                userConn.from === required.from && userConn.to === required.to
            );
        });

        // If all required connections are made, complete the task
         if (allRequiredMade) { // No need to check userConnections.length - extra connections are allowed but don't fail the task
            // Remove event listeners to prevent further drawing
            componentElements.forEach(component => {
                component.removeEventListener('mousedown', startDrawing);
                component.removeEventListener('mouseup', endDrawing);
                 component.removeEventListener('mouseleave', handleMouseLeave);
            });
             gameAreaElement.removeEventListener('mouseup', cancelDrawing);
             gameAreaElement.removeEventListener('mouseleave', cancelDrawing);
            gameAreaElement.removeEventListener('mousemove', updateLine);

            // Show success state
            userConnections.forEach(conn => {
                conn.line.setAttribute('stroke', 'var(--success-color)');
                // Update marker color if needed (requires updating marker definition)
                const markerId = `arrow-${conn.from}-${conn.to}`;
                 const marker = svg.querySelector(`#${markerId}`);
                 if(marker) {
                      marker.querySelector('path').setAttribute('fill', 'var(--success-color)');
                 }
            });

            setTimeout(() => {
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            }, 500); // Delay slightly to show success color
        }
    }
}

// Task 3: Close Vulnerability
function setupCloseVulnerabilityTask() {
    taskTitleElement.textContent = 'Закрой все уязвимости в системе';

    // Create server icon
    const serverContainer = document.createElement('div');
    serverContainer.className = 'server-icon';

    const serverImg = document.createElement('img');
    serverImg.src = 'server-icon.png';
    serverImg.alt = 'Server Icon'; // Added alt text
    serverContainer.appendChild(serverImg);

    gameAreaElement.appendChild(serverContainer);

    // Create 3-5 vulnerabilities
    const numVulnerabilities = Math.floor(Math.random() * 3) + 3; // 3-5 vulnerabilities
    const vulnerabilities = [];
    let vulnerabilitiesClosed = 0;

    // Use a delay for spawning
    for (let i = 0; i < numVulnerabilities; i++) {
        // Use requestAnimationFrame or setTimeout for controlled spawning
        setTimeout(() => {
             if (!gameState.isPlaying || vulnerabilitiesClosed >= numVulnerabilities) return; // Stop spawning if game ends or task is completed

            // Create vulnerability at random position
            const vulnerability = document.createElement('div');
            vulnerability.className = 'vulnerability';

            // Position randomly on the server
             // Get actual rendered size after adding to DOM
            const serverRect = serverContainer.getBoundingClientRect();
            const gameRect = gameAreaElement.getBoundingClientRect();

            // Position relative to serverContainer, which is centered
            const serverRelativeX = serverRect.left - gameRect.left;
            const serverRelativeY = serverRect.top - gameRect.top;

             // Ensure vulnerability stays within server bounds, with padding
             const padding = 10; // Keep vulnerabilities away from edges
             const vulSize = 30; // Size of vulnerability div
             const randX = serverRelativeX + padding + Math.random() * (serverRect.width - vulSize - 2 * padding);
             const randY = serverRelativeY + padding + Math.random() * (serverRect.height - vulSize - 2 * padding);


            vulnerability.style.left = `${randX}px`;
            vulnerability.style.top = `${randY}px`;

            gameAreaElement.appendChild(vulnerability); // Append to gameArea for easier positioning

            vulnerabilities.push(vulnerability);

            // Add click handler
            vulnerability.addEventListener('click', function handler() {
                // Remove the event listener after first click
                this.removeEventListener('click', handler);

                // Mark as closed
                vulnerabilitiesClosed++;

                this.style.backgroundColor = 'var(--success-color)';
                this.style.animation = 'none'; //


                if (vulnerabilitiesClosed >= numVulnerabilities) {
                    completeTask(true, Math.floor(gameState.timeLeft / 10));
                }
            });
        }, i * 1000); // Add vulnerabilities with a delay
    }
}

// Task 4: Decrypt Message
function setupDecryptMessageTask() {
    taskTitleElement.textContent = 'Расшифруй сообщение';

    // Messages with encryption and options
    const messages = [
        {
            encrypted: "рбуит - пкрблтп", // shift +1
            options: ["сатир - плохое", "сбуйс - рлпчпе", "санкт - петербр", "сауис - плохой"],
            correct: 3
        },
        {
            encrypted: "лпоухс - мхдщкл", // shift -1
            options: ["контур - лучший", "лпнфус - дшъщкй", "мрохут - нцдылн", "контур - худший"],
            correct: 0
        },
        {
            encrypted: "еъоызх спуоэтэйкк", // reversed
            options: ["умные технологии", "новые разработки", "контур технологии", "цифровые решения"],
            correct: 2
        }
    ];

    // Select a random message
    const messageIndex = Math.floor(Math.random() * messages.length);
    const message = messages[messageIndex];

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.style.display = 'flex';
    messageContainer.style.flexDirection = 'column';
    messageContainer.style.alignItems = 'center';
    messageContainer.style.gap = '30px';

    // Create encrypted message
    const encryptedElement = document.createElement('div');
    encryptedElement.className = 'code-snippet';
    encryptedElement.style.fontSize = '1.5rem';
    encryptedElement.style.padding = '20px 30px';
    encryptedElement.textContent = message.encrypted;

    messageContainer.appendChild(encryptedElement);

    // Create options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '15px';

    message.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option;
        button.style.width = '300px';

        button.addEventListener('click', () => {
            if (index === message.correct) {
                button.style.backgroundColor = 'var(--success-color)';
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                completeTask(false);
            }
        });

        optionsContainer.appendChild(button);
    });

    messageContainer.appendChild(optionsContainer);
    gameAreaElement.appendChild(messageContainer);
}

// Task 5: Sort Data
function setupSortDataTask() {
    taskTitleElement.textContent = 'Отсортируй данные по возрастанию';

    // Create sorting container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sortable-container';

    // Generate random numbers to sort
    const numItems = Math.floor(Math.random() * 3) + 4; // 4-6 items
    const numbers = [];

    for (let i = 0; i < numItems; i++) {
        numbers.push(Math.floor(Math.random() * 100));
    }

    // Shuffle the numbers
    numbers.sort(() => Math.random() - 0.5);

    // Create sortable items
    numbers.forEach(num => {
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.textContent = num;
        item.draggable = true;

        // Add drag events
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragover', dragOver);
        item.addEventListener('dragenter', dragEnter);
        item.addEventListener('dragleave', dragLeave);
        item.addEventListener('drop', drop);
        item.addEventListener('dragend', dragEnd);

        sortContainer.appendChild(item);
    });

    gameAreaElement.appendChild(sortContainer);

    // Drag and drop functionality
    let draggedItem = null;

    function dragStart() {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        playSound('click');
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }

    function dragLeave() {
        this.classList.remove('drag-over');
    }

    function drop() {
        this.classList.remove('drag-over');

        // Get the index of both items
        const allItems = [...sortContainer.querySelectorAll('.sortable-item')];
        const draggedIndex = allItems.indexOf(draggedItem);
        const dropTargetIndex = allItems.indexOf(this);

        // Swap the items
        if (draggedIndex < dropTargetIndex) {
            sortContainer.insertBefore(draggedItem, this.nextSibling);
        } else {
            sortContainer.insertBefore(draggedItem, this);
        }

        // Check if items are sorted
        checkSorting();
    }

    function dragEnd() {
        this.classList.remove('dragging');
    }

    function checkSorting() {
        const items = [...sortContainer.querySelectorAll('.sortable-item')];
        const currentValues = items.map(item => parseInt(item.textContent));

        // Check if sorted in ascending order
        let isSorted = true;
        for (let i = 1; i < currentValues.length; i++) {
            if (currentValues[i] < currentValues[i - 1]) {
                isSorted = false;
                break;
            }
        }

        if (isSorted) {
            // Remove event listeners
            items.forEach(item => {
                item.removeEventListener('dragstart', dragStart);
                item.removeEventListener('dragover', dragOver);
                item.removeEventListener('dragenter', dragEnter);
                item.removeEventListener('dragleave', dragLeave);
                item.removeEventListener('drop', drop);
                item.removeEventListener('dragend', dragEnd);

                item.style.backgroundColor = 'var(--success-color)';
                item.style.color = 'white';
            });

            setTimeout(() => {
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            }, 500);
        }
    }
}

// Task 6: Stop DDoS Attack
function setupStopDdosAttackTask() {
    taskTitleElement.textContent = 'Отбей DDOS-атаку! Уничтожь вредоносные пакеты (красные)';

    // Create server in the center
    const serverContainer = document.createElement('div');
    serverContainer.className = 'server-icon';
    serverContainer.style.width = '100px';
    serverContainer.style.height = '120px';
    serverContainer.style.position = 'absolute';
    serverContainer.style.left = '50%';
    serverContainer.style.top = '50%';
    serverContainer.style.transform = 'translate(-50%, -50%)';

    gameAreaElement.appendChild(serverContainer);

    // Track packets
    const packets = [];
    let packetCount = 0;
    let badPacketsDestroyed = 0;
    let goodPacketsDestroyed = 0;
    let targetScore = 10; // Need to destroy 10 bad packets

    // Spawn packets periodically
    const spawnInterval = setInterval(() => {
        spawnPacket();
    }, 800);

    function spawnPacket() {
        if (!gameState.isPlaying) {
            clearInterval(spawnInterval);
            return;
        }

        // Create a packet
        const packet = document.createElement('div');
        packet.className = 'packet';
        packetCount++;

        // Decide if it's good or bad (70% chance of bad)
        const isBad = Math.random() < 0.7;
        if (!isBad) {
            packet.classList.add('good');
        }

        // Random starting position (from edges)
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const gameRect = gameAreaElement.getBoundingClientRect();

        let x, y;
        switch (edge) {
            case 0: // top
                x = Math.random() * gameRect.width;
                y = 0;
                break;
            case 1: // right
                x = gameRect.width - 40;
                y = Math.random() * gameRect.height;
                break;
            case 2: // bottom
                x = Math.random() * gameRect.width;
                y = gameRect.height - 40;
                break;
            case 3: // left
                x = 0;
                y = Math.random() * gameRect.height;
                break;
        }

        packet.style.left = `${x}px`;
        packet.style.top = `${y}px`;

        gameAreaElement.appendChild(packet);

        // Add to tracking
        packets.push({
            element: packet,
            isBad: isBad,
            x: x,
            y: y,
            speed: Math.random() * 1 + 1 // Random speed between 1-2
        });

        // Add click handler
        packet.addEventListener('click', function() {
            // Remove the packet
            const index = packets.findIndex(p => p.element === this);
            if (index > -1) {
                const isPacketBad = packets[index].isBad;

                if (isPacketBad) {
                    badPacketsDestroyed++;
                    this.style.transform = 'scale(1.5)';
                    this.style.opacity = '0';
                    setTimeout(() => {
                        gameAreaElement.removeChild(this);
                        packets.splice(index, 1);
                    }, 200);
                    playSound('success');
                } else {
                    goodPacketsDestroyed++;
                    this.style.backgroundColor = 'var(--error-color)';
                    setTimeout(() => {
                        gameAreaElement.removeChild(this);
                        packets.splice(index, 1);
                    }, 200);
                    playSound('error');
                    // Penalty for destroying good packets
                    gameState.score = Math.max(0, gameState.score - 20);
                    updateScore();
                }

                // Check if target reached
                if (badPacketsDestroyed >= targetScore) {
                    clearInterval(spawnInterval);
                    clearInterval(moveInterval);

                    // Remove all packets
                    packets.forEach(packet => {
                        gameAreaElement.removeChild(packet.element);
                    });
                    packets.length = 0;

                    completeTask(true, Math.floor(gameState.timeLeft / 15));
                }
            }
        });
    }

    // Move packets
    const moveInterval = setInterval(() => {
        movePackets();
    }, 30);

    function movePackets() {
        if (!gameState.isPlaying) {
            clearInterval(moveInterval);
            return;
        }

        const serverRect = serverContainer.getBoundingClientRect();
        const gameRect = gameAreaElement.getBoundingClientRect();

        const serverCenterX = serverRect.left + serverRect.width / 2 - gameRect.left;
        const serverCenterY = serverRect.top + serverRect.height / 2 - gameRect.top;

        // Move each packet towards the server
        for (let i = packets.length - 1; i >= 0; i--) {
            const packet = packets[i];

            // Calculate direction towards server
            const dx = serverCenterX - (packet.x + 20);
            const dy = serverCenterY - (packet.y + 20);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Normalize and apply speed
            if (distance > 0) {
                packet.x += (dx / distance) * packet.speed;
                packet.y += (dy / distance) * packet.speed;

                packet.element.style.left = `${packet.x}px`;
                packet.element.style.top = `${packet.y}px`;
            }

            // Check if packet reached the server (within 30px)
            if (distance < 30) {
                // Remove the packet
                gameAreaElement.removeChild(packet.element);
                packets.splice(i, 1);

                // Penalty if bad packet reaches server
                if (packet.isBad) {
                    gameState.score = Math.max(0, gameState.score - 30);
                    updateScore();

                    // Visual feedback
                    serverContainer.style.backgroundColor = 'var(--error-color)';
                    setTimeout(() => {
                        serverContainer.style.backgroundColor = '';
                    }, 200);

                    playSound('error');
                }
            }
        }
    }
}

// Task 7: Restore Backup
function setupRestoreBackupTask() {
    taskTitleElement.textContent = 'Восстанови данные из бэкапа';

    // Create container
    const backupContainer = document.createElement('div');
    backupContainer.className = 'backup-container';

    // Create damaged file icon
    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon';
    fileIcon.innerHTML = '<span style="font-size: 2rem;">📄</span>';

    backupContainer.appendChild(fileIcon);

    // Create buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Correct button and fake buttons
    const correctIndex = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i++) {
        const button = document.createElement('button');
        button.className = 'choice-btn';

        if (i === correctIndex) {
            button.textContent = "Восстановить из бэкапа";
            button.addEventListener('click', () => {
                button.style.backgroundColor = 'var(--success-color)';

                // Show file restored
                fileIcon.style.boxShadow = '0 0 15px var(--success-color)';
                fileIcon.querySelector('span').textContent = '✓';

                completeTask(true, Math.floor(gameState.timeLeft / 10));
            });
        } else {
            const fakeOptions = [
                "Переустановить систему", 
                "Запустить антивирус", 
                "Обновить драйвера", 
                "Перезагрузить сервер"
            ];

            // Get a random fake option
            const randomIndex = Math.floor(Math.random() * fakeOptions.length);
            button.textContent = fakeOptions[randomIndex];

            button.addEventListener('click', () => {
                button.style.backgroundColor = 'var(--error-color)';
                completeTask(false);
            });
        }

        buttonContainer.appendChild(button);
    }

    backupContainer.appendChild(buttonContainer);
    gameAreaElement.appendChild(backupContainer);
}

// Initialize the game
initGame();