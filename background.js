// background.js - VERSION 92.0 (Force Minimize Fix + Shortcuts)
const STORAGE_KEY = "scheduled_messages";
const HISTORY_KEY = "message_history";
let isProcessing = false;

// 🔹 TASK 1: PRECISE LOGGING
function logWithTime(msg, scheduledTime = null) {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').slice(0, -1);
    let logString = `[WhatSched | ${dateStr}] ${msg}`;
    if (scheduledTime) {
        const diff = now.getTime() - new Date(scheduledTime).getTime();
        logString += ` (Drift: ${diff}ms)`;
    }
    console.log(logString);
}

// --- COMMANDS (SHORTCUTS) ---
chrome.commands.onCommand.addListener((command) => {
    if (command === "open_scheduler") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes("web.whatsapp.com")) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "open_modal" });
            }
        });
    }
});

// --- STORAGE HELPERS ---
async function getList(key) {
  return new Promise((resolve) => chrome.storage.local.get([key], (res) => resolve(res[key] || [])));
}
async function setList(key, list) {
  return new Promise((resolve) => chrome.storage.local.set({ [key]: list }, resolve));
}

// --- INITIALIZATION ---
chrome.runtime.onInstalled.addListener(() => { 
    chrome.alarms.create("Watchdog", { periodInMinutes: 1 });
    logWithTime("Installed. Watchdog running.");
});

chrome.runtime.onStartup.addListener(() => { 
    chrome.alarms.create("Watchdog", { periodInMinutes: 1 });
    isProcessing = false; 
});

chrome.alarms.onAlarm.addListener(() => processQueue());

// --- MAIN PROCESSOR ---
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
      const list = await getList(STORAGE_KEY);
      const nowStr = new Date().toISOString();
      const dueMessages = list.filter(m => m.time <= nowStr || (new Date(m.time).getTime() - Date.now() < 2000));

      if (dueMessages.length === 0) { 
          isProcessing = false; 
          return; 
      }

      dueMessages.sort((a, b) => a.time.localeCompare(b.time));
      logWithTime(`Batch processing ${dueMessages.length} messages.`);

      // 🔹 SMART TAB PREPARATION
      const tabData = await findAndPrepareTab();
      let batchResults = [];

      if (tabData && tabData.tabId) {
          logWithTime(`Target: Tab ${tabData.tabId} (Win ${tabData.windowId}). State: ${tabData.originalState}`);
          
          const response = await sendMessageToTab(tabData.tabId, { action: "process_batch", payload: dueMessages });
          
          if (response && response.results) {
              batchResults = response.results;
          } else {
              batchResults = dueMessages.map(m => ({ id: m.id, success: false, error: "Connection/Script Error" }));
          }

          // 🔹 FORCE MINIMIZE LOGIC (FIXED)
          if (tabData.windowId && tabData.originalState !== 'already-visible') {
              setTimeout(() => {
                  logWithTime(`Batch Complete. Force minimizing Window ${tabData.windowId}...`);
                  chrome.windows.update(tabData.windowId, { state: 'minimized' }, (win) => {
                      if (chrome.runtime.lastError) {
                          console.error("Minimize failed:", chrome.runtime.lastError);
                      } else {
                          logWithTime("Window minimized successfully.");
                      }
                  });
              }, 2000); // 2-second grace period
          } else {
              logWithTime("Window was already active/visible. Leaving open.");
          }

      } else {
           batchResults = dueMessages.map(m => ({ id: m.id, success: false, error: "WhatsApp Tab Not Found" }));
      }

      // Update Storage
      const history = await getList(HISTORY_KEY);
      let currentSchedule = await getList(STORAGE_KEY); 

      batchResults.forEach(res => {
          const original = dueMessages.find(m => m.id === res.id);
          if (original) {
              history.push({ ...original, status: res.success ? "Sent" : "Failed", error: res.error || null, sentAt: new Date().toISOString() });
              currentSchedule = currentSchedule.filter(m => m.id !== res.id);
          }
      });

      await setList(HISTORY_KEY, history);
      await setList(STORAGE_KEY, currentSchedule);

      // Recursion
      const freshCheck = currentSchedule.filter(m => m.time <= new Date().toISOString());
      if (freshCheck.length > 0) {
          isProcessing = false; 
          processQueue(); 
      }

  } catch (err) {
      console.error(err);
  } finally {
      isProcessing = false;
  }
}

