// content.js - VERSION 93.1 (Fixed: Seconds Column Added + Shortcuts)

// 🔹 TASK 1: PRECISE TIMESTAMP LOGGING
function logWithTime(msg) {
    const now = new Date();
    // Format: YYYY-MM-DD HH:MM:SS.mmm
    const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0') + '.' +
        String(now.getMilliseconds()).padStart(3, '0');
    
    console.log(`[WhatSched | ${dateStr}] ${msg}`);
}

logWithTime("VERSION 93.1 INJECTED - SECONDS ENABLED + SHORTCUTS");

// --- CLEANUP ---
const oldBtn = document.getElementById('ws-scheduler-btn');
if (oldBtn) oldBtn.remove();
const oldBlocker = document.getElementById('ws-ghost-lock');
if (oldBlocker) oldBlocker.remove();
const oldConfirm = document.getElementById('ws-confirm-overlay');
if (oldConfirm) oldConfirm.remove();
// Also cleanup existing modal if re-injecting
const oldModal = document.getElementById('ws-modal-overlay');
if (oldModal) oldModal.remove();

// --- STATE VARIABLES ---
let batchOriginalChat = null; 

// --- STYLES ---
const STYLES = `
  /* --- CSS VARIABLES --- */
  :root {
      /* === LIGHT MODE DEFAULTS === */
      --ws-bg: #ffffff;
      --ws-text: #111b21;
      --ws-subtext: #54656f;
      --ws-hover: #f0f2f5;
      --ws-border: #e9edef;
      --ws-input-bg: #ffffff;
      
      /* Light Mode Green */
      --ws-accent: #1B9A58;
      --ws-sand: #1B9A58; 
      --ws-toast-bg: #1B9A58;
      
      --ws-accent-fg: #ffffff;
      --ws-shadow: rgba(0,0,0,0.1);
      
      /* LIGHT MODE OVERLAY: WHITE BG, BLACK TEXT */
      --ws-overlay: rgba(255, 255, 255, 0.95);
      --ws-lock-text: #0A0A0A;
      
      /* LIGHT MODE GLASS: DARK GREY (To be visible on white) */
      --ws-glass-stroke: #54656f;

      /* Light Mode Icons */
      --ws-icon-default: #0A0A0A; 
      --ws-icon-hover: #FDFDFD;   
  }

  @media (prefers-color-scheme: dark) {
      :root {
          /* === DARK MODE OVERRIDES === */
          --ws-bg: #222e35;
          --ws-text: #e9edef;
          --ws-subtext: #8696a0;
          --ws-hover: #111b21;
          --ws-border: #374043;
          --ws-input-bg: #2a3942;
          
          /* Night Mode Green */
          --ws-accent: #37C572; 
          --ws-sand: #37C572;
          --ws-toast-bg: #37C572;
          
          --ws-accent-fg: #111b21;
          --ws-shadow: rgba(0,0,0,0.35);
          
          /* NIGHT MODE OVERLAY: BLACK BG, WHITE TEXT */
          --ws-overlay: rgba(11, 20, 26, 0.95);
          --ws-lock-text: #e9edef;
          
          /* NIGHT MODE GLASS: WHITE (To be visible on black) */
          --ws-glass-stroke: #ffffff;
          
          /* Night Mode Icons */
          --ws-icon-default: #FAFAFA;
          --ws-icon-hover: #0A0A0A;
      }
  }

  /* --- SCHEDULER BUTTON --- */
  #ws-scheduler-btn { 
      height: 40px; width: 40px; min-height: 40px; min-width: 40px;
      flex-shrink: 0; margin: 0 8px; cursor: pointer; border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; 
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1), background 0.15s; 
      z-index: 100; position: relative; 
  }
  
  #ws-scheduler-btn svg { width: 24px; height: 24px; display: block; fill: var(--ws-icon-default); transition: fill 0.15s ease; }
  
  #ws-scheduler-btn:hover { background-color: var(--ws-accent); box-shadow: 0 2px 8px var(--ws-shadow); transform: scale(1.1); }
  #ws-scheduler-btn:hover svg { fill: var(--ws-icon-hover) !important; }

  #ws-scheduler-btn::after {
      content: attr(data-tooltip); position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
      padding: 4px 8px; border-radius: 6px; font-family: -apple-system, sans-serif; font-size: 12px; 
      font-weight: 500; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;
      background-color: #111b21; color: #fff;
  }
  @media (prefers-color-scheme: dark) { #ws-scheduler-btn::after { background-color: #e9edef; color: #111b21; } }
  #ws-scheduler-btn:hover::after { opacity: 1; }

  /* --- GHOST LOCK OVERLAY --- */
  #ws-ghost-lock {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: var(--ws-overlay); backdrop-filter: blur(8px);
      z-index: 2147483647; display: flex; flex-direction: column; 
      justify-content: center; align-items: center; cursor: wait;
      font-family: -apple-system, sans-serif; color: var(--ws-lock-text); 
      font-weight: 600; font-size: 18px; user-select: none;
  }

  /* --- ANIMATION CONTAINER --- */
  .ws-hg-container {
      width: 100px; height: 100px; 
      margin-bottom: 24px;
  }

  /* --- GROUP 1: ROTATOR (Glass & Sand Piles) --- */
  .ws-hg-rotator {
      transform-origin: 12px 12px;
      animation: ws-flip-glass 3s ease-in-out infinite;
  }

  /* Glass Outline */
  .ws-hg-glass-outline { 
      fill: none; 
      stroke: var(--ws-glass-stroke); 
      stroke-width: 2; 
      stroke-linecap: round; 
      stroke-linejoin: round;
  }
  
  .ws-hg-sand { fill: var(--ws-sand); stroke: none; }

  /* Top Sand */
  .ws-sand-top {
      transform-origin: 12px 12px; 
      animation: ws-drain-sand 3s linear infinite;
  }

  /* Bottom Sand */
  .ws-sand-bottom {
      transform-origin: 12px 22px; 
      animation: ws-fill-sand 3s linear infinite;
  }

  /* --- GROUP 2: GRAVITY (Stream) --- */
  .ws-sand-stream {
      stroke: var(--ws-sand);
      stroke-width: 1.5; 
      stroke-linecap: round;
      stroke-dasharray: 2 4; 
      animation: ws-stream-flow 0.3s linear infinite, ws-stream-fade 3s linear infinite; 
  }

  /* --- KEYFRAMES --- */
  @keyframes ws-flip-glass {
      0% { transform: rotate(0deg); }
      70% { transform: rotate(0deg); }  
      100% { transform: rotate(180deg); } 
  }

  @keyframes ws-drain-sand {
      0% { transform: scaleY(1); }
      65% { transform: scaleY(0); }
      100% { transform: scaleY(0); }
  }

  @keyframes ws-fill-sand {
      0% { transform: scaleY(0); }
      65% { transform: scaleY(1); }
      100% { transform: scaleY(1); }
  }

  @keyframes ws-stream-flow {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -6; } 
  }

  @keyframes ws-stream-fade {
      0% { opacity: 1; }
      65% { opacity: 0; } 
      100% { opacity: 0; }
  }

  /* --- MODAL STYLES --- */
  #ws-modal-overlay, #ws-confirm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
  #ws-confirm-overlay { z-index: 100001; }
  #ws-confirm-box { background: var(--ws-bg); width: 400px; max-width: 90%; padding: 24px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); font-family: -apple-system, sans-serif; display: flex; flex-direction: column; animation: ws-pop-in 0.2s ease-out; }
  #ws-confirm-title { font-size: 20px; color: var(--ws-text); margin: 0 0 12px 0; }
  #ws-confirm-text { font-size: 14px; color: var(--ws-subtext); margin-bottom: 24px; }
  #ws-confirm-actions { display: flex; justify-content: flex-end; gap: 12px; }
  
  #ws-modal { background: var(--ws-bg); width: 380px; padding: 0; border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.25); font-family: -apple-system, sans-serif; overflow: hidden; display: flex; flex-direction: column; max-height: 85vh; border: 1px solid var(--ws-border); }
  @keyframes ws-pop-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .ws-tabs { display: flex; background: var(--ws-hover); border-bottom: 1px solid var(--ws-border); }
  .ws-tab { flex: 1; padding: 14px; text-align: center; cursor: pointer; font-weight: 500; color: var(--ws-subtext); font-size: 14px; transition: background 0.2s; }
  .ws-tab:hover { background: rgba(0,0,0,0.02); }
  .ws-tab.active { background: var(--ws-bg); color: var(--ws-accent); border-bottom: 3px solid var(--ws-accent); font-weight: 600; }
  
  .ws-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; height: 100%; color: var(--ws-text); }
  .ws-hidden { display: none !important; }
  
  .ws-info-box { background-color: rgba(0, 168, 132, 0.08); border: 1px solid rgba(0, 168, 132, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px; }
  .ws-info-icon { min-width: 18px; height: 18px; fill: var(--ws-accent); margin-top: 1px; }
  .ws-info-text { font-size: 12px; color: var(--ws-text); line-height: 1.5; opacity: 0.9; }
  .ws-small-note { font-size: 11px; color: var(--ws-subtext); margin-top: 8px; margin-bottom: 12px; line-height: 1.4; border-left: 3px solid #ffbc3e; padding-left: 10px; background: transparent; }
  
  #ws-modal label { display: block; margin-top: 12px; margin-bottom: 4px; font-size: 12px; color: var(--ws-subtext); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .ws-input-group { display: flex; align-items: center; gap: 8px; }
  #ws-contact { flex-grow: 1; }
  #ws-refresh-name { padding: 9px; cursor: pointer; background: var(--ws-hover); border-radius: 8px; border: 1px solid var(--ws-border); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  #ws-refresh-name:hover { background: rgba(0,0,0,0.05); }
  #ws-refresh-name svg { fill: var(--ws-subtext); }
  #ws-modal input, #ws-modal textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--ws-border); border-radius: 8px; box-sizing: border-box; background: var(--ws-input-bg); color: var(--ws-text); font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.2s; }
  
  /* UPDATED: Allows dark mode support for calendar input */
  input[type="datetime-local"] { color-scheme: light; }
  @media (prefers-color-scheme: dark) { input[type="datetime-local"] { color-scheme: dark; } }

  #ws-modal input:focus, #ws-modal textarea:focus { border-color: var(--ws-accent); box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.2); }
  
  /* UPDATED: Modal actions layout to support hints */
  #ws-modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  .ws-actions-right { display: flex; gap: 12px; }
  .ws-shortcut-hint { font-size: 11px; color: var(--ws-subtext); opacity: 0.8; }

  .ws-btn { padding: 10px 20px; border: none; border-radius: 24px; cursor: pointer; font-weight: 600; font-size: 14px; transition: filter 0.2s; }
  .ws-btn:hover { filter: brightness(0.95); }
  .ws-cancel { background: transparent; color: var(--ws-accent); border: 1px solid var(--ws-border); }
  .ws-save { background: var(--ws-accent); color: var(--ws-accent-fg); }
  
  .ws-native-btn { padding: 10px 24px; font-size: 14px; font-weight: 500; border-radius: 24px; cursor: pointer; border: 1px solid transparent; transition: background 0.15s; }
  #ws-confirm-cancel { background: transparent; color: var(--ws-accent); border-color: var(--ws-border); }
  #ws-confirm-yes { background: var(--ws-accent); color: var(--ws-accent-fg); }

  .ws-list-header { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: var(--ws-text); display: flex; justify-content: space-between; align-items: center; text-transform: uppercase; letter-spacing: 0.5px; }
  .ws-clear-btn { font-size: 11px; color: #ef5350; cursor: pointer; text-decoration: none; border: 1px solid #ef5350; padding: 2px 8px; border-radius: 12px; opacity: 0.8; }
  .ws-clear-btn:hover { opacity: 1; background: rgba(239, 83, 80, 0.1); }
  .ws-empty { text-align: center; color: var(--ws-subtext); font-size: 13px; margin: 30px 0; font-style: italic; }
  
  .ws-item { border: 1px solid var(--ws-border); border-radius: 8px; padding: 12px; margin-bottom: 10px; background: var(--ws-input-bg); position: relative; transition: transform 0.1s; }
  .ws-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .ws-contact-name { font-weight: 600; color: var(--ws-text); font-size: 14px; }
  .ws-item-time { font-size: 11px; color: var(--ws-subtext); display: block; margin-bottom: 6px;}
  .ws-item-msg { font-size: 11px; color: var(--ws-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: var(--ws-hover); padding: 6px 8px; border-radius: 6px; border: 1px solid transparent; opacity: 0.9; }
  
  .ws-history-item { border-color: transparent; border-bottom-color: var(--ws-border); border-radius: 0; background: transparent; padding: 10px 4px; margin-bottom: 0; }
  .ws-history-item .ws-contact-name { font-size: 13px; font-weight: 500; }
  .ws-history-item .ws-item-msg { background: transparent; padding: 0; font-style: italic; opacity: 0.7; }
  
  .ws-del-btn { width: 24px; height: 24px; border-radius: 50%; background: var(--ws-hover); color: var(--ws-subtext); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; }
  .ws-del-btn:hover { background: #ef5350; color: white; }
  
  .ws-badge-sent { background: rgba(0, 200, 83, 0.1); color: #00c853; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-left: 8px; border: 1px solid rgba(0, 200, 83, 0.3); }
  .ws-badge-failed { background: rgba(229, 57, 53, 0.1); color: #e53935; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-left: 8px; border: 1px solid rgba(229, 57, 53, 0.3); }
  
  #ws-suggestions { border: 1px solid var(--ws-border); border-top: none; max-height: 120px; overflow-y: auto; display: none; background: var(--ws-input-bg); position: absolute; width: 100%; z-index: 100000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; margin-top: -5px; }
  .ws-suggestion-item { padding: 10px 12px; cursor: pointer; font-size: 13px; color: var(--ws-text); border-bottom: 1px solid var(--ws-border); }
  .ws-suggestion-item:last-child { border-bottom: none; }
  .ws-suggestion-item:hover { background: var(--ws-hover); }
  
  /* TOAST */
  .ws-toast { 
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); 
      background-color: #323232; color: white; 
      padding: 12px 24px; border-radius: 50px; 
      font-size: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.2); 
      z-index: 100002; opacity: 0; transition: opacity 0.3s ease, bottom 0.3s ease; 
      font-family: -apple-system, sans-serif; display: flex; align-items: center; 
      gap: 8px; pointer-events: none; 
  }
  .ws-toast.visible { opacity: 1; bottom: 60px; }
  .ws-toast.success { background-color: var(--ws-toast-bg); } 
  .ws-toast.error { background-color: #ef5350; }
`;
const styleEl = document.createElement('style'); styleEl.textContent = STYLES; document.head.appendChild(styleEl);

