//////////////////////////
// UNIVERSAL FUNCTIONS  //
//////////////////////////

function universalOpenPage(page) {
  window.location.href = page;
}

// Load and Save Users in localStorage
function loadAllUsers() {
  let raw = localStorage.getItem("gamboUsers");
  if (!raw) {
    localStorage.setItem("gamboUsers", "{}");
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem("gamboUsers", "{}");
    return {};
  }
}
function saveAllUsers(uObj) {
  localStorage.setItem("gamboUsers", JSON.stringify(uObj));
}

// Active user get/set
function getActiveUser() {
  return localStorage.getItem("activeUser") || "";
}
function setActiveUser(username) {
  localStorage.setItem("activeUser", username);
}

// Helpers to get/set the active user’s balance
//   - If activeUser == "guest", we use sessionStorage
//   - Else we use localStorage for normal registered users
function getUserBalance() {
  const activeUser = getActiveUser();

  if (activeUser === "guest") {
    let gBal = sessionStorage.getItem("guestBalance");
    if (!gBal) {
      gBal = "1000"; // default for a new guest
      sessionStorage.setItem("guestBalance", gBal);
    }
    return parseInt(gBal, 10);
  }

  // Normal user:
  let users = loadAllUsers();
  if (!activeUser || !users[activeUser]) return 0;
  return users[activeUser].balance || 0;
}
function setUserBalance(newBal) {
  const activeUser = getActiveUser();

  if (activeUser === "guest") {
    sessionStorage.setItem("guestBalance", String(newBal));
    universalUpdateDisplayBalance();
    return;
  }

  // Normal user:
  let users = loadAllUsers();
  if (!activeUser || !users[activeUser]) return;
  users[activeUser].balance = newBal;
  saveAllUsers(users);
  universalUpdateDisplayBalance();
}

// Signup with email
function userSignupWithEmail(username, email, password) {
  if (!username || !email || !password) {
    alert("All fields required!");
    return false;
  }
  let users = loadAllUsers();

  // Check if email is already used
  for (let uName in users) {
    if (users[uName].email && users[uName].email.toLowerCase() === email.toLowerCase()) {
      alert("That email is already in use!");
      return false;
    }
  }
  // Check if username is taken
  if (users[username]) {
    alert("That username is already taken!");
    return false;
  }

  // Create new user
  users[username] = {
    username: username,
    email: email,
    password: password,
    balance: 0
  };
  saveAllUsers(users);
  setActiveUser(username);
  return true;
}

// Login with email
function userLoginWithEmail(email, password) {
  if (!email || !password) {
    alert("All fields required!");
    return false;
  }
  let users = loadAllUsers();
  let foundUsername = "";
  for (let uName in users) {
    if (users[uName].email && users[uName].email.toLowerCase() === email.toLowerCase()) {
      foundUsername = uName;
      break;
    }
  }
  if (!foundUsername) {
    alert("No account found with that email!");
    return false;
  }
  if (users[foundUsername].password !== password) {
    alert("Invalid password!");
    return false;
  }
  setActiveUser(foundUsername);
  return true;
}

// Guest Login function
function userGuestLogin() {
  setActiveUser("guest");
  // Initialize guest balance to 1000 if not set
  sessionStorage.setItem("guestBalance", "1000");
  // Redirect to home or wherever
  window.location.href = "gamindex.html"; // or "home.html"
}

// Logout
function userLogout() {
  setActiveUser("");
  sessionStorage.removeItem("guestBalance");
  // maybe redirect to userLogin.html
  window.location.href = "login.html";
}

// Initialize & display user’s balance
function universalInitializeBalance() {
  let activeUser = getActiveUser();
  // If there is no active user at all, treat them as a guest
  if (!activeUser) {
    setActiveUser("guest");
  }
  universalUpdateDisplayBalance();
}

function universalUpdateBalance(amount) {
  const activeUser = getActiveUser();
  if (!activeUser) {
    alert("No user logged in or guest!");
    return;
  }

  let currentBalance = getUserBalance();
  let newBalance = currentBalance + amount;
  if (newBalance < 0) {
    alert("Insufficient funds!");
    return;
  }
  setUserBalance(newBalance);
}

function universalUpdateDisplayBalance() {
  let balEl = document.getElementById("balance");
  if (!balEl) return;

  let activeUser = getActiveUser();
  // If user is guest:
  if (activeUser === "guest") {
    let gBal = sessionStorage.getItem("guestBalance");
    if (!gBal) {
      gBal = "1000";
      sessionStorage.setItem("guestBalance", gBal);
    }
    balEl.textContent = `Guest | Balance: ${gBal}G`;
    return;
  }

  // Otherwise normal user
  if (!activeUser) {
    balEl.textContent = "No user logged in | Balance: $0";
    return;
  }
  let users = loadAllUsers();
  let userObj = users[activeUser];
  if (!userObj) {
    balEl.textContent = "No user data? | Balance: $0";
    return;
  }
  let bal = userObj.balance || 0;
  balEl.textContent = `User: ${userObj.username} | Balance: $${bal}`;
}

// onload
window.onload = function() {
  universalInitializeBalance();
};


/////////////////////
// HOME PAGE LOGIC //
/////////////////////

function homeFilterCards() {
  let query = document.getElementById('searchBar').value.toLowerCase();
  let slot_card = document.querySelectorAll('.slotcard');
  let noResultsMessage = document.getElementById('noResultsMessage');
  let anyVisible = false;

  slot_card.forEach(card => {
    let slotName = card.querySelector('h2').textContent.toLowerCase();
    if (slotName.includes(query)) {
      card.style.display = "";
      anyVisible = true;
    } else {
      card.style.display = "none";
    }
  });
  if (anyVisible) {
    noResultsMessage.style.display = "none";
  } else {
    noResultsMessage.style.display = "block";
  }
}


