"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  progress: number;
  pathIndex: number;
  speed: number;
  opacity: number;
  size: number;
  status: "success" | "retry" | "pending";
  delay: number;
  active: boolean;
}

const COLORS = {
  success: "#34d399",
  retry: "#fbbf24",
  pending: "#60a5fa",
  line: "#26262c",
  lineActive: "#35353d",
  glow: "rgba(16, 185, 129, 0.15)",
};

export function DeliveryFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    // Define the delivery paths
    // Source (left) -> Deliverant hub (center) -> Endpoints (right)
    function getPaths(w: number, h: number) {
      const cx = w * 0.5;
      const sourceX = w * 0.08;
      const hubX = cx;
      const endX = w * 0.92;

      const hubY = h * 0.5;

      // 3 source points converging to hub
      const sources = [
        { x: sourceX, y: h * 0.2 },
        { x: sourceX, y: h * 0.5 },
        { x: sourceX, y: h * 0.8 },
      ];

      // 4 endpoint targets fanning out from hub
      const endpoints = [
        { x: endX, y: h * 0.15 },
        { x: endX, y: h * 0.38 },
        { x: endX, y: h * 0.62 },
        { x: endX, y: h * 0.85 },
      ];

      const paths: { points: { x: number; y: number }[]; type: "ingest" | "deliver" | "retry" }[] = [];

      // Ingest paths (source -> hub)
      sources.forEach((s) => {
        paths.push({
          type: "ingest",
          points: [
            s,
            { x: sourceX + (hubX - sourceX) * 0.4, y: s.y + (hubY - s.y) * 0.3 },
            { x: hubX - 30, y: hubY },
            { x: hubX, y: hubY },
          ],
        });
      });

      // Deliver paths (hub -> endpoints)
      endpoints.forEach((e) => {
        paths.push({
          type: "deliver",
          points: [
            { x: hubX, y: hubY },
            { x: hubX + 30, y: hubY },
            { x: hubX + (endX - hubX) * 0.6, y: hubY + (e.y - hubY) * 0.7 },
            e,
          ],
        });
      });

      // Retry path (loops from endpoint back toward hub and out again)
      const retryEndpoint = endpoints[2];
      paths.push({
        type: "retry",
        points: [
          retryEndpoint,
          { x: retryEndpoint.x - (endX - hubX) * 0.3, y: retryEndpoint.y + 25 },
          { x: hubX + (endX - hubX) * 0.4, y: retryEndpoint.y + 40 },
          { x: hubX + (endX - hubX) * 0.6, y: retryEndpoint.y + 25 },
          retryEndpoint,
        ],
      });

      return { paths, hubX, hubY, sources, endpoints };
    }

    function bezierPoint(points: { x: number; y: number }[], t: number) {
      // De Casteljau's algorithm for arbitrary-order bezier
      let pts = points.map((p) => ({ ...p }));
      while (pts.length > 1) {
        const next: { x: number; y: number }[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          next.push({
            x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
            y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
          });
        }
        pts = next;
      }
      return pts[0];
    }

    function drawPath(
      ctx: CanvasRenderingContext2D,
      points: { x: number; y: number }[],
      color: string,
      width: number
    ) {
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const p = bezierPoint(points, t);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    // Initialize particles
    function initParticles(pathCount: number) {
      const particles: Particle[] = [];
      for (let i = 0; i < 24; i++) {
        const pathIndex = i % pathCount;
        const statuses: Particle["status"][] = ["success", "success", "success", "pending", "retry"];
        particles.push({
          x: 0,
          y: 0,
          progress: 0,
          pathIndex,
          speed: 0.002 + Math.random() * 0.003,
          opacity: 0,
          size: 2 + Math.random() * 2,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          delay: i * 180 + Math.random() * 400,
          active: false,
        });
      }
      return particles;
    }

    function drawNode(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      color: string,
      pulse: number
    ) {
      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      gradient.addColorStop(0, color + "40");
      gradient.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.arc(x, y, radius * 3 * (1 + pulse * 0.15), 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function animate(timestamp: number) {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      timeRef.current = timestamp;

      const { paths, hubX, hubY, sources, endpoints } = getPaths(w, h);

      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(paths.length);
      }

      // Draw paths
      paths.forEach((path) => {
        const color = path.type === "retry" ? COLORS.retry + "20" : COLORS.line;
        drawPath(ctx, path.points, color, path.type === "retry" ? 1 : 1.5);
      });

      // Draw hub (Deliverant)
      const hubPulse = Math.sin(timestamp * 0.002) * 0.5 + 0.5;

      // Hub glow ring
      ctx.beginPath();
      ctx.arc(hubX, hubY, 28, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.success + "30";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hubX, hubY, 28 + hubPulse * 6, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.success + "10";
      ctx.lineWidth = 1;
      ctx.stroke();

      drawNode(ctx, hubX, hubY, 8, COLORS.success, hubPulse);

      // Hub label
      ctx.font = "600 10px var(--font-google-sans-code), monospace";
      ctx.fillStyle = COLORS.success + "cc";
      ctx.textAlign = "center";
      ctx.fillText("DELIVERANT", hubX, hubY - 38);

      // Draw source nodes
      sources.forEach((s, i) => {
        const labels = ["POST /events", "POST /events", "POST /events"];
        drawNode(ctx, s.x, s.y, 4, COLORS.pending, Math.sin(timestamp * 0.003 + i) * 0.5 + 0.5);
        ctx.font = "500 9px var(--font-google-sans-code), monospace";
        ctx.fillStyle = "#5c5c6a";
        ctx.textAlign = "left";
        ctx.fillText(labels[i], s.x + 12, s.y + 3);
      });

      // Draw endpoint nodes with status
      const endpointStatuses: { label: string; color: string; statusText: string }[] = [
        { label: "api.acme.com", color: COLORS.success, statusText: "200" },
        { label: "hooks.stripe.io", color: COLORS.success, statusText: "200" },
        { label: "notify.app.dev", color: COLORS.retry, statusText: "503 → retry" },
        { label: "events.prod.co", color: COLORS.success, statusText: "200" },
      ];

      endpoints.forEach((e, i) => {
        const ep = endpointStatuses[i];
        const pulse = Math.sin(timestamp * 0.003 + i * 1.5) * 0.5 + 0.5;
        drawNode(ctx, e.x, e.y, 4, ep.color, pulse);
        ctx.font = "500 9px var(--font-google-sans-code), monospace";
        ctx.fillStyle = "#5c5c6a";
        ctx.textAlign = "right";
        ctx.fillText(ep.label, e.x - 12, e.y - 8);
        ctx.fillStyle = ep.color + "99";
        ctx.fillText(ep.statusText, e.x - 12, e.y + 10);
      });

      // Animate particles
      particlesRef.current.forEach((particle) => {
        if (timestamp < particle.delay && !particle.active) return;
        particle.active = true;

        particle.progress += particle.speed;
        if (particle.progress > 1) {
          particle.progress = 0;
          particle.delay = timestamp + 500 + Math.random() * 2000;
          particle.active = false;
          particle.pathIndex = Math.floor(Math.random() * paths.length);
          const statuses: Particle["status"][] = ["success", "success", "success", "pending", "retry"];
          particle.status = statuses[Math.floor(Math.random() * statuses.length)];
          return;
        }

        const path = paths[particle.pathIndex];
        if (!path) return;

        const p = bezierPoint(path.points, particle.progress);
        particle.x = p.x;
        particle.y = p.y;

        // Fade in/out at path edges
        const fadeIn = Math.min(particle.progress * 8, 1);
        const fadeOut = Math.min((1 - particle.progress) * 8, 1);
        particle.opacity = fadeIn * fadeOut;

        const color =
          particle.status === "success"
            ? COLORS.success
            : particle.status === "retry"
            ? COLORS.retry
            : COLORS.pending;

        // Particle trail
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 6
        );
        gradient.addColorStop(0, color + Math.round(particle.opacity * 60).toString(16).padStart(2, "0"));
        gradient.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Particle core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(particle.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full aspect-[16/9] max-h-[420px]">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#ededef 1px, transparent 1px),
            linear-gradient(90deg, #ededef 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
