'use client';
import AppNav from "./AppNav";

export default function Header() {
  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 40, 
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 0' }}>
        <AppNav />
      </div>
    </header>
  );
} 