///////////////////
// SLOT MACHINE  //
///////////////////

const slotOptions = [
  { name: "Triple Diamonds", img: "images/triple_diamonds.png", payout: 50 },
  { name: "Diamond",         img: "images/diamond.png",         payout: 10 },
  { name: "Mango",           img: "images/mango.png",           payout: 5 },
  { name: "Apple",           img: "images/apple.png",           payout: 3 },
  { name: "Coins",           img: "images/coins.png",           payout: 2 }
];

function slotPlaySlot() {
  const betInput = document.getElementById('betAmount');
  const resultMessage = document.getElementById('resultMessage');
  if (!betInput || !resultMessage) return;

  const bet = parseInt(betInput.value, 10);
  let currentBalance = getUserBalance();

  if (isNaN(bet) || bet <= 0) {
    alert("Please enter a valid bet amount.");
    return;
  }
  if (bet > currentBalance) {
    alert("Insufficient balance to place this bet.");
    return;
  }

  currentBalance -= bet;
  setUserBalance(currentBalance);

  const result = [
    slotOptions[Math.floor(Math.random() * slotOptions.length)],
    slotOptions[Math.floor(Math.random() * slotOptions.length)],
    slotOptions[Math.floor(Math.random() * slotOptions.length)]
  ];

  document.getElementById('slot1').src = result[0].img;
  document.getElementById('slot2').src = result[1].img;
  document.getElementById('slot3').src = result[2].img;

  let winnings = 0;
  if (result[0].name === result[1].name && result[1].name === result[2].name) {
    winnings = bet * result[0].payout;
  } else if (
    result[0].name === result[1].name ||
    result[1].name === result[2].name ||
    result[0].name === result[2].name
  ) {
    winnings = bet * 2;
  }

  if (winnings > 0) {
    currentBalance += winnings;
    setUserBalance(currentBalance);
    resultMessage.textContent = `You won $${winnings}!`;
  } else {
    resultMessage.textContent = "You lost! Better luck next time.";
  }
}


////////////////////
// BLACKJACK GAME //
////////////////////

let blackJackPlayerHand = [];
let blackJackDealerHand = [];
let blackJackCurrentBet = 0;
let blackJackGameActive = false;
let blackJackDeck = blackJackCreateDeck();

function blackJackCreateDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const cards = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      cards.push({
        rank,
        suit,
        image: `images/cards/${rank}_of_${suit}.png`
      });
    });
  });
  return cards;
}

function blackJackShuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function blackJackPlaceBet(amount) {
  const currentBalance = getUserBalance();
  if (currentBalance >= amount) {
    blackJackCurrentBet = amount;
    setUserBalance(currentBalance - amount);
    blackJackUpdateBalanceDisplay();
    document.getElementById('currentBet').textContent = `$${blackJackCurrentBet}`;
    blackJackDisableBetButtons();
    document.getElementById('gameMessage').textContent = '';
    document.getElementById('winningAmount').textContent = '';
    if (!blackJackGameActive) {
      blackJackStartGame();
    }
  } else {
    alert('Insufficient balance!');
  }
}

function blackJackDisableBetButtons() {
  const betButtons = document.querySelectorAll('#bettingArea button');
  betButtons.forEach(button => {
    button.disabled = true;
  });
}

function blackJackEnableBetButtons() {
  const betButtons = document.querySelectorAll('#bettingArea button');
  betButtons.forEach(button => {
    button.disabled = false;
  });
}

function blackJackUpdateBalanceDisplay() {
  // just re-calls the universal function
  universalUpdateDisplayBalance();
}

function blackJackStartGame() {
  blackJackDeck = blackJackCreateDeck();
  blackJackShuffleDeck(blackJackDeck);

  blackJackPlayerHand = [blackJackDrawCard(), blackJackDrawCard()];
  blackJackDealerHand = [blackJackDrawCard(), blackJackDrawCard()];
  blackJackRenderHands();
  blackJackGameActive = true;
  document.getElementById('hitButton').disabled = false;
  document.getElementById('standButton').disabled = false;
}

function blackJackDrawCard() {
  return blackJackDeck.pop();
}

function blackJackRenderHands() {
  blackJackRenderHand(blackJackPlayerHand, 'playerCards');
  blackJackRenderHand(blackJackDealerHand, 'dealerCards', true);
}

function blackJackRenderHand(hand, containerId, hideFirstCard = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  hand.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';

    let cardImage = '';
    if (hideFirstCard && index === 0) {
      cardImage = 'images/cards/back_card.png';
    } else {
      cardImage = `images/cards/${card.suit}_${card.rank}.png`;
    }
    cardElement.style.backgroundImage = `url('${cardImage}')`;
    cardElement.classList.add('card');
    container.appendChild(cardElement);
  });
}

function blackJackCalculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  hand.forEach(card => {
    if (['J', 'Q', 'K'].includes(card.rank)) {
      value += 10;
    } else if (card.rank === 'A') {
      value += 11;
      aces += 1;
    } else {
      value += parseInt(card.rank, 10);
    }
  });
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
}

function blackJackHit() {
  if (blackJackGameActive) {
    blackJackPlayerHand.push(blackJackDrawCard());
    blackJackRenderHand(blackJackPlayerHand, 'playerCards');
    const playerValue = blackJackCalculateHandValue(blackJackPlayerHand);
    if (playerValue > 21) {
      blackJackEndGame('lose');
    }
  }
}

// 1-SECOND DELAY LOGIC FOR DEALER
function blackJackStand() {
  if (blackJackGameActive) {
    blackJackDealerDrawSequence();
  }
}

