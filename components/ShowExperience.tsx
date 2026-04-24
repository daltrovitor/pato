"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { RotateCcw, Volume2, VolumeX, Loader2 } from "lucide-react";

const DuckScene = dynamic(() => import("@/components/DuckScene"), {
  ssr: false,
});

type ShowPhase =
  | "loading"
  | "warning"
  | "drumroll"
  | "black-silence"
  | "strobe-voce"
  | "strobe-ganhou"
  | "strobe-pato"
  | "strobe-lafa"
  | "duck-reveal"
  | "made-by"
  | "finished"
  | "expired";

// --- AUDIO GENERATORS ---
function playPuff(audioCtx: AudioContext) {
  const noise = audioCtx.createBufferSource();
  const bufferSize = audioCtx.sampleRate * 0.8;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer;

  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500;
  filter.Q.value = 0.5;

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start();
}



function playChoir(audioCtx: AudioContext) {
  const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (C Major 7)
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 1.5);
  masterGain.gain.setValueAtTime(0.035, audioCtx.currentTime + 10);
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 20);
  masterGain.connect(audioCtx.destination);

  frequencies.forEach(freq => {
    // Two oscillators per note for chorusing effect
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.005; // slight detune

    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 4; // vibrato speed
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 5; // vibrato depth
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);

    osc1.start();
    osc2.start();
    lfo.start();

    osc1.stop(audioCtx.currentTime + 20);
    osc2.stop(audioCtx.currentTime + 20);
    lfo.stop(audioCtx.currentTime + 20);
  });
}






