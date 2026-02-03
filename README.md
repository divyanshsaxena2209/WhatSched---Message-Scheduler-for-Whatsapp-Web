# 📩 **WhatSched**
🔗 **Chrome Extension**
A privacy focused Chrome extension that enables precise scheduling of WhatsApp Web messages directly from the chat interface, designed to feel native, reliable, and fully client side.

---

🚀 **Overview**
WhatSched solves a simple but widely felt problem: WhatsApp does not support scheduled messaging. This project integrates scheduling directly into WhatsApp Web, delivering messages at exact times while keeping all data local and under user control, without relying on any external servers.

---

✨ **Key Features**

⏰ **Message Scheduling**

* Schedule messages to any contact at an exact date and time
* Second level precision for accurate delivery
* Supports multiple scheduled messages in batches

🧠 **Smart Automation**

* Detects WhatsApp Web state automatically
* Brings WhatsApp into focus only when required
* Restores the user workspace after delivery
* Handles background, minimized, and inactive tabs gracefully

🖥 **Native WhatsApp UI Integration**

* Scheduler button injected directly into the chat footer
* Clean modal interface aligned with WhatsApp design
* Keyboard shortcuts for fast scheduling
* Dashboard for upcoming messages and history

🔐 **Privacy First Architecture**

* All data stored locally using Chrome storage
* No external servers or third party APIs
* Messages sent only through the user’s active WhatsApp Web session

📊 **History and Reliability**

* Timestamp based delivery logs
* Sent and failed message tracking
* Graceful handling of archived chats and UI readiness issues
* Drift aware execution for timing accuracy

---

🧑‍💻 **Tech Stack**

* Chrome Extension Manifest V3
* JavaScript
* HTML and CSS
* Chrome APIs

  * storage
  * alarms
  * tabs
  * scripting
* WhatsApp Web DOM integration

---

🖼 **UI and UX Highlights**

* Clean and distraction free design
* Light and dark mode support
* Smooth animations and transitions
* Clear visual feedback and toasts
* Designed to feel like a native WhatsApp feature

---

📁 **Project Structure (High Level)**

* background.js handles scheduling logic, alarms, and tab management
* content.js manages UI injection, automation, and message delivery
* popup.html, popup.css, popup.js provide quick access and management
* manifest.json defines permissions and configuration
* icons folder contains extension assets

---

🧪 **Reliability and Edge Case Handling**

* Accurate scheduling even when WhatsApp is inactive
* Prevents messages from being sent to the wrong chat
* Safeguards against user interference
* Ensures chats are accessible before delivery

---

🔮 **Future Roadmap**

* Expanded automation controls
* Advanced scheduling rules
* Enhanced delivery analytics
* Thoughtful feature expansion without compromising privacy

---

🧠 **Learning Outcomes**

* Deep understanding of Chrome extension internals
* Advanced DOM automation and state handling
* Client side reliability engineering
* Iterative UI and UX refinement
* Debugging complex real world edge cases

---

📌 **Status**

* ✅ Actively developed
* 🚀 Stable and functional
* 🔒 Fully client side and privacy focused

