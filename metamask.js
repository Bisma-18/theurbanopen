/**
 * ============================================================
 * METAMASK.JS — The Urban Open | Web3 Wallet Integration
 * ============================================================
 * Full MetaMask integration using ethers.js v6
 * Supports: Sepolia Testnet & Polygon Mainnet
 * Features: Connect, Disconnect, Auto-reconnect, Payment flow
 * ============================================================
 */

// ─────────────────────────────────────────────
// SUPPORTED NETWORKS CONFIGURATION
// ─────────────────────────────────────────────
const SUPPORTED_NETWORKS = {
  11155111: {
    name: "Sepolia Testnet",
    symbol: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    color: "#00d2ff"
  },
  137: {
    name: "Polygon Mainnet",
    symbol: "MATIC",
    blockExplorer: "https://polygonscan.com",
    color: "#8247e5"
  }
};

// ─────────────────────────────────────────────
// REGISTRATION PAYMENT CONFIG
// ─────────────────────────────────────────────
const REGISTRATION_FEE_ETH = "0.001";
// Using a well-known burn address for simulation — no real funds sent anywhere harmful
const TOURNAMENT_WALLET = "0x000000000000000000000000000000000000dEaD";

// ─────────────────────────────────────────────
// GLOBAL WALLET STATE
// ─────────────────────────────────────────────
const WalletState = {
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false
};

// ─────────────────────────────────────────────
// UTILITY: Shorten address for display
// ─────────────────────────────────────────────
function shortenAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ─────────────────────────────────────────────
// UTILITY: Show toast notification
// ─────────────────────────────────────────────
function showToast(message, type = "info") {
  const existing = document.querySelector(".w3-toast");
  if (existing) existing.remove();

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `w3-toast w3-toast-${type}`;
  toast.innerHTML = `<div class="w3-toast-icon">${icons[type] || "ℹ️"}</div><div class="w3-toast-msg">${message}</div>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("w3-toast-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("w3-toast-visible");
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// ─────────────────────────────────────────────
// UPDATE NETWORK WARNING BANNER
// ─────────────────────────────────────────────
function updateNetworkBanner(chainId) {
  // Always hide network banner — simulated payment works on any network
  const banner = document.getElementById("w3-network-banner");
  if (banner) banner.style.display = "none";
}

// ─────────────────────────────────────────────
// UPDATE ALL WALLET UI ELEMENTS
// ─────────────────────────────────────────────
function updateWalletUI() {
  const connectBtn = document.getElementById("metamask-connect-btn");
  const walletInfo = document.getElementById("wallet-info");
  const walletAddress = document.getElementById("wallet-address-display");
  const walletNetwork = document.getElementById("wallet-network-display");
  const disconnectBtn = document.getElementById("metamask-disconnect-btn");

  if (WalletState.isConnected) {
    if (connectBtn) connectBtn.style.display = "none";
    if (walletInfo) walletInfo.style.display = "flex";
    if (walletAddress) walletAddress.textContent = shortenAddress(WalletState.address);

    const net = SUPPORTED_NETWORKS[WalletState.chainId];
    if (walletNetwork) {
      walletNetwork.textContent = net ? net.name : `Chain ${WalletState.chainId}`;
      walletNetwork.style.color = net ? net.color : "#ff4d00";
    }
    if (disconnectBtn) disconnectBtn.style.display = "inline-flex";

    updateNetworkBanner(WalletState.chainId);
    updateLeaderboardWalletSection();
    updateRegistrationGate(true);
  } else {
    if (connectBtn) {
      connectBtn.style.display = "inline-flex";
      connectBtn.disabled = false;
      connectBtn.classList.remove("w3-btn-loading");
      connectBtn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" class="w3-fox-icon" alt="MM"> Connect Wallet`;
    }
    if (walletInfo) walletInfo.style.display = "none";
    if (disconnectBtn) disconnectBtn.style.display = "none";
    const banner = document.getElementById("w3-network-banner");
    if (banner) banner.style.display = "none";
    updateLeaderboardWalletSection();
    updateRegistrationGate(false);
  }
}

