import { useState, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./index.module.css";

/* ──────────────────── Hero ──────────────────── */

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCenter}>
          <div className={styles.heroBrand}>
            <div className={styles.heroBrandGlow}>
              <img
                src={useBaseUrl("/img/mascot.png")}
                alt={siteConfig.title}
                className={styles.heroBrandLogo}
              />
            </div>
            <span className={styles.heroBrandName}>AirTruct</span>
          </div>
          <h1 className={styles.heroTitle}>
            The <span className={styles.heroFastest}><span className={styles.heroFastLines}><span className={styles.heroFastLine} /><span className={styles.heroFastLine} /><span className={styles.heroFastLine} /></span>fastest</span> way to connect{' '}
            <br className={styles.brDesktop} />
            <span className={styles.heroSkewBox}>your data</span> to <span className={styles.heroSkewBox}>AI</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Turn APIs, databases, and scripts into MCP tools - without writing MCP servers.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Before / After (Animated) ──────────────────── */

const painSteps = [
  { icon: '{}', text: 'Write custom server code' },
  { icon: '!', text: 'Handle errors & retries' },
  { icon: '⇄', text: 'Manage database connections' },
  { icon: '◈', text: 'Define tool schemas' },
  { icon: '⚙', text: 'Configure transport layer' },
  { icon: '▲', text: 'Deploy & maintain server' },
  { icon: '∞', text: 'Repeat for every new tool' },
];

