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
            The <span className={styles.heroFastest}><span className={styles.heroFastLines}><span className={styles.heroFastLine} /><span className={styles.heroFastLine} /><span className={styles.heroFastLine} /></span>fastest</span> way to build{' '}
            <br className={styles.brDesktop} />
            <span className={styles.heroSkewBox}>tools</span> for <span className={styles.heroSkewBox}>AI assistants</span>
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

const codeLines = [
  { text: 'from mcp import Server', dim: true },
  { text: 'import psycopg2, json', dim: true },
  { text: '' },
  { text: 'server = Server("my-tools")', str: [14, 25] },
  { text: '' },
  { text: '@server.tool()', dim: true },
  { text: 'def check_balance(customer_id):' },
  { text: '  conn = psycopg2.connect(...)' },
  { text: '  cur = conn.cursor()' },
  { text: '  cur.execute("SELECT...")', str: [14, 24] },
  { text: '  return json.dumps(cur.fetchone())', dim: true },
  { text: '' },
  { text: '# + error handling', dim: true },
  { text: '# + connection pooling', dim: true },
  { text: '# + schema definitions', dim: true },
  { text: '# + deployment config', dim: true },
];

const buildSteps = [
  'Installing dependencies...',
  'Building MCP server...',
  'Configuring transport layer...',
  'Deploying to server...',
  'Server running on port 3001 ✓',
];

