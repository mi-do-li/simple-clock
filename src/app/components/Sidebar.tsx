import React from "react";

interface Theme {
  bg: string;
  color: string;
  sec: string;
}

interface SidebarProps {
  open: boolean;
  onNavigate: (page: string) => void;
  active: string;
  theme: Theme;
}

export default function Sidebar({ open, onNavigate, active, theme }: SidebarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: open ? 0 : '-260px',
        width: 260,
        height: '100vh',
        background: `linear-gradient(135deg, ${theme.bg} 80%, ${theme.sec} 120%)`,
        color: theme.color,
        boxShadow: open ? `-4px 0 24px ${theme.sec}33` : 'none',
        borderLeft: `2px solid ${theme.sec}`,
        zIndex: 199,
        transition: 'right 0.3s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 18px 18px 18px',
      }}
    >
      <div style={{fontWeight:700,fontSize:'1.2em',marginBottom:24,textAlign:'center',width:'100%',color:theme.color}}>メニュー</div>
      <div style={{display:'flex',flexDirection:'column',gap:18,alignItems:'center',width:'100%'}}>
        <button onClick={()=>onNavigate('home')} style={{width:'100%',fontWeight:active==='home'?700:400,background:active==='home'?theme.sec:theme.bg,color:active==='home'?theme.bg:theme.color,border:`2px solid ${theme.sec}`,padding:'12px 0',borderRadius:8,cursor:'pointer',transition:'background 0.2s,color 0.2s,border 0.2s',boxShadow:active==='home'?`0 2px 8px ${theme.sec}33`:'none',marginBottom:10}}>ホーム（現在時刻）</button>
        <button onClick={()=>onNavigate('fullscreen')} style={{width:'100%',fontWeight:active==='fullscreen'?700:400,background:active==='fullscreen'?theme.color:theme.bg,color:active==='fullscreen'?theme.bg:theme.color,border:`2px solid ${theme.color}`,padding:'12px 0',borderRadius:8,cursor:'pointer',transition:'background 0.2s,color 0.2s,border 0.2s',boxShadow:active==='fullscreen'?`0 2px 8px ${theme.color}33`:'none',marginTop:18}}>全画面</button>
        <button onClick={()=>onNavigate('settings')} style={{width:'100%',fontWeight:active==='settings'?700:400,background:active==='settings'?theme.color:theme.bg,color:active==='settings'?theme.bg:theme.color,border:`2px solid ${theme.color}`,padding:'12px 0',borderRadius:8,cursor:'pointer',transition:'background 0.2s,color 0.2s,border 0.2s',boxShadow:active==='settings'?`0 2px 8px ${theme.color}33`:'none'}}>設定</button>
      </div>
    </div>
  );
} 