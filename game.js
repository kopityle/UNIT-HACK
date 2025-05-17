import * as PIXI from 'pixi.js';
import { Leaderboard } from './components/leaderboard.js';
import { setupConnectComponentsTask } from './tasks/connectComponents.js';
import { setupDecryptMessageTask } from './tasks/decryptMessage.js';
import { setupFindBugTask } from './tasks/findBug.js';
import { setupCloseVulnerabilityTask } from './tasks/closeVulnerability.js';
import { setupStopDdosAttackTask } from './tasks/stopDdosAttack.js';
import { setupRestoreBackupTask } from './tasks/restoreBackup.js';
import { setupSortDataTask } from './tasks/sortData.js';
import { initAudioContext, loadAllSounds, playSound } from './utils/audio.js';
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

// Инициализация аудио
initAudioContext();
loadAllSounds();

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
    // Инициализация аудио, если еще не сделано
    initAudioContext();

    // Воспроизведение звука
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
    // Очистка игровой области
    gameAreaElement.innerHTML = '';

    // Выбор случайной задачи
    const taskType = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];

    // Вызов соответствующей функции задачи
    switch (taskType) {
        case 'findBugInCode':
            setupFindBugTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'connectComponents':
            setupConnectComponentsTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'closeVulnerability':
            setupCloseVulnerabilityTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'decryptMessage':
            setupDecryptMessageTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'sortData':
            setupSortDataTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'stopDdosAttack':
            setupStopDdosAttackTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        case 'restoreBackup':
            setupRestoreBackupTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound });
            break;
        default:
            console.error('Unknown task type:', taskType);
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

// Initialize the game
initGame();