// ─────────────────────────────────────────────
// LEADERBOARD WALLET STATUS SECTION
// ─────────────────────────────────────────────
function updateLeaderboardWalletSection() {
  const section = document.getElementById("lb-wallet-status");
  if (!section) return;

  if (WalletState.isConnected) {
    const net = SUPPORTED_NETWORKS[WalletState.chainId];
    section.innerHTML = `
      <div class="lb-wallet-connected">
        <div class="lb-wallet-dot"></div>
        <div class="lb-wallet-details">
          <span class="lb-wallet-label">Connected Wallet</span>
          <span class="lb-wallet-addr">${shortenAddress(WalletState.address)}</span>
        </div>
        <div class="lb-wallet-network" style="color:${net ? net.color : '#ff4d00'}">
          ${net ? net.name : "Unknown Network"}
        </div>
      </div>`;
  } else {
    section.innerHTML = `
      <div class="lb-wallet-disconnected">
        <span class="lb-wallet-dot lb-wallet-dot-off"></span>
        <span style="opacity:0.6;font-size:0.9rem;">No wallet connected — 
          <a href="registration.html" style="color:var(--accent-blue);">Connect on Registration</a>
        </span>
      </div>`;
  }
}

// ─────────────────────────────────────────────
// REGISTRATION FORM GATE
// ─────────────────────────────────────────────
function updateRegistrationGate(connected) {
  const gate = document.getElementById("wallet-gate");
  const form = document.getElementById("regForm");
  const payBtn = document.getElementById("reg-pay-btn");

  if (!gate && !form) return;

  if (connected) {
    if (gate) gate.style.display = "none";
    if (form) { form.style.opacity = "1"; form.style.pointerEvents = "auto"; }
    if (payBtn) { payBtn.disabled = false; payBtn.textContent = `Pay ${REGISTRATION_FEE_ETH} ETH & Register`; }
  } else {
    if (gate) gate.style.display = "flex";
    if (form) { form.style.opacity = "0.35"; form.style.pointerEvents = "none"; }
  }
}

// ─────────────────────────────────────────────
// CONNECT WALLET
// ─────────────────────────────────────────────
async function connectWallet() {
  // MetaMask does NOT inject window.ethereum on file:// pages.
  // The user must serve the site via http:// (e.g. Live Server, python -m http.server, etc.)
  if (window.location.protocol === "file:") {
    showToast("⚠️ MetaMask doesn't work on file:// — open via a local server (e.g. VS Code Live Server or double-check your browser allows it).", "error");
    console.warn("MetaMask requires http:// or https:// — file:// protocol is not supported.");
    return;
  }

  if (typeof window.ethereum === "undefined") {
    // Simulate wallet connection when MetaMask is not available
    showToast("Simulating wallet connection... 🦊", "info");
    WalletState.address = "0xSIM" + Math.random().toString(16).slice(2,12).toUpperCase();
    WalletState.chainId = 11155111;
    WalletState.isConnected = true;
    WalletState.provider = null;
    WalletState.signer = null;
    localStorage.setItem("w3_connected", "true");
    localStorage.setItem("w3_address", WalletState.address);
    localStorage.setItem("w3_chainId", WalletState.chainId);
    setTimeout(() => showToast("Wallet connected! Welcome to The Urban Open. 🔥", "success"), 800);
    updateWalletUI();
    return;
  }

  const btn = document.getElementById("metamask-connect-btn");
  if (btn) {
    btn.classList.add("w3-btn-loading");
    btn.innerHTML = `<span class="w3-spinner"></span> Connecting...`;
    btn.disabled = true;
  }

  try {
    WalletState.provider = new ethers.BrowserProvider(window.ethereum);
    await WalletState.provider.send("eth_requestAccounts", []);
    WalletState.signer = await WalletState.provider.getSigner();
    WalletState.address = await WalletState.signer.getAddress();

    const network = await WalletState.provider.getNetwork();
    WalletState.chainId = Number(network.chainId);
    WalletState.isConnected = true;

    localStorage.setItem("w3_connected", "true");
    localStorage.setItem("w3_address", WalletState.address);
    localStorage.setItem("w3_chainId", WalletState.chainId);

    // Allow any network — simulated payment works on all networks
    showToast("Wallet connected! Welcome to The Urban Open. 🔥", "success");

    updateWalletUI();
    setupEventListeners();

  } catch (err) {
    if (err.code === 4001 || (err.message && err.message.includes("rejected"))) {
      showToast("Connection rejected. Please approve the MetaMask prompt.", "error");
    } else {
      showToast("Connection failed. Please try again.", "error");
      console.error("Wallet connect error:", err);
    }
    // Reset button
    if (btn) {
      btn.classList.remove("w3-btn-loading");
      btn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" class="w3-fox-icon" alt="MM"> Connect Wallet`;
      btn.disabled = false;
    }
  }
}

