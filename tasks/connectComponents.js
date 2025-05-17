import { playSound } from '../utils/audio.js';

const SCENARIOS_DATA = [
    {
        id: 'basic_web',
        title: 'Построй базовую веб-архитектуру',
        components: [
            { id: 'client', label: 'Клиент', x: 100, y: 200, info: "Конечный пользователь, запрашивает данные." },
            { id: 'web_server', label: 'Веб-сервер', x: 300, y: 200, info: "Обрабатывает запросы от клиента, может обращаться к кэшу и БД." },
            { id: 'database', label: 'База данных', x: 500, y: 300, info: "Хранит постоянные данные." },
            { id: 'cache', label: 'Кэш', x: 500, y: 100, info: "Хранит часто запрашиваемые данные для быстрого доступа." }
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
            { id: 'client', label: 'Клиент', x: 50, y: 250 },
            { id: 'lb', label: 'Балансировщик', x: 200, y: 250, info: "Распределяет нагрузку между сервером приложений." },
            { id: 'app_server1', label: 'Сервер App #1', x: 350, y: 150 },
            { id: 'app_server2', label: 'Сервер App #2', x: 350, y: 350 },
            { id: 'database', label: 'База данных', x: 550, y: 250 }
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
        componentElement.style.left = `${compData.x}px`;
        componentElement.style.top = `${compData.y}px`;

        // Добавление тултипа с информацией
        if (compData.info) {
            componentElement.title = compData.info;
        }

        gameAreaElement.appendChild(componentElement);
        return { ...compData, element: componentElement };
    });

    // Правила соединений
    const correctConnections = currentScenario.correctConnections;

    // Keep track of user's connections
    const userConnections = [];

    // Drawing state variables
    let isDrawing = false;
    let startComponent = null;
    let currentLine = null;
    let isDraggingConnection = false;
    let selectedConnection = null;

    // Function to make a line interactive
    function makeLineInteractive(connection) {
        const { line } = connection;
        
        // Make line clickable
        line.style.cursor = 'pointer';
        line.style.pointerEvents = 'auto';
        
        // Add hover effect
        line.addEventListener('mouseenter', () => {
            if (!isDraggingConnection) {
                line.setAttribute('stroke-width', '5');
            }
        });
        
        line.addEventListener('mouseleave', () => {
            if (!isDraggingConnection) {
                line.setAttribute('stroke-width', '3');
            }
        });

        // Add click to remove
        line.addEventListener('click', (e) => {
            if (!isDraggingConnection) {
                e.stopPropagation();
                // Remove connection
                const index = userConnections.indexOf(connection);
                if (index > -1) {
                    userConnections.splice(index, 1);
                    line.remove();
                    // Remove marker if it exists
                    const markerId = `arrow-${connection.from}-${connection.to}`;
                    const marker = defs.querySelector(`#${markerId}`);
                    if (marker) marker.remove();
                }
                playSoundFromGame('error');
                checkConnections(); // Check if remaining connections are correct
            }
        });
    }

    function startDrawing(e) {
        if (!gameState.isPlaying) return;
        if (e.button !== 0) return;

        isDrawing = true;
        startComponent = e.currentTarget;

        currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        currentLine.setAttribute('stroke', 'var(--accent-blue)');
        currentLine.setAttribute('stroke-width', '3');
        currentLine.setAttribute('stroke-linecap', 'round');

        const startRect = startComponent.getBoundingClientRect();
        const gameRect = gameAreaElement.getBoundingClientRect();

        const x1 = startRect.left + startRect.width / 2 - gameRect.left;
        const y1 = startRect.top + startRect.height / 2 - gameRect.top;

        currentLine.setAttribute('x1', x1);
        currentLine.setAttribute('y1', y1);
        currentLine.setAttribute('x2', x1);
        currentLine.setAttribute('y2', y1);

        svg.appendChild(currentLine);

        playSoundFromGame('click');
        e.preventDefault();
    }

    function handleGameAreaMouseUp(e) {
        if (!isDrawing || !startComponent) return;

        const endComponent = e.target.closest('.component');

        if (endComponent && startComponent !== endComponent) {
            endDrawing(endComponent);
        } else {
            cancelDrawing();
        }
    }

    function cancelDrawing() {
        if (isDrawing && currentLine) {
            currentLine.remove();
            playSoundFromGame('error');
        }
        isDrawing = false;
        startComponent = null;
        currentLine = null;
    }

    function updateLine(e) {
        if (!isDrawing || !currentLine) return;

        const gameRect = gameAreaElement.getBoundingClientRect();
        const x2 = e.clientX - gameRect.left;
        const y2 = e.clientY - gameRect.top;

        currentLine.setAttribute('x2', x2);
        currentLine.setAttribute('y2', y2);
    }

    function endDrawing(endComponent) {
        if (!isDrawing || !startComponent || !endComponent) {
            cancelDrawing();
            return;
        }

        const fromId = startComponent.dataset.id;
        const toId = endComponent.dataset.id;

        const connectionExists = userConnections.some(conn =>
            conn.from === fromId && conn.to === toId
        );

        if (!connectionExists) {
            const startRect = startComponent.getBoundingClientRect();
            const endRect = endComponent.getBoundingClientRect();
            const gameRect = gameAreaElement.getBoundingClientRect();

            let x1 = startRect.left + startRect.width / 2 - gameRect.left;
            let y1 = startRect.top + startRect.height / 2 - gameRect.top;
            let x2 = endRect.left + endRect.width / 2 - gameRect.left;
            let y2 = endRect.top + endRect.height / 2 - gameRect.top;

            // Проверяем, есть ли обратное соединение
            const reverseConnectionExists = userConnections.some(conn =>
                conn.from === toId && conn.to === fromId
            );

            if (reverseConnectionExists) {
                const offsetAmount = 5; // Сдвиг в пикселях

                // Вектор линии (от текущей toId к fromId, чтобы получить перпендикуляр для fromId -> toId)
                let dx = x1 - x2;
                let dy = y1 - y2;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (length > 0) { // Предотвращение деления на ноль
                    // Нормализованный перпендикулярный вектор
                    const perpX = -dy / length;
                    const perpY = dx / length;

                    // Смещаем обе точки текущей линии
                    x1 += perpX * offsetAmount;
                    y1 += perpY * offsetAmount;
                    x2 += perpX * offsetAmount;
                    y2 += perpY * offsetAmount;
                }
            }

            currentLine.setAttribute('x1', x1);
            currentLine.setAttribute('y1', y1);
            currentLine.setAttribute('x2', x2);
            currentLine.setAttribute('y2', y2);

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
            currentLine.setAttribute('marker-end', `url(#${markerId})`);

            const connection = { from: fromId, to: toId, line: currentLine };
            userConnections.push(connection);
            makeLineInteractive(connection);

            playSoundFromGame('click');
            checkConnections();
        } else {
            if (currentLine) {
                currentLine.remove();
                currentLine = null;
            }
            playSoundFromGame('error');
        }

        // Сброс состояния рисования
        isDrawing = false;
        startComponent = null;
        currentLine = null;
    }

    function checkConnections() {
        const allRequiredMade = correctConnections.every(required => {
            return userConnections.some(userConn =>
                userConn.from === required.from && userConn.to === required.to
            );
        });

        if (allRequiredMade) {
            // Disable all interactions
            gameAreaElement.removeEventListener('mouseup', handleGameAreaMouseUp);
            gameAreaElement.removeEventListener('mousemove', updateLine);
            gameAreaElement.removeEventListener('mouseleave', cancelDrawing);

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

    // Add event listeners
    const componentElements = gameAreaElement.querySelectorAll('.component');
    componentElements.forEach(component => {
        component.addEventListener('mousedown', startDrawing);
    });

    gameAreaElement.addEventListener('mouseup', handleGameAreaMouseUp);
    gameAreaElement.addEventListener('mousemove', updateLine);
    gameAreaElement.addEventListener('mouseleave', cancelDrawing);
}