function BeforeAfter() {
  const sectionRef = useRef(null);
  // idle → typing → building → built → striking → done
  const [phase, setPhase] = useState('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const [buildStep, setBuildStep] = useState(0);
  const [strikeStep, setStrikeStep] = useState(0);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setPhase('typing');
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Type code lines
  useEffect(() => {
    if (phase !== 'typing') return;
    if (visibleLines < codeLines.length) {
      const delay = codeLines[visibleLines].text === '' ? 80 : 120;
      const timer = setTimeout(() => setVisibleLines(v => v + 1), delay);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('building'), 500);
    return () => clearTimeout(timer);
  }, [phase, visibleLines]);

  // Show build/deploy steps
  useEffect(() => {
    if (phase !== 'building') return;
    if (buildStep < buildSteps.length) {
      const delay = buildStep === buildSteps.length - 1 ? 600 : 400;
      const timer = setTimeout(() => setBuildStep(v => v + 1), delay);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('striking'), 1000);
    return () => clearTimeout(timer);
  }, [phase, buildStep]);

  // Strike through lines one by one (code + build = total lines)
  const totalStrikeLines = codeLines.length + buildSteps.length;
  useEffect(() => {
    if (phase !== 'striking') return;
    if (strikeStep < totalStrikeLines) {
      const timer = setTimeout(() => setStrikeStep(v => v + 1), 60);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('done'), 400);
    return () => clearTimeout(timer);
  }, [phase, strikeStep, totalStrikeLines]);

  const renderCodeLine = (line, idx) => {
    if (line.text === '') return <br key={idx} />;
    if (line.dim) {
      return <span key={idx} className={styles.codeDim}>{line.text}<br /></span>;
    }
    if (line.str) {
      const [s, e] = line.str;
      return (
        <span key={idx}>
          {line.text.slice(0, s)}
          <span className={styles.codeStr}>{line.text.slice(s, e)}</span>
          {line.text.slice(e)}
          <br />
        </span>
      );
    }
    return <span key={idx}>{line.text}<br /></span>;
  };

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
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot} style={{ background: '#ef4444' }} />
                <span className={styles.codeDot} style={{ background: '#f59e0b' }} />
                <span className={styles.codeDot} style={{ background: '#22c55e' }} />
                <span className={styles.codeTitle}>mcp_server.py</span>
              </div>
              <div className={styles.codeBody}>
                <code>
                  {codeLines.map((line, idx) => {
                    const isVisible = idx < visibleLines;
                    const isStruck = isStriking && strikeStep > idx;
                    return (
                      <span key={idx} className={`${isStruck ? styles.lineStruck : ''} ${isVisible ? '' : styles.lineHidden}`}>
                        {renderCodeLine(line, idx)}
                      </span>
                    );
                  })}
                  {phase === 'typing' && <span className={styles.cursor}>|</span>}
                </code>
              </div>
            </div>

            {/* Build / deploy terminal — always rendered for fixed layout */}
            <div className={styles.terminalBlock}>
              <div className={styles.terminalHeader}>
                <span className={styles.terminalPrompt}>$</span>
                <span>deploy mcp-server</span>
              </div>
              <div className={styles.terminalBody}>
                {buildSteps.map((step, idx) => {
                  const isVisible = idx < buildStep;
                  const strikeIdx = codeLines.length + idx;
                  const isStruck = isStriking && strikeStep > strikeIdx;
                  return (
                    <div key={idx} className={`${styles.terminalLine} ${isStruck ? styles.lineStruck : ''} ${isVisible ? '' : styles.lineHidden}`}>
                      {step}
                    </div>
                  );
                })}
                {phase === 'building' && buildStep < buildSteps.length && (
                  <span className={styles.cursor}>|</span>
                )}
              </div>
            </div>
          </div>

          <div className={`${styles.comparisonArrow} ${isAfterVisible ? styles.arrowVisible : ''}`}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M10 24H38M30 16L38 24L30 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={`${styles.comparisonAfter} ${isAfterVisible ? styles.afterVisible : ''}`}>
            <div className={styles.comparisonLabel}>With Airtruct</div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHeader}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>MCP Tool</span>
                <span className={styles.toolCardBadge}>Ready</span>
              </div>
              <div className={styles.toolCardBody}>
                {/* Input box */}
                <div className={styles.toolCardBox}>
                  <div className={styles.toolCardBoxHeader}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>MCP Tool Input</span>
                    <svg className={styles.toolCardCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className={styles.toolCardBoxBody}>
                    <div className={styles.toolCardField}>
                      <span className={styles.toolCardLabel}>Name</span>
                      <div className={styles.toolCardInput}><span>check_balance</span></div>
                    </div>
                    <div className={styles.toolCardField}>
                      <span className={styles.toolCardLabel}>Description</span>
                      <div className={styles.toolCardInput}><span>Check customer balance and unpaid invoices</span></div>
                    </div>
                    <div className={styles.toolCardField}>
                      <span className={styles.toolCardLabel}>Parameters</span>
                      <div className={styles.toolCardParam}>
                        <code>customer_id</code>
                        <span className={styles.toolCardParamType}>string, required</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className={styles.toolCardArrow}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12l7 7 7-7" /></svg>
                </div>

                {/* Processor box */}
                <div className={styles.toolCardBox}>
                  <div className={styles.toolCardBoxHeader}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Processor</span>
                    <svg className={styles.toolCardCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className={styles.toolCardBoxBody}>
                    <div className={styles.toolCardInput}>
                      <code>SELECT balance, invoices FROM customers WHERE id = ?</code>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className={styles.toolCardArrow}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12l7 7 7-7" /></svg>
                </div>

                {/* Output box */}
                <div className={styles.toolCardBox}>
                  <div className={styles.toolCardBoxHeader}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Sync Response</span>
                    <svg className={styles.toolCardCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className={styles.toolCardBoxBody}>
                    <div className={styles.toolCardInput}><span>Result → AI client</span></div>
                  </div>
                </div>
              </div>
              <div className={styles.toolCardFooter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Exposed at <code>/mcp</code> — discoverable by AI clients</span>
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
    tool: "match_payment",
    inputs: [{ name: "payment_ref", type: "string" }, { name: "amount", type: "number" }],
    action: "List open invoices → return matches with confidence",
    userMessage: "We received payment REF-4821 for $2,500. Find matching invoices.",
    toolCall: 'match_payment(payment_ref="REF-4821", amount=2500)',
    agentReply: "Found 2 potential matches: INV-1094 from Acme Corp ($2,500, due Mar 25) — 98% confidence. INV-1087 from Acme Corp ($2,480) — 72% confidence. Recommend matching to INV-1094.",
  },
  {
    title: "Run Custom Python Script",
    tool: "analyze_churn",
    inputs: [{ name: "customer_segment", type: "string" }],
    action: "subprocess → python3 churn_model.py",
    userMessage: "Run churn analysis for the enterprise segment",
    toolCall: 'analyze_churn(customer_segment="enterprise")',
    agentReply: "Churn risk report: 3 accounts flagged high-risk (Acme Corp, Globex, Initech). Top factor: no login in 30+ days. Recommended action: trigger re-engagement campaign.",
  },
  {
    title: "Customer Compensation Decision",
    tool: "decide_compensation",
    inputs: [{ name: "customer_id", type: "string" }, { name: "turnover", type: "number" }, { name: "return_ratio", type: "number" }, { name: "tenure_years", type: "number" }],
    action: "Custom logic → evaluate and decide compensation",
    userMessage: "Customer C-4412 is complaining about a late delivery. Should we offer anything?",
    toolCall: 'decide_compensation(customer_id="C-4412")',
    agentReply: "Customer since 2021, $18,200 total spend, 2% return rate. High-value loyal customer. Recommendation: offer 15% discount voucher on next order. Applied code SORRY15 and sent via email.",
  },
];

function Examples() {
  const [active, setActive] = useState(0);
  // Animation steps: 0=empty, 1=tool row, 2=inputs row, 3=action row, 4=arrow, 5=user msg, 6=tool call, 7=agent reply
  const [step, setStep] = useState(0);
  const animating = useRef(false);

  const runAnimation = () => {
    if (animating.current) return;
    animating.current = true;
    setStep(0);
    const delays = [300, 400, 400, 400, 300, 500, 400, 0];
    let total = 0;
    for (let i = 0; i < 8; i++) {
      total += delays[i];
      const s = i + 1;
      setTimeout(() => {
        setStep(s);
        if (s === 8) animating.current = false;
      }, total);
    }
  };

  useEffect(() => {
    runAnimation();
  }, [active]);

  const switchTo = (idx) => {
    if (idx === active) return;
    setStep(0);
    setActive(idx);
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

        <div className={styles.sliderTabs}>
          {examples.map((e, idx) => (
            <button
              key={idx}
              className={`${styles.sliderTab} ${idx === active ? styles.sliderTabActive : ''}`}
              onClick={() => switchTo(idx)}
            >
              {e.title}
            </button>
          ))}
        </div>

        <div className={styles.slideWrap}>
          <div className={styles.slideContent}>
            {/* Left: tool definition */}
            <div className={styles.slideTool}>
              <div className={styles.toolDef}>
                <div className={`${styles.toolDefRow} ${step >= 1 ? styles.rowVisible : styles.rowHidden}`}>
                  <span className={styles.toolDefKey}>Tool</span>
                  <code className={styles.toolDefVal}>{ex.tool}</code>
                </div>
                <div className={`${styles.toolDefRow} ${step >= 2 ? styles.rowVisible : styles.rowHidden}`}>
                  <span className={styles.toolDefKey}>Inputs</span>
                  <code className={styles.toolDefVal}>
                    {ex.inputs.map(i => i.name).join(", ")}
                  </code>
                </div>
                <div className={`${styles.toolDefRow} ${step >= 3 ? styles.rowVisible : styles.rowHidden}`}>
                  <span className={styles.toolDefKey}>Action</span>
                  <code className={styles.toolDefVal}>{ex.action}</code>
                </div>
              </div>
            </div>

            {/* Arrow between */}
            <div className={`${styles.slideArrow} ${step >= 4 ? styles.rowVisible : styles.rowHidden}`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>

            {/* Right: chat demo */}
            <div className={styles.slideChat}>
              <div className={styles.chatDemo}>
                <div className={`${styles.chatMessage} ${styles.chatUser} ${step >= 5 ? styles.rowVisible : styles.rowHidden}`}>
                  {ex.userMessage}
                </div>
                <div className={`${styles.chatMessage} ${styles.chatAgent} ${step >= 6 ? styles.rowVisible : styles.rowHidden}`}>
                  <span className={`${styles.chatToolCall} ${step >= 6 ? '' : styles.rowHidden}`}>
                    Called {ex.toolCall}
                  </span>
                  <span className={step >= 7 ? '' : styles.rowHidden}>
                    {ex.agentReply}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sliderDots}>
          {examples.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.sliderDot} ${idx === active ? styles.sliderDotActive : ''}`}
              onClick={() => switchTo(idx)}
              aria-label={`Example ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Features ──────────────────── */

const features = [
  {
    title: "Instant MCP Endpoint",
    description: "The coordinator exposes a /mcp endpoint. All MCP Tool streams are auto-registered and discoverable by any MCP client.",
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
