//////////////////////////
// UNIVERSAL FUNCTIONS  //
//////////////////////////

/**
 * Navigates the browser to the given page (HTML file).
 */
function universalOpenPage(page) {
  window.location.href = page;
}

/**
 * SIGN UP with email/username/password via /api/auth.
 * On success, store sessionToken + username + balance in localStorage.
 */
async function userSignupWithEmail(username, email, password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        username,
        email,
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Signup failed');
      return false;
    }
    localStorage.setItem('sessionToken', data.sessionToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('balance', data.balance);
    return true;
  } catch (err) {
    console.error(err);
    alert('Error in signup');
    return false;
  }
}

/**
 * LOGIN with email/password via /api/auth.
 * On success, store sessionToken + username + balance in localStorage.
 */
async function userLoginWithEmail(email, password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Login failed');
      return false;  // STOP
    }

    // success => store token
    localStorage.setItem('sessionToken', data.sessionToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('balance', data.balance);
    return true;
  } catch (err) {
    console.error(err);
    alert('Error logging in');
    return false;
  }
}



/**
 * GUEST LOGIN
 */
function userGuestLogin() {
  localStorage.removeItem('sessionToken');
  localStorage.setItem('username', 'Guest');
  sessionStorage.setItem('guestBalance', '1000');
  window.location.href = 'gamindex.html';
}

/**
 * LOGOUT
 */
async function userLogout() {
  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken) {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', sessionToken }),
      });
    } catch (err) {
      console.warn('Logout API call failed', err);
    }
  }
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('username');
  localStorage.removeItem('balance');
  window.location.href = 'login.html';
}

/**
 * Gets real DB balance if sessionToken, else returns 0
 */
async function getUserBalance() {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) {
    return 0;
  }
  try {
    const res = await fetch('/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get',
        sessionToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn(data.error || 'Could not get balance');
      return 0;
    }
    localStorage.setItem('balance', data.balance);
    return data.balance;
  } catch (err) {
    console.error(err);
    return 0;
  }
}

/**
 * Locally sets user or guest balance
 */
function setUserBalance(newBal) {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) {
    sessionStorage.setItem('guestBalance', String(newBal));
  } else {
    localStorage.setItem('balance', String(newBal));
  }
  universalUpdateDisplayBalance();
}

/**
 * Actually updates DB by amount
 */
async function updateUserBalance(amount) {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) {
    alert('Not logged in! (Guest mode cannot update DB)');
    return;
  }
  try {
    const res = await fetch('/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        sessionToken,
        amount,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Could not update balance');
      return;
    }
    localStorage.setItem('balance', data.balance);
    universalUpdateDisplayBalance();
  } catch (err) {
    console.error(err);
  }
}

/**
 * + or - to user’s balance
 */
function universalUpdateBalance(amount) {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) {
    let gBal = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    const newBal = gBal + amount;
    if (newBal < 0) {
      alert('Insufficient guest funds!');
      return;
    }
    sessionStorage.setItem('guestBalance', String(newBal));
    universalUpdateDisplayBalance();
  } else {
    updateUserBalance(amount);
  }
}

/**
 * Update the display for user/guest
 */
function universalUpdateDisplayBalance() {
  const balEl = document.getElementById('balance');
  if (!balEl) return;

  const sessionToken = localStorage.getItem('sessionToken') || '';
  const username = localStorage.getItem('username') || 'Guest';

  if (!sessionToken) {
    const guestBal = sessionStorage.getItem('guestBalance') || '0';
    balEl.textContent = `User: Guest | Balance: $${guestBal}`;
  } else {
    const storedBal = localStorage.getItem('balance') || '0';
    balEl.textContent = `User: ${username} | Balance: $${storedBal}`;
  }
}

/**
 * Called on page load
 */
async function universalInitializeBalance() {
  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken) {
    await getUserBalance();
  } else {
    if (!sessionStorage.getItem('guestBalance')) {
      sessionStorage.setItem('guestBalance', '1000');
    }
  }
  universalUpdateDisplayBalance();
}