export default function ShowExperience({ expiresAt }: { expiresAt: string }) {
  const [phase, setPhase] = useState<ShowPhase>("loading");
  const [lightingMode, setLightingMode] = useState<"intro" | "pointing" | "off">("off");
  const [showStarted, setShowStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showLafaText, setShowLafaText] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopDrumRef = useRef<(() => void) | null>(null);

  // Remaining time display
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        setPhase("expired");
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleDuckLoaded = useCallback(() => {
    if (phase === "loading") {
      setPhase("warning");
    }
  }, [phase]);

  const startShow = useCallback(() => {
    setShowStarted(true);

    if (!muted) {
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
      } catch (e) {
        console.error("AudioContext setup failed");
      }
    }

    setPhase("drumroll");
    setLightingMode("intro");
    setShowLafaText(false);

    const drumAudio = new Audio("/drum.mp3");
    const vcGanhouAudio = new Audio("/vcganhooou.mp3");
    vcGanhouAudio.volume = 0.85;

    if (muted) {
      drumAudio.muted = true;
      vcGanhouAudio.muted = true;
    }

    let isCancelled = false;
    const timeouts: (ReturnType<typeof setTimeout>)[] = [];

    stopDrumRef.current = () => {
      isCancelled = true;
      drumAudio.pause();
      vcGanhouAudio.pause();
      timeouts.forEach(clearTimeout);
    };

    drumAudio.onended = () => {
      if (isCancelled) return;
      
      // Tela preta rápida só para garantir o state
      setLightingMode("off");
      
      // Milissegundo zero: áudio + sopro + VOCÊ — tudo junto, sem delay (exatamente na hora)
      vcGanhouAudio.play().catch(e => console.error("Error playing vcganhooou.mp3:", e));
      if (audioCtxRef.current && !muted) playPuff(audioCtxRef.current);
      setPhase("strobe-voce");

      // Ajustando o delay: "tempo de antes, ... delay maior"
      // Colocando 2000ms entre as palavras para ser BEM mais devagar.
      // 2000ms: GANHOU + sopro
      timeouts.push(setTimeout(() => {
        if (isCancelled) return;
        if (audioCtxRef.current && !muted) playPuff(audioCtxRef.current);
        setPhase("strobe-ganhou");
      }, 2000));

      // 4000ms: UM PATO + sopro
      timeouts.push(setTimeout(() => {
        if (isCancelled) return;
        if (audioCtxRef.current && !muted) playPuff(audioCtxRef.current);
        setPhase("strobe-pato");
      }, 4000));

      // 6000ms: DO LAFA + sopro — fica cravado na tela!
      timeouts.push(setTimeout(() => {
        if (isCancelled) return;
        if (audioCtxRef.current && !muted) playPuff(audioCtxRef.current);
        setPhase("strobe-lafa");
        setShowLafaText(true);
      }, 6000));

      // 9000ms: mostra o grande PATO (o audio coral já vai estar tocando)
      timeouts.push(setTimeout(() => {
        if (isCancelled) return;
        
        // Foco de luz revela o Pato subindo
        setPhase("duck-reveal");
        setLightingMode("pointing");
        setShowLafaText(false);
      }, 9000));

      timeouts.push(setTimeout(() => {
        if (!isCancelled) setPhase("made-by");
      }, 11000));

      timeouts.push(setTimeout(() => {
        if (!isCancelled) setPhase("finished");
      }, 15000));
    };

    // Assim que o som curto de "Você ganhou" acabar, começa o coral "ÓÓÓ" sem dar atropelo.
    vcGanhouAudio.onended = () => {
      if (!isCancelled && audioCtxRef.current && !muted) {
        playChoir(audioCtxRef.current);
      }
    };

    drumAudio.play().catch(e => {
      console.error("Error playing drum.mp3:", e);
      // Fallback in case of autoplay issues
      if (!isCancelled) {
        const t3 = setTimeout(() => {
           drumAudio.onended?.(new Event('ended'));
        }, 4000);
        timeouts.push(t3);
      }
    });

  }, [muted]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stopDrumRef.current) stopDrumRef.current();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const resetShow = useCallback(() => {
    if (new Date(expiresAt) < new Date()) {
      setPhase("expired");
      return;
    }
    if (stopDrumRef.current) stopDrumRef.current();
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setPhase("warning");
    setShowStarted(false);
    setShowLafaText(false);
  }, [expiresAt]);



  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black select-none" style={{ backgroundColor: "black" }}>

      {/* SINGLE DUCK SCENE: Preloaded and persistent to avoid context crashes */}
      {/* Hidden during strobe phases (solid black bg covers it), revealed at duck-reveal */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: (phase === "drumroll" || phase === "duck-reveal" || phase === "made-by" || phase === "finished") ? 1 : 0 
        }}
        transition={{ duration: phase === "duck-reveal" ? 0.3 : 1 }}
      >
        <DuckScene 
          onLoaded={handleDuckLoaded} 
          showDuck={(phase === "duck-reveal" || phase === "made-by" || phase === "finished")}
          isRevealing={phase === "duck-reveal"}
          lightingMode={lightingMode}
        />
      </motion.div>

      <AnimatePresence mode="wait">

        {/* LOADING SCREEN */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
            <p className="text-xs uppercase font-bold tracking-widest text-muted">Carregando Modelo 3D...</p>
          </motion.div>
        )}

        {/* WARNING SCREEN */}
        {phase === "warning" && (
          <motion.div
            key="warning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-lg"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-none bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🔊
                </motion.span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 uppercase tracking-widest">
                Ative o Som
              </h2>

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3 font-mono">
                Para ter a melhor experiência, certifique-se de que o <strong className="text-white">som está ativado</strong> antes de iniciar o show.
              </p>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 mb-4">
                <span className="text-xl">🎧</span>
                <p className="text-gray-400 text-xs sm:text-sm leading-snug font-mono text-left">
                  Use <strong className="text-white">fones de ouvido</strong> ou esteja em um <strong className="text-white">lugar silencioso</strong> para a melhor experiência.
                </p>
              </div>

              <div className="text-gray-400 text-sm md:text-base uppercase font-bold tracking-widest mb-8 border-2 border-red-500/50 p-4 bg-red-500/10">
                <span className="block mb-1 text-red-500">VALIDADE: 1 HORA</span>
                <span className="block text-white">RESTANDO: {timeLeft}</span>
              </div>

              <button
                onClick={() => setMuted(!muted)}
                className="mb-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-none bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-400 hover:text-white border border-white/10"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {muted ? "Som Desativado" : "Som Ativado"}
              </button>

              <motion.button
                id="start-show-btn"
                onClick={startShow}
                className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest text-lg rounded-none
                  hover:bg-accent-hover transition-colors shadow-[8px_8px_0_rgba(251,191,36,0.3)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px]"
              >
                COMEÇAR SHOW
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* TELA PRETA — silêncio dramático de 600ms após tambores */}
        {phase === "black-silence" && (
          <motion.div
            key="black-silence"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="absolute inset-0 bg-black z-10"
          />
        )}

        {/* STROBE: VOCÊ — milissegundo zero, junto com o áudio e o sopro */}
        {phase === "strobe-voce" && (
          <motion.div
            key="strobe-voce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="absolute inset-0 z-10 bg-black"
          >
            <StrobeText text="VOCÊ" />
          </motion.div>
        )}

        {/* STROBE: GANHOU — 1500ms com sopro */}
        {phase === "strobe-ganhou" && (
          <motion.div
            key="strobe-ganhou"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="absolute inset-0 z-10 bg-black"
          >
            <StrobeText text="GANHOU" />
          </motion.div>
        )}

        {/* STROBE: UM PATO — 3000ms com sopro */}
        {phase === "strobe-pato" && (
          <motion.div
            key="strobe-pato"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            className="absolute inset-0 z-10 bg-black"
          >
            <StrobeText text="UM PATO" />
          </motion.div>
        )}

        {/* DUCK REVEAL BACKGROUND AND UI */}
        {(phase === "duck-reveal" || phase === "made-by" || phase === "finished") && (
          <motion.div
            key="duck-scene-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {/* The actual DuckScene is rendered globally and animated up to avoid context loss. */}

            {/* MADE BY LOGO OVERLAY */}
            {phase === "made-by" && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <motion.div
                  className="flex flex-col items-center gap-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }}
                  transition={{ 
                    duration: 2.5,
                    times: [0, 0.1, 0.85, 1],
                    ease: "easeInOut"
                  }}
                >
                  <h2 className="text-white text-2xl sm:text-3xl font-black uppercase tracking-[0.8em] text-center">
                    FEITO POR
                  </h2>
                  <img
                    src="/viraweb3.png"
                    alt="Logo"
                    className="w-[80vw] md:w-[40vw] max-w-2xl h-auto object-contain"
                  />
                </motion.div>
              </motion.div>
            )}



            {/* Bottom bar */}
            {(phase === "finished") && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <div className="max-w-lg mx-auto text-center">
                  <motion.h3
                    className="text-white text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-2"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    PARABÉNS!
                  </motion.h3>

                  <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-8">
                    PELO PATO
                  </p>

                  <motion.button
                    id="repeat-show-btn"
                    onClick={resetShow}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-none text-sm border-2 border-white
                      hover:bg-transparent hover:text-white transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    REPETIR SHOW
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* EXPIRED SCREEN */}
        {phase === "expired" && (
          <motion.div
            key="expired"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md border-2 border-red-500/30 p-8 bg-red-500/5 relative overflow-hidden"
            >
              {/* Decorative background stripes */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 2px, transparent 0, transparent 50%)', backgroundSize: '15px 15px' }}>
              </div>

              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 flex items-center justify-center border-2 border-red-500">
                <span className="text-4xl">⌛</span>
              </div>

              <h2 className="text-3xl font-black text-red-500 mb-2 uppercase tracking-tighter">
                ACESSO EXPIRADO
              </h2>

              <div className="h-px w-full bg-red-500/30 mb-6" />

              <p className="text-gray-300 text-sm leading-relaxed mb-8 font-mono">
                Sua sessão de visualização chegou ao fim. Por motivos de segurança, esta senha não é mais válida.
              </p>

              <div className="space-y-4 relative z-10">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  O QUE FAZER AGORA?
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="block w-full py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                >
                  VOLTAR AO INÍCIO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DO LAFA — fica cravado na tela enquanto o áudio continua */}
      <AnimatePresence>
        {showLafaText && (
          <motion.div
            key="lafa-persistent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-10 bg-black flex items-center justify-center pointer-events-none"
          >
            <motion.h1
              className="relative z-10 text-7xl sm:text-9xl md:text-[10rem] font-black tracking-tighter uppercase text-center leading-none text-white"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              DO LAFA
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Strobe Text Component ---
function StrobeText({ text }: { text: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <motion.h1
        className="relative z-10 text-7xl sm:text-9xl md:text-[10rem] font-black tracking-tighter uppercase text-center leading-none text-white"
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {text}
      </motion.h1>
    </div>
  );
}
