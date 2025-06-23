import React, { useEffect, useRef, useState } from 'react';
import './RadarLanding.css';

const RadarLanding = () => {
  const canvasRef = useRef(null);
  const [hudTexts, setHudTexts] = useState([
    { id: 1, text: '', fullText: 'RADAR SWEEP: 360° ACTIVE', position: 'top-left' },
    { id: 2, text: '', fullText: 'TRACKING: 12 CONTACTS', position: 'top-right' },
    { id: 3, text: '', fullText: 'DOPPLER SHIFT: +2.3 KHZ', position: 'bottom-left' },
    { id: 4, text: '', fullText: 'RANGE: 50 NAUTICAL MILES', position: 'bottom-right' },
    { id: 5, text: '', fullText: 'AZIMUTH: 045° BEARING', position: 'mid-left' },
    { id: 6, text: '', fullText: 'PULSE WIDTH: 1.2 MICROSEC', position: 'mid-right' }
  ]);
  const [reticle, setReticle] = useState({ x: 50, y: 50, focusing: false, locked: false });
  const prevReticlePos = useRef({ x: 50, y: 50 });
  const mousePos = useRef({ x: 0, y: 0 });
  const [radarDot, setRadarDot] = useState({ visible: false, x: 0, y: 0 });
  const [ellipses, setEllipses] = useState('.');
  const [reticleTrail, setReticleTrail] = useState({ visible: false, fromX: 50, fromY: 50, toX: 50, toY: 50 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Ensure canvas dimensions are set
    canvas.width = 800;
    canvas.height = 800;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    let angle = 0;
    const trailLength = 60;
    const angleHistory = [];
    let lastDetectionTime = 0;

    const animate = () => {
      // Clear canvas with slight fade effect
      ctx.fillStyle = 'rgba(0, 20, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      ctx.strokeStyle = '#00cc00';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Store current angle
      angleHistory.push(angle);
      if (angleHistory.length > trailLength) {
        angleHistory.shift();
      }

      // Draw fading trail
      angleHistory.forEach((historyAngle, index) => {
        const opacity = index / angleHistory.length;
        const x = centerX + Math.cos(historyAngle) * radius;
        const y = centerY + Math.sin(historyAngle) * radius;
        
        ctx.strokeStyle = `rgba(0, 204, 0, ${opacity * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // Check if sweep passes over mouse position
      const rect = canvas.getBoundingClientRect();
      const canvasMouseX = mousePos.current.x - rect.left;
      const canvasMouseY = mousePos.current.y - rect.top;
      const mouseDistFromCenter = Math.sqrt(
        Math.pow(canvasMouseX - centerX, 2) + 
        Math.pow(canvasMouseY - centerY, 2)
      );
      
      if (mouseDistFromCenter <= radius && mouseDistFromCenter > 20) {
        const mouseAngle = Math.atan2(canvasMouseY - centerY, canvasMouseX - centerX);
        
        // Normalize both angles to [0, 2π]
        const normalizedSweepAngle = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        const normalizedMouseAngle = ((mouseAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        
        // Calculate the shortest angular distance
        let angleDiff = Math.abs(normalizedSweepAngle - normalizedMouseAngle);
        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff;
        }
        
        if (angleDiff < 0.1 && Date.now() - lastDetectionTime > 2100) {
          const detectedX = mousePos.current.x;
          const detectedY = mousePos.current.y;
          setRadarDot({ visible: true, x: detectedX, y: detectedY });
          lastDetectionTime = Date.now();
          setTimeout(() => setRadarDot(prev => ({ ...prev, visible: false })), 2000);
        }
      }

      // Draw main rotating line
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.strokeStyle = '#00cc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      angle += 0.02;
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  useEffect(() => {
    const typeText = (index = 0) => {
      if (index >= hudTexts.length) {
        setTimeout(() => typeText(0), 3000);
        return;
      }
      
      const currentHud = hudTexts[index];
      let charIndex = 0;
      
      const typeChar = () => {
        if (charIndex <= currentHud.fullText.length) {
          setHudTexts(prev => prev.map(hud => 
            hud.id === currentHud.id 
              ? { ...hud, text: currentHud.fullText.slice(0, charIndex) }
              : hud
          ));
          charIndex++;
          setTimeout(typeChar, 50);
        } else {
          setTimeout(() => typeText(index + 1), 800);
        }
      };
      
      typeChar();
    };
    
    typeText();
  }, []);

  useEffect(() => {
    const moveReticle = () => {
      const newX = Math.random() * 90 + 5;
      const newY = Math.random() * 90 + 5;
      
      setReticleTrail({ visible: true, fromX: prevReticlePos.current.x, fromY: prevReticlePos.current.y, toX: newX, toY: newY });
      prevReticlePos.current = { x: newX, y: newY };
      setReticle({ x: newX, y: newY, focusing: false });
      
      setTimeout(() => setReticleTrail(prev => ({ ...prev, visible: false })), 3500);
      
      setTimeout(() => {
        setReticle(prev => ({ ...prev, focusing: true }));
      }, 500);
      
      setTimeout(() => {
        setReticle(prev => ({ ...prev, locked: true }));
      }, 1250);
      
      setTimeout(() => {
        setReticle(prev => ({ ...prev, locked: false }));
      }, 2750);
      
      setTimeout(() => {
        setReticle(prev => ({ ...prev, focusing: false }));
      }, 3000);
    };
    
    const interval = setInterval(moveReticle, 4000);
    moveReticle();
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animateEllipses = () => {
      setEllipses(prev => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    };
    
    const interval = setInterval(animateEllipses, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="radar-container">
      <div 
        className="topographic-bg"
        style={{
          '--mouse-x': `${mousePos.current.x}px`,
          '--mouse-y': `${mousePos.current.y}px`
        }}
      ></div>
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="radar-canvas"
      />
      {radarDot.visible && (
        <div 
          className="radar-dot"
          style={{
            left: `${radarDot.x}px`,
            top: `${radarDot.y}px`
          }}
        ></div>
      )}
      <div className="radar-overlay">
        <h1>RaDAR Landing</h1>
        <p>Scanning for targets<span className="ellipses">{ellipses}</span></p>
      </div>
      <div className="hud-display">
        {hudTexts.map(hud => (
          <div key={hud.id} className={`hud-text ${hud.position}`}>
            {hud.text}<span className="cursor">_</span>
          </div>
        ))}
      </div>
      <div 
        className={`reticle ${reticle.focusing ? 'focusing' : ''} ${reticle.locked ? 'locked' : ''}`}
        style={{ left: `${reticle.x}%`, top: `${reticle.y}%` }}
      >
        <div className="corner tl"></div>
        <div className="corner tr"></div>
        <div className="corner bl"></div>
        <div className="corner br"></div>
        <div className="reticle-inner"></div>
        {reticle.locked && (
          <div className="locked-text">LOCKED ON!</div>
        )}
      </div>
      {reticleTrail.visible && (
        <div 
          className="reticle-trail-line"
          style={{
            left: `${reticleTrail.fromX}%`,
            top: `${reticleTrail.fromY}%`,
            width: `${Math.sqrt(
              Math.pow((reticleTrail.toX - reticleTrail.fromX) * window.innerWidth / 100, 2) +
              Math.pow((reticleTrail.toY - reticleTrail.fromY) * window.innerHeight / 100, 2)
            )}px`,
            transform: `rotate(${Math.atan2(
              (reticleTrail.toY - reticleTrail.fromY) * window.innerHeight / 100,
              (reticleTrail.toX - reticleTrail.fromX) * window.innerWidth / 100
            )}rad)`
          }}
        ></div>
      )}
      <div 
        className="range-line"
        style={{
          left: '50%',
          top: '50%',
          width: `${Math.sqrt(
            Math.pow((reticle.x - 50) * window.innerWidth / 100, 2) +
            Math.pow((reticle.y - 50) * window.innerHeight / 100, 2)
          )}px`,
          transform: `rotate(${Math.atan2(
            (reticle.y - 50) * window.innerHeight / 100,
            (reticle.x - 50) * window.innerWidth / 100
          )}rad)`
        }}
      ></div>
      <div className="crosshair-lines">
        <div className="crosshair-h-left" style={{ 
          top: `${reticle.y}%`, 
          width: `${reticle.x}%`
        }}></div>
        <div className="crosshair-h-right" style={{ 
          top: `${reticle.y}%`, 
          width: `${100 - reticle.x}%`
        }}></div>
        <div className="crosshair-v-top" style={{ 
          left: `${reticle.x}%`, 
          height: `${reticle.y}%`
        }}></div>
        <div className="crosshair-v-bottom" style={{ 
          left: `${reticle.x}%`, 
          height: `${100 - reticle.y}%`
        }}></div>
      </div>
    </div>
  );
};

export default RadarLanding;