import React, { useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./index.module.css";

const features = [
  {
    title: "Built-in HTTP Ingestion",
    description: "Receive data via HTTP – perfect for webhooks and live feeds.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    title: "Single File Deployment",
    description: "The entire ETL engine in a single file - deploy anywhere with minimal dependencies.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "Language-Agnostic Components",
    description: "Add processors in Python, Node, Rust, or anything – via Subprocess.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "No Docker Required",
    description: "Deploy anywhere, fast and lightweight – unlike other ETL solutions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    title: "Simple Pipeline Design",
    description: "Create ETL pipelines with minimal configuration and maximum flexibility.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: "Apache 2.0 Licensed",
    description: "Fully open source with Apache 2.0 license - zero vendor lock-in, and easy to contribute.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

function DataFlowAnimation() {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bufferFill = container.querySelector('[data-buffer-fill]');
    const memoryFill = container.querySelector('[data-memory-fill]');
    const cacheFill = container.querySelector('[data-cache-fill]');

    let bufferLevel = 0;
    let memoryLevel = 0;
    let batchSize = 0;
    const maxBatchSize = 8;
    let processingBatch = false;

    const inputShapes = ["circle", "triangle", "diamond"];
    const outputShapes = ["square", "hexagon", "star"];
    const colors = [
      "rgba(107, 114, 128, 0.7)",
      "rgba(75, 85, 99, 0.7)",
      "rgba(55, 65, 81, 0.7)",
    ];

    function updateBufferLevel(delta) {
      bufferLevel = Math.max(0, Math.min(100, bufferLevel + delta));
      if (bufferFill) bufferFill.style.width = `${bufferLevel}%`;
      const cacheLevel = bufferLevel * 0.8;
      if (cacheFill) cacheFill.style.width = `${cacheLevel}%`;
    }

    function updateMemoryLevel(delta) {
      memoryLevel = Math.max(0, Math.min(100, memoryLevel + delta));
      if (memoryFill) memoryFill.style.height = `${memoryLevel}%`;
    }

    function processBatch() {
      if (processingBatch || batchSize === 0) return;
      processingBatch = true;
      updateMemoryLevel(20);
      setTimeout(() => {
        updateBufferLevel(-20);
        setTimeout(() => updateMemoryLevel(-10), 500);
        setTimeout(() => {
          updateMemoryLevel(-10);
          processingBatch = false;
          batchSize = 0;
        }, 1000);
      }, 1000);
    }

    function createEntity() {
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const shapeType = inputShapes[Math.floor(Math.random() * inputShapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.floor(Math.random() * 10) + 15;

      const entity = document.createElement("div");
      entity.className = styles.dataEntity;

      const yVariation = Math.random() * 100 - 50;
      entity.style.left = "20px";
      entity.style.top = `${centerY + yVariation}px`;
      entity.style.width = `${size}px`;
      entity.style.height = `${size}px`;

      if (shapeType === "circle") {
        entity.style.borderRadius = "50%";
        entity.style.backgroundColor = color;
      } else if (shapeType === "triangle") {
        entity.style.width = "0";
        entity.style.height = "0";
        entity.style.borderLeft = `${size / 2}px solid transparent`;
        entity.style.borderRight = `${size / 2}px solid transparent`;
        entity.style.borderBottom = `${size}px solid ${color}`;
        entity.style.background = "transparent";
      } else if (shapeType === "diamond") {
        entity.style.transform = "rotate(45deg)";
        entity.style.borderRadius = "4px";
        entity.style.backgroundColor = color;
      }

      entity.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.1)";
      container.appendChild(entity);

      updateBufferLevel(5);
      batchSize++;
      if (batchSize >= maxBatchSize && !processingBatch) processBatch();

      // Animate to buffer
      setTimeout(() => {
        entity.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        entity.style.left = `${60 + Math.random() * 80}px`;
        entity.style.top = `${centerY + (Math.random() * 60 - 30)}px`;
        entity.style.opacity = "0.9";
      }, 100);

      // Animate through scanner
      setTimeout(() => {
        entity.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        entity.style.left = "210px";
        entity.style.top = `${centerY + (Math.random() * 40 - 20)}px`;
      }, 1000);

      // Animate to processor
      setTimeout(() => {
        entity.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)";
        entity.style.left = `${centerX}px`;
        entity.style.top = `${centerY + (Math.random() * 30 - 15)}px`;
      }, 2000);

      // Transform at processor
      setTimeout(() => {
        const outputShape = outputShapes[Math.floor(Math.random() * outputShapes.length)];
        const newColor = colors[Math.floor(Math.random() * colors.length)];

        if (shapeType === "triangle") {
          entity.style.borderLeft = "";
          entity.style.borderRight = "";
          entity.style.borderBottom = "";
          entity.style.width = `${size}px`;
          entity.style.height = `${size}px`;
          entity.style.backgroundColor = newColor;
        }

        if (outputShape === "square") {
          entity.style.borderRadius = "2px";
          entity.style.transform = "rotate(0deg)";
        } else if (outputShape === "hexagon") {
          entity.style.borderRadius = "0";
          entity.style.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
        } else if (outputShape === "star") {
          entity.style.borderRadius = "0";
          entity.style.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
        }

        entity.style.backgroundColor = newColor;
        entity.style.filter = "drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))";
      }, 3000);

      // Animate to output
      setTimeout(() => {
        entity.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)";
        entity.style.left = `${rect.width - 100}px`;
        entity.style.top = `${centerY + (Math.random() * 60 - 30)}px`;
        entity.style.filter = "none";
        entity.style.opacity = "0.7";
      }, 4000);

      // Remove
      setTimeout(() => {
        entity.style.opacity = "0";
        setTimeout(() => entity.remove(), 500);
      }, 5500);
    }

    // Initial burst
    for (let i = 0; i < 5; i++) {
      setTimeout(createEntity, i * 300);
    }

    // Continuous creation
    const entityInterval = setInterval(createEntity, 400);
    const batchInterval = setInterval(() => {
      if (batchSize >= 3) processBatch();
    }, 2000);

    // Processor pulse
    const processorCore = container.querySelector('[data-processor-core]');
    const pulseInterval = setInterval(() => {
      if (processorCore) {
        processorCore.style.transition = "all 0.3s ease";
        processorCore.style.backgroundColor = "rgba(75, 85, 99, 0.5)";
        processorCore.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.5)";
        setTimeout(() => {
          processorCore.style.backgroundColor = "rgba(75, 85, 99, 0.3)";
          processorCore.style.boxShadow = "none";
        }, 300);
      }
    }, 1500);

    return () => {
      clearInterval(entityInterval);
      clearInterval(batchInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className={styles.dataFlowContainer} ref={containerRef}>
      {/* Connection Paths */}
      <svg className={styles.connectionPath} viewBox="0 0 800 400" preserveAspectRatio="none">
        <path d="M160,160 C300,100 500,300 640,160" stroke="#d1d5db" strokeWidth="1" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="30s" repeatCount="indefinite" />
        </path>
        <path d="M160,200 C300,260 500,140 640,200" stroke="#d1d5db" strokeWidth="1" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="30s" repeatCount="indefinite" />
        </path>
        <path d="M160,240 C300,180 500,220 640,240" stroke="#d1d5db" strokeWidth="1" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="30s" repeatCount="indefinite" />
        </path>
      </svg>

      {/* Partition Lines */}
      <div className={styles.partitionLine} style={{ left: 210 }} />
      <div className={styles.partitionLine} style={{ left: 230 }} />
      <div className={styles.partitionLine} style={{ left: 250 }} />

      {/* Buffer Zone (Input) */}
      <div className={styles.bufferZone}>
        <div className={styles.zoneIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4b5563">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className={styles.bufferMeter}>
          <div className={styles.bufferFill} data-buffer-fill="" />
        </div>
        <div className={styles.cacheIndicator}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" style={{ marginRight: 4 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className={styles.cacheBar}>
            <div className={styles.cacheFillBar} data-cache-fill="" />
          </div>
        </div>
      </div>

      {/* Scanner Zone */}
      <div className={styles.scannerZone}>
        <div className={styles.zoneIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4b5563">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div className={styles.scanner}>
          <div className={styles.scannerBeam} />
        </div>
      </div>

      {/* Processor */}
      <div className={styles.processor}>
        <div className={styles.processorInner}>
          <div className={styles.processorCore} data-processor-core="">
            <div className={styles.logoIcon}>
              <div className={styles.logoCircle}>
                <div className={styles.logoArrow} />
                <div className={styles.logoDot} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Output Zone */}
      <div className={styles.outputZone}>
        <div className={styles.zoneIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4b5563">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 5h16" />
          </svg>
        </div>
        <div className={styles.memoryMeter}>
          <div className={styles.memoryFill} data-memory-fill="" />
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const docsUrl = useBaseUrl("/docs/getting-started/installation");
  const learnUrl = useBaseUrl("/docs/");
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroRow}>
          <div className={styles.heroText}>
            <span className={styles.heroLabel}>Introducing Airtruct</span>
            <h1 className={styles.heroTitle}>
              Powerful ETL tool in <span>a single file</span>
            </h1>
            <p className={styles.heroSubtitle}>
              ETL Pipelines, Made Simple — scale as you need, without the hassle.
            </p>
            <div className={styles.heroButtons}>
              <a className={styles.btnPrimary} href={docsUrl}>Get Started</a>
              <a className={styles.btnSecondary} href={learnUrl}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Learn More
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <DataFlowAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>Features</h2>
          <p className={styles.featuresSubtitle}>
            Everything you need to build powerful ETL pipelines.
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

function CTA() {
  const docsUrl = useBaseUrl("/docs/");
  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to simplify your ETL pipelines?</h2>
          <p className={styles.ctaSubtitle}>
            Join the community building scalable data pipelines with Airtruct.
          </p>
          <div className={styles.ctaButtons}>
            <a className={styles.ctaBtnPrimary} href="https://github.com/sananguliyev/airtruct">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
            <a className={styles.ctaBtnSecondary} href={docsUrl}>Documentation</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="Powerful ETL tool in a single file"
      description="ETL Pipelines, Made Simple — scale as you need, without the hassle."
    >
      <Hero />
      <Features />
      <CTA />
    </Layout>
  );
}