/**
 * Handle signup
 */
async function handleSignup(ev) {
  ev.preventDefault();
  const username = document.getElementById('signupUsername').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  const success = await userSignupWithEmail(username, email, password);
  if (success) {
    window.location.href = 'gamindex.html';
  }
}

/**
 * Handle login
 */
async function handleLogin(ev) {
  ev.preventDefault();
  
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Call the login function
  const success = await userLoginWithEmail(email, password);
  if (success) {
    // Only redirect if success
    window.location.href = 'gamindex.html';
  }
}


/**
 * On window load
 */
window.onload = async function() {
  await universalInitializeBalance();
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
  { name: "Triple Diamonds", img: "images/triple_diamonds.png", threeOfKindPayout: 50, twoOfKindPayout: 0 },
  { name: "Diamond",         img: "images/diamond.png",         threeOfKindPayout: 25, twoOfKindPayout: 0 },
  { name: "Coins",           img: "images/coins.png",           threeOfKindPayout: 10, twoOfKindPayout: 0 },
  { name: "Apple",           img: "images/apple.png",           threeOfKindPayout: 4,  twoOfKindPayout: 1.5 },
  { name: "Mango",           img: "images/mango.png",           threeOfKindPayout: 2,  twoOfKindPayout: 1.3 }
];

const spinSfx     = new Audio("sfx/slotSpinsfx.mp3");
const dingSfx     = new Audio("sfx/slotDingsfx.mp3");
const jackpotSfx  = new Audio("sfx/slotJackpotsfx.mp3");
const loseSfx     = new Audio("sfx/slotLosesfx.mp3");

let slotAudioEnabled = true;