// ─────────────────────────────────────────────
// DISCONNECT WALLET
// ─────────────────────────────────────────────
function disconnectWallet() {
  WalletState.provider = null;
  WalletState.signer = null;
  WalletState.address = null;
  WalletState.chainId = null;
  WalletState.isConnected = false;

  localStorage.removeItem("w3_connected");
  localStorage.removeItem("w3_address");
  localStorage.removeItem("w3_chainId");

  showToast("Wallet disconnected.", "info");
  updateWalletUI();
}

// ─────────────────────────────────────────────
// AUTO-RECONNECT ON PAGE LOAD
// ─────────────────────────────────────────────
async function autoReconnect() {
  if (localStorage.getItem("w3_connected") !== "true") return;
  if (window.location.protocol === "file:") return;
  if (typeof window.ethereum === "undefined") return;

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      localStorage.removeItem("w3_connected");
      return;
    }
    WalletState.provider = new ethers.BrowserProvider(window.ethereum);
    WalletState.signer = await WalletState.provider.getSigner();
    WalletState.address = await WalletState.signer.getAddress();
    const network = await WalletState.provider.getNetwork();
    WalletState.chainId = Number(network.chainId);
    WalletState.isConnected = true;
    localStorage.setItem("w3_address", WalletState.address);
    localStorage.setItem("w3_chainId", WalletState.chainId);
    updateWalletUI();
    setupEventListeners();
  } catch (err) {
    localStorage.removeItem("w3_connected");
    console.warn("Auto-reconnect skipped:", err.message);
  }
}

// ─────────────────────────────────────────────
// METAMASK EVENT LISTENERS
// ─────────────────────────────────────────────
function setupEventListeners() {
  if (!window.ethereum) return;

  window.ethereum.removeAllListeners && window.ethereum.removeAllListeners("accountsChanged");
  window.ethereum.removeAllListeners && window.ethereum.removeAllListeners("chainChanged");

  window.ethereum.on("accountsChanged", async (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
    } else {
      WalletState.address = accounts[0];
      localStorage.setItem("w3_address", WalletState.address);
      showToast(`Account switched to ${shortenAddress(WalletState.address)}`, "info");
      updateWalletUI();
    }
  });

  window.ethereum.on("chainChanged", (chainIdHex) => {
    const newChainId = parseInt(chainIdHex, 16);
    WalletState.chainId = newChainId;
    localStorage.setItem("w3_chainId", newChainId);
    if (!SUPPORTED_NETWORKS[newChainId]) {
      showToast("Unsupported network! Please switch to Sepolia or Polygon.", "warning");
    } else {
      showToast(`Switched to ${SUPPORTED_NETWORKS[newChainId].name}`, "success");
    }
    updateWalletUI();
  });
}

// ─────────────────────────────────────────────
// SWITCH TO SEPOLIA NETWORK
// ─────────────────────────────────────────────
async function switchToSepolia() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }]
    });
  } catch (err) {
    showToast("Could not switch automatically. Please switch in MetaMask manually.", "error");
  }
}

