"use client";

import * as React from "react";

export function ParticleBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_snow_enabled");
      setEnabled(stored !== "false");

      const handleToggle = () => {
        const updated = localStorage.getItem("nexora_snow_enabled");
        setEnabled(updated !== "false");
      };

      window.addEventListener("nexora_snow_toggled", handleToggle);
      return () => {
        window.removeEventListener("nexora_snow_toggled", handleToggle);
      };
    }
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationId: number;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 35 : 85;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }

    const colors = [
      "255, 255, 255", // pure white
      "224, 231, 255", // light indigo-white
      "207, 250, 254", // light cyan-white
    ];

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, // gentle sway side to side
      vy: Math.random() * 0.6 + 0.3, // drift downwards (always positive)
      size: Math.random() * 1.8 + 0.5, // range of snowflake sizes
      opacity: Math.random() * 0.55 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Reset if snowflake falls past the bottom
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
          p.vy = Math.random() * 0.6 + 0.3;
          p.vx = (Math.random() - 0.5) * 0.25;
        }

        // Wrap around horizontally
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