function toggleSlotAudio() {
  slotAudioEnabled = !slotAudioEnabled;
  const iconEl = document.getElementById("slotAudioToggle");
  if (!iconEl) return;
  if (slotAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}

async function slotPlaySlot() {
  const betInput      = document.getElementById("betAmount");
  const resultMessage = document.getElementById("resultMessage");
  const spinButton    = document.getElementById("spinButton");

  if (!betInput || !resultMessage || !spinButton) return;
  spinButton.disabled = true;

  const bet = parseInt(betInput.value, 10);
  let currentBalance = await getUserBalance();
  if (!localStorage.getItem('sessionToken')) {
    currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
  }

  if (isNaN(bet) || bet <= 0) {
    alert("Please enter a valid bet amount.");
    spinButton.disabled = false;
    return;
  }
  if (bet > currentBalance) {
    alert("Insufficient balance to place this bet.");
    spinButton.disabled = false;
    return;
  }

  const newBal = currentBalance - bet;
  setUserBalance(newBal);

  resultMessage.textContent = "";

  if (slotAudioEnabled) {
    spinSfx.currentTime = 0;
    spinSfx.play();
  }

  let slot1Index = 0, slot2Index = 0, slot3Index = 0;
  let finalResult = [null, null, null];
  const intervalSpeed = 100;

  const reel1Interval = setInterval(() => {
    slot1Index = (slot1Index + 1) % slotOptions.length;
    document.getElementById("slot1").src = slotOptions[slot1Index].img;
  }, intervalSpeed);

  const reel2Interval = setInterval(() => {
    slot2Index = (slot2Index + 1) % slotOptions.length;
    document.getElementById("slot2").src = slotOptions[slot2Index].img;
  }, intervalSpeed);

  const reel3Interval = setInterval(() => {
    slot3Index = (slot3Index + 1) % slotOptions.length;
    document.getElementById("slot3").src = slotOptions[slot3Index].img;
  }, intervalSpeed);

  setTimeout(() => {
    clearInterval(reel1Interval);
    const randomIndex = Math.floor(Math.random() * slotOptions.length);
    finalResult[0] = slotOptions[randomIndex];
    document.getElementById("slot1").src = finalResult[0].img;
    if (slotAudioEnabled) {
      dingSfx.currentTime = 0;
      dingSfx.play();
    }
  }, 2000);

  setTimeout(() => {
    clearInterval(reel2Interval);
    const randomIndex = Math.floor(Math.random() * slotOptions.length);
    finalResult[1] = slotOptions[randomIndex];
    document.getElementById("slot2").src = finalResult[1].img;
    if (slotAudioEnabled) {
      dingSfx.currentTime = 0;
      dingSfx.play();
    }
  }, 4000);

  setTimeout(() => {
    clearInterval(reel3Interval);
    const randomIndex = Math.floor(Math.random() * slotOptions.length);
    finalResult[2] = slotOptions[randomIndex];
    document.getElementById("slot3").src = finalResult[2].img;

    if (slotAudioEnabled) {
      dingSfx.currentTime = 0;
      dingSfx.play();
    }
    if (slotAudioEnabled) {
      spinSfx.pause();
      spinSfx.currentTime = 0;
    }

    let finalBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      finalBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      finalBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }

    let winnings = 0;
    const [sym0, sym1, sym2] = finalResult;

    if (sym0.name === sym1.name && sym1.name === sym2.name) {
      winnings = bet * sym0.threeOfKindPayout;
    } else {
      let twoOfKindSymbol = null;
      if (sym0.name === sym1.name && sym0.twoOfKindPayout > 0) {
        twoOfKindSymbol = sym0;
      } else if (sym1.name === sym2.name && sym1.twoOfKindPayout > 0) {
        twoOfKindSymbol = sym1;
      } else if (sym0.name === sym2.name && sym0.twoOfKindPayout > 0) {
        twoOfKindSymbol = sym0;
      }
      if (twoOfKindSymbol) {
        winnings = bet * twoOfKindSymbol.twoOfKindPayout;
      }
    }

    if (winnings > 0) {
      const updatedBalance = finalBalance + winnings;
      setUserBalance(updatedBalance);
      resultMessage.textContent = `You won $${winnings}!`;
      if (slotAudioEnabled) {
        jackpotSfx.currentTime = 0;
        jackpotSfx.play();
      }
    } else {
      resultMessage.textContent = "You lost! Better luck next time.";
      if (slotAudioEnabled) {
        loseSfx.currentTime = 0;
        loseSfx.play();
      }
    }
    spinButton.disabled = false;
  }, 6000);
}


////////////////////
// BLACKJACK GAME //
////////////////////

const bjCardDrawSfx = new Audio("sfx/cardsDrawnsfx.mp3");
const bjWinSfx      = new Audio("sfx/winsfx.mp3");
const bjLoseSfx     = new Audio("sfx/slotLosesfx.mp3");

let blackjackAudioEnabled = true;
function toggleBlackjackAudio() {
  blackjackAudioEnabled = !blackjackAudioEnabled;
  const iconEl = document.getElementById("bjAudioToggle");
  if (!iconEl) return;
  if (blackjackAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}

let blackJackPlayerHand = [];
let blackJackDealerHand = [];
let blackJackCurrentBet = 0;
let blackJackGameActive = false;
let blackJackDeck = blackJackCreateDeck();

function blackJackCreateDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
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
  let currentBalance = 0;
  if (localStorage.getItem('sessionToken')) {
    currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
  } else {
    currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
  }

  if (currentBalance >= amount) {
    blackJackCurrentBet = amount;
    setUserBalance(currentBalance - amount);
    blackJackUpdateBalanceDisplay();
    document.getElementById('currentBet').textContent = `$${blackJackCurrentBet}`;
    blackJackDisableBetButtons();
    document.getElementById('gameMessage').textContent = '';
    document.getElementById('winningAmount').textContent = '';

    if (!blackJackGameActive) {
      blackJackGameActive = true;
      blackJackDeck = blackJackCreateDeck();
      blackJackShuffleDeck(blackJackDeck);
      blackJackDealInitialSequence();
    }
  } else {
    alert('Insufficient balance!');
  }
}

