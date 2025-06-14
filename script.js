class CricketScoreCounter {
  constructor() {
    this.state = {
      matchId: Math.floor(Math.random() * 100000) + 1,
      team1: "Team A",
      team2: "Team B",
      totalOvers: 20,
      currentInnings: 1,
      battingTeam: "Team A",
      bowlingTeam: "Team B",
      target: 0,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      ballsHistory: [],
      inningsHistory: [],
      tossWinner: null,
      tossChoice: null,
    };

    this.initElements();
    this.initEventListeners();
    this.loadFromLocalStorage();
    this.updateUI();
  }

  initElements() {
    this.elements = {
      teamsHeader: document.getElementById("teams-header"),
      battingTeam: document.getElementById("batting-team"),
      runs: document.getElementById("runs"),
      wickets: document.getElementById("wickets"),
      overs: document.getElementById("overs"),
      totalOvers: document.getElementById("total-overs"),
      targetDisplay: document.getElementById("target-display"),
      ballsContainer: document.getElementById("balls-container"),
      crr: document.getElementById("crr"),
      rrr: document.getElementById("rrr"),
      scorepadButtons: document.querySelectorAll(".scorepad .btn"),
      undoBtn: document.getElementById("undo-btn"),
      endInningsBtn: document.getElementById("end-innings-btn"),
      scoreboardBtn: document.getElementById("scoreboard-btn"),
      resetBtn: document.getElementById("reset-btn"),
      modal: document.getElementById("modal"),
      closeModal: document.getElementById("close-modal"),
      modalBody: document.getElementById("modal-body"),
      setupModal: document.getElementById("setup-modal"),
      setupForm: document.getElementById("setup-form"),
      team1Input: document.getElementById("team1"),
      team2Input: document.getElementById("team2"),
      totalOversInput: document.getElementById("total-overs-input"),
      tossWinnerInput: document.getElementById("toss-winner"),
      tossChoiceInput: document.getElementById("toss-choice"),
      gameId: document.getElementById("gameId"),
      copyBtn: document.getElementById("link-copy-btn")
    };
  }

  initEventListeners() {

    this.elements.copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(
        `https://rhinosclient.ashishsubedi.com/viewonly/?gameId=${this.state.matchId}`
      );
    });

    this.elements.scorepadButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.handleScorepadButton(btn));
    });

    this.elements.undoBtn.addEventListener("click", () => this.undoLastBall());
    this.elements.endInningsBtn.addEventListener("click", () =>
      this.endInnings()
    );
    this.elements.scoreboardBtn.addEventListener("click", () =>
      this.showScoreboard()
    );
    this.elements.resetBtn.addEventListener("click", () => this.resetMatch());
    this.elements.closeModal.addEventListener("click", () => this.closeModal());

    this.elements.setupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.startMatch();
    });

    if (!localStorage.getItem("cricketScoreData")) {
      this.elements.setupModal.style.display = "flex";
    }
  }

  handleScorepadButton(btn) {
    const type = btn.dataset.type;
    const score = parseInt(btn.dataset.score) || 0;

    // Directly add runs for 1, 2, 3 buttons
    if (type === "run" && [1, 2, 3].includes(score)) {
      this.addBall("run", score, 0);
      return;
    }

    switch (type) {
      case "wide":
      case "noBall":
      case "byes":
      case "out":
      case "run": // For the Run button and other run values
        this.showOptionsModal(type);
        break;
      default:
        this.addBall(type, score, 0);
    }
  }

  showOptionsModal(type) {
    this.elements.modalBody.innerHTML = "";

    const addCustomRunOption = (type, isOut = false) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Custom Run";
      btn.addEventListener("click", () => {
        const runs = this.promptForRuns();
        if (runs !== null) {
          if (isOut) {
            this.promptForOutType(runs);
          } else {
            this.addBall(type, runs, 0);
          }
        }
        this.closeModal();
      });
      this.elements.modalBody.appendChild(btn);
    };

    switch (type) {
      case "run":
        // Custom run options
        [0, 3, 5, 7].forEach((runs) => {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = runs === 0 ? "Dot" : runs;
          btn.addEventListener("click", () => {
            this.addBall("run", runs, 0);
            this.closeModal();
          });
          this.elements.modalBody.appendChild(btn);
        });
        addCustomRunOption("run");
        break;

      case "wide":
        [0, 1, 2, 4].forEach((runs) => {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = runs === 0 ? "Dot" : runs;
          btn.addEventListener("click", () => {
            this.addBall("wide", runs, 0);
            this.closeModal();
          });
          this.elements.modalBody.appendChild(btn);
        });
        addCustomRunOption("wide");
        break;

      case "noBall":
        [0, 1, 2, 4, 6].forEach((runs) => {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = runs === 0 ? "Dot" : runs;
          btn.addEventListener("click", () => {
            this.addBall("noBall", runs, 0);
            this.closeModal();
          });
          this.elements.modalBody.appendChild(btn);
        });

        // Run Out option for no ball
        const noBallRunOutBtn = document.createElement("button");
        noBallRunOutBtn.className = "btn";
        noBallRunOutBtn.textContent = "Run Out";
        noBallRunOutBtn.addEventListener("click", () => {
          const runs = this.promptForRuns("How many runs before run out?");
          if (runs !== null) {
            this.addBall("noBall", runs, 1, "runOut");
          }
          this.closeModal();
        });
        this.elements.modalBody.appendChild(noBallRunOutBtn);

        addCustomRunOption("noBall");
        break;

      case "byes":
        [1, 2, 3, 4].forEach((runs) => {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = runs;
          btn.addEventListener("click", () => {
            this.addBall("byes", runs, 0);
            this.closeModal();
          });
          this.elements.modalBody.appendChild(btn);
        });
        addCustomRunOption("byes");
        break;

      case "out":
        ["Bowled", "Caught", "LBW", "Stumped"].forEach((outType) => {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = outType;
          btn.addEventListener("click", () => {
            this.addBall("out", 0, 1, outType.toLowerCase());
            this.closeModal();
          });
          this.elements.modalBody.appendChild(btn);
        });

        // Run Out with runs option
        const runOutBtn = document.createElement("button");
        runOutBtn.className = "btn";
        runOutBtn.textContent = "Run Out";
        runOutBtn.addEventListener("click", () => {
          const runs = this.promptForRuns("How many runs before run out?");
          if (runs !== null) {
            this.addBall("out", runs, 1, "runOut");
          }
          this.closeModal();
        });
        this.elements.modalBody.appendChild(runOutBtn);

        break;
    }

    this.openModal();
  }

  promptForRuns(message = "How many runs?") {
    const runs = prompt(message);
    if (runs === null) return null;

    const runsNum = parseInt(runs);
    if (isNaN(runsNum)) {
      // Fixed the syntax error here
      alert("Please enter a valid number");
      return this.promptForRuns(message);
    }

    return runsNum;
  }

  promptForOutType(runs) {
    this.elements.modalBody.innerHTML = "<h3>Select out type:</h3>";

    ["Bowled", "Caught", "LBW", "Stumped", "Run Out"].forEach((outType) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = outType;
      btn.addEventListener("click", () => {
        if (outType === "Run Out") {
          this.addBall("out", runs, 1, "runOut");
        } else {
          this.addBall("out", runs, 1, outType.toLowerCase());
        }
        this.closeModal();
      });
      this.elements.modalBody.appendChild(btn);
    });

    this.openModal();
  }

  addBall(type, runs, wickets, extraInfo) {
    // Create ball object with all relevant information
    const ball = {
      type,
      runs,
      wickets,
      extraInfo,
      countable: !["wide", "noBall"].includes(type),
      timestamp: new Date().toISOString(),
    };

    // Calculate runs to add (extra 1 run penalty for wides/no-balls)
    let runsToAdd = runs;
    if (type === "wide" || type === "noBall") {
      runsToAdd += 1;
    }

    // Update match statistics
    this.state.runs += runsToAdd;
    this.state.wickets += wickets;

    // Add to complete balls history
    this.state.ballsHistory.push(ball);

    // Only count valid deliveries toward over completion
    if (ball.countable) {
      this.state.balls++;
      if (this.state.balls === 6) {
        this.state.balls = 0;
        this.state.overs++;
      }
    }

    // Check for innings ending conditions
    this.checkInningsEnd();

    // Update UI immediately
    this.updateUI();

    // Persist state
    this.saveToLocalStorage();

    // Debug logging (optional)
    console.log(
      `Ball added:`,
      ball,
      `Score: ${this.state.runs}/${this.state.wickets}`,
      `Over: ${this.state.overs}.${this.state.balls}`
    );
  }

  checkInningsEnd() {
    if (this.state.wickets >= 10) {
      this.endInnings();
      return;
    }

    if (this.state.overs >= this.state.totalOvers && this.state.balls === 0) {
      this.endInnings();
      return;
    }

    if (
      this.state.currentInnings === 2 &&
      this.state.runs >= this.state.target
    ) {
      this.endInnings();
      return;
    }
  }

  undoLastBall() {
    if (this.state.ballsHistory.length === 0) return;

    const lastBall = this.state.ballsHistory.pop();
    let runsToSubtract = lastBall.runs;
    if (lastBall.type === "wide" || lastBall.type === "noBall") {
      runsToSubtract += 1;
    }
    this.state.runs -= runsToSubtract;
    this.state.wickets -= lastBall.wickets;

    if (lastBall.countable) {
      if (this.state.balls === 0) {
        this.state.balls = 5;
        this.state.overs = Math.max(0, this.state.overs - 1);
      } else {
        this.state.balls--;
      }
    }

    this.updateUI();
    this.saveToLocalStorage();
  }

  endInnings() {
    // Save current innings data
    this.state.inningsHistory.push({
      team: this.state.battingTeam,
      runs: this.state.runs,
      wickets: this.state.wickets,
      overs: this.state.overs + this.state.balls / 6,
      ballsHistory: [...this.state.ballsHistory], // Store a copy of balls history
    });

    if (this.state.currentInnings === 1) {
      this.state.target = this.state.runs + 1;
      this.state.currentInnings = 2;
      [this.state.battingTeam, this.state.bowlingTeam] = [
        this.state.bowlingTeam,
        this.state.battingTeam,
      ];

      // Reset counters
      this.state.runs = 0;
      this.state.wickets = 0;
      this.state.overs = 0;
      this.state.balls = 0;
      this.state.ballsHistory = [];

      alert(`${this.state.battingTeam} needs ${this.state.target} runs to win`);
    } else {
      // Match completed logic
      let result;
      if (this.state.runs >= this.state.target) {
        const wicketsLeft = 10 - this.state.wickets;
        result = `${this.state.battingTeam} won by ${wicketsLeft} wicket${
          wicketsLeft !== 1 ? "s" : ""
        }`;
      } else {
        const runsShort = this.state.target - this.state.runs - 1;
        result = `${this.state.bowlingTeam} won by ${runsShort} run${
          runsShort !== 1 ? "s" : ""
        }`;
      }

      alert(`Match completed! ${result}`);
      this.resetMatch();
      return;
    }

    this.updateUI();
    this.saveToLocalStorage();
  }

  showScoreboard() {
    let html = "<h2>Scoreboard</h2>";

    // Toss information
    if (this.state.tossWinner) {
      const tossWinnerName =
        this.state.tossWinner === "team1" ? this.state.team1 : this.state.team2;
      html += `<p>Toss: ${tossWinnerName} won and chose to ${this.state.tossChoice}</p>`;
    }

    // Display all completed innings
    this.state.inningsHistory.forEach((innings, index) => {
      html += `
      <div class="innings-score">
        <h3>${innings.team} - ${innings.runs}/${
        innings.wickets
      } (${this.formatOvers(innings.overs)})</h3>
        ${this.getBallsHistoryHTML(innings.ballsHistory)}
      </div>
    `;
    });

    // Current innings if not completed
    if (
      this.state.ballsHistory.length > 0 ||
      this.state.runs > 0 ||
      this.state.wickets > 0
    ) {
      html += `
      <div class="innings-score">
        <h3>${this.state.battingTeam} - ${this.state.runs}/${
        this.state.wickets
      } (${this.formatOvers(this.state.overs + this.state.balls / 6)})</h3>
        ${this.getBallsHistoryHTML(this.state.ballsHistory)}
      </div>
    `;
    }

    // Target display for second innings
    if (this.state.currentInnings === 2) {
      html += `<p>Target: ${this.state.target}</p>`;
    }

    this.elements.modalBody.innerHTML = html;
    this.openModal();
  }

  // New helper method to generate balls history HTML
  getBallsHistoryHTML(ballsHistory) {
    let html = '<div class="balls-history">';
    let overNumber = 1;
    let currentOverBalls = [];
    let validBallsInOver = 0;

    ballsHistory.forEach((ball) => {
      currentOverBalls.push(ball);

      if (ball.countable) {
        validBallsInOver++;
      }

      // When we have 6 valid balls, complete the over (including any extras)
      if (validBallsInOver === 6) {
        html += `
        <div class="over-row">
          <div class="over-number">${overNumber++}</div>
          <div class="balls-row">
            ${currentOverBalls.map((b) => this.getBallHTML(b)).join("")}
          </div>
        </div>
      `;
        currentOverBalls = [];
        validBallsInOver = 0;
      }
    });

    // Add any remaining balls in incomplete over
    if (currentOverBalls.length > 0) {
      html += `
      <div class="over-row">
        <div class="over-number">${overNumber}</div>
        <div class="balls-row">
          ${currentOverBalls.map((b) => this.getBallHTML(b)).join("")}
        </div>
      </div>
    `;
    }

    html += "</div>";
    return html;
  }

  getBallHTML(ball) {
    let ballClass = "ball";
    let text = "";

    switch (ball.type) {
      case "dot":
        ballClass += " ball-dot";
        text = "•";
        break;
      case "run":
        ballClass += " ball-run";
        text = ball.runs;
        break;
      case "four":
        ballClass += " ball-four";
        text = "4";
        break;
      case "six":
        ballClass += " ball-six";
        text = "6";
        break;
      case "wide":
        ballClass += " ball-wide";
        text = ball.runs > 0 ? `${ball.runs}WD` : "WD";
        break;
      case "noBall":
        ballClass += " ball-no-ball";
        if (ball.wickets === 1) {
          text = ball.runs > 0 ? `${ball.runs}RO` : "RO";
        } else {
          text = ball.runs > 0 ? `${ball.runs}NB` : "NB";
        }
        break;
      case "byes":
        ballClass += " ball-bye";
        text = `${ball.runs}B`;
        break;
      case "out":
        ballClass += " ball-out";
        if (ball.extraInfo === "runOut") {
          text = ball.runs > 0 ? `${ball.runs}RO` : "RO";
        } else {
          text = ball.runs > 0 ? `${ball.runs}W` : "W";
        }
        break;
    }

    return `<span class="${ballClass}">${text}</span>`;
  }

  resetMatch() {
    if (!confirm("Are you sure you want to reset the match?")) return;

    this.state = {
      team1: this.state.team1,
      team2: this.state.team2,
      totalOvers: this.state.totalOvers,
      currentInnings: 1,
      battingTeam: this.state.team1,
      bowlingTeam: this.state.team2,
      target: 0,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      ballsHistory: [],
      inningsHistory: [],
      tossWinner: null,
      tossChoice: null,
    };

    localStorage.removeItem("cricketScoreData");
    this.updateUI();
    this.elements.setupModal.style.display = "flex";
  }

  startMatch() {
    this.state.matchId = Math.floor(Math.random() * 100000) + 1;
    this.state.team1 = this.elements.team1Input.value || "Team 1";
    this.state.team2 = this.elements.team2Input.value || "Team 2";
    this.state.totalOvers = parseInt(this.elements.totalOversInput.value) || 20;
    this.state.tossWinner = this.elements.tossWinnerInput.value;
    this.state.tossChoice = this.elements.tossChoiceInput.value;

    // Set batting and bowling teams based on toss
    if (this.state.tossWinner === "team1") {
      this.state.battingTeam =
        this.state.tossChoice === "bat" ? this.state.team1 : this.state.team2;
      this.state.bowlingTeam =
        this.state.tossChoice === "bat" ? this.state.team2 : this.state.team1;
    } else {
      this.state.battingTeam =
        this.state.tossChoice === "bat" ? this.state.team2 : this.state.team1;
      this.state.bowlingTeam =
        this.state.tossChoice === "bat" ? this.state.team1 : this.state.team2;
    }

    this.elements.setupModal.style.display = "none";
    this.updateUI();
    this.saveToLocalStorage();

    // Show toss result
    alert(
      `${
        this.state.tossWinner === "team1" ? this.state.team1 : this.state.team2
      } won the toss and chose to ${this.state.tossChoice}`
    );
  }

  updateUI() {
    // Update basic score information
    this.elements.teamsHeader.textContent = `${this.state.team1} vs ${this.state.team2}`;
    this.elements.battingTeam.textContent = this.state.battingTeam;
    this.elements.runs.textContent = this.state.runs;
    this.elements.wickets.textContent = this.state.wickets;
    this.elements.overs.textContent = this.formatOvers(
      this.state.overs + this.state.balls / 6
    );
    this.elements.totalOvers.textContent = this.state.totalOvers;
    this.elements.gameId.textContent = this.state.matchId;

    // Clear and update balls container with current over only
    this.elements.ballsContainer.innerHTML = "";
    const currentOverBalls = this.getCurrentOverBalls();
    currentOverBalls.forEach((ball) => {
      this.elements.ballsContainer.innerHTML += this.getBallHTML(ball);
    });

    // Update target display for second innings
    if (this.state.currentInnings === 2) {
      const runsNeeded = this.state.target - this.state.runs;
      const ballsRemaining =
        this.state.totalOvers * 6 - (this.state.overs * 6 + this.state.balls);
      this.elements.targetDisplay.innerHTML = `
      Target: ${this.state.target} | Need ${runsNeeded} in ${ballsRemaining} balls
    `;
      this.elements.targetDisplay.style.display = "block";
    } else {
      this.elements.targetDisplay.style.display = "none";
    }

    // Update run rates
    this.elements.crr.textContent = this.calculateCRR().toFixed(2);
    this.elements.rrr.textContent = this.calculateRRR().toFixed(2);

    // Disable buttons if match ended
    const matchEnded =
      this.state.currentInnings === 2 &&
      (this.state.runs >= this.state.target ||
        this.state.wickets >= 10 ||
        (this.state.overs >= this.state.totalOvers && this.state.balls === 0));

    document.querySelectorAll(".scorepad .btn").forEach((btn) => {
      btn.disabled = matchEnded;
    });
  }

  getCurrentOverBalls() {
    // Calculate how many completed overs we have
    const completedOvers = this.state.overs;

    // Count balls to skip (all balls from completed overs)
    let ballsToSkip = 0;
    let countableBalls = 0;

    for (let i = 0; i < this.state.ballsHistory.length; i++) {
      if (this.state.ballsHistory[i].countable) {
        countableBalls++;
        if (countableBalls > completedOvers * 6) {
          break; // We've reached the current over
        }
      }
      if (countableBalls <= completedOvers * 6) {
        ballsToSkip++;
      }
    }

    // Return balls from current over only
    return this.state.ballsHistory.slice(ballsToSkip);
  }

  calculateCRR() {
    const totalBalls = this.state.overs * 6 + this.state.balls;
    if (totalBalls === 0) return 0;
    return (this.state.runs / totalBalls) * 6;
  }

  calculateRRR() {
    if (this.state.currentInnings !== 2) return 0;

    const runsNeeded = this.state.target - this.state.runs;
    const ballsRemaining =
      this.state.totalOvers * 6 - (this.state.overs * 6 + this.state.balls);

    if (ballsRemaining <= 0 || runsNeeded <= 0) return 0;
    return (runsNeeded / ballsRemaining) * 6;
  }

  formatOvers(overs) {
    const fullOvers = Math.floor(overs);
    const balls = Math.round((overs - fullOvers) * 6);
    return `${fullOvers}.${balls}`;
  }

  openModal() {
    this.elements.modal.style.display = "flex";
  }

  closeModal() {
    this.elements.modal.style.display = "none";
  }

  getScore() {
    let firstInning = {};
    let secondInning = {};

    const currentInning = {
      runs: this.state.runs,
      wickets: this.state.wickets,
      over: {
        overNumber: this.state.overs,
        ballsBowled: this.state.balls,
      },
    };

    if (this.state.currentInnings == 1) {
      firstInning = currentInning;
      secondInning = null;
    } else {
      firstInning = {
        ...this.state.inningsHistory[0],
        over: {
          overNumber: this.state.inningsHistory[0].overs,
          ballsBowled: 0,
        },
      };
      secondInning = currentInning;
    }
    return {
      firstInning,
      secondInning,
    };
  }
  saveInServer() {
    fetch(`https://rhinos.ashishsubedi.com/score/${this.state.matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.getScore()),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        console.log("Response:", responseData);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  saveToLocalStorage() {
    this.saveInServer();
    localStorage.setItem("cricketScoreData", JSON.stringify(this.state));
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem("cricketScoreData");
    if (savedData) {
      try {
        Object.assign(this.state, JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CricketScoreCounter();
});
