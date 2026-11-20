# Stillpoint

Stillpoint is a browser-based counselling notes demo for practising with fictional clients. It opens with five examples. Create a note using DAP (Data, Assessment, Plan), SOAP (Subjective, Objective, Assessment, Plan), or freeform text. You can edit, search, star, move notes to Trash, and restore them.

## Run locally

From the repository root, start the static server on the loopback interface:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory demo
```

On Windows, you can use `py` in place of `python`. Open [the demo on localhost](http://127.0.0.1:8000/). The app needs no packages, credentials, or database.

## What happens to a note

Save keeps your note in memory in the current tab. Refreshing or closing the page discards your changes. A fresh page starts with the original fictional examples. **Clear workspace** also clears Trash and leaves an empty workspace. Select **Load fictional examples** to start practising again.

Use fictional content throughout. The app has no note backend, analytics, external fonts, AI calls, or persistent browser storage. All assets are bundled, and its content security policy blocks network connections initiated by scripts and form submissions. Browser extensions, operating-system features, and anyone who can see the screen are outside the app’s control. This demo is for practice with synthetic data and has not been assessed for clinical recordkeeping.

## Verify the demo

Run the privacy regression checks with `python -m unittest discover -s tests`. To check the workflow, create a fictional note, edit it, search for a phrase in its body, and move it to Trash and back. Refresh the page and confirm the original five examples return.