// --- HELPERS ---
function suppressInput(e) { if (e.isTrusted) { e.stopImmediatePropagation(); e.preventDefault(); return false; } }

function toggleGhostLock(active, message = "WhatSched is sending message, kindly wait.") {
    const existing = document.getElementById('ws-ghost-lock');
    if (existing && active) {
        const msgDiv = existing.querySelector('div:nth-child(2)');
        if(msgDiv) msgDiv.innerText = message;
        return;
    }
    if (existing) existing.remove();
    if (active) {
        const lock = document.createElement('div'); lock.id = 'ws-ghost-lock';
        
        // --- REAL PHYSICS HOURGLASS SVG (WITH INSET CLIPPING) ---
        lock.innerHTML = `
            <svg class="ws-hg-container" viewBox="0 0 24 24">
                <defs>
                    <clipPath id="ws-glass-inner">
                        <path d="M7.5,4.5 C7.5,4.5 7.5,8 11,10.5 L11,13.5 L13,13.5 L13,10.5 C16.5,8 16.5,4.5 16.5,4.5 Z" />
                        <path d="M7.5,19.5 C7.5,19.5 7.5,16 11,13.5 L13,13.5 C16.5,16 16.5,19.5 16.5,19.5 Z" />
                    </clipPath>
                </defs>

                <g class="ws-hg-rotator">
                    <path class="ws-hg-glass-outline" d="
                        M5,3 H19 
                        C19,3 19,9 14.5,11 
                        L14.5,13 
                        C19,15 19,21 19,21 H5 
                        C5,21 5,15 9.5,13 
                        L9.5,11 
                        C5,9 5,3 5,3 Z" />
                    
                    <g clip-path="url(#ws-glass-inner)">
                        <rect class="ws-hg-sand ws-sand-top" x="0" y="0" width="24" height="12" />
                        <rect class="ws-hg-sand ws-sand-bottom" x="0" y="12" width="24" height="12" />
                    </g>
                </g>

                <g class="ws-hg-gravity">
                    <line class="ws-sand-stream" x1="12" y1="11" x2="12" y2="20" />
                </g>
            </svg>
            <div>${message}</div>
            <div style="font-size:12px; margin-top:5px; font-weight:normal; opacity:0.8;">Input is locked. Please wait.</div>
        `;
        document.body.appendChild(lock);
        ['keydown','keypress','keyup','mousedown','mouseup','click'].forEach(ev => window.addEventListener(ev, suppressInput, true));
    } else {
        ['keydown','keypress','keyup','mousedown','mouseup','click'].forEach(ev => window.removeEventListener(ev, suppressInput, true));
    }
}

