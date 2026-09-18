# Emergency Siren Sound

Place a file named `emergency-siren.mp3` in this directory.

Requirements:
- Format: MP3 (widely supported)
- Duration: Loopable (the audio plays on loop while emergency page is open)
- Volume: Moderate — users can control device volume
- Source: Use a royalty-free siren sound from sites like:
  - https://freesound.org (search "siren" or "emergency alert")
  - https://pixabay.com/sound-effects/

The EmergencyRequest.jsx page handles a missing file gracefully:
- If the file is absent or fails to load, the siren silently does not play
- The user still sees the emergency UI and gets the "Tap to activate" prompt
- The STOP SIREN button only appears when audio is active

IMPORTANT: Do NOT use copyrighted audio without a license.