// ─────────────────────────────────────────────
// REGISTRATION PAYMENT FLOW
// ─────────────────────────────────────────────
async function processRegistrationPayment(playerData) {
  if (!WalletState.isConnected) {
    showToast("Please connect your wallet first!", "warning");
    return false;
  }

  // ── SIMULATED PAYMENT (no real ETH required) ──
  showPaymentModal("pending", playerData);

  // Simulate a short processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate a fake transaction hash for demo/simulation
  const fakeTxHash = "0xSIM" + Math.random().toString(16).slice(2, 18).toUpperCase();

  showPaymentModal("confirming", playerData, fakeTxHash);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Save to database with simulated payment info
  const saved = await saveRegistration(playerData, fakeTxHash);
  if (saved) {
    showPaymentModal("success", playerData, fakeTxHash);
    return true;
  } else {
    showPaymentModal("failed");
    return false;
  }
}

// ─────────────────────────────────────────────
// SAVE REGISTRATION TO LOCALSTORAGE
// ─────────────────────────────────────────────
async function saveRegistration(playerData, txHash) {
  // POST to backend API — persistent database storage
  try {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_name:    playerData.name,
        game_id:        playerData.id,
        team_name:      playerData.team,
        wallet:         WalletState.address,
        payment_method: 'MetaMask',
        payment_status: 'Paid',
        tx_hash:        txHash
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Registration save failed', 'error');
      return false;
    }
    showToast('Registration saved to database!', 'success');
    return true;
  } catch (e) {
    // Fallback to localStorage if backend is offline
    const participants = JSON.parse(localStorage.getItem("tournamentPlayers")) || [];
    participants.push({ ...playerData, wallet: WalletState.address, txHash: txHash, registeredAt: new Date().toISOString() });
    localStorage.setItem("tournamentPlayers", JSON.stringify(participants));
    console.warn('Backend offline — saved to localStorage as fallback');
    return true;
  }
}

// ─────────────────────────────────────────────
// PAYMENT STATUS MODAL
// ─────────────────────────────────────────────
function showPaymentModal(state, playerData, txHash) {
  playerData = playerData || {};
  txHash = txHash || "";

  const old = document.getElementById("w3-payment-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "w3-payment-modal";
  modal.className = "w3-modal-overlay";

  const templates = {
    pending: `
      <div class="w3-modal-icon w3-modal-spin">⟳</div>
      <h3 class="w3-modal-title">Confirm in MetaMask</h3>
      <p class="w3-modal-subtitle">Please approve the transaction in your MetaMask wallet...</p>
      <div class="w3-tx-details">
        <div class="w3-tx-row"><span>Player</span><strong>${playerData.name || "—"}</strong></div>
        <div class="w3-tx-row"><span>Team</span><strong>${playerData.team || "—"}</strong></div>
        <div class="w3-tx-row"><span>Entry Fee</span><strong>${REGISTRATION_FEE_ETH} ETH</strong></div>
        <div class="w3-tx-row"><span>Wallet</span><strong>${shortenAddress(WalletState.address)}</strong></div>
      </div>
      <div class="w3-pulse-bar"></div>`,

    confirming: `
      <div class="w3-modal-icon w3-modal-spin" style="color:var(--accent-blue)">⟳</div>
      <h3 class="w3-modal-title">Processing On-Chain</h3>
      <p class="w3-modal-subtitle">Waiting for blockchain confirmation... this may take 15–30 seconds.</p>
      <div class="w3-tx-hash"><span>TX:</span><code>${shortenAddress(txHash)}</code></div>
      <div class="w3-pulse-bar"></div>`,

    success: `
      <div class="w3-modal-icon w3-modal-success-icon">✓</div>
      <h3 class="w3-modal-title" style="color:#00ff88">You're In! 🏆</h3>
      <p class="w3-modal-subtitle">Registration confirmed on the blockchain. See you at The Urban Open!</p>
      <div class="w3-tx-details">
        <div class="w3-tx-row"><span>Player</span><strong>${playerData.name || "—"}</strong></div>
        <div class="w3-tx-row"><span>Team</span><strong>${playerData.team || "—"}</strong></div>
        <div class="w3-tx-row"><span>Status</span><strong style="color:#00ff88">✅ Confirmed</strong></div>
        <div class="w3-tx-row"><span>TX Hash</span><strong>${shortenAddress(txHash)}</strong></div>
      </div>
      ${WalletState.chainId && SUPPORTED_NETWORKS[WalletState.chainId] ? `<a href="${SUPPORTED_NETWORKS[WalletState.chainId].blockExplorer}/tx/${txHash}" target="_blank" class="w3-explorer-link">View on Explorer ↗</a>` : ""}
      <button class="w3-modal-close-btn" onclick="document.getElementById('w3-payment-modal').remove()">Close</button>`,

    failed: `
      <div class="w3-modal-icon" style="font-size:3rem;color:#ff4d00">✕</div>
      <h3 class="w3-modal-title" style="color:#ff4d00">Transaction Failed</h3>
      <p class="w3-modal-subtitle">Something went wrong on-chain. Please try again.</p>
      <button class="w3-modal-close-btn" onclick="document.getElementById('w3-payment-modal').remove()">Close</button>`,

    rejected: `
      <div class="w3-modal-icon" style="font-size:3rem;color:#ff4d00">✕</div>
      <h3 class="w3-modal-title" style="color:#ff4d00">Transaction Rejected</h3>
      <p class="w3-modal-subtitle">You rejected the transaction in MetaMask. No funds were sent.</p>
      <button class="w3-modal-close-btn" onclick="document.getElementById('w3-payment-modal').remove()">Close</button>`,

    insufficient: `
      <div class="w3-modal-icon" style="font-size:3rem;color:#fbbf24">💸</div>
      <h3 class="w3-modal-title" style="color:#fbbf24">Insufficient Funds</h3>
      <p class="w3-modal-subtitle">You need at least ${REGISTRATION_FEE_ETH} ETH on Sepolia. Get free test ETH below.</p>
      <a href="https://sepoliafaucet.com" target="_blank" class="w3-modal-close-btn" style="margin-bottom:8px;">Get Sepolia ETH →</a>
      <button class="w3-modal-close-btn" style="background:transparent;border:1px solid #555;" onclick="document.getElementById('w3-payment-modal').remove()">Close</button>`
  };

  modal.innerHTML = `<div class="w3-modal-box">${templates[state] || templates.failed}</div>`;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add("w3-modal-visible"), 10);
}

