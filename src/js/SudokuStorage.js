/**
 * SudokuStorage.js
 * Gestiona el almacenamiento persistente:
 * - Guardar/Cargar partidas
 * - Historial de tiempos
 * - Estadísticas
 */

class SudokuStorage {
  constructor() {
    this.STORAGE_KEYS = {
      CURRENT_GAME: "sudoku_current_game",
      BEST_TIMES: "sudoku_best_times",
      STATISTICS: "sudoku_statistics",
    };
  }

  /**
   * Guarda el estado actual de la partida
   * @param {Object} gameState - Estado del juego
   */
  saveCurrentGame(gameState) {
    try {
      const data = {
        board: gameState.board,
        initialBoard: gameState.initialBoard,
        timer: gameState.timer,
        difficulty: gameState.difficulty,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        this.STORAGE_KEYS.CURRENT_GAME,
        JSON.stringify(data)
      );
      return true;
    } catch (error) {
      console.error("Error guardando partida:", error);
      return false;
    }
  }

  /**
   * Carga el estado de la partida guardada
   * @returns {Object|null} Estado del juego o null si no existe
   */
  loadCurrentGame() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CURRENT_GAME);
      if (!data) return null;

      const gameState = JSON.parse(data);

      // Verificar que no sea muy antigua (más de 7 días)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (gameState.timestamp < weekAgo) {
        this.clearCurrentGame();
        return null;
      }

      return gameState;
    } catch (error) {
      console.error("Error cargando partida:", error);
      return null;
    }
  }

  /**
   * Elimina la partida guardada
   */
  clearCurrentGame() {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_GAME);
  }

  /**
   * Guarda un tiempo de resolución
   * @param {string} difficulty - Nivel de dificultad
   * @param {number} time - Tiempo en segundos
   */
  saveTime(difficulty, time) {
    try {
      const times = this.getBestTimes();

      if (!times[difficulty]) {
        times[difficulty] = [];
      }

      times[difficulty].push({
        time: time,
        date: new Date().toISOString(),
      });

      // Mantener solo los mejores 10 tiempos
      times[difficulty].sort((a, b) => a.time - b.time);
      times[difficulty] = times[difficulty].slice(0, 10);

      localStorage.setItem(this.STORAGE_KEYS.BEST_TIMES, JSON.stringify(times));

      // Actualizar estadísticas
      this.updateStatistics(difficulty, time);

      return true;
    } catch (error) {
      console.error("Error guardando tiempo:", error);
      return false;
    }
  }

  /**
   * Obtiene los mejores tiempos
   * @returns {Object} Mejores tiempos por dificultad
   */
  getBestTimes() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.BEST_TIMES);
      return data ? JSON.parse(data) : { easy: [], medium: [], hard: [] };
    } catch (error) {
      console.error("Error obteniendo tiempos:", error);
      return { easy: [], medium: [], hard: [] };
    }
  }

  /**
   * Actualiza las estadísticas
   * @param {string} difficulty - Nivel de dificultad
   * @param {number} time - Tiempo en segundos
   */
  updateStatistics(difficulty, time) {
    try {
      const stats = this.getStatistics();

      if (!stats[difficulty]) {
        stats[difficulty] = {
          played: 0,
          completed: 0,
          totalTime: 0,
          bestTime: Infinity,
        };
      }

      stats[difficulty].completed++;
      stats[difficulty].totalTime += time;

      const currentBest = stats[difficulty].bestTime;
      if (
        currentBest === Infinity ||
        currentBest === null ||
        currentBest === 0
      ) {
        stats[difficulty].bestTime = time;
      } else {
        stats[difficulty].bestTime = Math.min(currentBest, time);
      }

      localStorage.setItem(this.STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
    } catch (error) {
      console.error("Error actualizando estadísticas:", error);
    }
  }

  /**
   * Incrementa el contador de partidas jugadas
   * @param {string} difficulty - Nivel de dificultad
   */
  incrementPlayed(difficulty) {
    try {
      const stats = this.getStatistics();

      if (!stats[difficulty]) {
        stats[difficulty] = {
          played: 0,
          completed: 0,
          totalTime: 0,
          bestTime: Infinity,
        };
      }

      stats[difficulty].played++;

      localStorage.setItem(this.STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
    } catch (error) {
      console.error("Error incrementando partidas jugadas:", error);
    }
  }

  /**
   * Obtiene las estadísticas
   * @returns {Object} Estadísticas por dificultad
   */
  getStatistics() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.STATISTICS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return {};
    }
  }

  /**
   * Limpia todas las estadísticas
   */
  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Verifica si hay una partida guardada
   * @returns {boolean} true si existe una partida guardada
   */
  hasSavedGame() {
    return localStorage.getItem(this.STORAGE_KEYS.CURRENT_GAME) !== null;
  }
}
