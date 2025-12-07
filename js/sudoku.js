document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const container = document.getElementById('sudoku-container');
    const generateBtn = document.getElementById('generate-sudoku');
    const checkBtn = document.getElementById('check-sudoku');
    const clearBtn = document.getElementById('clear-user-inputs');
    const messageElement = document.getElementById('sudoku-message');

    let originalBoard = Array(9).fill().map(() => Array(9).fill(0));
    let userInputs = Array(9).fill().map(() => Array(9).fill(false));
    let sudokuLocked = false; // Track actual lock state

    // Initialize empty board
    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.className = 'sudoku-cell';
            cell.maxLength = 1;
            cell.addEventListener('input', (e) => {
                const value = e.target.value;
                if (!/^[1-9]$/.test(value)) e.target.value = '';
                else userInputs[Math.floor(i / 9)][i % 9] = true;
            });
            boardElement.appendChild(cell);
        }
    }

    // Generate a valid Sudoku puzzle
    function generateSudoku() {
        originalBoard = Array(9).fill().map(() => Array(9).fill(0));
        userInputs = Array(9).fill().map(() => Array(9).fill(false));

        fillBoard(originalBoard);

        const cells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                cells.push([i, j]);
            }
        }
        cells.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 40; i++) {
            const [row, col] = cells[i];
            originalBoard[row][col] = 0;
        }

        updateBoard();
        messageElement.textContent = '¡Buena suerte!';
    }

    // Helper to fill the board with a valid Sudoku
    function fillBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
                    for (let num of nums) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (fillBoard(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Check if placing num at board[row][col] is valid
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    }

    // Shuffle array
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Update the board UI
    function updateBoard() {
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const val = originalBoard[row][col] || '';
            const isFixed = originalBoard[row][col] !== 0;
            cells[i].value = val;
            cells[i].dataset.fixed = isFixed ? '1' : '0';
            // Solo deshabilita si está locked Y no es una celda fija
            cells[i].disabled = isFixed || sudokuLocked;
        }
    }

    // Actualiza el estado de lock del Sudoku
    function setSudokuLocked(locked) {
        sudokuLocked = locked;
        
        if (!container) return;
        container.classList.toggle('locked', locked);
        
        // Actualiza celdas del tablero
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        cells.forEach((cell) => {
            const isFixed = cell.dataset.fixed === '1';
            cell.disabled = locked || isFixed;
        });
        
        // Botones
        [generateBtn, checkBtn, clearBtn].forEach(btn => {
            if (btn) btn.disabled = locked;
        });
    }

    // Check if the current board is solved correctly
    function checkSolution() {
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        const board = Array(9).fill().map(() => Array(9).fill(0));
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const val = parseInt(cells[i].value) || 0;
            if (val < 1 || val > 9) {
                messageElement.textContent = 'Solo nums del 1 al 9.';
                return;
            }
            board[row][col] = val;
        }
        if (isValidSudoku(board)) {
            messageElement.textContent = '¡Correcto!';
        } else {
            messageElement.textContent = 'Solución incorrecta.';
        }
    }

    // Check if the board is a valid Sudoku
    function isValidSudoku(board) {
        for (let i = 0; i < 9; i++) {
            const rowSet = new Set();
            const colSet = new Set();
            const boxSet = new Set();
            for (let j = 0; j < 9; j++) {
                // Row
                if (rowSet.has(board[i][j])) return false;
                rowSet.add(board[i][j]);
                // Column
                if (colSet.has(board[j][i])) return false;
                colSet.add(board[j][i]);
                // Box
                const boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                const boxCol = (i % 3) * 3 + (j % 3);
                if (boxSet.has(board[boxRow][boxCol])) return false;
                boxSet.add(board[boxRow][boxCol]);
            }
        }
        return true;
    }

    // Clear only user-entered inputs
    function clearUserInputs() {
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            if (userInputs[row][col]) {
                cells[i].value = '';
                userInputs[row][col] = false;
            }
        }
        messageElement.textContent = 'Inputs borrados.';
    }

    // Escucha eventos globales del pomodoro
    // TRABAJO (temporizador 1): DISABLED
    document.addEventListener('work:start', () => setSudokuLocked(true));
    
    // DESCANSO (temporizador 2): ENABLED
    document.addEventListener('rest:start', () => setSudokuLocked(false));
    
    // TRABAJO TERMINA: ENABLED
    document.addEventListener('work:stop', () => setSudokuLocked(false));
    
    // DESCANSO TERMINA: ENABLED (no necesitamos hacer nada, pero lo dejamos explícito)
    document.addEventListener('rest:stop', () => setSudokuLocked(false));

    // Reset: ENABLED (manejado desde pomodoro.js)
    // Ciclos = 0: ENABLED (manejado desde pomodoro.js)

    // Expone un pequeño API por si prefieres llamarlo directo
    window.SudokuLocker = {
        lock: () => setSudokuLocked(true),
        unlock: () => setSudokuLocked(false)
    };

    // Event listeners
    generateBtn.addEventListener('click', generateSudoku);
    checkBtn.addEventListener('click', checkSolution);
    clearBtn.addEventListener('click', clearUserInputs);

    // Initialize
    createBoard();
});