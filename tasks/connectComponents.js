import { playSound } from '../utils/audio.js';

const SCENARIOS_DATA = [
    {
        id: 'basic_web',
        title: 'Построй базовую веб-архитектуру',
        components: [
            { id: 'client', label: 'Клиент', x: 15, y: 35, info: "Конечный пользователь, запрашивает данные." },
            { id: 'web_server', label: 'Веб-сервер', x: 45, y: 35, info: "Обрабатывает запросы от клиента, может обращаться к кэшу и БД." },
            { id: 'database', label: 'База данных', x: 75, y: 50, info: "Хранит постоянные данные." },
            { id: 'cache', label: 'Кэш', x: 75, y: 20, info: "Хранит часто запрашиваемые данные для быстрого доступа." }
        ],
        correctConnections: [
            { from: 'client', to: 'web_server' },
            { from: 'web_server', to: 'client' },
            { from: 'web_server', to: 'database' },
            { from: 'web_server', to: 'cache' },
            { from: 'cache', to: 'web_server' }
        ]
    },
    {
        id: 'load_balanced_app',
        title: 'Собери отказоустойчивое приложение с балансировщиком',
        components: [
            { id: 'client', label: 'Клиент', x: 10, y: 40 },
            { id: 'lb', label: 'Балансировщик', x: 30, y: 40, info: "Распределяет нагрузку между сервером приложений." },
            { id: 'app_server1', label: 'Сервер App #1', x: 50, y: 25 },
            { id: 'app_server2', label: 'Сервер App #2', x: 50, y: 55 },
            { id: 'database', label: 'База данных', x: 70, y: 40 }
        ],
        correctConnections: [
            { from: 'client', to: 'lb' },
            { from: 'lb', to: 'app_server1' },
            { from: 'lb', to: 'app_server2' },
            { from: 'app_server1', to: 'database' },
            { from: 'app_server2', to: 'database' },
            { from: 'app_server1', to: 'lb' },
            { from: 'app_server2', to: 'lb' },
            { from: 'lb', to: 'client' }
        ]
    }
];

