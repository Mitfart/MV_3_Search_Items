# Flooded Basement Playable

A playable ad challenge where the player helps a frightened girl escape a flooding basement by finding keys before the water reaches the top.

## Language

**Challenge**:
The core playable task: find every hidden **Key** before the basement floods. This project uses a five-key challenge with a forgiving 45–50 second fail timer that starts on the first key tap. For now, the playable is portrait-only with no orientation change support.
_Avoid_: seven-key challenge, 7-key challenge; proportionally shortening the timer because there are five keys; treating Challenge Start as the cause of gameplay changes; adding landscape/orientation-switch behavior

**Key**:
A hidden collectible object the player taps to remove one matching **Lock** from the **Door**. There are exactly five keys in the challenge, and they may be collected in any order. Key taps use an enlarged dynamic hitbox based on the key sprite bounds with configurable padding.
_Avoid_: item, object, collectible when specifically referring to escape keys; forced key sequence; requiring pixel-perfect key taps

**Hinted Key**:
The key visually emphasized to teach the player what to tap. One initial hinted key is configured, defaults to `Key_1`, and may intensify over idle time while other keys remain valid targets. If the player takes about 10 seconds to find another key, a random uncollected key is selected and re-hinted until any key is collected; collecting any key clears the hint target and resets the idle hint timer. A hint starts as key bounce plus glow/outline, then adds a hand cursor if ignored for another 10 seconds.
_Avoid_: rotating the initial hint target; making only the hinted key tappable; constant hints with no idle delay

**Lock**:
A door obstacle removed by collecting its matching **Key**. There are exactly five gameplay locks in the challenge; `Key_1` opens `Lock_1`, `Key_2` opens `Lock_2`, and so on, regardless of collection order.
_Avoid_: padlock count of seven; next-lock progress mapping

**Chain**:
A door restraint connected to a **Lock**. Each lock may have one or more connected chains, and opening that lock removes all chains connected to it.
_Avoid_: treating every chain as a separate key objective; assuming chains are only decorative

**Door**:
The basement exit blocked by locks and chains during the challenge. After all five locks are removed, the closed/current door is hidden so the open door drawn in the background becomes the win call-to-action.
_Avoid_: gate, exit hatch; keeping the closed door visible in the win state

**Flood**:
The rising water threat that visualizes time pressure. Before the first key tap, water only bobs or animates locally without meaningful vertical rise; after the first key tap, flood height tracks challenge timer progress and reaches maximum at timer expiry. Losing is decided by the challenge timer rather than exact water height, and no numeric timer is shown to the player.
_Avoid_: treating water height as the fail source of truth; tying flood behavior to the Challenge Start analytics event instead of the first key tap; countdown timer UI

**Soundscape**:
The playable should use the available project sounds wherever they fit the moment: music, water, key pickup, lock/unlock, chains, door, girl reactions, win/fail, and right/wrong feedback. `startAudioOnLoad` controls start timing: when true, audio starts from load; when false, all audio starts and unmutes after the first pointer click. Key success sound plays on the first key tap because that tap also starts the challenge; wrong-tap sound may play from the first click/start when audio is available. Music and water ambience continue through win/fail end states, with win/fail sounds layered on top. Audio-unlock interaction is separate from **Challenge Start**.
_Avoid_: leaving suitable existing sounds unused without reason; confusing audio-unlock interaction with Challenge Start; suppressing first-key success sound

**Girl State**:
A visual danger/readability state for the trapped girl, coordinated with the **Flood** state. Before the first key tap, the girl uses the first visual state; after the first key tap, girl and water states escalate by challenge timer progress through low, medium, and high danger stages at even thirds of the challenge timer. State changes are animated so the danger escalation reads clearly.
_Avoid_: treating all girl variants as interchangeable decoration; changing girl danger by key progress; tying girl behavior to the Challenge Start analytics event instead of the first key tap; instant unreadable state swaps