function showConfirmModal(text, onYes) {
    const existing = document.getElementById('ws-confirm-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div'); overlay.id = 'ws-confirm-overlay';
    overlay.innerHTML = `<div id="ws-confirm-box"><div id="ws-confirm-title">${text}</div><div id="ws-confirm-text">This action cannot be undone.</div><div id="ws-confirm-actions"><button id="ws-confirm-cancel" class="ws-native-btn">Cancel</button><button id="ws-confirm-yes" class="ws-native-btn">Delete for me</button></div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('ws-confirm-cancel').onclick = () => overlay.remove();
    document.getElementById('ws-confirm-yes').onclick = () => { overlay.remove(); onYes(); };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function forceTyping(element, text) {
  element.focus(); document.execCommand('selectAll', false, null); const success = document.execCommand('insertText', false, text);
  if (!success) element.innerHTML = text; 
  element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true })); 
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function simulateClick(element) { 
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => { 
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); 
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); 
    }, 50);
}

async function clearSearch(box) { 
    box.click(); box.focus(); 
    document.execCommand('selectAll', false, null); 
    document.execCommand('delete', false, null); 
    await sleep(300); 
}

async function openChat(contactName) {
  const currentTitle = getContactName() || "";
  if (currentTitle.toLowerCase().includes(contactName.toLowerCase()) || contactName.toLowerCase().includes(currentTitle.toLowerCase())) { return { success: true }; }
  
  const sidePanel = document.getElementById('side');
  if (!sidePanel) return { success: false, code: "WA_NOT_READY" };
  
  let searchBox = sidePanel.querySelector('div[contenteditable="true"]');
  if (!searchBox) return { success: false, code: "WA_NOT_READY" };
  
  await clearSearch(searchBox);
  forceTyping(searchBox, contactName);
  
  for(let i=0; i<10; i++) {
      await sleep(500);
      const candidates = Array.from(sidePanel.querySelectorAll('div[role="listitem"] span[title], div[role="gridcell"] span[title]'));
      const exactMatch = candidates.find(el => el.getAttribute('title').toLowerCase() === contactName.toLowerCase());
      const target = exactMatch || candidates[0]; 
      if (target) {
          let row = target.closest('div[role="listitem"]') || target.closest('div[role="gridcell"]') || target;
          simulateClick(row);
          await sleep(1000); 
          return { success: true };
      }
  }
  const newTitle = getContactName();
  if (newTitle && (newTitle.toLowerCase().includes(contactName.toLowerCase()) || contactName.toLowerCase().includes(newTitle.toLowerCase()))) { return { success: true }; }
  return { success: false, code: "CONTACT_NOT_FOUND" };
}

async function sendMessage(text, intendedName, retry = 0) {
  if (retry > 2) return { success: false, code: "USER_INTERFERENCE" };
  let currentTitle = getContactName();
  
  if (!currentTitle || currentTitle.toLowerCase() !== intendedName.toLowerCase()) {
      if (retry === 0) { console.warn(`[WhatSched] Wrong chat! Re-opening ${intendedName}...`); await openChat(intendedName); await sleep(500); } else { return { success: false, code: "WRONG_CHAT_OPEN" }; }
  }
  const mainFooter = document.querySelector('footer'); if (!mainFooter) return { success: false, code: "SEND_FAILED" };
  const input = mainFooter.querySelector('div[contenteditable="true"]'); if (!input) return { success: false, code: "SEND_FAILED" };
  input.focus(); forceTyping(input, text); await sleep(200); 
  const sendBtn = mainFooter.querySelector('button[aria-label="Send"]') || mainFooter.querySelector('span[data-icon="send"]');
  if (sendBtn) { sendBtn.click(); if(sendBtn.tagName==='SPAN') sendBtn.parentElement.click(); } else { const ev = { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }; input.dispatchEvent(new KeyboardEvent('keydown', ev)); }
  return { success: true };
}

// --- BATCH PROCESSOR ---
async function handleBatchTasks(messages) {
    if (!document.getElementById('ws-ghost-lock')) {
        batchOriginalChat = getContactName();
        toggleGhostLock(true, "Preparing to send messages...");
    }

    const results = [];
    let processedCount = 0;
    const total = messages.length;

    try {
        for (const msg of messages) {
            processedCount++;
            toggleGhostLock(true, `Sending message ${processedCount} of ${total} to ${msg.contact}...`);

            logWithTime(`Looking for contact: ${msg.contact}`);
            const openResult = await openChat(msg.contact);
            
            if (!openResult.success) {
                logWithTime(`Failed to open chat: ${openResult.code}`);
                results.push({ id: msg.id, success: false, error: openResult.code });
                continue;
            }

            logWithTime(`Sending to: ${msg.contact}`);
            const sendResult = await sendMessage(msg.message, msg.contact);
            results.push({ id: msg.id, success: sendResult.success, error: sendResult.success ? null : sendResult.code });
            
            chrome.runtime.sendMessage({ action: "ping" }); 
            await sleep(1000);
        }

        console.log(`[WhatSched] Batch Complete. Restoring to ${batchOriginalChat}...`);
        toggleGhostLock(true, "Restoring Your Chat...");
        
        if (batchOriginalChat) {
             const current = getContactName();
             if (current && current.toLowerCase() !== batchOriginalChat.toLowerCase()) {
                 await openChat(batchOriginalChat);
             }
        }
        
    } catch (e) {
        console.error("[WhatSched] Batch Error:", e);
    } finally {
        await sleep(500);
        toggleGhostLock(false);
        batchOriginalChat = null;
    }
    return results;
}

// --- UI HELPERS ---
function showToast(message, type = 'default') {
    const existing = document.querySelector('.ws-toast');
    if(existing) existing.remove();
    const toast = document.createElement('div'); toast.className = `ws-toast ${type}`; toast.innerText = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function injectButton() {
  if (document.getElementById('ws-scheduler-btn')) return;
  const footer = document.querySelector('footer');
  if (!footer) return; 
  let container = footer.querySelector('div[contenteditable="true"]')?.parentElement;
  if (!container) container = footer.firstElementChild; 
  if (container) {
      const btn = document.createElement('div'); btn.id = 'ws-scheduler-btn'; 
      btn.setAttribute('data-tooltip', 'Schedule message'); 
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,2 A10,10 0 1,0 22,12 A10,10 0 0,0 12,2 M12,20 C7.59,20 4,16.41 4,12 C4,7.59 7.59,4 12,4 C16.41,4 20,7.59 20,12 C20,16.41 16.41,20 12,20 M12.5,7 H11 V13 L16.25,16.15 L17,14.92 L12.5,12.25 V7 Z"></path></svg>`;
      btn.addEventListener('click', openModal);
      const sibling = container.nextElementSibling || container.lastElementChild;
      if (sibling) container.parentElement.insertBefore(btn, sibling); else container.appendChild(btn);
  }
}
setInterval(injectButton, 1500);

