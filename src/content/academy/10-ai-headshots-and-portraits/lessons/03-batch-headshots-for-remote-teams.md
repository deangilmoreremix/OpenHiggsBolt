# Batch Headshots for Remote Teams

> **Time:** about 14 minutes. **You will finish with:** a team roster CSV and a folder of auto-cropped, square selfies ready for batch rendering.

---

## Before you start

A company with **50 remote employees** in 6 countries sends 150+ raw selfies. Cropping, prompting, rendering and sorting each by hand takes **over 12 hours**. The fix is a batch pipeline: CSV roster plus selfie folder, then automated identity extraction, then batch rendering with one shared background, then auto-zipped folders. In this first part you prepare the inputs: a roster and face-aligned 1:1 crops.

You will need [`templates/b2b-headshot-proposal.md`](templates/b2b-headshot-proposal.md), a `selfies/` folder, and Python with a face-detection library (OpenCV or MediaPipe) if you script the crop. Use SmartVideo GO AI **Storyboard / Campaign Planner** for the batch matrix and **Image Studio** for rendering. Menus move; follow the current screen. Use only selfies people have consented to share.

## Step by step

### 1. Open the template

Open [`templates/b2b-headshot-proposal.md`](templates/b2b-headshot-proposal.md) and find the batch CSV schema and folder naming standards.

**You should see:** the roster columns and naming rules.

**If not:** use the CSV in the next step as written.

### 2. Create the roster CSV

Create `team_roster.csv`:

```csv
EmployeeID,FullName,Title,DressCode,SelfieFile
EMP001,John Doe,VP of Engineering,Executive Suit,selfies/john_doe.jpg
EMP002,Sarah Jenkins,Lead Designer,Creative Blazer,selfies/sarah_j.jpg
EMP003,Alex Rivera,Senior Developer,Tech Sweater,selfies/alex_r.jpg
```

**You should see:** one row per employee with a real file path in `SelfieFile`.

**If not:** if a path does not exist in `selfies/`, fix the file name or the row before going on.

### 3. Auto-crop with face detection

Run a Python pre-processing script (OpenCV / MediaPipe) that finds the face bounding box in each file in `selfies/` and crops to **1:1** with a **35% margin above the head**. If you do not code, ask an AI assistant to write it, and never paste secrets or client data into the chat.

**You should see:** a new folder of square crops, one per row, each centered on a face.

**If not:** if a crop is empty or off-face, the selfie probably has no clear face. Flag that employee for a retake.

### 4. Spot-check the crops

Open 5 crops at random.

**You should see:** the head with room above it, consistent framing across people.

**If not:** change the margin value and re-run on the whole folder so all crops stay consistent.

## Check yourself

* [ ] `team_roster.csv` has all five columns.
* [ ] Every `SelfieFile` path exists.
* [ ] Crops are 1:1 with a 35% margin above the head.
* [ ] I flagged any employee whose face was not detected.

## Common mistakes

* **Tuning crops per person.** The point is a uniform margin across the team.
* **Mismatched paths.** One wrong path stops a whole batch later.
* **Skipping consent.** Process only selfies people agreed to submit.

Next: Batch Headshots for Remote Teams, part 2.