function blackJackDealerDrawSequence() {
  const dealerValue = blackJackCalculateHandValue(blackJackDealerHand);
  if (dealerValue < 17) {
    // Wait 1 second, then draw next card
    setTimeout(() => {
      blackJackDealerHand.push(blackJackDrawCard());
      blackJackRenderHand(blackJackDealerHand, 'dealerCards');
      blackJackDealerDrawSequence(); // check again
    }, 1000);
  } else {
    // Dealer done drawing => evaluate
    let playerValue = blackJackCalculateHandValue(blackJackPlayerHand);
    let finalDealerValue = blackJackCalculateHandValue(blackJackDealerHand);
    if (finalDealerValue > 21 || playerValue > finalDealerValue) {
      blackJackEndGame('win');
    } else if (playerValue < finalDealerValue) {
      blackJackEndGame('lose');
    } else {
      blackJackEndGame('tie');
    }
  }
}

function blackJackEndGame(result) {
  blackJackGameActive = false;
  let currentBalance = getUserBalance();
  let winningAmount = 0;

  if (result === 'win') {
    winningAmount = blackJackCurrentBet * 2;
    currentBalance += winningAmount;
    document.getElementById('gameMessage').textContent =
      `You win! You won $${winningAmount}!`;
  } else if (result === 'tie') {
    winningAmount = blackJackCurrentBet;
    currentBalance += winningAmount;
    document.getElementById('gameMessage').textContent =
      `It's a tie! You won $${winningAmount}.`;
  } else {
    document.getElementById('gameMessage').textContent = 'You lose!';
  }

  setUserBalance(currentBalance);
  blackJackEnableBetButtons();
  document.getElementById('hitButton').disabled = true;
  document.getElementById('standButton').disabled = true;
  blackJackCurrentBet = 0;
  document.getElementById('currentBet').textContent = '$0';
}


////////////////
// POKER GAME //
////////////////