function getContactName() {
  const activeChat = document.querySelector('div[id="pane-side"] div[aria-selected="true"]');
  if (activeChat) { const titleSpan = activeChat.querySelector('span[title]'); if (titleSpan) return titleSpan.getAttribute('title'); }
  const header = document.querySelector('header'); if (!header) return "";
  const allSpans = Array.from(header.querySelectorAll('span[dir="auto"], span[title]'));
  let bestName = ""; let maxSize = 0;
  allSpans.forEach(span => {
      const fontSize = parseFloat(window.getComputedStyle(span).fontSize);
      const text = span.innerText.trim();
      if (!text) return;
      const lower = text.toLowerCase();
      if (lower.includes("online") || lower.includes("typing") || lower.includes("last seen") || lower.includes("click here")) return;
      if (fontSize > maxSize) { maxSize = fontSize; bestName = text; }
  });
  return bestName.replace(/\(You\)/i, "").trim();
}

function openModal() {
  try {
      if (document.getElementById('ws-modal-overlay')) return; // Prevent duplicate

      let currentChat = getContactName() || "";
      const modalHtml = `
        <div id="ws-modal-overlay"><div id="ws-modal">
            <div class="ws-tabs"><div class="ws-tab active" id="tab-schedule">Schedule</div><div class="ws-tab" id="tab-dashboard">Dashboard</div></div>
            <div id="view-schedule" class="ws-content">
                <div class="ws-info-box"><svg class="ws-info-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><div class="ws-info-text">For reliable delivery, ensure chat is <b>unarchived</b> and name matches exactly.</div></div>
                <label>Contact:</label><div class="ws-input-group"><input id="ws-contact" type="text" value="${currentChat}" placeholder="Name or Number" autocomplete="off"><div id="ws-refresh-name" title="Re-detect Name"><svg viewBox="0 0 24 24" width="16" height="16" fill="#666"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></div></div>
                <div class="ws-small-note"><b>⚠️ Important: Please keep the browser open to ensure message delivery.</b></div>
                <div id="ws-suggestions"></div>
                <label>Message:</label><textarea id="ws-message" rows="3" placeholder="Type message..."></textarea><label>Time:</label>
                <input id="ws-datetime" type="datetime-local" step="1">
                
                <div id="ws-modal-actions">
                    <span class="ws-shortcut-hint">Shortcut: Ctrl+Shift+S</span>
                    <div class="ws-actions-right">
                        <button class="ws-btn ws-cancel" id="ws-close">Close (Esc)</button>
                        <button class="ws-btn ws-save" id="ws-save">Schedule</button>
                    </div>
                </div>
            </div>
            <div id="view-dashboard" class="ws-content ws-hidden">
                <div class="ws-list-header">Upcoming</div><div id="ws-upcoming-list"></div>
                <div class="ws-list-header" style="margin-top:20px;">History <span class="ws-clear-btn" id="ws-clear-history">Clear</span></div><div id="ws-history-list"></div>
                <div style="margin-top:auto; padding-top:15px; text-align:right;"><button class="ws-btn ws-cancel" id="ws-close-dash">Close</button></div>
            </div>
        </div></div>`;
      
      const div = document.createElement('div'); div.innerHTML = modalHtml; document.body.appendChild(div);
      const dtInput = document.getElementById('ws-datetime');
      const now = new Date(); now.setSeconds(0, 0); 
      const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
      dtInput.value = localIso;

      // 🔹 ESCAPE KEY LOGIC
      const removeModal = () => {
          div.remove();
          document.removeEventListener('keydown', handleEsc);
      };

      const handleEsc = (e) => {
          if (e.key === 'Escape') removeModal();
      };
      document.addEventListener('keydown', handleEsc);

      const tabSch = document.getElementById('tab-schedule'); const tabDash = document.getElementById('tab-dashboard'); const viewSch = document.getElementById('view-schedule'); const viewDash = document.getElementById('view-dashboard');
      tabSch.onclick = () => { tabSch.classList.add('active'); tabDash.classList.remove('active'); viewSch.classList.remove('ws-hidden'); viewDash.classList.add('ws-hidden'); };
      tabDash.onclick = () => { tabDash.classList.add('active'); tabSch.classList.remove('active'); viewDash.classList.remove('ws-hidden'); viewSch.classList.add('ws-hidden'); loadDashboard(); };
      
      document.getElementById('ws-close').onclick = removeModal;
      document.getElementById('ws-close-dash').onclick = removeModal;
      
      document.getElementById('ws-refresh-name').onclick = () => { document.getElementById('ws-contact').value = getContactName(); };
      document.getElementById('ws-save').onclick = () => {
        const contact = document.getElementById('ws-contact').value; const message = document.getElementById('ws-message').value; const time = document.getElementById('ws-datetime').value;
        if(!contact || !message || !time) { showToast("Please fill all fields", "error"); return; }
        if (!chrome.runtime?.id) { showToast("Connection lost. Refresh page.", "error"); return; }
        const payload = { id: Date.now().toString(), contact, message, time: new Date(time).toISOString() };
        chrome.runtime.sendMessage({ action: "schedule_message", payload: payload }, (resp) => { 
            if(resp && resp.success) { showToast("Message Scheduled", "success"); removeModal(); } else { showToast("Scheduling failed.", "error"); } 
        });
      };
      document.getElementById('ws-clear-history').onclick = () => { showConfirmModal("Delete messages?", () => { chrome.runtime.sendMessage({ action: "clear_history" }, () => { showToast("History Cleared", "success"); loadDashboard(); }); }); };
      
      // 🔹 TASK 3: ENTER vs SHIFT+ENTER LOGIC (UX CRITICAL)
      const msgInput = document.getElementById('ws-message');
      
      msgInput.addEventListener('keydown', (e) => {
          // If Enter is pressed WITHOUT Shift
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Stop newline
              e.stopPropagation(); // Stop bubbling
              
              // Visual feedback or trigger
              const btn = document.getElementById('ws-save');
              if (btn) {
                  logWithTime("Enter detected. Triggering schedule.");
                  btn.click();
              }
          }
          // Shift+Enter will naturally create a newline (default behavior), no code needed.
      });

      document.getElementById('ws-contact').addEventListener('input', (e) => showSuggestions(e.target.value));
  } catch(e) { console.error("Error opening modal:", e); }
}

