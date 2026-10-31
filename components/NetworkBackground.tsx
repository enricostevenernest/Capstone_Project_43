"use client";
import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  isSpecial?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const nodes: Node[] = [];
    const ripples: Ripple[] = [];
    const mouse = { x: -1000, y: -1000, active: false };

    const MAX_NODES = 110;
    const CONNECT_DIST = 135;
    const MOUSE_CONNECT_DIST = 160;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.scale(dpr, dpr);

      // Inisialisasi node awal jika kosong
      if (nodes.length === 0) {
        const count = Math.min(Math.max(Math.floor((width * height) / 22000), 40), 75);
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.5 + 1.2,
            baseAlpha: Math.random() * 0.35 + 0.35,
            isSpecial: Math.random() < 0.12, // aksen merah Telkom tipis
          });
        }
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // Track mouse
    function handlePointerMove(e: PointerEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }

    function handlePointerLeave() {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    }

    // Klik untuk membuat percabangan baru
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      // Jangan ganggu interaksi tombol, link, atau input formulir
      if (target?.closest("button, a, input, select, textarea, [role='button'], [role='menuitem']")) {
        return;
      }

      const cx = e.clientX;
      const cy = e.clientY;

      // Efek ripple visual saat diklik
      ripples.push({
        x: cx,
        y: cy,
        radius: 4,
        maxRadius: 65,
        alpha: 0.7,
      });

      // 1 node pusat di titik klik
      const newNodes: Node[] = [
        {
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: 2.8,
          baseAlpha: 0.9,
          isSpecial: true,
        },
      ];

      // 2 - 4 percabangan yang memancar keluar
      const branchCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < branchCount; i++) {
        const angle = (Math.PI * 2 * i) / branchCount + (Math.random() - 0.5) * 0.6;
        const dist = Math.random() * 45 + 30;
        const speed = Math.random() * 0.35 + 0.15;
        newNodes.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.5 + 1.4,
          baseAlpha: 0.75,
          isSpecial: Math.random() < 0.3,
        });
      }

      // Masukkan ke daftar nodes (jika melebihi batas, hapus node tertua)
      nodes.push(...newNodes);
      while (nodes.length > MAX_NODES) {
        nodes.shift();
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerdown", handlePointerDown);

    // Animation Loop
    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Update & render ripples
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 2.2;
        rip.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(242, 73, 94, ${rip.alpha * 0.6})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
        }
      }

      // Update positions
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce at edges
        if (n.x < 0) {
          n.x = 0;
          n.vx = -n.vx;
        } else if (n.x > width) {
          n.x = width;
          n.vx = -n.vx;
        }

        if (n.y < 0) {
          n.y = 0;
          n.vy = -n.vy;
        } else if (n.y > height) {
          n.y = height;
          n.vy = -n.vy;
        }
      }

      // Draw connections between nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const ratio = 1 - dist / CONNECT_DIST;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            if (a.isSpecial || b.isSpecial) {
              ctx.strokeStyle = `rgba(242, 73, 94, ${ratio * 0.28})`;
            } else {
              ctx.strokeStyle = `rgba(220, 226, 240, ${ratio * 0.16})`;
            }
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }

        // Connection to mouse
        if (mouse.active) {
          const mdx = a.x - mouse.x;
          const mdy = a.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < MOUSE_CONNECT_DIST) {
            const mratio = 1 - mdist / MOUSE_CONNECT_DIST;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(242, 73, 94, ${mratio * 0.35})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Sedikit dorongan halus ke arah kursor jika terlalu dekat
            if (mdist > 40 && mdist < 120) {
              a.x -= mdx * 0.003;
              a.y -= mdy * 0.003;
            }
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.isSpecial) {
          ctx.fillStyle = `rgba(242, 73, 94, ${n.baseAlpha})`;
          ctx.shadowColor = "rgba(242, 73, 94, 0.4)";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = `rgba(235, 240, 255, ${n.baseAlpha})`;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

