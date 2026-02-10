# 3-Minute Demo Video Plan — Gemini 3 Hackathon

**Tool:** Camtasia (screen recording)  
**Target:** ~3 minutes  
**Audience:** Hackathon judges / viewers

---

## Timing Overview

| Segment | Duration | Cumulative |
|--------|----------|------------|
| 1. Hook + intro | 0:00–0:20 | 0:20 |
| 2. What it does (problem + solution) | 0:20–0:45 | 0:45 |
| 3. Core demo: load data + Gemini transform | 0:45–2:00 | 2:00 |
| 4. Power feature: image → flow/table | 2:00–2:35 | 2:35 |
| 5. Wrap + call to action | 2:35–3:00 | 3:00 |

---

## Segment 1: Hook + Intro (0:00–0:20)

- **Screen:** App open with a clean state (or demo mode on so labels guide the story).
- **Script idea:**  
  *“Data wrangling without writing SQL — using Gemini 3 to go from raw CSVs to a transformation pipeline in one place.”*
- **Do:** Show the layout in one sentence: “Left: your pipeline. Right: data and Gemini.”
- **Tip:** Turn on **Demo mode** in Settings first so “Step 1 / Step 2 / Stage flow / Table view” labels support the narrative.

---

## Segment 2: What It Does (0:20–0:45)

- **Message:**  
  - **Problem:** People have CSVs and want joins, filters, aggregations without coding.  
  - **Solution:** This app uses **Gemini 3** to understand your data and your words (or a screenshot of a flow), and builds a visual pipeline; you see results in the table view immediately.
- **Screen:** Optional: one static slide or the app with “Step 1” and “Step 2” visible.
- **Keep it short:** One sentence for problem, one for solution, then go straight into the demo.

---

## Segment 3: Core Demo — Load Data + Gemini Transform (0:45–2:00)

**Goal:** Show “upload → ask in words → see pipeline + table” in about 75 seconds.

1. **Upload (0:45–1:00)**  
   - Drag & drop 2 CSVs (e.g. `customers.csv`, `orders.csv`) or use **Use sample data** in Settings and refresh.  
   - Say: *“Each file becomes a table. Now I ask Gemini to transform them.”*

2. **Ask Gemini (1:00–1:25)**  
   - Open the **Chat** tab in the Gemini input area.  
   - Type one short request, e.g.:  
     *“Join customers and orders on customer_id and show customer name, order id, and amount.”*  
   - Hit send.  
   - While it runs: *“Gemini generates the pipeline and runs it with DuckDB in the browser.”*

3. **Show result (1:25–2:00)**  
   - Point to the **stage flow** (left): “Here’s the pipeline it created — LOAD, then JOIN.”  
   - Click **Table** on the JOIN stage (or the table tab) and show the result table.  
   - Say: *“Results show here. I can edit the stage or add more steps.”*

**Camtasia:**  
- Zoom or highlight the upload area, then the chat input, then the new stage and table tab so the flow is easy to follow.

---

## Segment 4: Power Feature — Image to Flow/Table (2:00–2:35)

**Goal:** Show that Gemini 3 can also read a **screenshot** (flow or table) and update the app.

1. **Setup (2:00–2:05)**  
   - Say: *“You can also give Gemini a screenshot.”*  
   - Open the **Upload** tab (image) in the Gemini area.

2. **Flow or table image (2:05–2:25)**  
   - **Option A — Flow image:**  
     Upload an image of a flow diagram (e.g. “Orders → Filter → Aggregate”).  
     - If the dialog appears: choose “Replace” or “Add.”  
     - Say: *“Gemini reads the flow and creates the stages here.”*  
   - **Option B — Table image:**  
     Upload a screenshot of a table.  
     - Say: *“Gemini finds how it connects to existing tables and suggests JOINs or new stages.”*  
   - Keep to one of the two so you stay within 30 seconds.

3. **Result (2:25–2:35)**  
   - Briefly show the new stages in the flow and one result table.  
   - One line: *“So you can start from CSVs, from text, or from a screenshot — all powered by Gemini 3.”*

---

## Segment 5: Wrap + Call to Action (2:35–3:00)

- **Screen:** Back to a full view of the app (flow + table view) or a short title slide.
- **Script idea:**  
  *“Data wrangling with Gemini 3: upload CSVs, describe what you want in text or with a screenshot, and get a visual pipeline and results in the browser. Thanks for watching.”*
- Optional: Show **Settings** briefly and mention “API key, sample data, demo mode” in one phrase if you have 5 seconds left.

---

## Pre-Recording Checklist

- [ ] **Browser:** Clean profile or dedicated window; close extra tabs, turn off notifications.
- [ ] **App state:**  
  - Either start with **Use sample data** ON and refresh so you have tables + flow ready,  
  - Or start empty and do one upload + one chat in the demo.
- [ ] **Demo mode:** Turn ON in Settings so “Step 1 / Step 2 / Stage flow / Table view” show (optional but helpful).
- [ ] **API key:** Set in Settings or rely on server default so Gemini works during the recording.
- [ ] **Resolution:** Record at 1080p; set browser zoom to 100%.
- [ ] **Camtasia:**  
  - Record system audio if you’ll talk; otherwise plan for music or captions.  
  - Use cursor highlight or zoom for “upload,” “chat,” “Table” button, and “Upload (image)” tab.

---

## Optional Short Script (for voice-over)

1. *“This is a data wrangling app powered by Gemini 3.”*  
2. *“You upload CSVs; each file becomes a table.”*  
3. *“You tell Gemini what you want in plain language — for example, join these two tables on customer ID.”*  
4. *“Gemini builds the pipeline and runs it in the browser; you see the result here.”*  
5. *“You can also upload a screenshot of a flow or a table — Gemini reads it and adds the right stages.”*  
6. *“All in the browser, with no SQL required. Thanks for watching.”*

---

## If You Run Over 3 Minutes

- **Cut:** Long waiting for Gemini (trim to 2–3 seconds of “thinking” then jump to result).  
- **Shorten:** Segment 2 (problem/solution) to 15–20 seconds.  
- **Drop:** The image-upload option you don’t use (only show flow image **or** table image, not both).

Good luck with the hackathon.