function loadDashboard() {
    chrome.runtime.sendMessage({ action: "get_data" }, (resp) => {
        const upList = document.getElementById('ws-upcoming-list'); const histList = document.getElementById('ws-history-list');
        if(!upList || !histList) return;
        upList.innerHTML = ''; histList.innerHTML = '';
        if (!resp.scheduled || resp.scheduled.length === 0) upList.innerHTML = '<div class="ws-empty">No upcoming messages</div>';
        else { resp.scheduled.forEach(item => { const date = new Date(item.time).toLocaleString(); const el = document.createElement('div'); el.className = 'ws-item'; el.innerHTML = `<div class="ws-item-top"><span class="ws-contact-name">${item.contact}</span><div class="ws-del-btn ws-del-schedule" data-id="${item.id}" title="Cancel">✕</div></div><div class="ws-item-time">Scheduled: ${date}</div><div class="ws-item-msg">${item.message}</div>`; upList.appendChild(el); }); }
        
        if (!resp.history || resp.history.length === 0) histList.innerHTML = '<div class="ws-empty">No history</div>';
        else { 
            resp.history.forEach(item => { 
                const date = new Date(item.sentAt).toLocaleString(); 
                const badge = item.status === 'Sent' ? '<span class="ws-badge-sent">Success</span>' : '<span class="ws-badge-failed">Fail</span>'; 
                const el = document.createElement('div'); el.className = 'ws-item ws-history-item'; 
                el.innerHTML = `<div class="ws-item-top"><span class="ws-contact-name">${item.contact}${badge}</span><div class="ws-del-btn ws-del-history" data-id="${item.id}" title="Delete">✕</div></div><div class="ws-item-time">Sent: ${date}</div><div class="ws-item-msg">${item.message}</div>`; 
                histList.appendChild(el); 
            }); 
        }
        
        document.querySelectorAll('.ws-del-schedule').forEach(btn => { btn.onclick = function() { const id = this.getAttribute('data-id'); chrome.runtime.sendMessage({ action: "delete_scheduled", payload: { id } }, () => { showToast("Message Cancelled", "default"); loadDashboard(); }); }; });
        document.querySelectorAll('.ws-del-history').forEach(btn => { btn.onclick = function() { const id = this.getAttribute('data-id'); chrome.runtime.sendMessage({ action: "delete_history_item", payload: { id } }, () => { showToast("Entry Deleted", "default"); loadDashboard(); }); }; });
    });
}

