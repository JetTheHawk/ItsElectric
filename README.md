# ItsElectric ─ a tiny mobile‑friendly Snake remix

Concept / Game Loop
* **Premise** You are an adventurous eel cruising the shallows.  
  *Eat* orange fish and crabs to grow your tail.  
  *Avoid* fishing hooks:  
  * A hook that snags your **head** reels the whole eel out ➜ *game‑over*  
  * A hook that hits your **body** slices the tail; the cut pieces are dragged up while you swim on  
* Tap or swipe **anywhere** to steer.  
  *If you tap more than 100 ° behind the current heading the eel does a tight
  180 ° “assist arc” so you never stall.*  
* Wall‑hits (“Bonked wall!”) and self–tangles (“Tangled!”) also end the run.  
* A persistent **high‑score** is stored in `localStorage`.

Run Locally
```bash
git clone <your-fork-url> eel-hooks
cd eel-hooks
npm install            # installs Phaser & Vite
npm run dev            # Vite dev‑server  →  open http://localhost:5173
```
Bugs
* very rarely eel will vibrate