**Challenge Start**:
An analytics event fired when the player first taps a **Key**. It does not itself change gameplay behavior; the first key tap is also the gameplay action that starts the fail timer.
_Avoid_: treating any first screen tap as Challenge Start; using the analytics event itself to change flood, timer, hints, audio, input, or girl behavior

**Key Counter**:
The gameplay progress display showing how many of the five keys have been collected, such as `0/5` or `3/5`.
_Avoid_: five separate required key inventory slots

**Wrong Tap**:
A player tap that does not hit an interactive key hitbox during gameplay. It shows a small red X or wrong marker at the tap position, fades quickly, and may play a wrong sound if assigned; wrong feedback stops after the last key is collected or after fail triggers.
_Avoid_: showing wrong feedback for correct key-hitbox taps; showing wrong feedback after terminal win/fail condition

**Progress Milestone**:
An analytics milestone based on collected **Keys**, not elapsed time or flood height. In the five-key challenge, 25% fires after the second key, 50% after the third key, and 75% after the fourth key. `CHALLENGE_SOLVED` fires on the final key tap, `CHALLENGE_FAILED` fires at timer expiry, `ENDCARD_SHOWN` fires when the win or fail CTA text becomes visible, and `CTA_CLICKED` fires any time download is called. `CHALLENGE_RETRY` may exist in the event adapter but has no production gameplay trigger for now.
_Avoid_: timer milestone, water-height milestone; delaying solved analytics until win text appears; delaying failed analytics until fail text appears; firing endcard analytics before endcard text is visible; tying CTA_CLICKED to only one screen or timing

**Win Endcard**:
The open-door win state shown after gameplay stops because all five keys have been found. After the final lock and chains finish falling, the door may shake/play an open sound if available, the closed/current door fades or hides to reveal the open door drawn in the background, then “Open the door!” appears. Once the door is opened/revealed and the text is visible, any click redirects to download; the hand/A guidance points at the door position after a delay.
_Avoid_: success screen; continuing gameplay behind the endcard; requiring clicks only on the door, text, or a separate install button after win; redirecting before the win text is visible

**Fail Endcard**:
The fail state shown immediately after gameplay stops because the challenge timer expires before the player finds all five keys. It shows “Break down the door!” and, once that text is visible, any click redirects to download; the hand/A guidance points at the door action after a delay. No extra fail animation is needed because the flood is already max and the girl is already in the high danger state.
_Avoid_: lose screen; continuing gameplay behind the endcard; water-height-driven fail condition; requiring clicks only on a separate install button after fail; redirecting before the fail text is visible

## Example dialogue

Developer: “Should we implement seven keys because the old brief says seven?”
Domain expert: “No. This playable is a five-key challenge. The current key and lock assets define the gameplay count.”

Developer: “There are extra chain sprites on the door. Are those extra objectives?”
Domain expert: “No. Chains belong to locks. A lock can have multiple connected chains, and all connected chains are removed when that lock opens.”

Developer: “Should the timer be shortened because this is five keys instead of seven?”
Domain expert: “No. Keep the fail timer in the 45–50 second range; the five-key version is intentionally forgiving.”

Developer: “Does Challenge Start change flood speed, timer, hints, audio, input, or girl behavior?”
Domain expert: “No. Challenge Start is only an analytics event fired on the first key tap. The same first key tap also starts the fail timer, but the analytics event is not the cause.”

Developer: “Should CHALLENGE_PASS_25 fire when 25% of the flood timer has elapsed?”
Domain expert: “No. Progress milestones are based on collected keys: second key, third key, and fourth key.”

Developer: “If the player taps the background first, does Challenge Start fire?”
Domain expert: “No. Challenge Start fires only on the first key tap, and this analytics distinction does not change gameplay.”

Developer: “If the player sees an unhinted key, should tapping it work?”
Domain expert: “Yes. Keys can be collected in any order; the bounce hint only attracts attention.”

Developer: “If Key_3 is collected first, which lock disappears?”
Domain expert: “Lock_3. Key collection is any-order, but each key has a fixed matching lock.”