function showSuggestions(text) {
  const box = document.getElementById('ws-suggestions');
  if (text.length < 1) { box.style.display = 'none'; return; }
  const contacts = new Set();
  document.querySelectorAll('span[title]').forEach(s => { const name = s.getAttribute('title'); if(name && !name.includes(':') && name.length < 30) contacts.add(name); });
  const matches = Array.from(contacts).filter(c => c.toLowerCase().includes(text.toLowerCase()));
  box.innerHTML = '';
  if (matches.length > 0) { box.style.display = 'block'; matches.slice(0, 5).forEach(name => { const div = document.createElement('div'); div.className = 'ws-suggestion-item'; div.innerText = name; div.onclick = () => { document.getElementById('ws-contact').value = name; box.style.display = 'none'; }; box.appendChild(div); }); } else { box.style.display = 'none'; }
}

chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
  if (req.action === "open_modal") { openModal(); sendResp({success: true}); return true; }
  if (req.action === "process_batch") { handleBatchTasks(req.payload).then((results) => { sendResp({ results }); }); return true; }
  if (req.action === "send_scheduled_message") { handleAutomatedTask(req.payload).then(sendResp); return true; }
  if (req.action === "show_toast") { showToast(req.message, req.type); return true; }
  if (req.action === "ping") { sendResp({ status: "alive" }); return true; }
});