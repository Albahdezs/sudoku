/**
 * SudokuController.js
 * Controla la lógica de la aplicación:
 * - Eventos de usuario
 * - Coordinación entre UI y Solver
 * - Gestión del temporizador
 * - Flujo de la aplicación
 */

class SudokuController {
  static AUTOSAVE_INTERVAL = 30000;
  static MESSAGE_TIMEOUT = 3000;
  static SOLVE_DELAY = 100;

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

      this.showTemporaryMessage("✅ Partida cargada correctamente", "success");
    }
  }

  /**
   * Inicializa todos los event listeners
   */
  initEventListeners() {
    // Botones de dificultad
    this.setupDifficultyButtons();

    // Botones de acción
    this.setupActionButtons();

    // Menú desplegable
    this.setupMenu();

    // Teclado numérico
    this.setupNumberPad();

    // Celdas del tablero
    this.setupBoardEvents();

    // Teclado físico
    this.setupKeyboardEvents();

    // Auto-guardar periórico
    this.setupAutoSave();
  }

  /**
   * Configura los botones de dificultad
   */
  setupDifficultyButtons() {
    const difficulties = ["easy", "medium", "hard"];
    difficulties.forEach((diff) => {
      document
        .getElementById(`btn-${diff}`)
        .addEventListener("click", () => this.generateSudoku(diff));
    });
  }

  /**
   * Configura los botonces de acción principales
   */
  setupActionButtons() {
    document
      .getElementById("btn-hint")
      .addEventListener("click", () => this.showHint());

    document
      .getElementById("btn-reset")
      .addEventListener("click", () => this.resetBoard());
  }

  /**
   * Configura el menú desplegable
   */
  setupMenu() {
    const menuBtn = document.getElementById("btn-menu");
    const menuContent = document.getElementById("menu-content");

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuContent.classList.toggle("show");
    });

    // Opciones menú
    const menuActions = {
      "menu-solve": () => this.solveSudoku(),
      "menu-save": () => this.saveGame(),
      "menu-clear": () => this.clearBoard(),
      "menu-stats": () => this.showStatistics(),
      "menu-instructions": () => this.ui.showInstructions(),
    };

    Object.entries(menuActions).forEach(([id, action]) => {
      document.getElementById(id).addEventListener("click", (e) => {
        e.preventDefault();
        action();
        menuContent.classList.remove("show");
      });
    });

    // Cierra el menú si se hace click fuera
    window.addEventListener("click", (e) => {
      if (
        !e.target.matches("#btn-menu") &&
        menuContent.classList.contains("show")
      ) {
        menuContent.classList.remove("show");
      }
    });
  }

  /**
   * Configura el teclado numérico
   */
  setupNumberPad() {
    document.querySelectorAll(".num-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const num = parseInt(e.target.dataset.num);
        this.handleNumberInput(num);
      });
    });
  }

  /**
   * Configura eventos del tablero
   */
  setupBoardEvents() {
    this.ui.boardElement.addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.handleCellClick(row, col);
      }
    });
  }

  /**
   * Configura eventos del teclado físico
   */
  setupKeyboardEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.key >= "1" && e.key <= "9") {
        this.handleNumberInput(parseInt(e.key));
      } else if (["delete", "Backspace", "0"].includes(e.key)) {
        this.handleNumberInput(0);
      }
    });
  }

  /**
   * Configura el auto-guardado periódico
   */
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.isRunning && this.currentDifficulty) {
        this.autoSave();
      }
    }, SudokuController.AUTOSAVE_INTERVAL);
  }

  /**
   * Renderiza el tablero y actualiza conflictos
   */
  render() {
    this.ui.renderBoard(this.solver.board, this.solver.initialBoard);
    const conlifcts = this.solver.detectConflicts(this.solver.board);
    this.ui.updateConflicts(conlifcts);
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
   * Resuelve el Sudoku siempre desde el inicio usando backtracking
   * Muestra la solución, pero no guarda estadísticas
   */
  solveSudoku() {
    this.ui.clearMessages();

    // Comprueba si el tablero inicial tiene conflictos
    const currentBoardIsValid = this.solver.validateBoard(this.solver.board);

    // Resolver en el siguiente tick para no bloquear la UI
    setTimeout(() => {
      let boardToSolve;
      let solved = false;
      // Copia del tablero inicial

      // Intentamos resolver la copia limpia
      if (currentBoardIsValid) {
        // Si NO hay conflictos: Intentar resolver desde el estado ACTUAL
        boardToSolve = this.solver.copyBoard(this.solver.board);
        solved = this.solver.solve(boardToSolve);
      } else {
        // SI hay conflictos: Resolver desde el INICIO
        boardToSolve = this.solver.copyBoard(this.solver.initialBoard);
        solved = this.solver.solve(boardToSolve);
      }

      // Mostrar resultado
      if (solved) {
        this.solver.board = boardToSolve;
        this.render();

        this.stopTimer();
        this.ui.showMessage("¡Sudoku resuelto!", "success", true);
        this.storage.clearCurrentGame();
      } else {
        // Esto puede pasar si el usuario pone números que bloquean la solución
        this.ui.showMessage(
          "No se pudo encontrar una solución válida desde el estado actual",
          "error",
          true
        );
      }
    }, 100);
  }

  /**
   * Muestra una pista al usuario
   */
  showHint() {
    const hint = this.solver.getHint(this.solver.board);

    if (!hint) {
      this.showTemporaryMessage("¡El tablero ya está completo!", "success");
      return;
    }

    const { row, col, num } = hint;

    // Aplicar la pista
    this.solver.board[row][col] = num;
    this.render();
    this.ui.setSelectedCell([row, col]);

    this.showTemporaryMessage(
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
          "success",
          true
        );
      } else {
        this.showTemporaryMessage(
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
   * Formatea el tiempo en formato MM:SS
   * @param {number} seconds - Segundos totales
   * @retuns {string} Tiempo formateado
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Muestra un mensaje temporal y lo oculta automáticamente
   * @param {string} text - Texto del mensaje
   * @param {string} type - Tipo de mensaje
   */
  showTemporaryMessage(text, type = "success") {
    this.ui.showMessage(text, type);
    setTimeout(() => this.ui.clearMessages(), SudokuController.MESSAGE_TIMEOUT);
  }

  /**
   * Muestra las estadísticas
   * Recoge los datos del Storage y se los pasa a la UI.
   */
  showStatistics() {
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
        this.showTemporaryMessage(
          "💾 Partida guardada correctamente",
          "success"
        );
      }
    } else {
      this.showTemporaryMessage("⚠️ Genera un Sudoku primero", "error");
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