function BeforeAfter() {
  const sectionRef = useRef(null);
  // idle → appearing → striking → done
  const [phase, setPhase] = useState('idle');
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [strikeStep, setStrikeStep] = useState(0);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setPhase('appearing');
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== 'appearing') return;
    if (visibleSteps < painSteps.length) {
      const timer = setTimeout(() => setVisibleSteps(v => v + 1), 350);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('striking'), 800);
    return () => clearTimeout(timer);
  }, [phase, visibleSteps]);

  useEffect(() => {
    if (phase !== 'striking') return;
    if (strikeStep < painSteps.length) {
      const timer = setTimeout(() => setStrikeStep(v => v + 1), 120);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('done'), 400);
    return () => clearTimeout(timer);
  }, [phase, strikeStep]);

  const isAfterVisible = phase === 'done';
  const isStriking = phase === 'striking' || phase === 'done';

  return (
    <section className={styles.beforeAfter} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What <span className={styles.strikeWord}>Problem</span> Disappears</h2>
        </div>
        <div className={`${styles.comparisonGrid} ${isAfterVisible ? styles.comparisonExpanded : ''}`}>
          <div className={`${styles.comparisonBefore} ${isAfterVisible ? styles.codeDimmed : ''}`}>
            <div className={styles.comparisonLabel}>Without Airtruct</div>
            <div className={styles.painList}>
              {painSteps.map((step, idx) => {
                const isVisible = idx < visibleSteps;
                const isStruck = isStriking && strikeStep > idx;
                return (
                  <div
                    key={idx}
                    className={`${styles.painStep} ${isVisible ? styles.painStepVisible : ''} ${isStruck ? styles.painStepStruck : ''}`}
                  >
                    <span className={styles.painIcon}>{step.icon}</span>
                    <span className={styles.painText}>{step.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${styles.comparisonArrow} ${isAfterVisible ? styles.arrowVisible : ''}`}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M10 24H38M30 16L38 24L30 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={`${styles.comparisonAfter} ${isAfterVisible ? styles.afterVisible : ''}`}>
            <div className={styles.comparisonLabel}>With Airtruct</div>
            <div className={styles.flowCard}>
              <div className={styles.flowCardHeader}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>MCP Tool</span>
                <span className={styles.flowCardBadge}>Ready</span>
              </div>
              <div className={styles.flowCardBody}>
                <div className={styles.flowNodes}>
                  {/* Connect node */}
                  <div className={styles.flowNode}>
                    <div className={styles.flowNodeIcon}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                    </div>
                    <span className={styles.flowNodeLabel}>Connect</span>
                  </div>

                  {/* Arrow */}
                  <div className={styles.flowArrow}>
                    <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                      <path d="M0 8H28M22 2L28 8L22 14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Transform node */}
                  <div className={styles.flowNode}>
                    <div className={styles.flowNodeIcon}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className={styles.flowNodeLabel}>Transform</span>
                  </div>

                  {/* Arrow */}
                  <div className={styles.flowArrow}>
                    <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                      <path d="M0 8H28M22 2L28 8L22 14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* AI-Ready node */}
                  <div className={styles.flowNode}>
                    <div className={styles.flowNodeIcon}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <span className={styles.flowNodeLabel}>AI-Ready</span>
                  </div>
                </div>
              </div>
              <div className={styles.flowCardFooter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Configure visually. Deploy instantly.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── How It Works ──────────────────── */

function HowItWorks() {
  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
        </div>
        <div className={styles.stepsRow}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Connect</h3>
            <p className={styles.stepDesc}>
              Connect to APIs, databases, internal services, or scripts. 66+ connectors built in.
            </p>
          </div>
          <div className={styles.stepDivider}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Define Tool</h3>
            <p className={styles.stepDesc}>
              Set a tool name, description, and parameters. Airtruct generates the MCP tool automatically.
            </p>
          </div>
          <div className={styles.stepDivider}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Use With AI</h3>
            <p className={styles.stepDesc}>
              Your tools are instantly callable by Claude, Cursor, AI agents, and internal copilots.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Example MCP Tools (Slider) ──────────────────── */

const examples = [
  {
    title: "Match Payments to Invoices",
    source: "Invoicing database",
    userMessage: "We received payment REF-4821 for $2,500. Find matching invoices.",
    toolCall: 'match_payment(payment_ref="REF-4821", amount=2500)',
    agentReply: "Found 2 potential matches: INV-1094 from Acme Corp ($2,500, due Mar 25) - 98% confidence. INV-1087 from Acme Corp ($2,480) - 72% confidence. Recommend matching to INV-1094.",
  },
  {
    title: "Run Custom Python Script",
    source: "Python script",
    userMessage: "Run churn analysis for the enterprise segment",
    toolCall: 'analyze_churn(customer_segment="enterprise")',
    agentReply: "Churn risk report: 3 accounts flagged high-risk (Acme Corp, Globex, Initech). Top factor: no login in 30+ days. Recommended action: trigger re-engagement campaign.",
  },
  {
    title: "Customer Compensation Decision",
    source: "CRM + business rules",
    userMessage: "Customer C-4412 is complaining about a late delivery. Should we offer anything?",
    toolCall: 'decide_compensation(customer_id="C-4412")',
    agentReply: "Customer since 2021, $18,200 total spend, 2% return rate. High-value loyal customer. Recommendation: offer 15% discount voucher on next order. Applied code SORRY15 and sent via email.",
  },
];

function Typewriter({ text, speed = 20, onDone, onUpdate }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      idx.current++;
      const val = text.slice(0, idx.current);
      setDisplayed(val);
      if (onUpdate) onUpdate(val);
      if (idx.current >= text.length) {
        clearInterval(timer);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayed}</>;
}

function Examples() {
  const [active, setActive] = useState(0);
  // Steps: 0=idle, 1=cursor to input, 2=typing in input bar, 3=sent (msg appears as bubble),
  //        4=typing dots, 5=tool call, 6=typing reply, 7=done, 8=cursor to sidebar
  const [step, setStep] = useState(0);
  // mode: 'text' (blinking line), 'pointer' (hand), 'idle' (arrow, no blink)
  const [cursorPos, setCursorPos] = useState({ x: '60%', y: '90%', mode: 'arrow' });
  const autoplayTimer = useRef(null);
  const sidebarRefs = useRef([]);
  const inputBarRef = useRef(null);
  const inputTextRef = useRef(null);
  const chatWindowRef = useRef(null);
  const animationId = useRef(0);

  const getRelPos = (el) => {
    const win = chatWindowRef.current;
    if (!el || !win) return null;
    const wr = win.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { wx: wr.left, wy: wr.top, ex: er.left, ey: er.top, ew: er.width, eh: er.height };
  };

  const getCursorPosForSidebar = (idx) => {
    const r = getRelPos(sidebarRefs.current[idx]);
    if (!r) return { x: '10%', y: '50%', mode: 'pointer' };
    return {
      x: `${r.ex - r.wx + r.ew * 0.6}px`,
      y: `${r.ey - r.wy + r.eh / 2}px`,
      mode: 'pointer',
    };
  };

  const getCursorPosForInputStart = () => {
    const r = getRelPos(inputBarRef.current);
    if (!r) return { x: '60%', y: '90%', mode: 'text' };
    return {
      x: `${r.ex - r.wx + 12}px`,
      y: `${r.ey - r.wy + r.eh / 2}px`,
      mode: 'text',
    };
  };

  const updateCursorToTextEnd = () => {
    requestAnimationFrame(() => {
      const span = inputTextRef.current;
      const win = chatWindowRef.current;
      if (!span || !win) return;
      const wr = win.getBoundingClientRect();
      const sr = span.getBoundingClientRect();
      setCursorPos(prev => ({
        ...prev,
        x: `${sr.left - wr.left + sr.width}px`,
      }));
    });
  };

  const runAnimation = (idx) => {
    const id = ++animationId.current;
    setActive(idx);
    setStep(0);

    const schedule = (delay, fn) => {
      setTimeout(() => {
        if (animationId.current === id) fn();
      }, delay);
    };

    schedule(300, () => {
      setCursorPos({ ...getCursorPosForInputStart(), mode: 'arrow' });
      setStep(1);
    });
    schedule(900, () => {
      setCursorPos(prev => ({ ...prev, mode: 'text' }));
      setStep(2);
    });
  };

  const advanceAfterInputType = () => setStep(3);

  useEffect(() => {
    if (step === 3) {
      // Message sent - switch to arrow, stay near input
      setCursorPos(prev => ({ ...prev, mode: 'arrow' }));
      const t = setTimeout(() => setStep(4), 400);
      return () => clearTimeout(t);
    }
    if (step === 4) {
      const t = setTimeout(() => setStep(5), 1000);
      return () => clearTimeout(t);
    }
    if (step === 5) {
      const t = setTimeout(() => setStep(6), 200);
      return () => clearTimeout(t);
    }
  }, [step]);

  const advanceAfterReply = () => setStep(7);

  useEffect(() => {
    if (step !== 7) return;
    autoplayTimer.current = setTimeout(() => {
      const next = (active + 1) % examples.length;
      setStep(8);
      setCursorPos(getCursorPosForSidebar(next));
      setTimeout(() => {
        runAnimation(next);
      }, 700);
    }, 3000);
    return () => clearTimeout(autoplayTimer.current);
  }, [step, active]);

  useEffect(() => {
    runAnimation(0);
  }, []);

  const handleManualClick = (idx) => {
    clearTimeout(autoplayTimer.current);
    animationId.current++;
    runAnimation(idx);
  };

  const ex = examples[active];

  return (
    <section className={styles.examples} id="examples">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>See It In Action</h2>
          <p className={styles.sectionSubtitle}>
            A few examples - and hundreds of other ideas waiting to be built in minutes.
          </p>
        </div>

        <div className={styles.chatWindow} ref={chatWindowRef}>
          {/* Always-visible cursor */}
          <div
            className={`${styles.fakeCursor} ${step === 2 ? styles.fakeCursorSnap : ''}`}
            style={{ left: cursorPos.x, top: cursorPos.y }}
          >
            {cursorPos.mode === 'text' ? (
              <div className={styles.textCursor} />
            ) : cursorPos.mode === 'pointer' ? (
              <svg width="20" height="24" viewBox="0 0 20 24">
                <path d="M8 0C6.9 0 6 .9 6 2v9.5l-.7-.7C4.5 10 3.3 10 2.5 10.8c-.8.8-.8 2 0 2.8L7.2 18c1 1 2.3 1.5 3.7 1.5H13c3.3 0 6-2.7 6-6v-3.5c0-1.1-.9-2-2-2s-2 .9-2 2v-.5c0-1.1-.9-2-2-2s-2 .9-2 2V2c0-1.1-.9-2-2-2z" fill="white" stroke="black" strokeWidth="1.2" />
              </svg>
            ) : (
              <svg width="18" height="22" viewBox="0 0 16 20" fill="white" stroke="black" strokeWidth="1">
                <path d="M1 1L1 14L4.5 10.5L7.5 17L10 16L7 9.5L11.5 9.5L1 1Z" />
              </svg>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.chatSidebar}>
            <div className={styles.chatSidebarHeader}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span>New chat</span>
            </div>
            <div className={styles.chatSidebarList}>
              {examples.map((e, idx) => (
                <button
                  key={idx}
                  ref={el => sidebarRefs.current[idx] = el}
                  className={`${styles.chatSidebarItem} ${idx === active ? styles.chatSidebarItemActive : ''}`}
                  onClick={() => handleManualClick(idx)}
                >
                  <svg className={styles.chatSidebarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                  <span>{e.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat content */}
          <div className={styles.chatContent}>
            <div className={styles.chatContentHeader}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>Connected to: {ex.source}</span>
            </div>
            <div className={styles.chatMessages}>
              {step >= 3 && (
                <div className={`${styles.chatMessage} ${styles.chatUser} ${styles.rowVisible}`}>
                  {ex.userMessage}
                </div>
              )}
              {step === 4 && (
                <div className={`${styles.chatMessage} ${styles.chatAgent} ${styles.rowVisible}`}>
                  <span className={styles.chatTyping}>
                    <span className={styles.chatTypingDot} />
                    <span className={styles.chatTypingDot} />
                    <span className={styles.chatTypingDot} />
                  </span>
                </div>
              )}
              {step >= 5 && (
                <div className={`${styles.chatMessage} ${styles.chatAgent} ${styles.rowVisible}`}>
                  <span className={styles.chatToolCall}>
                    Called {ex.toolCall}
                  </span>
                  {step === 6
                    ? <Typewriter text={ex.agentReply} speed={25} onDone={advanceAfterReply} />
                    : step >= 7 ? ex.agentReply : null}
                </div>
              )}
            </div>
            <div className={styles.chatInputBar} ref={inputBarRef}>
              {step === 2
                ? <span className={styles.chatInputTyping} ref={inputTextRef}><Typewriter text={ex.userMessage} speed={45} onDone={advanceAfterInputType} onUpdate={updateCursorToTextEnd} /></span>
                : <span className={styles.chatInputPlaceholder}>Ask anything...</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Features ──────────────────── */

const features = [
  {
    title: "Instant MCP Endpoint",
    description: "The coordinator exposes a /mcp endpoint. All MCP Tool flows are auto-registered and discoverable by any MCP client.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Connect Anything",
    description: "66+ built-in connectors — APIs, databases, message queues, cloud storage. If it has an interface, Airtruct can connect to it.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 5h16" />
      </svg>
    ),
  },
  {
    title: "Visual Tool Builder",
    description: "Design your tool's logic with a drag-and-drop editor. Connect inputs, processors, and outputs visually.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: "Parameter Validation",
    description: "Define tool inputs with types, descriptions, and required flags. AI clients see exactly what parameters your tool accepts.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Secure Credentials",
    description: "Manage API keys, database passwords, and tokens safely. Secrets are stored encrypted and injected at runtime.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Single Binary, Open Source",
    description: "Deploy anywhere as one file. Apache 2.0 licensed, self-hosted, zero vendor lock-in.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to build, deploy, and manage MCP tools.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureCardTitle}>{feature.title}</h3>
              <p className={styles.featureCardDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Built For (Rotating) ──────────────────── */

const audiences = [
  {
    label: "AI Engineers",
    description: "Turn your systems into AI-callable tools - no MCP server coding required.",
  },
  {
    label: "SaaS Teams",
    description: "Enable AI assistants to use your product via APIs - instantly.",
  },
  {
    label: "Internal Automation",
    description: "Automate operations by turning internal systems into AI tools.",
  },
  {
    label: "Startups",
    description: "Launch AI-powered features fast - single binary, zero infra, from prototype to production.",
  },
];

function BuiltFor() {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle, deleting, typing
  const [charCount, setCharCount] = useState(audiences[0].label.length);

  const currentLabel = audiences[current].label;
  const targetLabel = next !== null ? audiences[next].label : '';
  const displayText = phase === 'typing'
    ? targetLabel.slice(0, charCount)
    : currentLabel.slice(0, charCount);
  const descVisible = phase === 'idle';

  // Auto-rotate
  useEffect(() => {
    if (phase !== 'idle') return;
    const timer = setTimeout(() => {
      setNext((current + 1) % audiences.length);
      setPhase('deleting');
      setCharCount(currentLabel.length);
    }, 4500);
    return () => clearTimeout(timer);
  }, [phase, current, currentLabel.length]);

  // Deleting
  useEffect(() => {
    if (phase !== 'deleting') return;
    if (charCount > 0) {
      const timer = setTimeout(() => setCharCount(c => c - 1), 40);
      return () => clearTimeout(timer);
    }
    // Done deleting — switch to typing
    setCurrent(next);
    setCharCount(0);
    setPhase('typing');
  }, [phase, charCount, next]);

  // Typing
  useEffect(() => {
    if (phase !== 'typing') return;
    if (charCount < targetLabel.length) {
      const timer = setTimeout(() => setCharCount(c => c + 1), 60);
      return () => clearTimeout(timer);
    }
    // Done typing
    setNext(null);
    setPhase('idle');
  }, [phase, charCount, targetLabel.length]);

  const handleDot = (idx) => {
    if (idx === current || phase !== 'idle') return;
    setNext(idx);
    setPhase('deleting');
    setCharCount(currentLabel.length);
  };

  return (
    <section className={styles.builtFor}>
      <div className={styles.container}>
        <div className={styles.builtForInner}>
          <h2 className={styles.builtForTitle}>
            Built for{' '}
            <span className={styles.builtForRotate}>
              {displayText}<span className={styles.builtForCursor}>|</span>
            </span>
          </h2>
          <p className={`${styles.builtForDesc} ${descVisible ? styles.builtForDescIn : styles.builtForDescOut}`}>
            {audiences[current].description}
          </p>
          <div className={styles.builtForDots}>
            {audiences.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.builtForDot} ${idx === current ? styles.builtForDotActive : ''}`}
                onClick={() => handleDot(idx)}
                aria-label={audiences[idx].label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── CTA ──────────────────── */

function CTA() {
  const docsUrl = useBaseUrl("/docs/getting-started/installation");
  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Start building MCP tools in minutes</h2>
          <p className={styles.ctaSubtitle}>
            Self-hosted. Open source. No vendor lock-in.
          </p>
          <div className={styles.ctaButtons}>
            <a className={styles.ctaBtnPrimary} href={docsUrl}>Build your first tool</a>
            <a className={styles.ctaBtnSecondary} href="https://github.com/sananguliyev/airtruct">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Page ──────────────────── */

export default function Home() {
  useEffect(() => {
    document.querySelector('.navbar')?.classList.add('navbar--hidden-landing');
    return () => document.querySelector('.navbar')?.classList.remove('navbar--hidden-landing');
  }, []);

  return (
    <Layout
      title="The fastest way to build tools for AI assistants"
      description="Turn APIs, databases, and scripts into MCP tools for AI assistants — without writing MCP servers. Open source, self-hosted."
    >
      <div className={styles.pageWrap}>
        <Hero />
        <div className={styles.sectionDivider} />
        <BeforeAfter />
        <div className={styles.sectionDivider} />
        <HowItWorks />
        <div className={styles.sectionDivider} />
        <Examples />
        <div className={styles.sectionDivider} />
        <Features />
        <div className={styles.sectionDivider} />
        <BuiltFor />
        <div className={styles.sectionDivider} />
        <CTA />
      </div>
    </Layout>
  );
}