// 🔹 SMART TAB FINDER
async function findAndPrepareTab() {
    return new Promise(resolve => {
        // 1. Get the currently focused window first
        chrome.windows.getLastFocused((focusedWindow) => {
            chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
                
                if (!tabs || tabs.length === 0) {
                    // Not found -> Open new -> Default to minimized behavior
                    chrome.windows.create({ url: "https://web.whatsapp.com", focused: true, state: 'normal' }, (win) => {
                        setTimeout(() => resolve({ tabId: win.tabs[0].id, windowId: win.id, originalState: 'created-new' }), 15000);
                    });
                    return;
                }

                const targetTab = tabs[0];
                const winId = targetTab.windowId;
                
                // 2. CHECK: Is the WhatsApp window the one currently focused?
                // We check if the browser actually has focus AND if the window IDs match.
                const isUserLooking = focusedWindow && (focusedWindow.id === winId) && focusedWindow.focused;

                if (isUserLooking) {
                    // CASE A: USER IS ACTIVE ON WHATSAPP WINDOW
                    logWithTime("User is looking at WhatsApp. Touching nothing.");
                    chrome.tabs.update(targetTab.id, { active: true }, () => {
                        resolve({ tabId: targetTab.id, windowId: winId, originalState: 'already-visible' });
                    });
                } else {
                    // CASE B: WHATSAPP IS IN BACKGROUND
                    logWithTime("WhatsApp in background. Popping up...");
                    
                    // Force 'normal' first (cannot focus a minimized window directly)
                    chrome.windows.update(winId, { state: 'normal' }, () => {
                        // Then Force Focus
                        chrome.windows.update(winId, { focused: true, drawAttention: true }, () => {
                            chrome.tabs.update(targetTab.id, { active: true }, () => {
                                
                                // Verify connection
                                chrome.tabs.sendMessage(targetTab.id, { action: "ping" }, (response) => {
                                    if (chrome.runtime.lastError) {
                                        chrome.scripting.executeScript({ target: { tabId: targetTab.id }, files: ["content.js"] }, () => {
                                            setTimeout(() => resolve({ tabId: targetTab.id, windowId: winId, originalState: 'background' }), 1000);
                                        });
                                    } else {
                                        resolve({ tabId: targetTab.id, windowId: winId, originalState: 'background' });
                                    }
                                });
                            });
                        });
                    });
                }
            });
        });
    });
}

function sendMessageToTab(tabId, message) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, message, (resp) => {
            if (chrome.runtime.lastError) resolve({ success: false, error: "Connection Lost" });
            else resolve(resp);
        });
    });
}

// --- MESSAGE LISTENERS ---
chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
  if (req.action === "schedule_message") {
    (async () => {
      const list = await getList(STORAGE_KEY);
      list.push(req.payload);
      await setList(STORAGE_KEY, list);
      
      const delay = new Date(req.payload.time).getTime() - Date.now();
      if (delay > 0 && delay < 120000) {
          chrome.alarms.create(`msg_exact_${req.payload.id}`, { when: new Date(req.payload.time).getTime() });
      } else {
          processQueue();
      }
      sendResp({ success: true });
    })();
    return true;
  }
  if (req.action === "get_data") {
    (async () => {
        const scheduled = await getList(STORAGE_KEY);
        const history = await getList(HISTORY_KEY);
        scheduled.sort((a, b) => a.time.localeCompare(b.time));
        history.sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""));
        sendResp({ scheduled, history });
    })();
    return true;
  }
  if (req.action === "delete_scheduled") {
    (async () => {
      let list = await getList(STORAGE_KEY);
      list = list.filter(m => m.id !== req.payload.id);
      await setList(STORAGE_KEY, list);
      sendResp({ success: true });
    })();
    return true;
  }
  if (req.action === "delete_history_item") {
    (async () => {
      let list = await getList(HISTORY_KEY);
      list = list.filter(m => m.id !== req.payload.id);
      await setList(HISTORY_KEY, list);
      sendResp({ success: true });
    })();
    return true;
  }
  if (req.action === "clear_history") {
    setList(HISTORY_KEY, []).then(() => sendResp({ success: true }));
    return true;
  }
  if (req.action === "ping") { sendResp({ status: "alive" }); return true; }
});