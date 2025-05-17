import { playSound } from '../utils/audio.js';

export function setupDecryptMessageTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Расшифруй сообщение';

    // Сообщения с шифрованием и вариантами ответов
    const messages = [
        {
            encrypted: "рбуит - пкрблтп", // сдвиг +1
            options: ["сатир - плохое", "сбуйс - рлпчпе", "санкт - петербр", "сауис - плохой"],
            correctIndex: 3
        },
        {
            encrypted: "лпоухс - мхдщкл", // сдвиг -1
            options: ["контур - лучший", "лпнфус - дшъщкй", "мрохут - нцдылн", "контур - худший"],
            correctIndex: 0
        },
        {
            encrypted: "еъоызх спуоэтэйкк", // обратный порядок
            options: ["умные технологии", "новые разработки", "контур технологии", "цифровые решения"],
            correctIndex: 2
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
    encryptedElement.className = 'code-snippet'; // Reuse code-snippet style
    encryptedElement.style.fontSize = '1.5rem';
    encryptedElement.style.padding = '20px 30px';
    encryptedElement.textContent = message.encrypted;

    messageContainer.appendChild(encryptedElement);

    // Create options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '15px';

    const choiceButtons = []; // Store button references to disable later

    message.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option;
        button.style.width = '300px';

        button.addEventListener('click', () => {
            if (index === message.correctIndex) {
                button.style.backgroundColor = 'var(--success-color)';
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                completeTask(false);
            }
        });

        optionsContainer.appendChild(button);
        choiceButtons.push(button);
    });

    messageContainer.appendChild(optionsContainer);
    gameAreaElement.appendChild(messageContainer);
}