export function setupConnectComponentsTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    // Выбор случайного сценария
    const currentScenario = SCENARIOS_DATA[Math.floor(Math.random() * SCENARIOS_DATA.length)];
    taskTitleElement.textContent = currentScenario.title;

    // Создание контейнера SVG для рисования линий
    const svgContainer = document.createElement('div');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.pointerEvents = 'none';
    svgContainer.innerHTML = '<svg width="100%" height="100%"><defs></defs></svg>';

    const svg = svgContainer.querySelector('svg');
    const defs = svg.querySelector('defs');

    gameAreaElement.appendChild(svgContainer);

    // Создание компонентов
    const components = currentScenario.components.map(compData => {
        const componentElement = document.createElement('div');
        componentElement.className = 'component';
        componentElement.dataset.id = compData.id;
        componentElement.textContent = compData.label;
        componentElement.style.position = 'absolute';
        componentElement.style.left = `${compData.x}%`;
        componentElement.style.top = `${compData.y}%`;

        // Добавление тултипа с информацией
        if (compData.info) {
            componentElement.title = compData.info;
        }

        gameAreaElement.appendChild(componentElement);
        return { ...compData, element: componentElement };
    });

    // Правила соединений
    const correctConnections = currentScenario.correctConnections;

    // Отслеживание соединений пользователя
    const userConnections = [];

    // Переменная для отслеживания выбранного компонента
    let selectedComponent = null;

    // Функция для создания интерактивной линии
    function makeLineInteractive(connection) {
        const { line } = connection;
        line.style.cursor = 'pointer';
        line.style.pointerEvents = 'auto';

        // Эффект наведения
        line.addEventListener('mouseenter', () => {
            line.setAttribute('stroke-width', '5');
        });

        line.addEventListener('mouseleave', () => {
            line.setAttribute('stroke-width', '3');
        });

        // Удаление линии по клику/касанию
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            removeConnection(connection);
        });
        line.addEventListener('touchstart', (e) => {
            e.preventDefault();
            removeConnection(connection);
        });
    }

    // Функция для удаления соединения
    function removeConnection(connection) {
        const index = userConnections.indexOf(connection);
        if (index > -1) {
            userConnections.splice(index, 1);
            connection.line.remove();
            const markerId = `arrow-${connection.from}-${connection.to}`;
            const marker = defs.querySelector(`#${markerId}`);
            if (marker) marker.remove();
            playSoundFromGame('error');
            checkConnections();
        }
    }

    // Функция для создания соединения
    function createConnection(startComponent, endComponent) {
        const fromId = startComponent.dataset.id;
        const toId = endComponent.dataset.id;

        const connectionExists = userConnections.some(conn =>
            conn.from === fromId && conn.to === toId
        );

        if (!connectionExists && startComponent !== endComponent) {
            const startRect = startComponent.getBoundingClientRect();
            const endRect = endComponent.getBoundingClientRect();
            const gameRect = gameAreaElement.getBoundingClientRect();

            let x1 = startRect.left + startRect.width / 2 - gameRect.left;
            let y1 = startRect.top + startRect.height / 2 - gameRect.top;
            let x2 = endRect.left + endRect.width / 2 - gameRect.left;
            let y2 = endRect.top + endRect.height / 2 - gameRect.top;

            // Проверка на обратное соединение для смещения линии
            const reverseConnectionExists = userConnections.some(conn =>
                conn.from === toId && conn.to === fromId
            );

            if (reverseConnectionExists) {
                const offsetAmount = 5;
                let dx = x1 - x2;
                let dy = y1 - y2;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (length > 0) {
                    const perpX = -dy / length;
                    const perpY = dx / length;
                    x1 += perpX * offsetAmount;
                    y1 += perpY * offsetAmount;
                    x2 += perpX * offsetAmount;
                    y2 += perpY * offsetAmount;
                }
            }

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('stroke', 'var(--accent-blue)');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);

            const markerId = `arrow-${fromId}-${toId}`;
            if (!defs.querySelector(`#${markerId}`)) {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', markerId);
                marker.setAttribute('viewBox', '0 0 10 10');
                marker.setAttribute('refX', '9');
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
            line.setAttribute('marker-end', `url(#${markerId})`);

            svg.appendChild(line);

            const connection = { from: fromId, to: toId, line };
            userConnections.push(connection);
            makeLineInteractive(connection);
            playSoundFromGame('click');
            checkConnections();
        } else {
            playSoundFromGame('error');
        }
    }

    // Функция для очистки всех соединений
    function clearAllConnections() {
        userConnections.forEach(connection => {
            connection.line.remove();
            const markerId = `arrow-${connection.from}-${connection.to}`;
            const marker = defs.querySelector(`#${markerId}`);
            if (marker) marker.remove();
        });
        userConnections.length = 0;
        playSoundFromGame('click');
        checkConnections();
    }

    // Обработка касания/клика компонента
    function handleComponentInteraction(e) {
        if (!gameState.isPlaying) return;
        e.preventDefault();
        const component = e.currentTarget;

        if (selectedComponent) {
            createConnection(selectedComponent, component);
            selectedComponent.classList.remove('selected');
            selectedComponent = null;
        } else {
            selectedComponent = component;
            component.classList.add('selected');
            playSoundFromGame('click');
        }
    }

    // Проверка правильности соединений
    function checkConnections() {
        const allRequiredMade = correctConnections.every(required => {
            return userConnections.some(userConn =>
                userConn.from === required.from && userConn.to === required.to
            );
        });

        if (allRequiredMade) {
            // Отключаем взаимодействия
            const componentElements = gameAreaElement.querySelectorAll('.component');
            componentElements.forEach(component => {
                component.removeEventListener('click', handleComponentInteraction);
                component.removeEventListener('touchstart', handleComponentInteraction);
            });
            clearButton.removeEventListener('click', clearAllConnections);
            clearButton.removeEventListener('touchstart', clearAllConnections);
            rotateMessage.removeEventListener('click', clearAllConnections);
            rotateMessage.removeEventListener('touchstart', clearAllConnections);

            userConnections.forEach(conn => {
                conn.line.style.pointerEvents = 'none';
                conn.line.setAttribute('stroke', 'var(--success-color)');
                const markerId = `arrow-${conn.from}-${conn.to}`;
                const marker = defs.querySelector(`#${markerId}`);
                if (marker) {
                    marker.querySelector('path').setAttribute('fill', 'var(--success-color)');
                }
            });

            setTimeout(() => {
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            }, 500);
        }
    }

    // Создание кнопки "Стереть все"
    const clearButton = document.createElement('button');
    clearButton.className = 'choice-btn clear-button';
    clearButton.textContent = 'Стереть все';
    clearButton.style.zIndex = '1000';
    gameAreaElement.appendChild(clearButton);

    // Функция для обновления позиции кнопки
    function updateClearButtonPosition() {
        if (window.innerWidth >= 768) {
            // Десктоп: размещаем под схемой внутри #game-area
            clearButton.style.position = 'absolute';
            clearButton.style.bottom = '20px';
            clearButton.style.left = '50%';
            clearButton.style.transform = 'translateX(-50%)';
            clearButton.style.right = 'auto';
        } else {
            // Мобильные: фиксируем в правом нижнем углу экрана
            clearButton.style.position = 'fixed';
            clearButton.style.bottom = '20px';
            clearButton.style.right = '20px';
            clearButton.style.left = 'auto';
            clearButton.style.transform = 'none';
        }
    }

    // Инициализация позиции кнопки
    updateClearButtonPosition();

    // Обновление позиции при изменении размера экрана
    window.addEventListener('resize', updateClearButtonPosition);

    clearButton.addEventListener('click', clearAllConnections);
    clearButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        clearAllConnections();
    });

    // Создание сообщения "Переверни телефон"
    const rotateMessage = document.createElement('div');
    rotateMessage.className = 'rotate-message';
    rotateMessage.textContent = 'Переверни телефон в горизонтальное положение';
    rotateMessage.style.position = 'absolute';
    rotateMessage.style.top = '50%';
    rotateMessage.style.left = '50%';
    rotateMessage.style.transform = 'translate(-50%, -50%)';
    rotateMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    rotateMessage.style.color = 'white';
    rotateMessage.style.padding = '15px 20px';
    rotateMessage.style.borderRadius = '10px';
    rotateMessage.style.textAlign = 'center';
    rotateMessage.style.zIndex = '1000';
    rotateMessage.style.display = 'none';
    gameAreaElement.appendChild(rotateMessage);

    // Проверка ориентации и ширины экрана
    function checkOrientation() {
        if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
            rotateMessage.style.display = 'block';
        } else {
            rotateMessage.style.display = 'none';
        }
    }

    // Проверка при загрузке и изменении ориентации
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Добавление стилей для выбранного компонента и сообщения
    const style = document.createElement('style');
    style.textContent = `
        .component.selected {
            box-shadow: 0 0 10px var(--accent-blue);
            transform: scale(1.1);
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .rotate-message {
                display: block;
            }
        }
        @media (max-width: 768px) and (orientation: landscape) {
            .rotate-message {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Добавление обработчиков событий
    const componentElements = gameAreaElement.querySelectorAll('.component');
    componentElements.forEach(component => {
        component.addEventListener('click', handleComponentInteraction);
        component.addEventListener('touchstart', handleComponentInteraction, { passive: false });
    });
}