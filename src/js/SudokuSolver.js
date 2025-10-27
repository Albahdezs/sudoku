/**
 * SudokuSolver.js
 * Contiene toda la lógica del algoritmo Sudoku:
 * - Validaciones
 * - Algoritmo de backtracking
 * - Generación de tableros
 * - Detección de conflictos
 */

class SudokuSolver {
  // Constantes de clase
  static BOARD_SIZE = 9;
  static BOX_SIZE = 3;
  static MIN_NUMBER = 1;
  static MAX_NUMBER = 9;

  // Configuración de dificultad
  static DIFFICULTY_CONFIG = {
    easy: 35,
    medium: 45,
    hard: 55,
  };

  constructor() {
    this.board = this.createEmptyBoard();
    this.initialBoard = this.createEmptyBoard();
  }

  /**
   * Crea un tablero vacío de 9x9
   * @returns {Array} Matriz 9x9 llena de ceros
   */
  createEmptyBoard() {
    return Array(SudokuSolver.BOARD_SIZE)
      .fill()
      .map(() => Array(SudokuSolver.BOARD_SIZE).fill(0));
  }

  /**
   * Valida si un número es válido en una posición específica
   * Verifica fila, columna y cuadrante 3x3
   * @param {Array} board - Tablero de Sudoku
   * @param {number} row - Fila (0-8)
   * @param {number} col - Columna (0-8)
   * @param {number} num - Número a validar (1-9)
   *  @param {boolean} excludeCurrentCell - Si true, excluye la celda actual de la validación
   * @returns {boolean} true si es válido, false si no
   */
  isValid(board, row, col, num, excludeCurrentCell) {
    // Validar fila
    for (let x = 0; x < SudokuSolver.BOARD_SIZE; x++) {
      if (x !== col && board[row][x] === num) {
        return false;
      }
    }

    // Validar columna
    for (let x = 0; x < SudokuSolver.BOARD_SIZE; x++) {
      if (x !== row && board[x][col] === num) {
        return false;
      }
    }

    // Validar cuadrante 3x3
    const startRow =
      Math.floor(row / SudokuSolver.BOX_SIZE) * SudokuSolver.BOX_SIZE;
    const startCol =
      Math.floor(col / SudokuSolver.BOX_SIZE) * SudokuSolver.BOX_SIZE;

    for (let i = 0; i < SudokuSolver.BOX_SIZE; i++) {
      for (let j = 0; j < SudokuSolver.BOX_SIZE; j++) {
        const r = startRow + i;
        const c = startCol + j;
        if ((r !== row || c !== col) && board[r][c] === num) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Encuentra la primera celda vacía en el tablero
   * @param {Array} board - Tablero de Sudoku
   * @returns {Array|null} - [fila, columna] o null si no hay celdas vacías
   */
  findEmpty(board) {
    for (let i = 0; i < SudokuSolver.BOARD_SIZE; i++) {
      for (let j = 0; j < SudokuSolver.BOARD_SIZE; j++) {
        if (board[i][j] === 0) {
          return [i, j];
        }
      }
    }

    return null;
  }

  /**
   * Encuentra TODAS las celdas vacías en el tablero.
   * @param {Array} board - Tablero de Sudoku
   * @returns {Array} Un array de posiciones, e.g., [[0, 1], [0, 4], ...]
   */
  findAllEmpty(board) {
    const emptyCells = [];
    for (let i = 0; i < SudokuSolver.BOARD_SIZE; i++) {
      for (let j = 0; j < SudokuSolver.BOARD_SIZE; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    return emptyCells;
  }

  /**
   * Algoritmo de backtracking para resolver el Sudoku
   * Modifica el tablero directamente
   * @param {Array} board - Tablero de Sudoku a resolver
   * @retuns {boolean} true si se resolvió, false si no tiene solución
   */
  solve(board) {
    const empty = this.findEmpty(board);

    // Si no hay celdas vacías, el Sudoku está resuelto
    if (!empty) return true;

    const [row, col] = empty;

    // Intentar números del 1 al 9
    for (
      let num = SudokuSolver.MIN_NUMBER;
      num <= SudokuSolver.MAX_NUMBER;
      num++
    ) {
      if (this.isValid(board, row, col, num)) {
        board[row][col] = num;

        // Recursión: intentar resolver el resto
        if (this.solve(board)) {
          return true;
        }

        // Backtracking: deshacer si no funciona
        board[row][col] = 0;
      }
    }

    return false;
  }

  /**
   * Valida si el tablero completo es válido
   * @param {Array} board - Tablero de Sudoku
   * @returns {boolean} true si es válido, false si tiene conflictos
   */
  validateBoard(board) {
    for (let i = 0; i < SudokuSolver.BOARD_SIZE; i++) {
      for (let j = 0; j < SudokuSolver.BOARD_SIZE; j++) {
        if (board[i][j] !== 0) {
          const num = board[i][j];
          board[i][j] = 0;

          if (!this.isValid(board, i, j, num)) {
            board[i][j] = num;
            return false;
          }

          board[i][j] = num;
        }
      }
    }
    return true;
  }

  /**
   * Detecta todas las celdas con conflictos en el tablero
   * @param {Array} board - Tablero de Sudoku
   * @returns {Set} Set con las posiciones conflictivas en formato "fila-columna"
   */
  detectConflicts(board) {
    const conflicts = new Set();

    for (let i = 0; i < SudokuSolver.BOARD_SIZE; i++) {
      for (let j = 0; j < SudokuSolver.BOARD_SIZE; j++) {
        if (board[i][j] !== 0) {
          const num = board[i][j];
          board[i][j] = 0;

          if (!this.isValid(board, i, j, num)) {
            conflicts.add(`${i}-${j}`);
          }

          board[i][j] = num;
        }
      }
    }
    return conflicts;
  }

  /**
   * Resuelve el tablero usando backtracking con un orden de números aleatorio.
   * Esto es la clave para generar puzles 100% únicos.
   */
  solveRandomly(board) {
    const empty = this.findEmpty(board);
    if (!empty) {
      return true; // Resuelto
    }

    const [row, col] = empty;

    // ¡TRUCO! Probar números en orden aleatorio
    const numbers = this.shuffleArray(
      Array.from(
        {
          length: SudokuSolver.MAX_NUMBER,
        },
        (_, i) => i + SudokuSolver.MIN_NUMBER
      )
    );

    for (const num of numbers) {
      if (this.isValid(board, row, col, num)) {
        board[row][col] = num;
        if (this.solveRandomly(board)) {
          return true;
        }
        board[row][col] = 0; // Backtrack
      }
    }
    return false;
  }

  /**
   * Genera un nuevo Sudoku 100% aleatorio (v4)
   * Usa 'solveRandomly' y el borrado no simétrico.
   */
  generate(difficulty = "medium") {
    // Log para estar 100% seguros de que se ejecuta esta versión
    console.log("--- GENERADOR v4 (Aleatorio + Borrado NO Simétrico) ---");

    const newBoard = this.createEmptyBoard();

    // 1. Genera un tablero 100% aleatorio y completo
    this.solveRandomly(newBoard);

    // 2. Borra números al azar (Tu método ANTIGUO, sin simetría)
    const cellsToRemove =
      SudokuSolver.DIFFICULTY_CONFIG[difficulty] ||
      SudokuSolver.DIFFICULTY_CONFIG.medium;

    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * SudokuSolver.BOARD_SIZE);
      const col = Math.floor(Math.random() * SudokuSolver.BOARD_SIZE);

      if (newBoard[row][col] !== 0) {
        newBoard[row][col] = 0;
        removed++;
      }
    }

    // 3. Guardar tableros
    this.board = newBoard.map((row) => [...row]);
    this.initialBoard = newBoard.map((row) => [...row]);

    return this.board;
  }

  /**
   * Mezcla aleatoriamente (Fisher-Yates)
   * @param {Array} array - Array a mezclar
   * @retuns {Array} Nuevo array con los elementos en orden aleatorio
   */
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Crea una copia profunda dedl tablero
   * @param {Array} board - Tablero a copiar
   * @returns {Array} Copia del tablero
   */
  copyBoard(board) {
    return board.map((row) => [...row]);
  }

  /**
   * Obtiene una pista para la siguiente celda vacía
   * @param {Array} board - Tablero actual
   * @returns {Object|null} {row, col, num} o null si no hay celdas vacías
   */
  getHint(board) {
    // Encontrar todas las celdas vacías
    const emptyCells = this.findAllEmpty(board);
    if (emptyCells.length === 0) {
      return null; // No hay huecos
    }

    // Elegir una celda vacía AL AZAR
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [row, col] = emptyCells[randomIndex];

    // Encontrar la SOLUCIÓN REAL para esa celda
    // Copiamos el tablero para no estropear el juego del usuario
    const boardCopy = this.copyBoard(board);

    // Resolvemos la copia
    // (Usamos 'solve' normal, es más rápido y solo queremos la solución)
    if (this.solve(boardCopy)) {
      // El número en la copia es la solución correcta
      const num = boardCopy[row][col];
      return { row, col, num };
    } else {
      // Esto solo pasaría si el puzle no tiene solución
      return null;
    }
  }

  /**
   * Carga el estado actual e inicial del tablero en la clase
   * @param {number[][]} board - Estado actual del tablero.
   * @param {number[][]} initialBoard - Estado inicial del tablero (antes de jugar)
   * @retuns {void}
   */
  loadBoard(board, initialBoard) {
    this.board = board.map((row) => [...row]);
    this.initialBoard = initialBoard.map((row) => [...row]);
  }
}
