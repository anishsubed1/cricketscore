class CricketScoreCounter {
  constructor() {
    this.state = this.getInitialState();

    this.initElements();
    this.initEventListeners();
    this.loadFromLocalStorage();
  }

  getInitialState() {
    return {
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
      matchEnded: false,
    };
  }

  initElements() {
    this.elements = {
      // Main UI
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
      // Action Buttons
      undoBtn: document.getElementById("undo-btn"),
      endInningsBtn: document.getElementById("end-innings-btn"),
      scoreboardBtn: document.getElementById("scoreboard-btn"),
      resetBtn: document.getElementById("reset-btn"),
      // Main Modal
      modal: document.getElementById("modal"),
      closeModal: document.getElementById("close-modal"),
      modalBody: document.getElementById("modal-body"),
      // Setup Modal
      setupModal: document.getElementById("setup-modal"),
      setupForm: document.getElementById("setup-form"),
      team1Input: document.getElementById("team1"),
      team2Input: document.getElementById("team2"),
      totalOversInput: document.getElementById("total-overs-input"),
      tossWinnerInput: document.getElementById("toss-winner"),
      tossChoiceInput: document.getElementById("toss-choice"),
      // Link Copy
      copyBtn: document.getElementById("link-copy-btn"),
      linkUrl: document.getElementById("link-url"),
      // Custom Alert Modal
      alertModal: document.getElementById("alert-modal"),
      alertModalTitle: document.getElementById("alert-modal-title"),
      alertModalText: document.getElementById("alert-modal-text"),
      alertModalOk: document.getElementById("alert-modal-ok"),
      // Custom Input Modal
      inputModal: document.getElementById("input-modal"),
      inputModalTitle: document.getElementById("input-modal-title"),
      inputModalText: document.getElementById("input-modal-text"),
      inputModalBody: document.getElementById("input-modal-body"),
      inputModalCancel: document.getElementById("input-modal-cancel"),
      inputModalConfirm: document.getElementById("input-modal-confirm"),
    };
  }

  initEventListeners() {
    this.elements.copyBtn.addEventListener("click", () => this.copyLink());

    this.elements.scorepadButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.handleScorepadButton(btn));
    });

    this.elements.undoBtn.addEventListener("click", () => this.undoLastBall());
    this.elements.endInningsBtn.addEventListener("click", () =>
      this.confirmEndInnings()
    );
    this.elements.scoreboardBtn.addEventListener("click", () =>
      this.showScoreboard()
    );
    this.elements.resetBtn.addEventListener("click", () =>
      this.confirmResetMatch()
    );
    this.elements.closeModal.addEventListener("click", () => this.closeModal());

    this.elements.setupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.startMatch();
    });

    // Populate toss winner dropdown when team names change
    this.elements.team1Input.addEventListener("input", () =>
      this.updateTossWinnerOptions()
    );
    this.elements.team2Input.addEventListener("input", () =>
      this.updateTossWinnerOptions()
    );
  }

  // --- Core Scoring Logic ---

  addBall(type, runs, wickets = 0, extraInfo = "") {
    if (this.state.matchEnded) return;

    const ball = {
      type,
      runs,
      wickets,
      extraInfo,
      countable: !["wide", "noBall"].includes(type),
      timestamp: new Date().toISOString(),
    };
    this.state.ballsHistory.push(ball);

    let runsToAdd = runs;
    if (type === "wide" || type === "noBall") {
      runsToAdd += 1; // Penalty run
    }

    this.state.runs += runsToAdd;
    this.state.wickets += wickets;

    if (ball.countable) {
      this.state.balls++;
      if (this.state.balls === 6) {
        this.state.balls = 0;
        this.state.overs++;
      }
    }

    this.updateUI();
    this.saveToLocalStorage();
    this.checkInningsEnd();
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

    // If we undid the last ball of the match, it's no longer ended
    if (this.state.matchEnded) {
      this.state.matchEnded = false;
    }

    this.updateUI();
    this.saveToLocalStorage();
  }

  // --- Match Flow and State Management ---

  startMatch() {
    this.state.matchId = Math.floor(Math.random() * 100000) + 1;
    this.state.team1 = this.elements.team1Input.value || "Team 1";
    this.state.team2 = this.elements.team2Input.value || "Team 2";
    this.state.totalOvers = parseInt(this.elements.totalOversInput.value) || 20;
    this.state.tossWinner = this.elements.tossWinnerInput.value;
    this.state.tossChoice = this.elements.tossChoiceInput.value;

    const tossWinnerName =
      this.state.tossWinner === "team1" ? this.state.team1 : this.state.team2;
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
    this.showAlert(
      "Match Started",
      `${tossWinnerName} won the toss and chose to ${this.state.tossChoice}.`
    );
  }

  checkInningsEnd() {
    const isOverLimit = this.state.overs >= this.state.totalOvers;
    const allOut = this.state.wickets >= 10;
    const targetReached =
      this.state.currentInnings === 2 && this.state.runs >= this.state.target;

    if (isOverLimit || allOut || targetReached) {
      // Use a timeout to allow the UI to update with the final ball before ending the innings
      setTimeout(() => this.endInnings(), 500);
    }
  }

  endInnings() {
    if (this.state.matchEnded) return;

    this.state.inningsHistory.push({
      team: this.state.battingTeam,
      runs: this.state.runs,
      wickets: this.state.wickets,
      overs: this.state.overs + this.state.balls / 10,
      ballsHistory: [...this.state.ballsHistory],
    });

    if (this.state.currentInnings === 1) {
      this.state.target = this.state.runs + 1;
      this.state.currentInnings = 2;
      [this.state.battingTeam, this.state.bowlingTeam] = [
        this.state.bowlingTeam,
        this.state.battingTeam,
      ];
      this.state.runs = 0;
      this.state.wickets = 0;
      this.state.overs = 0;
      this.state.balls = 0;
      this.state.ballsHistory = [];
      this.showAlert(
        "Innings Break",
        `${this.state.battingTeam} needs ${this.state.target} runs to win.`
      );
    } else {
      this.finishMatch();
    }

    this.updateUI();
    this.saveToLocalStorage();
  }

  finishMatch() {
    this.state.matchEnded = true;
    let result;
    if (this.state.runs >= this.state.target) {
      const wicketsLeft = 10 - this.state.wickets;
      result = `${this.state.battingTeam} won by ${wicketsLeft} wicket${
        wicketsLeft !== 1 ? "s" : ""
      }.`;
    } else if (this.state.runs === this.state.target - 1) {
      result = "The match is a tie!";
    } else {
      const runsShort = this.state.target - this.state.runs - 1;
      result = `${this.state.bowlingTeam} won by ${runsShort} run${
        runsShort !== 1 ? "s" : ""
      }.`;
    }
    this.saveInServer();
    this.showAlert("Match Completed!", result);
    this.updateUI();
  }

  resetMatch() {
    const oldState = this.getInitialState();
    // Keep team names and over counts for convenience
    oldState.team1 = this.state.team1;
    oldState.team2 = this.state.team2;
    oldState.totalOvers = this.state.totalOvers;
    this.state = oldState;

    localStorage.removeItem("cricketScoreData");
    this.updateUI();
    this.updateTossWinnerOptions();
    this.elements.setupModal.style.display = "flex";
  }

  // --- UI Update and Rendering ---

  updateUI() {
    this.elements.teamsHeader.textContent = `${this.state.team1} vs ${this.state.team2}`;
    this.elements.battingTeam.textContent = this.state.battingTeam;
    this.elements.runs.textContent = this.state.runs;
    this.elements.wickets.textContent = this.state.wickets;
    this.elements.overs.textContent = this.formatOvers(
      this.state.overs,
      this.state.balls
    );
    this.elements.totalOvers.textContent = this.state.totalOvers;

    this.elements.ballsContainer.innerHTML = this.getCurrentOverBalls()
      .map((ball) => this.getBallHTML(ball))
      .join("");

    if (this.state.currentInnings === 2) {
      const runsNeeded = Math.max(0, this.state.target - this.state.runs);
      const ballsRemaining =
        this.state.totalOvers * 6 - (this.state.overs * 6 + this.state.balls);
      this.elements.targetDisplay.innerHTML = `Target: ${this.state.target} | Need ${runsNeeded} in ${ballsRemaining} balls`;
      this.elements.targetDisplay.style.display = "block";
    } else {
      this.elements.targetDisplay.style.display = "none";
    }

    this.elements.crr.textContent = this.calculateCRR().toFixed(2);
    this.elements.rrr.textContent = this.calculateRRR().toFixed(2);

    document
      .querySelectorAll(".scorepad .btn, #undo-btn, #end-innings-btn")
      .forEach((btn) => {
        btn.disabled = this.state.matchEnded;
      });
  }

  /**
   * BUG FIX: Rewritten function to correctly identify balls in the current over.
   * It iterates backwards from the end of the history, collecting balls
   * until it has collected all countable balls for the current over.
   */
  getCurrentOverBalls() {
    const allBalls = this.state.ballsHistory;
    if (allBalls.length === 0) return [];

    const overs = [];
    let currentOver = [];
    let countableBallsInOver = 0;

    for (const ball of allBalls) {
      currentOver.push(ball);
      if (ball.countable) {
        countableBallsInOver++;
      }

      if (countableBallsInOver === 6) {
        overs.push(currentOver);
        currentOver = [];
        countableBallsInOver = 0;
      }
    }

    // The remaining balls that haven't been grouped into a full over are the current over.
    return currentOver;
  }

  showScoreboard() {
    let html = "<h2>Scoreboard</h2>";
    if (this.state.tossWinner) {
      const tossWinnerName =
        this.state.tossWinner === "team1" ? this.state.team1 : this.state.team2;
      html += `<p><strong>Toss:</strong> ${tossWinnerName} won and chose to ${this.state.tossChoice}.</p>`;
    }

    this.state.inningsHistory.forEach((innings) => {
      html += `<div class="innings-score">
        <h3>${innings.team} - ${innings.runs}/${
        innings.wickets
      } (${this.formatOvers(
        Math.floor(innings.overs),
        Math.round((innings.overs % 1) * 10)
      )})</h3>
        ${this.getBallsHistoryHTML(innings.ballsHistory)}
      </div>`;
    });

    if (
      !this.state.matchEnded &&
      (this.state.ballsHistory.length > 0 || this.state.runs > 0)
    ) {
      html += `<div class="innings-score">
        <h3>${this.state.battingTeam} - ${this.state.runs}/${
        this.state.wickets
      } (${this.formatOvers(this.state.overs, this.state.balls)})</h3>
        ${this.getBallsHistoryHTML(this.state.ballsHistory)}
      </div>`;
    }

    if (this.state.currentInnings === 2) {
      html += `<p class="target-display" style="display:block">Target: ${this.state.target}</p>`;
    }

    this.elements.modalBody.innerHTML = html;
    this.openModal();
  }

  getBallsHistoryHTML(ballsHistory) {
    let html = '<div class="balls-history">';
    let overNumber = 1;
    let currentOverBalls = [];
    let validBallsInOver = 0;

    ballsHistory.forEach((ball) => {
      currentOverBalls.push(ball);
      if (ball.countable) validBallsInOver++;
      if (validBallsInOver === 6) {
        html += `<div class="over-row"><div class="over-number">${overNumber++}</div><div class="balls-row">${currentOverBalls
          .map((b) => this.getBallHTML(b))
          .join("")}</div></div>`;
        currentOverBalls = [];
        validBallsInOver = 0;
      }
    });

    if (currentOverBalls.length > 0) {
      html += `<div class="over-row"><div class="over-number">${overNumber}</div><div class="balls-row">${currentOverBalls
        .map((b) => this.getBallHTML(b))
        .join("")}</div></div>`;
    }

    html += "</div>";
    return html;
  }

  getBallHTML(ball) {
    let ballClass = "ball";
    let text = "";
    let title = `${ball.type.charAt(0).toUpperCase() + ball.type.slice(1)}`;

    switch (ball.type) {
      case "dot":
        ballClass += " ball-dot";
        text = "•";
        title = "Dot ball";
        break;
      case "run":
        ballClass += " ball-run";
        text = ball.runs;
        title = `${ball.runs} run(s)`;
        break;
      case "four":
        ballClass += " ball-four";
        text = "4";
        title = "Four";
        break;
      case "six":
        ballClass += " ball-six";
        text = "6";
        title = "Six";
        break;
      case "wide":
        ballClass += " ball-wide";
        title = "Wide";
        if (ball.runs > 0) title += ` + ${ball.runs} bye(s)`;

        if (ball.wickets > 0) {
          text = ball.runs > 0 ? `${ball.runs}WD+W` : `WD+W`;
          title += ` + Wicket (${ball.extraInfo})`;
        } else {
          text = ball.runs > 0 ? `${ball.runs}WD` : "WD";
        }
        break;
      case "noBall":
        ballClass += " ball-no-ball";
        title = "No Ball";
        if (ball.runs > 0) title += ` + ${ball.runs} run(s)`;

        if (ball.wickets > 0) {
          text = ball.runs > 0 ? `${ball.runs}NB+W` : "NB+W";
          title += ` + Wicket (run out)`;
        } else {
          text = ball.runs > 0 ? `${ball.runs}NB` : "NB";
        }
        break;
      case "byes":
        ballClass += " ball-byes";
        text = `${ball.runs}B`;
        title = `${ball.runs} Bye(s)`;
        break;
      case "out":
        ballClass += " ball-out";
        text = ball.runs > 0 ? `${ball.runs}W` : "W";
        title = `Wicket (${ball.extraInfo})`;
        if (ball.runs > 0) title += ` + ${ball.runs} run(s)`;
        break;
    }
    return `<span class="${ballClass}" title="${title}">${text}</span>`;
  }

  // --- Event Handlers and Modal Logic ---

  handleScorepadButton(btn) {
    const type = btn.dataset.type;
    const score = parseInt(btn.dataset.score);
    if (
      ["dot", "four", "six"].includes(type) ||
      (type === "run" && [1, 2].includes(score))
    ) {
      this.addBall(type, score, 0);
    } else {
      this.showOptionsModal(type);
    }
  }

  showOptionsModal(type) {
    this.elements.modalBody.innerHTML = "";
    const createBtn = (text, onClick) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = text;
      btn.addEventListener("click", onClick);
      this.elements.modalBody.appendChild(btn);
    };

    switch (type) {
      case "wide":
        // Add options for runs scored along with the wide (removed 3)
        [0, 1, 2, 4].forEach((runs) => {
          const text =
            runs === 0
              ? "Wide (0 Byes)"
              : `Wide + ${runs} Bye${runs !== 1 ? "s" : ""}`;
          createBtn(text, () => {
            this.addBall("wide", runs, 0);
            this.closeModal();
          });
        });

        // Add Wide + Custom Byes option
        createBtn("Wide + Custom", () => {
          this.closeModal();
          this.showInputModal({
            title: "Custom Byes on Wide",
            text: "Enter how many byes were scored with the wide ball.",
            inputType: "number",
            initialValue: 0,
            onConfirm: (runs) => this.addBall("wide", runs, 0),
          });
        });

        // Add Stumped option for a wide
        createBtn("Stumped", () => {
          this.addBall("wide", 0, 1, "stumped");
          this.closeModal();
        });

        // Add Run Out option for a wide
        createBtn("Run Out", () => {
          this.closeModal();
          this.showInputModal({
            title: "Runs Before Out?",
            text: "Enter runs completed before the run out (excluding the wide itself).",
            inputType: "number",
            initialValue: 0,
            onConfirm: (runs) => this.addBall("wide", runs, 1, "runOut"),
          });
        });
        break;

      case "run":
        // Removed 'Dot' (0) from these initial options
        [3, 5].forEach((val) => {
          createBtn(val.toString(), () => {
            this.addBall(type, val, 0);
            this.closeModal();
          });
        });
        // Kept Custom for other run values
        createBtn("Custom", () => {
          this.closeModal();
          this.showInputModal({
            title: `Custom ${type} runs`,
            text: `Enter number of runs for this ${type}.`,
            inputType: "number",
            initialValue: 0,
            onConfirm: (runs) => this.addBall(type, runs, 0),
          });
        });
        break;

      case "out":
        ["Bowled", "Caught", "LBW", "Stumped"].forEach((outType) => {
          createBtn(outType, () => {
            this.addBall("out", 0, 1, outType.toLowerCase());
            this.closeModal();
          });
        });
        createBtn("Run Out", () => {
          this.closeModal();
          this.showInputModal({
            title: "Runs Before Out?",
            text: "Enter how many runs were completed before the run out.",
            inputType: "number",
            initialValue: 0,
            onConfirm: (runs) => this.addBall("out", runs, 1, "runOut"),
          });
        });
        break;

      case "noBall":
      case "byes":
        const options = { noBall: [0, 1, 2, 4, 6], byes: [1, 2, 3, 4] };
        options[type].forEach((val) => {
          createBtn(val === 0 ? "Dot" : val.toString(), () => {
            this.addBall(type, val, 0);
            this.closeModal();
          });
        });

        createBtn("Custom", () => {
          this.closeModal();
          this.showInputModal({
            title: `Custom ${type} runs`,
            text: `Enter number of runs for this ${type}.`,
            inputType: "number",
            initialValue: 0,
            onConfirm: (runs) => this.addBall(type, runs, 0),
          });
        });

        if (type === "noBall") {
          createBtn("Run Out", () => {
            this.closeModal();
            this.showInputModal({
              title: "Runs Before Out?",
              text: "Enter runs on the no-ball before the run out.",
              inputType: "number",
              initialValue: 0,
              onConfirm: (runs) => this.addBall("noBall", runs, 1, "runOut"),
            });
          });
        }
        break;
    }

    this.openModal();
  }

  confirmEndInnings() {
    this.showInputModal({
      title: "End Innings?",
      text: "Are you sure you want to end the current innings?",
      showInput: false,
      onConfirm: () => this.endInnings(),
    });
  }

  confirmResetMatch() {
    this.showInputModal({
      title: "Reset Match?",
      text: "This will clear all scores and restart the match setup. This action cannot be undone.",
      showInput: false,
      confirmText: "Yes, Reset",
      onConfirm: () => this.resetMatch(),
    });
  }

  // --- Custom Modals (replaces alert, prompt, confirm) ---

  showAlert(title, text) {
    this.elements.alertModalTitle.textContent = title;
    this.elements.alertModalText.textContent = text;
    this.elements.alertModal.style.display = "flex";

    const okListener = () => {
      this.elements.alertModal.style.display = "none";
      this.elements.alertModalOk.removeEventListener("click", okListener);
    };
    this.elements.alertModalOk.addEventListener("click", okListener);
  }

  showInputModal({
    title,
    text,
    inputType = "number",
    initialValue = "",
    showInput = true,
    confirmText = "Confirm",
    onConfirm,
    onCancel,
  }) {
    this.elements.inputModalTitle.textContent = title;
    this.elements.inputModalText.textContent = text;
    this.elements.inputModalBody.innerHTML = "";

    if (showInput) {
      const input = document.createElement("input");
      input.type = inputType;
      input.id = "custom-input-field";
      input.value = initialValue;
      if (inputType === "number") input.min = 0;
      this.elements.inputModalBody.appendChild(input);
    }

    this.elements.inputModalConfirm.textContent = confirmText;
    this.elements.inputModal.style.display = "flex";

    const confirmListener = () => {
      const value = showInput
        ? document.getElementById("custom-input-field").value || 0
        : null;
      if (onConfirm)
        onConfirm(inputType === "number" ? parseInt(value) : value);
      cleanup();
    };

    const cancelListener = () => {
      if (onCancel) onCancel();
      cleanup();
    };

    const cleanup = () => {
      this.elements.inputModal.style.display = "none";
      this.elements.inputModalConfirm.removeEventListener(
        "click",
        confirmListener
      );
      this.elements.inputModalCancel.removeEventListener(
        "click",
        cancelListener
      );
    };

    this.elements.inputModalConfirm.addEventListener("click", confirmListener);
    this.elements.inputModalCancel.addEventListener("click", cancelListener);
  }

  openModal() {
    this.elements.modal.style.display = "flex";
  }
  closeModal() {
    this.elements.modal.style.display = "none";
  }

  // --- Helpers and Data Persistence ---

  calculateCRR() {
    const totalBalls = this.state.overs * 6 + this.state.balls;
    return totalBalls === 0 ? 0 : (this.state.runs / totalBalls) * 6;
  }

  calculateRRR() {
    if (this.state.currentInnings !== 2 || this.state.target <= 0) return 0;
    const runsNeeded = this.state.target - this.state.runs;
    const ballsRemaining =
      this.state.totalOvers * 6 - (this.state.overs * 6 + this.state.balls);
    return ballsRemaining <= 0 || runsNeeded <= 0
      ? 0
      : (runsNeeded / ballsRemaining) * 6;
  }

  formatOvers(overs, balls) {
    return `${overs}.${balls}`;
  }

  copyLink() {
    const url = `http://score.dmvrhinos.com/viewonly/?matchId=${this.state.matchId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.elements.linkUrl.textContent = "Link Copied!";
      setTimeout(() => {
        this.elements.linkUrl.textContent = "";
      }, 2000);
    });
  }

  updateTossWinnerOptions() {
    const team1Name = this.elements.team1Input.value || "Team 1";
    const team2Name = this.elements.team2Input.value || "Team 2";
    this.elements.tossWinnerInput.innerHTML = `
          <option value="" disabled selected>Select team</option>
          <option value="team1">${team1Name}</option>
          <option value="team2">${team2Name}</option>
      `;
  }

  getScore() {
    let firstInning = {};
    let secondInning = {};

    const currentInning = {
      runs: this.state.runs,
      wickets: this.state.wickets,
      battingTeam: this.state.battingTeam,
      bowlingTeam: this.state.bowlingTeam,
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
        battingTeam: this.state.bowlingTeam,
        bowlingTeam: this.state.battingTeam,
      };
      secondInning = currentInning;
    }
    return {
      firstInning,
      secondInning,
      totalOvers: this.state.totalOvers,
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
        this.elements.setupModal.style.display = "none";
      } catch (e) {
        console.error("Failed to load saved data", e);
        this.elements.setupModal.style.display = "flex";
      }
    } else {
      this.elements.setupModal.style.display = "flex";
    }
    this.updateTossWinnerOptions();
    this.updateUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CricketScoreCounter();
});