function blackJackDealInitialSequence() {
  blackJackPlayerHand = [];
  blackJackDealerHand = [];
  document.getElementById('hitButton').disabled = true;
  document.getElementById('standButton').disabled = true;

  const card1 = blackJackDrawCard();
  const card2 = blackJackDrawCard();
  const card3 = blackJackDrawCard();
  const card4 = blackJackDrawCard();

  setTimeout(() => {
    blackJackDealerHand.push(card1);
    blackJackRenderHands();
    blackJackDrawCard();
  }, 1000);

  setTimeout(() => {
    blackJackPlayerHand.push(card2);
    blackJackRenderHands();
    blackJackDrawCard();
  }, 2000);

  setTimeout(() => {
    blackJackDealerHand.push(card3);
    blackJackRenderHands();
    blackJackDrawCard();
  }, 3000);

  setTimeout(() => {
    blackJackPlayerHand.push(card4);
    blackJackRenderHands();
    document.getElementById('hitButton').disabled = false;
    document.getElementById('standButton').disabled = false;
  }, 4000);
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
  universalUpdateDisplayBalance();
}

function blackJackDrawCard() {
  if (blackjackAudioEnabled) {
    const newSfx = new Audio("sfx/cardsDrawnsfx.mp3");
    newSfx.play();
  }
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
    container.appendChild(cardElement);
  });
}

function blackJackCalculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  hand.forEach(card => {
    if (['J','Q','K'].includes(card.rank)) {
      value += 10;
    } else if (card.rank === 'A') {
      value += 11;
      aces++;
    } else {
      value += parseInt(card.rank, 10);
    }
  });
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
}

function blackJackHit() {
  if (blackJackGameActive) {
    blackJackPlayerHand.push(blackJackDrawCard());
    blackJackRenderHands();
    const playerValue = blackJackCalculateHandValue(blackJackPlayerHand);
    if (playerValue > 21) {
      blackJackEndGame('lose');
    }
  }
}

function blackJackStand() {
  if (!blackJackGameActive) return;
  blackJackDealerDrawSequence();
}

