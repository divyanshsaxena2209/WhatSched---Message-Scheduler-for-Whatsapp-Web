/*
© 2025 WhatSched
This software is proprietary and shared for beta testing only.
Redistribution, copying, or modification is prohibited.
*/


// popup.js

const contactInput = document.getElementById("contact");
const messageInput = document.getElementById("message");
const datetimeInput = document.getElementById("datetime");
const scheduleBtn = document.getElementById("scheduleBtn");
const refreshBtn = document.getElementById("refreshBtn");
const listDiv = document.getElementById("list");

// ---------- ERROR HANDLER (UPDATED) ----------
function showError(reason) {
  const messages = {
    "WA_NOT_READY": "WhatsApp UI not ready",
    "CONTACT_NOT_FOUND": "Contact not found",
    "ARCHIVED_NOT_SUPPORTED": "inaccesible chat, make sure chat is unarchived before scheduling a msg.",
    "SEND_FAILED": "WhatsApp blocked send"
  };

  const msg = messages[reason] || "An unknown error occurred.";
  alert(msg);
}

// ---------- SCHEDULE BUTTON ----------
scheduleBtn.addEventListener("click", () => {
  const contact = contactInput.value.trim();
  const message = messageInput.value.trim();
  const datetime = datetimeInput.value;

  if (!contact || !message || !datetime) {
    alert("Please fill all fields.");
    return;
  }

  const payload = {
    id: Date.now().toString(),
    contact,
    message,
    time: new Date(datetime).toISOString()
  };

  chrome.runtime.sendMessage(
    { action: "schedule_message", payload },
    (resp) => {
      if (resp?.success) {
        contactInput.value = "";
        messageInput.value = "";
        datetimeInput.value = "";
        loadScheduled();
        alert("Message scheduled successfully.");
      } else {
        showError(resp?.reason || resp?.code); // Handle both formats
      }
    }
  );
});

// ---------- REFRESH ----------
refreshBtn.addEventListener("click", loadScheduled);

// ---------- LOAD SCHEDULED LIST ----------
function loadScheduled() {
  chrome.runtime.sendMessage({ action: "get_scheduled" }, (resp) => {
    listDiv.innerHTML = "";

    if (!resp?.list || resp.list.length === 0) {
      listDiv.innerHTML = "<p style='color:#777;font-size:13px'>No scheduled messages</p>";
      return;
    }

    resp.list.forEach((item) => {
      const el = document.createElement("div");
      el.className = "scheduled-item";
      el.innerHTML = `
        <strong>${item.contact}</strong><br/>
        <small>${new Date(item.time).toLocaleString()}</small><br/>
        ${item.message}
        <button class="delete-btn" data-id="${item.id}">X</button>
      `;
      listDiv.appendChild(el);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        chrome.runtime.sendMessage(
          { action: "delete_scheduled", payload: { id } },
          () => loadScheduled()
        );
      });
    });
  });
}

// ---------- AUTOCOMPLETE ----------
function loadContactSuggestions() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url.includes("web.whatsapp.com")) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: "get_contacts" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.contacts) {
        const datalist = document.getElementById("contact-list");
        datalist.innerHTML = "";
        response.contacts.forEach(name => {
          const option = document.createElement("option");
          option.value = name;
          datalist.appendChild(option);
        });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadScheduled();
  loadContactSuggestions();
});