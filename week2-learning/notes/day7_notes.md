# Day 7: Anti-Blocking Basics (Stealth & Detection)

## Objective
To understand how websites detect automated traffic and implement "stealth" techniques to make scrapers look like organic human users.

## Key Learnings

* **User-Agent Rotation:** Learned that the "User-Agent" is the browser's ID card. By rotating through a list of modern strings (Chrome, Firefox, Safari), I can prevent a site from flagging a single device version.
* **Human-Like Jitter (Random Delays):** Implemented randomized sleep intervals (`Math.random()`). This breaks the robotic pattern of constant-speed requests, which is the #1 way firewalls identify bots.
* **Headless vs. Headful:** Explored how running in `headless: false` can bypass basic bot-detection scripts that look for browser features (like window dimensions or GPU signatures) usually missing in headless mode.
* **IP Reputation:** Understand that even with perfect code, a "blacklisted" IP address will be blocked. This is where VPN/Proxy rotation becomes necessary.

## Written Deliverable: Anti-Blocking Theory

**What does anti-blocking mean to me?** To me, anti-blocking is the art of "Digital Camouflage." It is the process of hiding the robotic nature of a script. It means ensuring that every request my scraper sends looks like it was initiated by a real person sitting at a desk. 

**What to try first when facing blocks?** I start with the "Soft" approach: slowing down the speed and randomizing the delays. If that fails, I rotate the User-Agent. 

**What if basic techniques fail?** I move to the "Hard" approach: rotating IP addresses (VPNs) and using "Stealth" libraries that mask the low-level JavaScript variables that leak the use of Playwright/Puppeteer.

