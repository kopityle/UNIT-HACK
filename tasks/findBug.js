import { playSound } from '../utils/audio.js';

export function setupFindBugTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
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

    // Function to disable all clicks on code elements
    const disableClicks = () => {
        const allElements = codeContainer.querySelectorAll('.code-element');
        allElements.forEach(el => {
            const clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
        });
    };


    // Add event listeners to all elements with the 'bug' class
    const bugElements = codeContainer.querySelectorAll('.bug');
    bugElements.forEach(element => {
        element.addEventListener('click', function handler() {
            // Remove the event listener to prevent multiple clicks on the same bug
            element.removeEventListener('click', handler);

            disableClicks(); // Disable all clicks after a choice is made

            this.style.textDecoration = 'line-through';
            this.style.color = 'var(--success-color)';
            completeTask(true, Math.floor(gameState.timeLeft / 10));
        });
    });

    // Add event listeners to all code elements that are not bugs
    const nonBugElements = codeContainer.querySelectorAll('.code-element:not(.bug)');
    nonBugElements.forEach(element => {
        element.addEventListener('click', function handler() {
             // Remove the event listener
            element.removeEventListener('click', handler);

            disableClicks(); // Disable all clicks after a choice is made

            this.style.color = 'var(--error-color)';
            // No need for timeout, completeTask will move to next task
            completeTask(false);
        });
    });
}