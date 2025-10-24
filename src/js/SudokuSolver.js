/**
 * SudokuSolver.js
 * Contiene toda la lógica del algoritmo Sudoku:
 * - Validaciones
 * - Algoritmo de backtracking
 * - Generación de tableros
 * - Detección de conflictos
 */

class SudokuSolver {
  constructor() {
    this.board = this.createEmptyBoard();
    this.initialBoard = this.createEmptyBoard();
  }

  /**
   * Crea un tablero vacío de 9x9
   * @returns {Array} Matriz 9x9 llena de ceros
   */

  createEmptyBoard() {
    return Array(9)
      .fill()
      .map(() => Array(9).fill(0));
  }

  /**
   * Valida si un número es válido en una posición específica
   * Verifica fila, columna y cuadrante 3x3
   * @param {Array} board - Tablero de Sudoku
   * @param {number} row - Fila (0-8)
   * @param {number} col - Columna (0-8)
   * @param {number} num - Número a validar (1-9)
   * @returns {boolean} true si es válido, false si no
   */
  isValid(board, row, col, num) {
    // Validar fila
    for (let x = 0; x < 9; x++) {
      if (x !== col && board[row][x] === num) {
        return false;
      }
    }

    // Validar columna
    for (let x = 0; x < 9; x++) {
      if (x !== row && board[x][col] === num) {
        return false;
      }
    }

    // Validar cuadrante 3x3
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
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
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
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
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
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
    for (let num = 1; num <= 9; num++) {
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
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
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

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
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

  // /**
  //  * Genera un nuevo Sudoku con algoritmo mejorado
  //  * Genera tableros completamente aleatorios
  //  * @param {string} difficulty - 'easy', 'medium' o 'hard'
  //  * @returns {Array} Tablero de Sudoku generado
  //  */
  // generate(difficulty = "medium") {
  //   const newBoard = this.createEmptyBoard();

  //   // Llenar diagonal principal con números aleatorios
  //   for (let box = 0; box < 9; box += 3) {
  //     const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  //     let idx = 0;

  //     for (let i = 0; i < 3; i++) {
  //       for (let j = 0; j < 3; j++) {
  //         newBoard[box + i][box + j] = nums[idx++];
  //       }
  //     }
  //   }

  //   // Resolver el tablero completo
  //   this.solve(newBoard);

  //   // Remover números según la dificultad
  //   const config = {
  //     easy: { remove: 35, symmetry: true },
  //     medium: { remove: 45, symmetry: true },
  //     hard: { remove: 55, symmetry: true },
  //   }[difficulty];

  //   this.removeNumbers(newBoard, config.remove, config.symmetry);

  //   // Guardar tableros
  //   this.board = newBoard.map((row) => [...row]);
  //   this.initialBoard = newBoard.map((row) => [...row]);

  //   return this.board;
  // }

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
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

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
    const cellsToRemove = {
      easy: 35, // Ajusta estos valores como quieras
      medium: 45,
      hard: 55,
    }[difficulty];

    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

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

  // /**
  //  * Remueve números del tablero con opción de simetría
  //  * @param {number[][]} board - Tablero completo de Sudoku
  //  * @param {number} count - Cantidad de números que se eliminarán
  //  * @param {boolean} symmetry - Si es true, se eliminan celdas simétricamente
  //  * @retuns {void}
  //  */
  // removeNumbers(board, count, symmetry) {
  //   let removed = 0;
  //   const cells = [];

  //   // Crear lista de celdas disponibles
  //   for (let i = 0; i < 9; i++) {
  //     for (let j = 0; j < 9; j++) {
  //       cells.push([i, j]);
  //     }
  //   }

  //   this.shuffleArray(cells);

  //   for (const [row, col] of cells) {
  //     if (removed >= count) break;

  //     if (board[row][col] !== 0) {
  //       const backup = board[row][col];
  //       board[row][col] = 0;
  //       removed++;

  //       // Aplicar simetría si está activada
  //       if (symmetry && removed < count) {
  //         const symRow = 8 - row;
  //         const symCol = 8 - col;
  //         if (board[symRow][symCol] !== 0) {
  //           board[symRow][symCol] = 0;
  //           removed++;
  //         }
  //       }
  //     }
  //   }
  // }

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
