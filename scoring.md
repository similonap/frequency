The short version
You hear a tone, then recreate it from memory using a frequency slider. Your score measures how close you got — but not in raw Hz. We convert both frequencies to the ERB-rate scale, a model from psychoacoustic research that matches how the human ear actually resolves pitch. This means the same perceived accuracy produces the same score whether you're matching a deep bass tone or a high treble. Five rounds, 0-10 per round, max 50.

The Scoring Pipeline
Convert to perceptual space. Both the target and your guess are converted from Hz to ERB-rate — a scale based on how the cochlea physically resolves frequencies. Low tones are compressed (the ear is less precise there), high tones are expanded.
Measure perceptual distance. The absolute distance between target and guess on the ERB-rate scale, normalized to the game's frequency range (80-1,200 Hz on Easy, 60-1,400 Hz on Hard). A distance of 0 means a perfect match.
Score via dual Gaussian. Two Gaussian curves compete — a sharp one (peak 10) that rewards near-perfect matches, and a gentle one (peak 3) that gives partial credit for being in the right neighborhood. Your score is whichever curve gives you more.
The Curve
The sharp Gaussian drops fast — you need to be very close to score above 7. The gentle curve prevents zeroes when you're in the ballpark. They cross over around a score of 3.

Score (0-10) vs perceptual distance (ERB-rate). White dot tracks your guess in the demo below.
Why ERB-Rate?
1
The ear has variable resolution. The cochlea's frequency filters (auditory channels) are wider at low frequencies and narrower at high frequencies. A 10 Hz difference at 100 Hz is less perceptible than a 10 Hz difference at 1,000 Hz. The ERB scale encodes this directly.
2
Equal perceived difficulty = equal score. A score of 8.0 means the same thing whether the target was 100 Hz or 900 Hz. You were "that close" relative to what the human ear can actually distinguish at that frequency.
3
Backed by decades of research. The ERB (Equivalent Rectangular Bandwidth) model was developed by Brian Moore and Brian Glasberg (1983, 1990) and is the standard in auditory science for modeling frequency resolution. It's used in hearing aid design, audio codec engineering, and speech recognition.
ERB-rate(f) = 21.4 * log10(1 + 0.00437 * f)

// perceptual distance dist = |ERB(target) - ERB(guess)| / (ERB(f_max) - ERB(f_min))

// dual gaussian scoring sharp = 10 * e-dist2 * 3250 gentle = 3 * e-dist2 * 130 score = max(sharp, gentle) // clamped 0-10
Why we changed the scoring
The original scoring system (v1, launched March 29, 2026) used logarithmic frequency space for distance — treating equal frequency ratios as equally accurate everywhere. That sounds right because pitch perception is roughly logarithmic. But it's not the whole story.

People noticed. The comment sections on TikTok were full of players who felt cheated by low-frequency rounds — they'd hear a deep bass tone, match it as closely as they could, and still get a 3 or 4. The frustration was consistent and specific: low tones felt unfairly punished.

They were right.

The problem: frequency discrimination isn't uniform
Human pitch discrimination follows a power law (Wier, Jesteadt & Green 1977; Moore 1974). The just-noticeable difference (JND) in Hz scales as f0.8, not f1.0. This means the Weber fraction (proportional JND) gets worse at lower frequencies. In plain terms: your ear is less precise in the bass.

In a game context, this compounds further. Lab JNDs are measured with simultaneous comparison — you hear two tones back to back. In Sound, you're comparing to a remembered tone after a delay. Memory noise adds 3-10x on top of the raw JND. So the effective precision gap between low and high frequencies is even larger than the lab data suggests.

Weber fraction (JND / frequency) across the game's range. Lower = more precise. The ear is measurably worse at discriminating low frequencies.
What the old scoring got wrong
The old system required the same proportional accuracy for a given score at every frequency. But since the ear is less precise at low frequencies, the same proportional error was much harder to achieve there.

Target	Hz tolerance for 9.0+	JNDs from target	Verdict
100 Hz	1.6 Hz	~0.5 JND	Sub-perceptual
300 Hz	4.8 Hz	~1.5 JNDs	Barely audible
1,000 Hz	16.2 Hz	~3-4 JNDs	Clearly audible
The 100 Hz problem
To score a 9.0 at 100 Hz in the old system, you needed to be within 1.6 Hz of the target. That's less than one JND — you literally could not perceive the remaining error, but the game still penalized you for it. At 1,000 Hz, the same 9.0 score left 3-4 JNDs of room, which is comfortably audible. The game was roughly 4x harder at 100 Hz than at 1,000 Hz for the same score.

The fix: ERB-rate distance
Two changes. First, we switched the distance metric from log-frequency space to ERB-rate space. The ERB (Equivalent Rectangular Bandwidth) scale models the auditory system's frequency resolution — how wide each "channel" in the cochlea actually is. At low frequencies, auditory filters are wider, meaning the same Hz difference is less discriminable. ERB-rate captures this directly.

Second, we tightened the Gaussian constants from 3000/120 to 3250/130 so the game stays exactly as hard overall. The ERB metric alone would have made scores slightly higher on average — we didn't want that. The result is the same difficulty, redistributed fairly across the frequency range.

