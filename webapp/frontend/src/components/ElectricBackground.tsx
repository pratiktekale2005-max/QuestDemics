import React, { useEffect, useRef } from 'react';

export default function ElectricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Persistent Plasma Arc that moves slowly and stays on screen
    class PlasmaArc {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      targetX1: number;
      targetY1: number;
      targetX2: number;
      targetY2: number;
      color: string;
      lineWidth: number;
      steps: number;
      offsets: number[] = [];

      constructor(w: number, h: number) {
        this.x1 = Math.random() * w;
        this.y1 = Math.random() * h;
        const len = 150 + Math.random() * 250;
        const angle = Math.random() * Math.PI * 2;
        this.x2 = this.x1 + Math.cos(angle) * len;
        this.y2 = this.y1 + Math.sin(angle) * len;

        this.targetX1 = this.x1;
        this.targetY1 = this.y1;
        this.targetX2 = this.x2;
        this.targetY2 = this.y2;

        this.lineWidth = 1 + Math.random() * 1.5;
        this.color = `rgba(0, 229, 255, ${0.12 + Math.random() * 0.18})`;
        this.steps = 15 + Math.floor(Math.random() * 15);
        
        for (let i = 0; i <= this.steps; i++) {
          this.offsets.push((Math.random() - 0.5) * 20);
        }
      }

      update(w: number, h: number) {
        // Slowly move targets
        if (Math.random() < 0.015) {
          this.targetX1 = Math.random() * w;
          this.targetY1 = Math.random() * h;
          const len = 150 + Math.random() * 250;
          const angle = Math.random() * Math.PI * 2;
          this.targetX2 = this.targetX1 + Math.cos(angle) * len;
          this.targetY2 = this.targetY1 + Math.sin(angle) * len;
        }

        // Interpolate slowly towards targets (0.003 is very slow and smooth)
        this.x1 += (this.targetX1 - this.x1) * 0.003;
        this.y1 += (this.targetY1 - this.y1) * 0.003;
        this.x2 += (this.targetX2 - this.x2) * 0.003;
        this.y2 += (this.targetY2 - this.y2) * 0.003;

        // Shift offsets slowly for a writhing, electric plasma look
        for (let i = 0; i <= this.steps; i++) {
          this.offsets[i] += (Math.random() - 0.5) * 1.5;
          if (this.offsets[i] > 35) this.offsets[i] = 35;
          if (this.offsets[i] < -35) this.offsets[i] = -35;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.strokeStyle = this.color;
        c.lineWidth = this.lineWidth;
        c.shadowColor = '#00e5ff';
        c.shadowBlur = 14;
        c.beginPath();

        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;

        c.moveTo(this.x1, this.y1);

        for (let i = 1; i < this.steps; i++) {
          const t = i / this.steps;
          const bx = this.x1 + dx * t;
          const by = this.y1 + dy * t;
          
          const offset = this.offsets[i] * (1 - Math.abs(t - 0.5) * 2);
          const px = bx + Math.cos(perpAngle) * offset;
          const py = by + Math.sin(perpAngle) * offset;

          c.lineTo(px, py);
        }

        c.lineTo(this.x2, this.y2);
        c.stroke();

        // Branching sparks branching out
        if (Math.random() < 0.1) {
          const splitIdx = Math.floor(this.steps * 0.3) + Math.floor(Math.random() * (this.steps * 0.4));
          const t = splitIdx / this.steps;
          const bx = this.x1 + dx * t;
          const by = this.y1 + dy * t;
          const offset = this.offsets[splitIdx] * (1 - Math.abs(t - 0.5) * 2);
          const px = bx + Math.cos(perpAngle) * offset;
          const py = by + Math.sin(perpAngle) * offset;

          c.strokeStyle = `rgba(0, 229, 255, ${parseFloat(this.color.split(',')[3]) * 0.5})`;
          c.lineWidth = this.lineWidth * 0.5;
          c.beginPath();
          c.moveTo(px, py);
          
          let cx = px;
          let cy = py;
          const branchAngle = angle + (Math.random() - 0.5) * 1.6;
          const branchSteps = 5;
          const branchLength = 40 + Math.random() * 40;

          for (let j = 1; j <= branchSteps; j++) {
            const bt = j / branchSteps;
            const targetX = px + Math.cos(branchAngle) * branchLength * bt;
            const targetY = py + Math.sin(branchAngle) * branchLength * bt;
            const bAngle = branchAngle + Math.PI / 2;
            const bJitter = (Math.random() - 0.5) * 8 * (1 - bt);
            cx = targetX + Math.cos(bAngle) * bJitter;
            cy = targetY + Math.sin(bAngle) * bJitter;
            c.lineTo(cx, cy);
          }
          c.stroke();
        }
      }
    }

    // Set up 8 slow plasma arcs to keep the background clustered
    const arcs: PlasmaArc[] = [];
    const arcCount = 8;
    for (let i = 0; i < arcCount; i++) {
      arcs.push(new PlasmaArc(canvas.width, canvas.height));
    }

    const render = () => {
      // Mild clear for glowing trails
      ctx.fillStyle = 'rgba(2, 7, 18, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw persistent electrical streams
      for (const arc of arcs) {
        arc.update(canvas.width, canvas.height);
        arc.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.4,
      }}
    />
  );
}
