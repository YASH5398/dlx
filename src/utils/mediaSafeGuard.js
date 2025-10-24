// Global media playback safeguards to prevent AbortError from play()/pause() races
// and ensure play() happens after a user interaction.
// Track if the user has interacted with the page (click/tap)
let userInteracted = false;
const setInteracted = () => { userInteracted = true; };
if (typeof document !== 'undefined') {
    document.addEventListener('click', setInteracted, { capture: true, once: false });
    document.addEventListener('touchstart', setInteracted, { capture: true, once: false });
}
// WeakMap to store last play timestamp per media element
const lastPlayTime = new WeakMap();
function patchMediaPlayback() {
    if (typeof window.HTMLMediaElement === 'undefined')
        return;
    const proto = window.HTMLMediaElement.prototype;
    const origPlay = proto.play;
    const origPause = proto.pause;
    // Patch play() to:
    // - Gate autoplay until there is a user interaction
    // - Catch AbortError safely
    // - Record play time to avoid immediate pause
    proto.play = function () {
        const el = this;
        lastPlayTime.set(el, performance.now());
        // If no user gesture yet, don't attempt to autoplay (browsers likely block it)
        if (!userInteracted) {
            // Silently skip play to avoid NotAllowedError and AbortError
            return Promise.resolve();
        }
        // Attempt to play and catch AbortError
        try {
            const p = origPlay.apply(el);
            if (p && typeof p.catch === 'function') {
                return p.catch((err) => {
                    // Ignore AbortError, log others
                    if (!err || err.name !== 'AbortError') {
                        console.error(err);
                    }
                });
            }
            return p;
        }
        catch (err) {
            if (!err || err.name !== 'AbortError') {
                console.error(err);
            }
            return Promise.resolve();
        }
    };
    // Patch pause() to avoid immediately pausing right after play()
    proto.pause = function () {
        const el = this;
        const last = lastPlayTime.get(el) || 0;
        const diffMs = performance.now() - last;
        if (diffMs < 200) {
            // Delay pause slightly to avoid interrupting a just-started play()
            const delay = Math.max(0, 200 - diffMs);
            setTimeout(() => {
                try {
                    origPause.apply(el);
                }
                catch { }
            }, delay);
            return;
        }
        try {
            origPause.apply(el);
        }
        catch { }
    };
}
try {
    patchMediaPlayback();
}
catch { }
export {};