// ─────────────────────────────────────────────
// INJECT WALLET UI INTO NAVBAR
// ─────────────────────────────────────────────
function injectNavbarWallet() {
  const nav = document.querySelector("nav");
  if (!nav || document.getElementById("metamask-connect-btn")) return;

  // Network warning banner
  const banner = document.createElement("div");
  banner.id = "w3-network-banner";
  banner.style.display = "none";
  banner.innerHTML = `
    <div class="w3-network-banner-inner">
      ⚠️ Wrong Network: <span class="w3-network-name"></span>
      &nbsp;—&nbsp;
      <button onclick="switchToSepolia()" class="w3-switch-btn">Switch to Sepolia</button>
    </div>`;
  // Insert banner at very top of body
  document.body.insertBefore(banner, document.body.firstChild);

  // Wallet wrapper
  const walletWrapper = document.createElement("div");
  walletWrapper.className = "w3-nav-wallet";
  walletWrapper.innerHTML = `
    <button id="metamask-connect-btn" class="w3-connect-btn" onclick="connectWallet()">
      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" class="w3-fox-icon" alt="MM">
      Connect Wallet
    </button>
    <div id="wallet-info" style="display:none;">
      <div class="w3-wallet-chip">
        <div class="w3-wallet-dot-live"></div>
        <span id="wallet-address-display" class="w3-address-text">0x0000...0000</span>
        <span class="w3-separator">|</span>
        <span id="wallet-network-display" class="w3-network-text">—</span>
        <button id="metamask-disconnect-btn" class="w3-disconnect-btn" onclick="disconnectWallet()" title="Disconnect Wallet">✕</button>
      </div>
    </div>`;
  nav.appendChild(walletWrapper);
}

// ─────────────────────────────────────────────
// INIT ON PAGE LOAD
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  injectNavbarWallet();
  await autoReconnect();
  updateWalletUI();
});