document.addEventListener("DOMContentLoaded", () => {
  // If user is "guest", we won't store in localStorage; that's handled in get/setUserBalance
  let balance = getUserBalance();
  const balanceDisplay = document.getElementById("balance");

  function pokerUpdateBalanceDisplay() {
    // We’ll just read from the stored variable “balance” for the UI below the pot
    // But also you might want to call universalUpdateDisplayBalance()
    if (balanceDisplay) {
      // If they are guest, show G
      const activeUser = getActiveUser();
      if (activeUser === "guest") {
        balanceDisplay.textContent = `${balance}G`;
      } else {
        balanceDisplay.textContent = `$${balance}`;
      }
    }
  }
  pokerUpdateBalanceDisplay();

  const gameMsgEl  = document.getElementById("game-message");
  const potEl      = document.getElementById("pot-value");
  const betBtn     = document.getElementById("pokerBet-btn");
  const raiseBtn   = document.getElementById("pokerRaise-btn");
  const foldBtn    = document.getElementById("pokerFold-btn");
  const newGameBtn = document.getElementById("pokerNew-game-btn");

  const bot1NameEl = document.getElementById("bot1-name");
  const bot2NameEl = document.getElementById("bot2-name");

  let deck       = [];
  let playerCards= [];
  let bot1Cards  = [];
  let bot2Cards  = [];
  let commCards  = [];

  let pot          = 0;
  let gameOver     = false;
  let playerFolded = false;
  let bot1Folded   = false;
  let bot2Folded   = false;

  const turnOrder  = ["player","bot1","bot2"];
  let turnIndex    = 0;
  let street       = "preflop";
  let currentBet   = 0;
  let minBet       = 50;
  let actionsThisStreet = 0;

  function pokerUpdateMessage(msg) {
    if (gameMsgEl) {
      gameMsgEl.textContent = msg;
    }
  }
  function pokerUpdatePotDisplay() {
    if (potEl) {
      potEl.textContent = `$${pot}`;
    }
  }
  function pokerDisableAllPlayerButtons() {
    if (betBtn)   betBtn.disabled   = true;
    if (raiseBtn) raiseBtn.disabled = true;
    if (foldBtn)  foldBtn.disabled  = true;
  }
  function pokerEnableAllPlayerButtons() {
    if (!playerFolded && !gameOver) {
      if (betBtn)   betBtn.disabled   = false;
      if (raiseBtn) raiseBtn.disabled = false;
      if (foldBtn)  foldBtn.disabled  = false;
    }
  }

  function pokerBuildDeck() {
    const suits = ["spades","hearts","clubs","diamonds"];
    const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    const newDeck = [];
    for (let s of suits) {
      for (let r of ranks) {
        newDeck.push(`${s}_${r}`);
      }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  function pokerDealCards() {
    playerCards = [deck.pop(), deck.pop()];
    bot1Cards   = [deck.pop(), deck.pop()];
    bot2Cards   = [deck.pop(), deck.pop()];
    commCards   = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  }

  function pokerRevealPlayerCards() {
    document.getElementById("player-card-1").src = `images/cards/${playerCards[0]}.png`;
    document.getElementById("player-card-2").src = `images/cards/${playerCards[1]}.png`;
  }
  function pokerRevealFlop() {
    document.getElementById("comm-card-1").src = `images/cards/${commCards[0]}.png`;
    document.getElementById("comm-card-2").src = `images/cards/${commCards[1]}.png`;
    document.getElementById("comm-card-3").src = `images/cards/${commCards[2]}.png`;
  }
  function pokerRevealTurn() {
    document.getElementById("comm-card-4").src = `images/cards/${commCards[3]}.png`;
  }
  function pokerRevealRiver() {
    document.getElementById("comm-card-5").src = `images/cards/${commCards[4]}.png`;
  }
  function pokerRevealAllCommunity() {
    pokerRevealFlop();
    pokerRevealTurn();
    pokerRevealRiver();
  }
  function pokerRevealBotsHands() {
    if (!bot1Folded) {
      document.getElementById("bot1-card-1").src = `images/cards/${bot1Cards[0]}.png`;
      document.getElementById("bot1-card-2").src = `images/cards/${bot1Cards[1]}.png`;
    }
    if (!bot2Folded) {
      document.getElementById("bot2-card-1").src = `images/cards/${bot2Cards[0]}.png`;
      document.getElementById("bot2-card-2").src = `images/cards/${bot2Cards[1]}.png`;
    }
  }

  function pokerCheckIfOnlyOneLeft() {
    let activeCount = 0;
    let lastActive  = "";
    if (!playerFolded) { activeCount++; lastActive = "player"; }
    if (!bot1Folded)   { activeCount++; lastActive = "bot1";   }
    if (!bot2Folded)   { activeCount++; lastActive = "bot2";   }
    if (activeCount === 1) {
      gameOver = true;
      if (lastActive === "player") {
        pokerUpdateMessage("All bots folded! You win the pot.");
        balance += pot;
        pokerUpdateBalanceDisplay();
      } else {
        pokerUpdateMessage(`${lastActive} is the only one left. They win the pot.`);
      }
      pot = 0;
      pokerUpdatePotDisplay();
      pokerEndGame();
      return true;
    }
    return false;
  }

  function pokerEndGame() {
    gameOver = true;
    pokerDisableAllPlayerButtons();
    if (newGameBtn) newGameBtn.disabled = false;
  }

  function pokerShowdown() {
    if (pokerCheckIfOnlyOneLeft()) return;
    gameOver = true;
    pokerRevealAllCommunity();
    pokerRevealBotsHands();
    let candidates = [];
    if (!playerFolded) candidates.push("Player");
    if (!bot1Folded)   candidates.push("Bot 1");
    if (!bot2Folded)   candidates.push("Bot 2");
    let winner = candidates[Math.floor(Math.random() * candidates.length)];
    if (winner === "Player") {
      pokerUpdateMessage("Showdown: You Win!");
      balance += pot;
      pokerUpdateBalanceDisplay();
    } else {
      pokerUpdateMessage(`Showdown: ${winner} wins!`);
    }
    pot = 0;
    pokerUpdatePotDisplay();
    pokerEndGame();
  }

  function pokerBotAction(botName) {
    if (gameOver) return;
    if (botName === "bot1" && bot1Folded) return;
    if (botName === "bot2" && bot2Folded) return;

    let foldProb  = 0.2;
    let callProb  = 0.5;
    let raiseProb = 0.3;
    let x = Math.random();

    if (x < foldProb) {
      pokerUpdateMessage(`${botName} folds.`);
      if (botName === "bot1") {
        bot1Folded = true;
        bot1NameEl.textContent = "Bot 1 (Folded)";
      } else {
        bot2Folded = true;
        bot2NameEl.textContent = "Bot 2 (Folded)";
      }
      pokerCheckIfOnlyOneLeft();
      return;
    }
    if (x < foldProb + callProb) {
      if (currentBet > 0) {
        pokerUpdateMessage(`${botName} calls $${currentBet}.`);
        pot += currentBet;
      } else {
        pokerUpdateMessage(`${botName} checks.`);
      }
      pokerUpdatePotDisplay();
    } else {
      let raiseAmount = currentBet + minBet;
      pokerUpdateMessage(`${botName} raises to $${raiseAmount}.`);
      pot += raiseAmount;
      currentBet = raiseAmount;
      if (raiseAmount > minBet) {
        minBet = raiseAmount;
      }
      pokerUpdatePotDisplay();
    }
  }

  function pokerNextTurn() {
    turnIndex = (turnIndex + 1) % turnOrder.length;
    let actor = turnOrder[turnIndex];
    if ((actor === "player" && playerFolded) ||
        (actor === "bot1" && bot1Folded) ||
        (actor === "bot2" && bot2Folded)) {
      pokerNextTurn();
      return;
    }
    actionsThisStreet++;
    if (actionsThisStreet > 3) {
      actionsThisStreet = 0;
      pokerProceedToNextStreet();
      return;
    }
    if (actor === "player") {
      if (!gameOver) {
        pokerUpdateMessage("Your turn...");
        pokerEnableAllPlayerButtons();
      }
    } else {
      pokerDisableAllPlayerButtons();
      setTimeout(() => {
        if (!gameOver) {
          pokerBotAction(actor);
          setTimeout(() => {
            if (!gameOver) {
              pokerNextTurn();
            }
          }, 1500);
        }
      }, 3000);
    }
  }

  function pokerProceedToNextStreet() {
    if (gameOver) return;
    if (pokerCheckIfOnlyOneLeft()) return;
    currentBet = 0;
    pokerDisableAllPlayerButtons();
    if (street === "preflop") {
      street = "flop";
      pokerRevealFlop();
      pokerUpdateMessage("Flop revealed. Next betting round...");
    } else if (street === "flop") {
      street = "turn";
      pokerRevealTurn();
      pokerUpdateMessage("Turn card revealed. Next betting round...");
    } else if (street === "turn") {
      street = "river";
      pokerRevealRiver();
      pokerUpdateMessage("River card revealed. Final betting round...");
    } else if (street === "river") {
      street = "showdown";
      pokerUpdateMessage("All community cards are out. Showdown!");
      pokerShowdown();
      return;
    }
    turnIndex = -1;
    pokerNextTurn();
  }

  function pokerPlayerBet() {
    if (gameOver || playerFolded) return;
    if (document.getElementById("player-card-1").src.endsWith("back_card.png")) {
      pokerRevealPlayerCards();
    }
    if (currentBet === 0) {
      if (balance < minBet) {
        pokerUpdateMessage("Not enough balance to bet!");
        return;
      }
      pokerUpdateMessage(`You bet $${minBet}.`);
      balance -= minBet;
      pot += minBet;
      currentBet = minBet;
    } else {
      if (balance < currentBet) {
        pokerUpdateMessage("Not enough balance to call!");
        return;
      }
      pokerUpdateMessage(`You call $${currentBet}.`);
      balance -= currentBet;
      pot += currentBet;
    }
    pokerUpdateBalanceDisplay();
    pokerUpdatePotDisplay();
    pokerDisableAllPlayerButtons();
    pokerNextTurn();
  }

  function pokerPlayerRaise() {
    if (gameOver || playerFolded) return;
    if (document.getElementById("player-card-1").src.endsWith("back_card.png")) {
      pokerRevealPlayerCards();
    }
    let newBet = currentBet + minBet;
    if (balance < newBet) {
      pokerUpdateMessage("Not enough balance to raise!");
      return;
    }
    pokerUpdateMessage(`You raise to $${newBet}.`);
    balance -= newBet;
    pot += newBet;
    currentBet = newBet;
    if (newBet > minBet) {
      minBet = newBet;
    }
    pokerUpdateBalanceDisplay();
    pokerUpdatePotDisplay();
    pokerDisableAllPlayerButtons();
    pokerNextTurn();
  }

  function pokerPlayerFold() {
    if (gameOver || playerFolded) return;
    playerFolded = true;
    pokerUpdateMessage("You folded!");
    pokerDisableAllPlayerButtons();
    pokerNextTurn();
  }

  function pokerStartGame() {
    gameOver        = false;
    playerFolded    = false;
    bot1Folded      = false;
    bot2Folded      = false;
    street          = "preflop";
    pot             = 0;
    currentBet      = 0;
    turnIndex       = 0;
    actionsThisStreet=0;
    minBet          = 50;

    if (bot1NameEl) bot1NameEl.textContent = "Bot 1";
    if (bot2NameEl) bot2NameEl.textContent = "Bot 2";

    pokerUpdateMessage("New Hand! It's preflop. Your turn...");
    pokerUpdatePotDisplay();
    if (newGameBtn) newGameBtn.disabled = true;

    deck = pokerBuildDeck();
    pokerDealCards();

    let imgElement = document.getElementById("player-card-1");
    if (imgElement) imgElement.src = "images/cards/back_card.png";
    imgElement = document.getElementById("player-card-2");
    if (imgElement) imgElement.src = "images/cards/back_card.png";
    imgElement = document.getElementById("bot1-card-1");
    if (imgElement) imgElement.src = "images/cards/back_card.png";
    imgElement = document.getElementById("bot1-card-2");
    if (imgElement) imgElement.src = "images/cards/back_card.png";
    imgElement = document.getElementById("bot2-card-1");
    if (imgElement) imgElement.src = "images/cards/back_card.png";
    imgElement = document.getElementById("bot2-card-2");
    if (imgElement) imgElement.src = "images/cards/back_card.png";

    for (let i = 1; i <= 5; i++) {
      imgElement = document.getElementById(`comm-card-${i}`);
      if (imgElement) imgElement.src = "images/cards/back_card.png";
    }

    pokerUpdateBalanceDisplay();
    pokerEnableAllPlayerButtons();
  }

  if (betBtn)   betBtn.addEventListener("click", pokerPlayerBet);
  if (raiseBtn) raiseBtn.addEventListener("click", pokerPlayerRaise);
  if (foldBtn)  foldBtn.addEventListener("click", pokerPlayerFold);
  if (newGameBtn) newGameBtn.addEventListener("click", pokerStartGame);

  pokerStartGame();
});


///////////////////
// SWEEPSBOMB  ////
///////////////////

document.addEventListener("DOMContentLoaded", () => {
  const minesGridEl        = document.getElementById("minesGrid");
  const minesMessageEl     = document.getElementById("minesMessage");
  const minesMultiplierEl  = document.getElementById("minesMultiplier");
  const minesStartBtn      = document.getElementById("minesStartBtn");
  const minesCashoutBtn    = document.getElementById("minesCashoutBtn");
  const minesBetAmountEl   = document.getElementById("minesBetAmount");
  const minesNumBombsEl    = document.getElementById("minesNumBombs");

  let minesGridSize        = 25;  // 5×5
  let minesPositions       = [];
  let minesRevealedCount   = 0;
  let minesGameActive      = false;
  let minesBaseMultiplier  = 1.0;
  let minesCurrentMult     = 1.0;
  let minesCurrentBet      = 0;

  function minesSetupGrid() {
    if (minesGridEl) {
      minesGridEl.innerHTML = "";
      for (let i = 0; i < minesGridSize; i++) {
        const cell = document.createElement("div");
        cell.classList.add("mines-cell");
        cell.dataset.index = i;
        cell.addEventListener("click", minesHandleCellClick);
        minesGridEl.appendChild(cell);
      }
    }
  }

  function minesStartGame() {
    let currentBalance = getUserBalance();
    const userBet = parseInt(minesBetAmountEl.value, 10) || 0;

    if (currentBalance <= 0) {
      minesMessageEl.textContent = "You have no balance. Deposit first!";
      return;
    }
    if (userBet > currentBalance) {
      minesMessageEl.textContent = "Bet exceeds current balance!";
      return;
    }
    if (userBet <= 0) {
      minesMessageEl.textContent = "Bet amount must be greater than 0!";
      return;
    }

    minesStartBtn.disabled = true;
    setUserBalance(currentBalance - userBet);

    minesCashoutBtn.disabled = true;
    minesCurrentBet = userBet;
    minesRevealedCount = 0;
    minesGameActive = true;
    minesSetupGrid();
    minesMessageEl.textContent = "Game started! Click tiles to find money...";

    const totalBombs = parseInt(minesNumBombsEl.value, 10);
    minesBaseMultiplier = minesGetBaseMultiplier(totalBombs);
    minesCurrentMult = minesBaseMultiplier;
    minesUpdateMultiplier();

    minesPositions = minesGenerateBombs(totalBombs, minesGridSize);
  }

  function minesGetBaseMultiplier(numBombs) {
    if (numBombs === 3) return 1.2;
    if (numBombs === 5) return 1.5;
    if (numBombs === 10) return 2.0;
    return 1.0;
  }

  function minesUpdateMultiplier() {
    if (minesMultiplierEl) {
      minesMultiplierEl.textContent = `Multiplier: x${minesCurrentMult.toFixed(2)}`;
    }
  }

  function minesGenerateBombs(num, totalCells) {
    let positions = [];
    while (positions.length < num) {
      const randomIndex = Math.floor(Math.random() * totalCells);
      if (!positions.includes(randomIndex)) {
        positions.push(randomIndex);
      }
    }
    return positions;
  }

  function minesHandleCellClick(e) {
    if (!minesGameActive) return;
    const cellEl = e.target;
    const cellIndex = parseInt(cellEl.dataset.index, 10);

    if (cellEl.classList.contains("minesRevealedSafe") ||
        cellEl.classList.contains("minesRevealedBomb")) {
      return;
    }

    if (minesPositions.includes(cellIndex)) {
      cellEl.classList.add("minesRevealedBomb");
      cellEl.style.backgroundImage = "url('images/boom.png')";
      cellEl.style.backgroundSize = "60%";
      cellEl.style.backgroundRepeat = "no-repeat";
      cellEl.style.backgroundPosition = "center";

      minesMessageEl.textContent = "Boom! You hit a bomb. Game Over!";
      minesGameOver(false);
    } else {
      cellEl.classList.add("minesRevealedSafe");
      cellEl.style.backgroundImage = "url('images/money.png')";
      cellEl.style.backgroundSize = "60%";
      cellEl.style.backgroundRepeat = "no-repeat";
      cellEl.style.backgroundPosition = "center";

      minesRevealedCount++;
      if (minesRevealedCount === 1) {
        minesCashoutBtn.disabled = false;
      }

      minesCurrentMult = minesBaseMultiplier + 0.05 * minesRevealedCount;
      minesUpdateMultiplier();

      const safeCellsNeeded = minesGridSize - minesPositions.length;
      if (minesRevealedCount === safeCellsNeeded) {
        minesMessageEl.textContent = "You revealed all safe tiles! You Win!";
        minesGameOver(true);
      } else {
        minesMessageEl.textContent =
          `Safe. Keep going or Cash Out... (Revealed: ${minesRevealedCount})`;
      }
    }
  }

  function minesCashOut() {
    if (!minesGameActive) return;
    minesMessageEl.textContent = "You cashed out your partial winnings!";
    minesGameOver(true);
  }

  function minesGameOver(win) {
    minesGameActive = false;
    minesCashoutBtn.disabled = true;
    minesRevealAllTiles();
    minesStartBtn.disabled = false;

    if (win) {
      let currentBalance = getUserBalance();
      const payout = Math.floor(minesCurrentBet * minesCurrentMult);
      setUserBalance(currentBalance + payout);
      minesMessageEl.textContent += ` You won $${payout}!`;
    }
  }

  function minesRevealAllTiles() {
    const cells = document.querySelectorAll(".mines-cell");
    for (let i = 0; i < minesGridSize; i++) {
      const cell = cells[i];
      const isBomb = minesPositions.includes(i);
      const isBombReveal = cell.classList.contains("minesRevealedBomb");
      const isSafeReveal = cell.classList.contains("minesRevealedSafe");

      if (isBomb) {
        if (!isBombReveal) {
          cell.classList.add("minesRevealedBomb");
          cell.style.backgroundImage = "url('images/boom.png')";
          cell.style.backgroundSize = "60%";
          cell.style.backgroundRepeat = "no-repeat";
          cell.style.backgroundPosition = "center";
          cell.classList.add("minesGreyed");
        }
      } else {
        if (!isSafeReveal) {
          cell.classList.add("minesRevealedSafe");
          cell.style.backgroundImage = "url('images/money.png')";
          cell.style.backgroundSize = "60%";
          cell.style.backgroundRepeat = "no-repeat";
          cell.style.backgroundPosition = "center";
          cell.classList.add("minesGreyed");
        }
      }
    }
  }

  if (minesStartBtn)   minesStartBtn.addEventListener("click", minesStartGame);
  if (minesCashoutBtn) minesCashoutBtn.addEventListener("click", minesCashOut);
  minesSetupGrid();
  minesUpdateMultiplier();
});


////////////////////
// DICE GAME LOGIC //
////////////////////

function initDiceGame() {
  const diceSlider     = document.getElementById("diceSlider");
  const diceRoll       = document.getElementById("diceRoll");
  const diceChance     = document.getElementById("diceChance");
  const diceMultiplier = document.getElementById("diceMultiplier");
  const diceProfit     = document.getElementById("diceProfit");
  const diceBetAmount  = document.getElementById("diceBetAmount");
  const rollMessage    = document.getElementById("rollMessage");
  const diceResultMsg  = document.getElementById("diceResultMessage");
  const rollToggleBtn  = document.getElementById("rollToggleBtn");
  const sliderTrack    = document.querySelector(".slider-track");

  let isRollUnder = true;

  function updateProfit() {
    let bet = parseFloat(diceBetAmount?.value) || 0;
    let mult = parseFloat(diceMultiplier?.value) || 2;
    let profit = bet * (mult - 1);
    if (diceProfit) diceProfit.value = profit.toFixed(4);
  }

  function updateSliderTrack() {
    if (!sliderTrack) return;
    let threshold = parseInt(diceRoll?.value, 10) || 50;
    if (isRollUnder) {
      sliderTrack.style.background =
        `linear-gradient(to right, blue 0%, blue ${threshold}%, red ${threshold}%, red 100%)`;
    } else {
      sliderTrack.style.background =
        `linear-gradient(to right, red 0%, red ${threshold}%, blue ${threshold}%, blue 100%)`;
    }
  }

  function updateFromValue(val) {
    if (val < 2) val = 2;
    if (val > 98) val = 98;
    if (diceSlider) diceSlider.value = val;
    if (diceRoll)   diceRoll.value   = val;

    let chance = isRollUnder ? val : (100 - val);
    if (diceChance) diceChance.value = chance.toFixed(0);

    let mult = (100 / chance) * 0.99;
    if (diceMultiplier) diceMultiplier.value = mult.toFixed(4);

    updateProfit();
    updateSliderTrack();
  }

  if (diceSlider) {
    diceSlider.addEventListener("input", () => {
      let val = parseInt(diceSlider.value, 10);
      updateFromValue(val);
    });
  }
  if (diceRoll) {
    diceRoll.addEventListener("input", () => {
      let val = parseInt(diceRoll.value, 10) || 50;
      updateFromValue(val);
    });
  }
  if (diceChance) {
    diceChance.addEventListener("input", () => {
      let c = parseInt(diceChance.value, 10) || 50;
      if (c < 2) c = 2;
      if (c > 98) c = 98;
      diceChance.value = c;
      let rollVal = isRollUnder ? c : (100 - c);
      updateFromValue(rollVal);
    });
  }
  if (diceMultiplier) {
    diceMultiplier.addEventListener("input", () => {
      let m = parseFloat(diceMultiplier.value) || 2;
      let c = 100 / (m / 0.99);
      if (c < 2) c = 2;
      if (c > 98) c = 98;
      if (diceChance) diceChance.value = c.toFixed(0);
      let r = isRollUnder ? c : (100 - c);
      updateFromValue(r);
    });
  }
  if (diceBetAmount) {
    diceBetAmount.addEventListener("input", updateProfit);
  }
  if (rollToggleBtn) {
    rollToggleBtn.addEventListener("click", () => {
      isRollUnder = !isRollUnder;
      rollToggleBtn.textContent = isRollUnder ? "Roll Under" : "Roll Over";
      let val = parseInt(diceSlider?.value, 10) || 50;
      updateFromValue(val);
    });
  }

  // The actual bet function
  window.dicePlaceBet = function() {
    let bet = parseFloat(diceBetAmount?.value) || 0;
    if (bet <= 0) {
      alert("Invalid bet amount!");
      return;
    }
    let currentBalance = getUserBalance();
    if (bet > currentBalance) {
      alert("Insufficient balance!");
      return;
    }
    setUserBalance(currentBalance - bet);

    let threshold = parseInt(diceRoll?.value, 10) || 50;
    let rollResult = Math.random() * 100;
    if (rollMessage) {
      rollMessage.textContent = `Roll = ${rollResult.toFixed(2)}`;
    }

    let mult = parseFloat(diceMultiplier?.value) || 2;
    let totalPayout = bet * mult;
    let profit = totalPayout - bet;

    let userWins = isRollUnder ? (rollResult < threshold) : (rollResult > threshold);

    let newBalance = getUserBalance();
    if (userWins) {
      newBalance += totalPayout;
      setUserBalance(newBalance);
      if (diceResultMsg) {
        diceResultMsg.textContent =
          `You won $${profit.toFixed(2)}! New balance: $${newBalance.toFixed(2)}`;
      }
    } else {
      if (diceResultMsg) {
        diceResultMsg.textContent =
          `You lost $${bet.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`;
      }
    }
  };

  (function initDice() {
    universalUpdateDisplayBalance();
    if (diceSlider) diceSlider.value = "50";
    if (diceRoll)   diceRoll.value   = "50";
    if (diceChance) diceChance.value = "50";
    if (diceMultiplier) diceMultiplier.value = "1.9800";
    if (diceProfit)     diceProfit.value     = "0.0000";
    if (rollMessage)    rollMessage.textContent = "";
    if (diceResultMsg)  diceResultMsg.textContent = "";
    isRollUnder = true;
    if (rollToggleBtn)  rollToggleBtn.textContent = "Roll Under";
    updateSliderTrack();
  })();
}

document.addEventListener("DOMContentLoaded", function() {
  universalInitializeBalance();
  initDiceGame();
});


//////////////////
// ROULETTE GAME //
//////////////////

function initRouletteGame() {
  let isSpinning = false;
  let selectedCoinValue = 10;
  let bets = {};

  const wheelOrder = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
    27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
    16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26
  ];

  const spinBtn         = document.getElementById("spinBtn");
  const clearBtn        = document.getElementById("clearBtn");
  const rouletteMessage = document.getElementById("rouletteMessage");
  const betsInfoOverlay = document.getElementById("betsInfoOverlay");
  const betsList        = document.getElementById("betsList");

  window.selectCoin = function(el) {
    document.querySelectorAll('.coin-img')
      .forEach(ci => ci.classList.remove('coin-selected'));
    el.classList.add('coin-selected');
    selectedCoinValue = parseInt(el.dataset.amount, 10);
  };

  window.placeBet = function(spot) {
    if (isSpinning) {
      alert("Cannot place bets while spinning!");
      return;
    }
    let currentBalance = getUserBalance();
    if (currentBalance < selectedCoinValue) {
      alert("Insufficient balance!");
      return;
    }
    setUserBalance(currentBalance - selectedCoinValue);

    if (!bets[spot]) bets[spot] = 0;
    bets[spot] += selectedCoinValue;

    if (rouletteMessage) {
      rouletteMessage.textContent =
        `Bet $${selectedCoinValue} on ${spot}. (Total: $${bets[spot]})`;
    }
  };

  window.clearBets = function() {
    if (isSpinning) {
      alert("Cannot clear while spinning!");
      return;
    }
    let totalBet = 0;
    for (let k in bets) {
      totalBet += bets[k];
    }
    let curBal = getUserBalance();
    setUserBalance(curBal + totalBet);
    bets = {};
    if (rouletteMessage) {
      rouletteMessage.textContent = "All bets cleared!";
    }
  };

  window.spinWheel = function() {
    if (isSpinning) return;
    isSpinning = true;
    if (spinBtn)  spinBtn.disabled  = true;
    if (clearBtn) clearBtn.disabled = true;

    const wheel = document.getElementById("rouletteWheel");
    if (!wheel) return;

    const winningNum = Math.floor(Math.random() * 37);
    const index = wheelOrder.indexOf(winningNum);
    const segmentAngle = 360 / 37;
    const baseOffset   = 0;
    const fullSpins    = 3 + Math.floor(Math.random()*3);
    const finalAngle   = (fullSpins * 360) + (baseOffset - index*segmentAngle);

    wheel.style.transform = `rotate(${finalAngle}deg)`;
    if (rouletteMessage) {
      rouletteMessage.textContent = "Spinning...";
    }

    setTimeout(() => {
      if (rouletteMessage) {
        rouletteMessage.textContent = `Winning number: ${winningNum}`;
      }
      payoutBets(winningNum);
      setTimeout(() => {
        isSpinning = false;
        if (spinBtn)  spinBtn.disabled  = false;
        if (clearBtn) clearBtn.disabled = false;
      }, 1000);
    }, 5000);
  };

  function payoutBets(winningNum) {
    let color="red", evenodd="odd", range="19-36", dozen="3rd12";
    if (winningNum === 0) {
      color="green"; evenodd="none"; range="none"; dozen="none";
    }
    // You can further refine logic by checking data-* attributes on each # for color, even/odd, etc.

    let totalWon = 0;
    for (let spot in bets) {
      let amt = bets[spot];
      if (!isNaN(spot)) {
        // Single number
        let spotNum = parseInt(spot, 10);
        if (spotNum === winningNum) {
          totalWon += (amt * 35) + amt; // 35:1 plus original
        }
      } else {
        // Outside bets
        switch(spot) {
          case "red":
            if (color==="red") totalWon+=(amt*2);
            break;
          case "black":
            if (color==="black") totalWon+=(amt*2);
            break;
          case "even":
            if (evenodd==="even") totalWon+=(amt*2);
            break;
          case "odd":
            if (evenodd==="odd") totalWon+=(amt*2);
            break;
          case "1-18":
            if (range==="1-18") totalWon+=(amt*2);
            break;
          case "19-36":
            if (range==="19-36") totalWon+=(amt*2);
            break;
          case "1st12":
            if (dozen==="1st12") totalWon+=(amt*3);
            break;
          case "2nd12":
            if (dozen==="2nd12") totalWon+=(amt*3);
            break;
          case "3rd12":
            if (dozen==="3rd12") totalWon+=(amt*3);
            break;
          default:
            break;
        }
      }
    }

    let currentBalance = getUserBalance();
    if (totalWon > 0) {
      currentBalance += totalWon;
      setUserBalance(currentBalance);
      if (rouletteMessage) {
        rouletteMessage.textContent += ` You won $${totalWon.toFixed(2)}!`;
      }
    } else {
      if (rouletteMessage) {
        rouletteMessage.textContent += " You lost your bets!";
      }
    }
    bets={};
  }

  window.showBetInfo = function() {
    if (!betsInfoOverlay || !betsList) return;
    betsList.innerHTML = "";
    let hasBets=false;
    for (let spot in bets) {
      hasBets=true;
      let amt = bets[spot];
      const p = document.createElement("p");
      p.textContent = `Spot "${spot}": $${amt}`;
      betsList.appendChild(p);
    }
    if (!hasBets) {
      betsList.textContent = "No bets placed.";
    }
    betsInfoOverlay.style.display = "block";
  };
  window.closeBetInfo = function() {
    if (betsInfoOverlay) {
      betsInfoOverlay.style.display="none";
    }
  };

  window.hoverOutside = function(outsideType, isHovering) {
    const insideBets = document.querySelectorAll('.bet-image, .bet-zero');
    insideBets.forEach(bet => {
      const c = bet.dataset.color;
      const eo= bet.dataset.evenodd;
      const r = bet.dataset.range;
      const d = bet.dataset.dozen;
      if (outsideType==="red"   && c==="red")   toggleHighlight(bet,isHovering);
      if (outsideType==="black" && c==="black") toggleHighlight(bet,isHovering);
      if (outsideType==="even"  && eo==="even") toggleHighlight(bet,isHovering);
      if (outsideType==="odd"   && eo==="odd")  toggleHighlight(bet,isHovering);
      if (outsideType==="1-18"  && r==="1-18")  toggleHighlight(bet,isHovering);
      if (outsideType==="19-36" && r==="19-36") toggleHighlight(bet,isHovering);
      if (outsideType==="1st12" && d==="1st12") toggleHighlight(bet,isHovering);
      if (outsideType==="2nd12" && d==="2nd12") toggleHighlight(bet,isHovering);
      if (outsideType==="3rd12" && d==="3rd12") toggleHighlight(bet,isHovering);
    });
  };
  window.hoverInside = function(el, isHovering) {
    toggleHighlight(el, isHovering);
  };
  function toggleHighlight(el, on) {
    if (on) el.classList.add('highlighted');
    else    el.classList.remove('highlighted');
  }
}

document.addEventListener("DOMContentLoaded", function() {
  universalInitializeBalance();
  initRouletteGame();
});