Log-frequency (old) vs ERB-rate (new). ERB-rate compresses low frequencies more, matching how the ear actually resolves them. The pivot point (~300 Hz) is unchanged.
Before & After
We switched the distance metric from log-frequency to ERB-rate, and tightened the Gaussian constants from 3000/120 to 3250/130 so the game stays exactly as hard overall. The difficulty just gets distributed fairly.

Being 5 Hz off
Target	Old score	New score	Change
100 Hz	3.78	7.29	+3.51
200 Hz	7.79	8.30	+0.51
300 Hz	8.94	8.85	-0.09
500 Hz	9.60	9.37	-0.23
800 Hz	9.84	9.68	-0.16
1,000 Hz	9.90	9.77	-0.13
Hz tolerance for a 7.0+ score
Target	Old tolerance	New tolerance	Improvement
100 Hz	2.9 Hz	5.2 Hz	+79%
200 Hz	5.9 Hz	6.8 Hz	+15%
300 Hz	8.9 Hz	8.5 Hz	-4%
500 Hz	14.9 Hz	13.5 Hz	-9%
1,000 Hz	29.9 Hz	27.2 Hz	-9%
Overall impact (simulated)
We simulated 50,000 games using realistic player noise to verify the change doesn't inflate or deflate scores overall.

Old (log)	New (ERB)	Change
Overall avg	6.63	6.64	+0.01
Low-freq avg (<200 Hz)	6.64	7.73	+1.09
High-freq avg (>600 Hz)	6.57	5.60	-0.97
Same difficulty, fair distribution
The overall average is unchanged. But the variance across the frequency range is dramatically reduced. Low-frequency rounds go from frustratingly hard to appropriately challenging. High-frequency rounds get stricter — which is psychoacoustically correct, since the ear can discriminate better there. The game is still hard. It's just honest about where the difficulty comes from.

Average score by target frequency. The old system (dashed) produced equal difficulty everywhere — but the ear isn't equally precise everywhere. The new system (solid) adjusts for perceptual reality.
The psychoacoustics
For anyone who wants the full picture. This section covers the auditory science that motivated the change.

Critical bands and the cochlea
The inner ear (cochlea) acts as a bank of overlapping bandpass filters. Each "auditory filter" responds to a narrow band of frequencies. The bandwidth of these filters — the critical bandwidth — is not constant. It's roughly 25% of the center frequency above 500 Hz, but wider relative to center frequency below that. This is a physical property of how the basilar membrane vibrates.

The Equivalent Rectangular Bandwidth (ERB) is the width of a rectangular filter that passes the same total energy as the actual auditory filter. Moore and Glasberg (1983, updated 1990) derived the standard formula from masking experiments:

ERB(f) = 24.7 * (4.37 * f/1000 + 1) Hz

// at 100 Hz: ERB = 29.2 Hz (wide filter) // at 500 Hz: ERB = 78.6 Hz // at 1000 Hz: ERB = 132.4 Hz

// quality factor Q = f/ERB ≈ 9.26 (roughly constant)
The ERB-rate scale converts Hz to "number of ERBs from 0 Hz" — essentially counting how many auditory filter widths you've traversed. This provides a perceptually uniform frequency axis.

Why logarithmic wasn't enough
Musical pitch is logarithmic — an octave (2:1 ratio) sounds like the same "step" at any frequency. This is why the original scoring used log-frequency. But pitch discrimination doesn't follow the log scale perfectly.

The frequency difference limen (DLF) — the smallest detectable change — follows a power law with exponent ~0.8, not 1.0 (Moore 1974; Wier, Jesteadt & Green 1977). This means:

DLF ≈ k * f0.8 (absolute JND in Hz)
Weber = DLF / f ≈ k * f-0.2 (proportional JND)
The 0.2 exponent difference from pure logarithmic seems small, but it compounds across the frequency range. At 100 Hz, the Weber fraction is about 60% worse than at 1,000 Hz. In a game where you're comparing to a remembered tone (not a simultaneous reference), this difference is amplified by memory noise.

Three frequency scales across the game range (Easy mode, 80-1,200 Hz). Linear Hz is wildly non-uniform. Log-frequency (old) is better but still penalizes low frequencies. ERB-rate (new) matches auditory resolution.
The memory factor
All the JND data above comes from simultaneous comparison studies — you hear two tones back to back and report which is higher. In Sound, you hear a tone, wait through a countdown, then try to recreate it from memory. This is categorically harder.

Pitch memory studies (Bachem 1954; Deutsch 1972; Ross et al. 2004) show that memory for absolute pitch degrades over time and interference. The effective JND for remembered tones is typically 3-10x larger than the simultaneous discrimination JND. And critically, this degradation is worse at low frequencies, where the initial JND is already larger.

This means the old scoring system was asking players to achieve sub-perceptual accuracy on low-frequency tones they were recalling from memory — a double penalty.

The phone speaker problem
Most smartphone speakers have a frequency response that rolls off steeply below 150-200 Hz. Even with headphones, cheap earbuds often have weak bass reproduction. This means many players literally cannot hear low-frequency target tones clearly, yet the old system scored them with the same precision requirements as clearly audible mid-range tones.

The ERB-rate adjustment doesn't solve the speaker problem entirely, but it does ensure that when a player is "close" at 100 Hz, they get credit for it — even if "close" means a wider margin in raw Hz.

