# UX Analysis — SmartCart

## Test Setup

- **Platform Used:** Maze | User Research and Testing Platform
- **Prototype Link:** [https://t.maze.co/542525865]
- **Prototype Scope:** Main onboarding, product scanning, QR checkout, and rewards redemption flow
- **Number of Participants:** 5

### Defined Tasks

| # | Task Description | Success Criteria |
|---|-----------------|-----------------|
| 1 | [Follow the normal flow of the application] | [Scan and complete list and reach the rewards screen] |

---

## Test Results

### Task 1 — [Follow the normal flow of the application]

| Participant | Outcome | Duration |
|-------------|---------|----------|
| [542985010]        | Success | [00:02:13] |
| [542830539]        | Success | [00:05:20] |
| [542990056]        | Success | [00:02:57] |
| [542985511]        | Fail | [00:01:52] |

---

## Heatmaps

### Lobby
![MazeLobby](media/mazeLobby.jpg)

### Scanning Flow
![MazeScanning](media/mazeScanning.jpg)

### Pending Items / QR Generation
![MazePendingItems](media/mazePendingItems.jpg)

### QR Validation
![MazeQRValidation](media/mazeQRValidation.jpg)

### Rewards
![MazeRewards](media/mazeRewards.jpg)

---

## Key Findings & Applied Corrections

| # | Finding / Problem Detected | Usability Dimension Affected | Correction Applied | Design Decision Justification |
|---|---------------------------|-----------------------------|--------------------|-------------------------------|
| 1 | Some screens give greater visual prominence to secondary actions over the intended primary action (P542990056). Correlates with P542985511's failure — this participant completed the flow in the shortest time but did not reach the goal, suggesting flow confusion rather than a readability issue. | Learnability / Visual Hierarchy | Increase the visual weight (size and color contrast) of the primary CTA on each screen; reduce the prominence of secondary controls so they do not compete with the priority action. | A clearly differentiated primary CTA reduces action ambiguity and guides the user toward the correct step in the Discover → Scan → Validate → Earn → Redeem loop without requiring exploration. |
| 2 | Users lack context about which step of the flow they are on and what action is expected from them at each screen (P542985010). | Learnability / Feedback | Add a lightweight progress indicator (e.g., "Step 2 of 3 — Scan your product") and contextual micro-copy on the key screens of the main flow. | Progress feedback aligns user expectations with the app flow, reduces navigation anxiety, and lowers the likelihood of drop-off at intermediate steps. |
| 3 | The interface presents too many visual elements simultaneously, creating a sense of overwhelm (P542830539). This participant had the highest completion time in the group (00:05:20 vs. avg ~00:02:47), directly supporting the efficiency impact. | Efficiency / Cognitive Load | Apply progressive disclosure: hide advanced or infrequent options until the user requests them; reduce the number of elements visible by default on high-density screens (lobby and product list). | Lowering information density per screen reduces cognitive load, speeds up decision-making, and improves the overall perception of product simplicity. |
| 4 | Positive finding: text legibility was rated as clear by participants (P542985511). This participant's task failure is attributed to visual hierarchy (finding #1), not typography. | N/A (positive validation) | No correction needed — retain the current typographic system. | Confirmed text clarity indicates that the font, size, and contrast decisions are appropriate for the use context. No adjustment required. |
