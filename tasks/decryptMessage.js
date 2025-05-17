import { playSound } from '../utils/audio.js';

export function setupDecryptMessageTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Расшифруй сообщение';

    // Сообщения с шифрованием и вариантами ответов
    const messages = [
        {
            encrypted: "тболу - рёуёсвс", // Шифруем "санкт - петербр" сдвигом +1
            options: ["сатир - плохое", "сбуйс - рлпчпе", "санкт - петербр", "сауис - плохой"],
            correctIndex: 2,
            hint: "Шифр Цезаря: каждая буква смещена на 1 вперед по алфавиту. (А->Б)"
        },
        {
            encrypted: "лпоухс - мхдщкл", // Шифруем "контур - лучший" сдвигом -1
            options: ["контур - лучший", "лпнфус - дшъщкй", "мрохут - нцдылн", "контур - худший"],
            correctIndex: 0,
            hint: "Шифр Цезаря: каждая буква смещена на 1 назад по алфавиту. (Б->А)"
        },
        {
            encrypted: "яиголонхет рутнок", // "контур технологии" наоборот
            options: ["умные технологии", "новые разработки", "контур технологии", "цифровые решения"],
            correctIndex: 2,
            hint: "Сообщение просто прочитано задом наперед!"
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

    // Отобразить подсказку
    const hintElement = document.createElement('p');
    hintElement.className = 'task-hint';
    hintElement.textContent = `Подсказка: ${message.hint}`;
    messageContainer.appendChild(hintElement);

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

    const choiceButtons = [];

    message.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option;
        button.style.width = '300px';

        button.addEventListener('click', () => {
            if (index === message.correctIndex) {
                button.style.backgroundColor = 'var(--success-color)';
                playSoundFromGame('success');
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                playSoundFromGame('error');
                completeTask(false);
            }
        });

        optionsContainer.appendChild(button);
        choiceButtons.push(button);
    });

    messageContainer.appendChild(optionsContainer);
    gameAreaElement.appendChild(messageContainer);
}