function blackJackDealerDrawSequence() {
  const dealerValue = blackJackCalculateHandValue(blackJackDealerHand);
  if (dealerValue < 17) {
    setTimeout(() => {
      blackJackDealerHand.push(blackJackDrawCard());
      blackJackRenderHand(blackJackDealerHand, 'dealerCards', true);
      blackJackDealerDrawSequence();
    }, 1000);
  } else {
    blackJackRenderHand(blackJackDealerHand, 'dealerCards', false);
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

  let currentBalance = 0;
  if (localStorage.getItem('sessionToken')) {
    currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
  } else {
    currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
  }

  let winningAmount = 0;

  if (result === 'win') {
    winningAmount = blackJackCurrentBet * 2;
    currentBalance += winningAmount;
    document.getElementById('gameMessage').textContent = `You win! You won $${winningAmount}!`;
    if (blackjackAudioEnabled) {
      bjWinSfx.currentTime = 0;
      bjWinSfx.play();
    }
  } else if (result === 'tie') {
    winningAmount = blackJackCurrentBet;
    currentBalance += winningAmount;
    document.getElementById('gameMessage').textContent = `It's a tie! You won $${winningAmount}.`;
  } else {
    document.getElementById('gameMessage').textContent = 'You lose!';
    if (blackjackAudioEnabled) {
      bjLoseSfx.currentTime = 0;
      bjLoseSfx.play();
    }
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

const pokerCardDrawSfx = "sfx/cardsDrawnsfx.mp3";
const pokerBetSfx      = "sfx/betprsfx.mp3";
const pokerWinSfx      = "sfx/winsfx.mp3";
const pokerLoseSfx     = "sfx/slotLosesfx.mp3";

let pokerAudioEnabled = true;
function togglePokerAudio() {
  pokerAudioEnabled = !pokerAudioEnabled;
  const iconEl = document.getElementById("pokerAudioToggle");
  if (!iconEl) return;
  if (pokerAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}
function playPokerSfx(sfxUrl) {
  if (!pokerAudioEnabled) return;
  const sfx = new Audio(sfxUrl);
  sfx.play();
}

document.addEventListener("DOMContentLoaded", () => {
  let balance = 0;
  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken) {
    balance = parseInt(localStorage.getItem('balance') || '0', 10);
  } else {
    balance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
  }

  const balanceDisplay = document.getElementById("balance");

  function pokerUpdateBalanceDisplay() {
    if (!balanceDisplay) return;
    const token = localStorage.getItem('sessionToken') || '';
    let bal;
    let name = localStorage.getItem('username') || 'Guest';
    if (!token) {
      bal = sessionStorage.getItem('guestBalance') || '0';
    } else {
      bal = localStorage.getItem('balance') || '0';
    }
    balanceDisplay.textContent = `User: ${name} | Balance: $${bal}`;
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
    if (betBtn) betBtn.disabled = true;
    if (raiseBtn) raiseBtn.disabled = true;
    if (foldBtn) foldBtn.disabled = true;
  }
  function pokerEnableAllPlayerButtons() {
    if (!playerFolded && !gameOver) {
      if (betBtn) betBtn.disabled = false;
      if (raiseBtn) raiseBtn.disabled = false;
      if (foldBtn) foldBtn.disabled = false;
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
    const c1 = document.getElementById("comm-card-1");
    const c2 = document.getElementById("comm-card-2");
    const c3 = document.getElementById("comm-card-3");
    if (c1 && c2 && c3) {
      c1.src = `images/cards/${commCards[0]}.png`;
      playPokerSfx(pokerCardDrawSfx);
      c2.src = `images/cards/${commCards[1]}.png`;
      playPokerSfx(pokerCardDrawSfx);
      c3.src = `images/cards/${commCards[2]}.png`;
      playPokerSfx(pokerCardDrawSfx);
    }
  }
  function pokerRevealTurn() {
    const c4 = document.getElementById("comm-card-4");
    if (c4) {
      c4.src = `images/cards/${commCards[3]}.png`;
      playPokerSfx(pokerCardDrawSfx);
    }
  }
  function pokerRevealRiver() {
    const c5 = document.getElementById("comm-card-5");
    if (c5) {
      c5.src = `images/cards/${commCards[4]}.png`;
      playPokerSfx(pokerCardDrawSfx);
    }
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
    let lastActive = "";
    if (!playerFolded) { activeCount++; lastActive = "player"; }
    if (!bot1Folded) { activeCount++; lastActive = "bot1"; }
    if (!bot2Folded) { activeCount++; lastActive = "bot2"; }
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
      playPokerSfx(pokerWinSfx);
    } else {
      pokerUpdateMessage(`Showdown: ${winner} wins!`);
      playPokerSfx(pokerLoseSfx);
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
        playPokerSfx(pokerBetSfx);
      } else {
        pokerUpdateMessage(`${botName} checks.`);
      }
      pokerUpdatePotDisplay();
      actedThisStreet.add(botName);
    } else {
      let raiseAmount = currentBet + minBet;
      pokerUpdateMessage(`${botName} raises to $${raiseAmount}.`);
      pot += raiseAmount;
      currentBet = raiseAmount;
      if (raiseAmount > minBet) {
        minBet = raiseAmount;
      }
      pokerUpdatePotDisplay();
      actedThisStreet.add(botName);
      playPokerSfx(pokerBetSfx);
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
    if (actedThisStreet.has(actor)) {
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
    actedThisStreet.clear();
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
      playPokerSfx(pokerBetSfx);
    } else {
      if (balance < currentBet) {
        pokerUpdateMessage("Not enough balance to call!");
        return;
      }
      pokerUpdateMessage(`You call $${currentBet}.`);
      balance -= currentBet;
      pot += currentBet;
      playPokerSfx(pokerBetSfx);
    }
    pokerUpdateBalanceDisplay();
    pokerUpdatePotDisplay();
    pokerDisableAllPlayerButtons();
    actedThisStreet.add("player");
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
    playPokerSfx(pokerBetSfx);
    actedThisStreet.add("player");
    pokerNextTurn();
  }

  function pokerPlayerFold() {
    if (gameOver || playerFolded) return;
    playerFolded = true;
    pokerUpdateMessage("You folded!");
    pokerDisableAllPlayerButtons();
    actedThisStreet.add("player");
    pokerNextTurn();
  }

  function pokerStartGame() {
    gameOver     = false;
    playerFolded = false;
    bot1Folded   = false;
    bot2Folded   = false;
    street       = "preflop";
    pot          = 0;
    currentBet   = 0;
    turnIndex    = 0;
    actionsThisStreet=0;
    minBet       = 50;

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

const sweepBombSuccessSfx = "sfx/slotDingsfx.mp3";
const sweepBombBombSfx    = "sfx/boomMinesfx.mp3";
const sweepBombWinSfx     = "sfx/betprsfx.mp3";

let sweepAudioEnabled = true;
function toggleSweepAudio() {
  sweepAudioEnabled = !sweepAudioEnabled;
  const iconEl = document.getElementById("sweepAudioToggle");
  if (!iconEl) return;
  if (sweepAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}
function playSweepSfx(url) {
  if (!sweepAudioEnabled) return;
  const sfx = new Audio(url);
  sfx.play();
}

document.addEventListener("DOMContentLoaded", () => {
  const minesGridEl       = document.getElementById("minesGrid");
  const minesMessageEl    = document.getElementById("minesMessage");
  const minesMultiplierEl = document.getElementById("minesMultiplier");
  const minesStartBtn     = document.getElementById("minesStartBtn");
  const minesCashoutBtn   = document.getElementById("minesCashoutBtn");
  const minesBetAmountEl  = document.getElementById("minesBetAmount");
  const minesNumBombsEl   = document.getElementById("minesNumBombs");

  let minesGridSize       = 25;
  let minesPositions      = [];
  let minesRevealedCount  = 0;
  let minesGameActive     = false;
  let minesBaseMultiplier = 1.0;
  let minesCurrentMult    = 1.0;
  let minesCurrentBet     = 0;

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
    let currentBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
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
    if (numBombs === 3)  return 1.2;
    if (numBombs === 5)  return 1.5;
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
      playSweepSfx(sweepBombBombSfx);
      minesMessageEl.textContent = "Boom! You hit a bomb. Game Over!";
      minesGameOver(false);
    } else {
      cellEl.classList.add("minesRevealedSafe");
      cellEl.style.backgroundImage = "url('images/money.png')";
      cellEl.style.backgroundSize = "60%";
      cellEl.style.backgroundRepeat = "no-repeat";
      cellEl.style.backgroundPosition = "center";
      playSweepSfx(sweepBombSuccessSfx);

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
        minesMessageEl.textContent = `Safe. Keep going or Cash Out... (Revealed: ${minesRevealedCount})`;
      }
    }
  }

  function minesCashOut() {
    if (!minesGameActive) return;
    minesMessageEl.textContent = "You cashed out your partial winnings!";
    playSweepSfx(sweepBombWinSfx);
    minesGameOver(true);
  }

  function minesGameOver(win) {
    minesGameActive = false;
    minesCashoutBtn.disabled = true;
    minesRevealAllTiles();
    minesStartBtn.disabled = false;

    if (win) {
      let currentBalance = 0;
      if (localStorage.getItem('sessionToken')) {
        currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
      } else {
        currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
      }
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

  if (minesStartBtn) minesStartBtn.addEventListener("click", minesStartGame);
  if (minesCashoutBtn) minesCashoutBtn.addEventListener("click", minesCashOut);
  minesSetupGrid();
  minesUpdateMultiplier();
});


////////////////////
// DICE GAME LOGIC //
////////////////////

const diceWinSfx  = "sfx/winsfx.mp3";
const diceLoseSfx = "sfx/slotLosesfx.mp3";

let diceAudioEnabled = true;
function toggleDiceAudio() {
  diceAudioEnabled = !diceAudioEnabled;
  const iconEl = document.getElementById("diceAudioToggle");
  if (!iconEl) return;
  if (diceAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}
function playDiceSfx(url) {
  if (!diceAudioEnabled) return;
  const sfx = new Audio(url);
  sfx.play();
}

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

  window.dicePlaceBet = function() {
    let bet = parseFloat(diceBetAmount?.value) || 0;
    if (bet <= 0) {
      alert("Invalid bet amount!");
      return;
    }
    let currentBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
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
    let newBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      newBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      newBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
    if (userWins) {
      newBalance += totalPayout;
      setUserBalance(newBalance);
      playDiceSfx(diceWinSfx);
      if (diceResultMsg) {
        diceResultMsg.textContent =
          `You won $${profit.toFixed(2)}! New balance: $${newBalance.toFixed(2)}`;
      }
    } else {
      playDiceSfx(diceLoseSfx);
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

document.addEventListener("DOMContentLoaded", async function() {
  await universalInitializeBalance();
  initDiceGame();
});


//////////////////
// ROULETTE GAME //
//////////////////

let rouletteAudioEnabled = true;
const rouletteBetSfx  = "sfx/betprsfx.mp3";
const rouletteSpinSfx = "sfx/slotSpinsfx.mp3";
const rouletteWinSfx  = "sfx/slotJackpotsfx.mp3";
const rouletteLoseSfx = "sfx/slotLosesfx.mp3";

function toggleRouletteAudio() {
  rouletteAudioEnabled = !rouletteAudioEnabled;
  const iconEl = document.getElementById("rouletteAudioToggle");
  if (!iconEl) return;
  if (rouletteAudioEnabled) {
    iconEl.textContent = "🔊";
    iconEl.style.color = "gold";
  } else {
    iconEl.textContent = "🔇";
    iconEl.style.color = "red";
  }
}
function playRouletteSfx(url) {
  if (!rouletteAudioEnabled) return;
  const sfx = new Audio(url);
  sfx.play();
}

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
  const wheel           = document.getElementById("rouletteWheel");

  if (wheel) {
    wheel.style.transition = "transform 6s cubic-bezier(0.32, 0.64, 0.45, 1)";
  }

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
    let currentBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
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
    playRouletteSfx(rouletteBetSfx);
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
    let curBal = 0;
    if (localStorage.getItem('sessionToken')) {
      curBal = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      curBal = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
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

    playRouletteSfx(rouletteSpinSfx);
    const winningNum = Math.floor(Math.random() * 37);
    const index = wheelOrder.indexOf(winningNum);
    const segmentAngle = 360 / 37;
    const fullSpins = 3 + Math.floor(Math.random() * 2);
    const finalAngle = (fullSpins * 360) - (index * segmentAngle);

    wheel.style.transform = `rotate(${finalAngle}deg)`;
    rouletteMessage.textContent = "Spinning...";

    setTimeout(() => {
      rouletteMessage.textContent = `Winning number: ${winningNum}`;
      payoutBets(winningNum);

      setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled  = false;
        clearBtn.disabled = false;
        setTimeout(() => {
          wheel.style.transition = "none";
          wheel.style.transform  = `rotate(0deg)`;
          wheel.offsetHeight;
          wheel.style.transition = "transform 6s cubic-bezier(0.32,0.64,0.45,1)";
        }, 1000);

      }, 1000);

    }, 6000);
  };

  function getColor(num) {
    if (num === 0) return "green";
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    if (redNumbers.includes(num)) return "red";
    return "black";
  }
  function getEvenOdd(num) {
    if (num === 0) return "none";
    return (num % 2 === 0) ? "even" : "odd";
  }
  function getRange(num) {
    if (num === 0) return "none";
    return (num >= 1 && num <= 18) ? "1-18" : "19-36";
  }
  function getDozen(num) {
    if (num === 0) return "none";
    if (num >= 1 && num <= 12) return "1st12";
    if (num >= 13 && num <= 24) return "2nd12";
    return "3rd12";
  }

  function payoutBets(winningNum) {
    const color   = getColor(winningNum);
    const evenodd = getEvenOdd(winningNum);
    const range   = getRange(winningNum);
    const dozen   = getDozen(winningNum);
    let totalWon  = 0;

    for (let spot in bets) {
      let amt = bets[spot];
      if (!isNaN(spot)) {
        let spotNum = parseInt(spot, 10);
        if (spotNum === winningNum) {
          totalWon += (amt * 35) + amt;
        }
      } else {
        switch(spot) {
          case "red":
            if (color === "red") totalWon += (amt * 2);
            break;
          case "black":
            if (color === "black") totalWon += (amt * 2);
            break;
          case "even":
            if (evenodd === "even") totalWon += (amt * 2);
            break;
          case "odd":
            if (evenodd === "odd")  totalWon += (amt * 2);
            break;
          case "1-18":
            if (range === "1-18") totalWon += (amt * 2);
            break;
          case "19-36":
            if (range === "19-36") totalWon += (amt * 2);
            break;
          case "1st12":
            if (dozen === "1st12") totalWon += (amt * 3);
            break;
          case "2nd12":
            if (dozen === "2nd12") totalWon += (amt * 3);
            break;
          case "3rd12":
            if (dozen === "3rd12") totalWon += (amt * 3);
            break;
          default:
            break;
        }
      }
    }

    let currentBalance = 0;
    if (localStorage.getItem('sessionToken')) {
      currentBalance = parseInt(localStorage.getItem('balance') || '0', 10);
    } else {
      currentBalance = parseInt(sessionStorage.getItem('guestBalance') || '0', 10);
    }
    if (totalWon > 0) {
      currentBalance += totalWon;
      setUserBalance(currentBalance);
      rouletteMessage.textContent += ` You won $${totalWon.toFixed(2)}!`;
      playRouletteSfx(rouletteWinSfx);
    } else {
      rouletteMessage.textContent += " You lost your bets!";
      playRouletteSfx(rouletteLoseSfx);
    }
    bets = {};
  }

  window.showBetInfo = function() {
    if (!betsInfoOverlay || !betsList) return;
    betsList.innerHTML = "";
    let hasBets = false;
    for (let spot in bets) {
      hasBets = true;
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
      if (outsideType==="red"   && c==="red")   toggleHighlight(bet, isHovering);
      if (outsideType==="black" && c==="black") toggleHighlight(bet, isHovering);
      if (outsideType==="even"  && eo==="even") toggleHighlight(bet, isHovering);
      if (outsideType==="odd"   && eo==="odd")  toggleHighlight(bet, isHovering);
      if (outsideType==="1-18"  && r==="1-18")  toggleHighlight(bet, isHovering);
      if (outsideType==="19-36" && r==="19-36") toggleHighlight(bet, isHovering);
      if (outsideType==="1st12" && d==="1st12") toggleHighlight(bet, isHovering);
      if (outsideType==="2nd12" && d==="2nd12") toggleHighlight(bet, isHovering);
      if (outsideType==="3rd12" && d==="3rd12") toggleHighlight(bet, isHovering);
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

document.addEventListener("DOMContentLoaded", async function() {
  await universalInitializeBalance();
  initRouletteGame();
});
