/**
 * SudokuController.js
 * Controla la lógica de la aplicación:
 * - Eventos de usuario
 * - Coordinación entre UI y Solver
 * - Gestión del temporizador
 * - Flujo de la aplicación
 */

class SudokuController {
  constructor(solver, ui, storage) {
    this.solver = solver;
    this.ui = ui;
    this.storage = storage;

    this.timer = 0;
    this.timerInterval = null;
    this.isRunning = false;
    this.currentDifficulty = null;
    this.autoSaveInterval = null;

    this.initEventListeners();
    this.checkForSavedGame();
  }

  /**
   * Verifica si hay una partida guardada al iniciar
   */
  checkForSavedGame() {
    if (this.storage.hasSavedGame()) {
      this.ui.showLoadGameDialog(
        () => this.loadSavedGame(),
        () => {
          this.storage.clearCurrentGame();
          this.render();
          this.ui.clearMessages();
        }
      );
    } else {
      this.render();
    }
  }

  /**
   * Carga la partida guardada
   */
  loadSavedGame() {
    const gameState = this.storage.loadCurrentGame();

    if (gameState) {
      this.solver.loadBoard(gameState.board, gameState.initialBoard);
      this.timer = gameState.timer || 0;
      this.currentDifficulty = gameState.difficulty;

      this.render();
      this.ui.updateTimer(this.timer);
      this.ui.showMessage("✅ Partida cargada correctamente", "success");

      setTimeout(() => this.ui.clearMessages(), 3000);
    }
  }

  /**
   * Inicializa todos los event listeners
   */
  initEventListeners() {
    // Botones de dificultad
    document
      .getElementById("btn-easy")
      .addEventListener("click", () => this.generateSudoku("easy"));
    document
      .getElementById("btn-medium")
      .addEventListener("click", () => this.generateSudoku("medium"));
    document
      .getElementById("btn-hard")
      .addEventListener("click", () => this.generateSudoku("hard"));

    // Botones de acción visibles
    document
      .getElementById("btn-hint")
      .addEventListener("click", () => this.showHint());
    document
      .getElementById("btn-reset")
      .addEventListener("click", () => this.resetBoard());

    // Botón menú
    const menuBtn = document.getElementById("btn-menu");
    const menuContent = document.getElementById("menu-content");

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuContent.classList.toggle("show");
    });

    // Conectar los enlaces del menú
    document.getElementById("menu-solve").addEventListener("click", (e) => {
      e.preventDefault();
      this.solveSudoku();
      menuContent.classList.remove("show");
    });

    document.getElementById("menu-save").addEventListener("click", (e) => {
      e.preventDefault();
      this.saveGame();
      menuContent.classList.remove("show");
    });

    document.getElementById("menu-clear").addEventListener("click", (e) => {
      e.preventDefault();
      this.clearBoard();
      menuContent.classList.remove("show");
    });

    document.getElementById("menu-stats").addEventListener("click", (e) => {
      e.preventDefault();
      this.showStatistics();
      menuContent.classList.remove("show");
    });

    // Conectar el modal de instrucciones
    document
      .getElementById("menu-instructions")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.ui.showInstructions();
        menuContent.classList.remove("show");
      });

    // Cierra el menú si se hace click fuera
    window.addEventListener("click", (e) => {
      if (!e.target.matches("#btn-menu")) {
        if (menuContent.classList.contains("show")) {
          menuContent.classList.remove("show");
        }
      }
    });

    // Teclado numérico
    document.querySelectorAll(".num-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const num = parseInt(e.target.dataset.num);
        this.handleNumberInput(num);
      });
    });

    // Celdas del tablero (delegación de eventos)
    this.ui.boardElement.addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.handleCellClick(row, col);
      }
    });

    // Teclado físico
    document.addEventListener("keydown", (e) => {
      if (e.key >= "1" && e.key <= "9") {
        this.handleNumberInput(parseInt(e.key));
      } else if (e.key === "Delete" || e.key === "Backspace" || e.key === "0") {
        this.handleNumberInput(0);
      }
    });

    // Auto-guardar cada 30 segundos si hay actividad
    this.autoSaveInterval = setInterval(() => {
      if (this.isRunning && this.currentDifficulty) {
        this.autoSave();
      }
    }, 30000);
  }

  /**
   * Renderiza el tablero y actualiza conflictos
   */
  render() {
    this.ui.renderBoard(this.solver.board, this.solver.initialBoard);
    const conflicts = this.solver.detectConflicts(this.solver.board);
    this.ui.updateConflicts(conflicts);

    this.ui.updateNumberCounts(this.solver.board);
  }

  /**
   * Maneja el click en una celda
   * @param {number} row - Fila
   * @param {number} col - Columna
   */
  handleCellClick(row, col) {
    // No permitir seleccionar celdas fijas
    if (this.solver.initialBoard[row][col] !== 0) return;

    this.ui.setSelectedCell([row, col]);
    this.ui.toggleNumberPad(true);

    //Iniciar temporizador si es la primera jugada
    if (!this.isRunning && this.solver.board[row][col] === 0) {
      this.startTimer();
    }

    this.ui.clearMessages();
  }

  /**
   * Maneja la entrada de un número
   * @param {number} num - Número ingresado (0-9)
   */
  handleNumberInput(num) {
    const selectedCell = this.ui.getSelectedCell();
    if (!selectedCell) return;

    const [row, col] = selectedCell;

    // No permitir modificar celdas fijas
    if (this.solver.initialBoard[row][col] !== 0) return;

    // Actualizar el tablero
    this.solver.board[row][col] = num;

    // Re-renderizar
    this.render();
    this.ui.setSelectedCell([row, col]);

    // Verificar si el tablero está completo
    this.checkCompletion();

    // Auto-guardar después de cada movimiento
    if (this.currentDifficulty) {
      this.autoSave();
    }
  }

  /**
   * Genera un nuevo Sudoku
   * @param {string} difficulty - 'easy', 'medium' o 'hard'
   */
  generateSudoku(difficulty) {
    this.solver.generate(difficulty);
    this.currentDifficulty = difficulty;
    this.render();
    this.ui.setSelectedCell(null);
    this.ui.toggleNumberPad(false);
    this.resetTimer();
    this.startTimer();
    this.ui.clearMessages();

    // Incrementar contador de partidas jugadas
    this.storage.incrementPlayed(difficulty);

    // Guardar partida inicial
    this.autoSave();
  }

  /**
   * Resuleve el Sudoku actual usando backtracking
   */
  solveSudoku() {
    this.ui.clearMessages();

    // Validar que le tablero actual sea válido
    if (!this.solver.validateBoard(this.solver.board)) {
      this.ui.showMessage(
        "El Sudoku actual tiene conflictos y no se puede resolver",
        "error"
      );
      return;
    }

    // Resolver en el siguiente tick para no bloquear la UI
    setTimeout(() => {
      const boardCopy = this.solver.copyBoard(this.solver.board);

      if (this.solver.solve(boardCopy)) {
        this.solver.board = boardCopy;
        this.render();
        this.ui.showMessage("¡Sudoku resulto correctamente!", "success");
        this.stopTimer();

        //Limpiar partida guardada al resolver
        this.storage.clearCurrentGame();
      } else {
        this.ui.showMessage("No se pudo enconrar una solución válida", "error");
      }
    }, 100);
  }

  /**
   * Muestra una pista al usuario
   */
  showHint() {
    const hint = this.solver.getHint(this.solver.board);

    if (!hint) {
      this.ui.showMessage("¡El tablero ya está completo!", "success");
      return;
    }

    const { row, col, num } = hint;

    // Aplicar la pista
    this.solver.board[row][col] = num;
    this.render();
    this.ui.setSelectedCell([row, col]);

    this.ui.showMessage(
      `💡 Pista: ${num} en fila ${row + 1}, columna ${col + 1}`,
      "success"
    );

    this.autoSave();
  }

  /**
   * Reinicia el tabler al estado inicial
   */
  resetBoard() {
    this.solver.board = this.solver.copyBoard(this.solver.initialBoard);
    this.render();
    this.ui.setSelectedCell(null);
    this.ui.toggleNumberPad(false);
    this.resetTimer();
    this.ui.clearMessages();

    this.autoSave();
  }

  /**
   * Limpia completamente el tablero
   */
  clearBoard() {
    this.solver.board = this.solver.createEmptyBoard();
    this.solver.initialBoard = this.solver.createEmptyBoard();
    this.currentDifficulty = null;
    this.render();
    this.ui.setSelectedCell(null);
    this.ui.toggleNumberPad(false);
    this.resetTimer();
    this.ui.clearMessages();

    this.storage.clearCurrentGame();
  }

  /**
   * Verifica si el Sudoku está completo y correcto
   */
  checkCompletion() {
    const empty = this.solver.findEmpty(this.solver.board);

    if (!empty) {
      if (this.solver.validateBoard(this.solver.board)) {
        this.stopTimer();

        // Guardar tiempo si hay dificultad establecida
        if (this.currentDifficulty) {
          this.storage.saveTime(this.currentDifficulty, this.timer);
          this.storage.clearCurrentGame();
        }

        this.ui.showMessage(
          `\¡Felicidades! Has completado en ${this.formatTime(this.timer)}`,
          "success"
        );
      } else {
        this.ui.showMessage(
          "El tablero está completo pero tiene errores",
          "error"
        );
      }
    }
  }

  /**
   * Inicia el temporizador
   */
  startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.ui.updateTimer(this.timer);
    }, 1000);
  }

  /**
   * Detiene el temporizador
   */
  stopTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Reinicia el temporizador a 0
   */
  resetTimer() {
    this.stopTimer();
    this.timer = 0;
    this.ui.updateTimer(this.timer);
  }

  /**
   * Formatea el tiempo
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Muestra las estadísticas
   * Recoge los datos del Storage y se los pasa a la UI.
   */
  showStatistics() {
    console.log("Mostrando estadísticas...");

    //  Obtener los datos del Storage
    const stats = this.storage.getStatistics();
    const bestTimes = this.storage.getBestTimes();

    //  Pasarlos a la UI para que los muestre
    this.ui.showStatistics(stats, bestTimes);
  }

  /**
   * Guarda la partida actual manualmente
   */
  saveGame() {
    if (this.currentDifficulty) {
      const success = this.storage.saveCurrentGame({
        board: this.solver.board,
        initialBoard: this.solver.initialBoard,
        timer: this.timer,
        difficulty: this.currentDifficulty,
      });

      if (success) {
        this.ui.showMessage("💾 Partida guardada correctamente", "success");
        setTimeout(() => this.ui.clearMessages(), 2000);
      }
    } else {
      this.ui.showMessage("⚠️ Genera un Sudoku primero", "error");
    }
  }

  /**
   * Auto-guarda la partida
   */
  autoSave() {
    if (this.currentDifficulty) {
      this.storage.saveCurrentGame({
        board: this.solver.board,
        initialBoard: this.solver.initialBoard,
        timer: this.timer,
        difficulty: this.currentDifficulty,
      });
    }
  }
}
