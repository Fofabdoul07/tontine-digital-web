import { useState, useEffect, useCallback } from 'react';
import * as API from './api';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#060E1A', card: '#0D1E30', border: '#15304A',
  gold: '#E8A020', goldL: '#FFD080',
  green: '#00C896', red: '#FF4D6A', blue: '#1E90D4',
  text: '#EEF4FF', sub: '#6B8BAA',
  wave: '#00B4D8', orange: '#FF6B35', mtn: '#FFCC00',
};

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const fmtShort = (n) => {
  n = Number(n || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return n;
};

// ─── COMPOSANTS PARTAGÉS ──────────────────────────────────────────────────────
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 14, ...style,
    cursor: onClick ? 'pointer' : 'default',
  }}>{children}</div>
);

const Btn = ({ children, onClick, color, outline, style, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '13px 20px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    border: outline ? `1.5px solid ${color || C.gold}` : 'none',
    background: outline ? 'transparent' : `linear-gradient(135deg, ${color || C.gold}, ${color ? color + 'cc' : '#b87000'})`,
    color: outline ? (color || C.gold) : (color === C.green ? '#fff' : C.bg),
    fontWeight: 800, fontSize: 14, fontFamily: 'Syne, sans-serif',
    opacity: disabled ? 0.6 : 1, width: '100%', ...style,
  }}>{children}</button>
);

const Input = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ color: C.sub, fontSize: 11, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif' }} />
  </div>
);

const Badge = ({ status }) => {
  const map = {
    active: { label: 'Actif', c: C.green }, actif: { label: 'Actif', c: C.green },
    paused: { label: 'Pause', c: C.gold }, completed: { label: 'Confirmé', c: C.green },
    failed: { label: 'Échoué', c: C.red }, processing: { label: 'En cours', c: C.blue },
    pending: { label: 'En attente', c: C.gold },
  };
  const s = map[status] || { label: status, c: C.sub };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.c + '25', color: s.c }}>{s.label}</span>;
};

const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
    background: type === 'error' ? C.red : C.green,
    color: '#fff', padding: '12px 24px', borderRadius: 12,
    fontWeight: 700, fontSize: 13, zIndex: 9999,
    boxShadow: `0 8px 32px ${type === 'error' ? C.red : C.green}50`,
  }}>{msg}</div>
);

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at 30% 20%, #0d2240 0%, ${C.bg} 65%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 100, height: 100, borderRadius: 26, background: `linear-gradient(135deg,${C.gold},#b87000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `0 24px 80px ${C.gold}50`, fontSize: 52 }}>🤝</div>
      <h1 style={{ color: C.text, fontSize: 42, fontWeight: 900, fontFamily: 'Syne, sans-serif', letterSpacing: -2, margin: '0 0 6px' }}>TONTINE</h1>
      <span style={{ color: C.gold, fontSize: 14, letterSpacing: 8, fontWeight: 700 }}>DIGITAL</span>
      <p style={{ color: C.sub, marginTop: 40, fontSize: 13 }}>Chargement…</p>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function Auth({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async () => {
    if (!phone || !password) return showToast('Remplissez tous les champs', 'error');
    setLoading(true);
    try {
      const res = await API.login(phone, password);
      API.saveToken(res.access_token);
      onLogin(res.user);
    } catch (e) {
      showToast(e.message, 'error');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name || !phone || !password) return showToast('Nom, téléphone et mot de passe obligatoires', 'error');
    setLoading(true);
    try {
      const res = await API.signup(name, phone, password, email);
      API.saveToken(res.access_token);
      onLogin(res.user);
    } catch (e) {
      showToast(e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at 40% 10%, #0d2240 0%, ${C.bg} 65%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {toast && <Toast {...toast} />}
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${C.gold},#b87000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 34 }}>🤝</div>
          <h1 style={{ color: C.text, fontSize: 30, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: '0 0 6px' }}>TONTINE DIGITAL</h1>
          <p style={{ color: C.sub, fontSize: 13 }}>L'épargne collective, réinventée</p>
        </div>

        <Card style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['login', 'Connexion'], ['signup', 'Inscription']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '10px', background: tab === id ? C.gold : 'transparent',
                border: `1.5px solid ${tab === id ? C.gold : C.border}`, borderRadius: 10,
                color: tab === id ? C.bg : C.sub, fontWeight: 800, cursor: 'pointer',
                fontSize: 13, fontFamily: 'Syne, sans-serif',
              }}>{label}</button>
            ))}
          </div>

          {tab === 'login' ? (
            <>
              <Input label="Numéro de téléphone" value={phone} onChange={setPhone} placeholder="Ex: 0621234567" type="tel" />
              <Input label="Mot de passe" value={password} onChange={setPassword} placeholder="Votre mot de passe" type="password" />
              <Btn onClick={handleLogin} disabled={loading}>{loading ? 'Connexion…' : 'Se connecter →'}</Btn>
            </>
          ) : (
            <>
              <Input label="Nom complet" value={name} onChange={setName} placeholder="Jean Dupont" />
              <Input label="Numéro de téléphone" value={phone} onChange={setPhone} placeholder="Ex: 0621234567" type="tel" />
              <Input label="Email (optionnel)" value={email} onChange={setEmail} placeholder="jean@email.com" type="email" />
              <Input label="Mot de passe" value={password} onChange={setPassword} placeholder="Min. 6 caractères" type="password" />
              <Btn onClick={handleSignup} color={C.green} disabled={loading}>{loading ? 'Création…' : 'Créer mon compte →'}</Btn>
            </>
          )}
        </Card>

        <p style={{ color: C.sub, textAlign: 'center', fontSize: 12, marginTop: 20 }}>
          Paiements sécurisés via Wave · Orange Money · MTN MoMo
        </p>
      </div>
    </div>
  );
}

// ─── SIDEBAR (desktop) ────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, onLogout }) {
  const items = [
    { id: 'dashboard', icon: '⊞', label: 'Tableau de bord' },
    { id: 'tontines', icon: '◎', label: 'Mes Tontines' },
    { id: 'paiements', icon: '↕', label: 'Paiements' },
    { id: 'admin', icon: '🔑', label: 'Administration' },
  ];
  return (
    <div style={{ width: 240, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${C.gold},#b87000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤝</div>
          <div>
            <p style={{ color: C.text, fontWeight: 900, margin: 0, fontSize: 14, fontFamily: 'Syne, sans-serif' }}>TONTINE</p>
            <p style={{ color: C.gold, fontWeight: 700, margin: 0, fontSize: 9, letterSpacing: 3 }}>DIGITAL</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 10px' }}>
        {items.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: '100%', display: 'flex', gap: 12, alignItems: 'center', padding: '11px 14px',
            background: active === item.id ? C.gold + '18' : 'none',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            color: active === item.id ? C.gold : C.sub,
            fontWeight: active === item.id ? 700 : 400,
            fontSize: 13, marginBottom: 4, textAlign: 'left',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},#b87000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bg, fontWeight: 900, fontSize: 13 }}>
            {user?.name?.[0] || '?'}
          </div>
          <div>
            <p style={{ color: C.text, fontWeight: 700, margin: 0, fontSize: 12 }}>{user?.name}</p>
            <p style={{ color: C.sub, margin: 0, fontSize: 10 }}>{user?.phone}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '9px', background: C.red + '18', border: `1px solid ${C.red}30`, borderRadius: 10, color: C.red, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, setActive }) {
  const [tontines, setTontines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.getTontines(), API.getPaymentHistory()])
      .then(([t, p]) => { setTontines(t); setTransactions(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = tontines.reduce((a, t) => a + (t.total_collected || 0), 0);
  const activeTontines = tontines.filter(t => t.status === 'active').length;

  return (
    <div style={{ padding: '32px 32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: '0 0 4px' }}>
          Bonsoir, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: C.sub, fontSize: 14, margin: 0 }}>Voici votre résumé Tontine Digital</p>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Épargne totale', value: fmt(totalCollected), color: C.gold, icon: '💰' },
              { label: 'Tontines actives', value: activeTontines, color: C.green, icon: '◎' },
              { label: 'Transactions', value: transactions.length, color: C.blue, icon: '↕' },
            ].map(s => (
              <Card key={s.label} style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: C.sub, fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                    <p style={{ color: s.color, fontSize: 24, fontWeight: 900, margin: 0, fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions rapides */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <Btn onClick={() => setActive('tontines')} style={{ flex: 1 }}>+ Créer une tontine</Btn>
            <Btn onClick={() => setActive('paiements')} color={C.green} style={{ flex: 1 }}>↑ Payer une cotisation</Btn>
          </div>

          {/* Mes tontines */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: 0 }}>Mes Tontines</h2>
              <button onClick={() => setActive('tontines')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 13, cursor: 'pointer' }}>Voir tout →</button>
            </div>
            {tontines.length === 0 ? (
              <Card style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 32 }}>◎</p>
                <p style={{ color: C.sub, fontSize: 14 }}>Aucune tontine. Créez-en une !</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {tontines.slice(0, 4).map(t => (
                  <Card key={t.id} style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <p style={{ color: C.text, fontWeight: 700, margin: 0, fontSize: 14 }}>{t.name}</p>
                        <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>{t.member_count} membres · {t.frequency}</p>
                      </div>
                      <Badge status={t.status} />
                    </div>
                    <p style={{ color: C.gold, fontWeight: 800, margin: '0 0 8px', fontSize: 16 }}>{fmt(t.total_collected)}</p>
                    <div style={{ background: C.border, borderRadius: 3, height: 4 }}>
                      <div style={{ background: `linear-gradient(90deg,${C.gold},${C.goldL})`, width: `${Math.min(((t.current_tour || 1) / (t.total_tours || 1)) * 100, 100)}%`, height: '100%', borderRadius: 3 }} />
                    </div>
                    <p style={{ color: C.sub, fontSize: 10, margin: '5px 0 0' }}>Tour {t.current_tour || 1} / {t.total_tours || 1}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Dernières transactions */}
          <div>
            <h2 style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: '0 0 14px' }}>Transactions récentes</h2>
            {transactions.length === 0 ? (
              <Card style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ color: C.sub }}>Aucune transaction pour le moment</p>
              </Card>
            ) : transactions.slice(0, 5).map(t => (
              <Card key={t.id} style={{ padding: '13px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.status === 'completed' ? C.green + '20' : C.red + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.status === 'completed' ? C.green : C.red, fontSize: 16 }}>
                    {t.status === 'completed' ? '✓' : '✗'}
                  </div>
                  <div>
                    <p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 13 }}>{t.description || 'Cotisation tontine'}</p>
                    <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>
                      {t.payment_method?.toUpperCase()} · {new Date(t.initiated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: C.text, fontWeight: 700, margin: 0 }}>{fmt(t.amount)}</p>
                  <Badge status={t.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TONTINES ─────────────────────────────────────────────────────────────────
function Tontines() {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'Mensuel', total_tours: '', description: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setTontines(await API.getTontines()); }
    catch (e) { showToast('Erreur chargement', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name || !form.amount) return showToast('Nom et montant obligatoires', 'error');
    try {
      await API.createTontine({ ...form, amount: parseFloat(form.amount), total_tours: parseInt(form.total_tours) || 1 });
      showToast('Tontine créée avec succès !');
      setShowCreate(false);
      setForm({ name: '', amount: '', frequency: 'Mensuel', total_tours: '', description: '' });
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const loadDetail = async (id) => {
    try { setSelected(await API.getTontine(id)); }
    catch (e) { showToast('Erreur', 'error'); }
  };

  if (selected) return (
    <div style={{ padding: '32px 32px', maxWidth: 800 }}>
      {toast && <Toast {...toast} />}
      <button onClick={() => setSelected(null)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', color: C.text, cursor: 'pointer', marginBottom: 20, fontSize: 13 }}>← Retour</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: 0 }}>{selected.name}</h1>
        <Badge status={selected.status} />
      </div>
      <Card style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.gold},#b87000)`, border: 'none', marginBottom: 20 }}>
        <p style={{ color: '#5a3800', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Cagnotte totale</p>
        <h2 style={{ color: C.bg, fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: '0 0 12px' }}>{fmt(selected.total_collected)}</h2>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Cotisation', fmt(selected.amount)], ['Fréquence', selected.frequency], ['Membres', selected.member_count], ['Tour', `${selected.current_tour}/${selected.total_tours}`]].map(([l, v]) => (
            <div key={l}><p style={{ color: '#5a3800', fontSize: 10, margin: 0 }}>{l}</p><p style={{ color: C.bg, fontWeight: 800, margin: 0 }}>{v}</p></div>
          ))}
        </div>
      </Card>
      <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: '0 0 12px' }}>Membres ({selected.members?.length || 0})</h3>
      {(selected.members || []).map(m => (
        <Card key={m.id} style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.blue + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontWeight: 700 }}>{m.name?.[0]}</div>
            <div>
              <p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 13 }}>{m.name}</p>
              <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>Tour #{m.tour_number} · {m.phone}</p>
            </div>
          </div>
          <Badge status={m.has_paid ? 'completed' : 'pending'} />
        </Card>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '32px 32px', maxWidth: 900 }}>
      {toast && <Toast {...toast} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: 0 }}>Mes Tontines</h1>
        <Btn onClick={() => setShowCreate(!showCreate)} style={{ width: 'auto', padding: '11px 20px' }}>+ Créer une tontine</Btn>
      </div>

      {showCreate && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: C.text, fontFamily: 'Syne, sans-serif', margin: '0 0 16px', fontSize: 16 }}>Nouveau groupe</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nom du groupe" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Famille Diallo" />
            <Input label="Montant par tour (FCFA)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="Ex: 50000" type="number" />
            <Input label="Nombre de tours" value={form.total_tours} onChange={v => setForm(f => ({ ...f, total_tours: v }))} placeholder="Ex: 8" type="number" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: C.sub, fontSize: 11, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fréquence</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none' }}>
                {['Hebdomadaire', 'Mensuel', 'Trimestriel'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <Input label="Description (optionnel)" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Objectif du groupe..." />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={handleCreate} color={C.green}>✓ Créer le groupe</Btn>
            <Btn onClick={() => setShowCreate(false)} outline>Annuler</Btn>
          </div>
        </Card>
      )}

      {loading ? <Loader /> : tontines.length === 0 ? (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>◎</p>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Aucune tontine pour le moment</p>
          <p style={{ color: C.sub, fontSize: 13 }}>Créez votre premier groupe d'épargne</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {tontines.map(t => (
            <Card key={t.id} onClick={() => loadDetail(t.id)} style={{ padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: C.gold + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold, fontWeight: 900, fontSize: 18 }}>{t.name?.[0]}</div>
                  <div>
                    <p style={{ color: C.text, fontWeight: 700, margin: 0 }}>{t.name}</p>
                    <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>{t.member_count} membres · {t.frequency}</p>
                  </div>
                </div>
                <Badge status={t.status} />
              </div>
              <p style={{ color: C.gold, fontWeight: 900, fontSize: 20, fontFamily: 'Syne, sans-serif', margin: '0 0 10px' }}>{fmt(t.total_collected)}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.sub, marginBottom: 8 }}>
                <span>Cotisation: {fmt(t.amount)}</span>
                <span>Tour {t.current_tour}/{t.total_tours}</span>
              </div>
              <div style={{ background: C.border, borderRadius: 3, height: 4 }}>
                <div style={{ background: `linear-gradient(90deg,${C.gold},${C.goldL})`, width: `${Math.min(((t.current_tour || 1) / (t.total_tours || 1)) * 100, 100)}%`, height: '100%', borderRadius: 3 }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PAIEMENTS ────────────────────────────────────────────────────────────────
function Paiements({ user }) {
  const [tab, setTab] = useState('payer');
  const [tontines, setTontines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ tontine_id: '', amount: '', payment_method: 'wave', phone_number: '' });

  const ADMIN = { wave: '0747429889', orange: '0555471974', mtn: '0747429889' };
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    Promise.all([API.getTontines(), API.getPaymentHistory()])
      .then(([t, p]) => { setTontines(t); setTransactions(p); })
      .catch(() => {});
  }, []);

  const handlePay = async () => {
    if (!form.amount || !form.phone_number) return showToast('Remplissez tous les champs', 'error');
    setLoading(true);
    try {
      const res = await API.initiatePayment({ ...form, amount: parseFloat(form.amount), tontine_id: form.tontine_id || null });
      showToast(`✅ ${res.message}`);
      setStep(1);
      setForm({ tontine_id: '', amount: '', payment_method: 'wave', phone_number: '' });
      const p = await API.getPaymentHistory();
      setTransactions(p);
      setTab('historique');
    } catch (e) { showToast(e.message, 'error'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px 32px', maxWidth: 860 }}>
      {toast && <Toast {...toast} />}
      <h1 style={{ color: C.text, fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: '0 0 24px' }}>Paiements</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['payer', '↑ Payer une cotisation'], ['historique', '📋 Historique']].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setStep(1); }} style={{
            padding: '10px 20px', background: tab === id ? C.gold : C.card,
            border: `1.5px solid ${tab === id ? C.gold : C.border}`, borderRadius: 10,
            color: tab === id ? C.bg : C.sub, fontWeight: 700, cursor: 'pointer', fontSize: 13,
          }}>{label}</button>
        ))}
      </div>

      {tab === 'payer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <Card style={{ padding: 24 }}>
            {/* Étapes */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? C.gold : C.border }} />
              ))}
            </div>

            {step === 1 && (
              <>
                <h3 style={{ color: C.text, fontFamily: 'Syne, sans-serif', margin: '0 0 16px' }}>Montant & Groupe</h3>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: C.sub, fontSize: 11, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Groupe (optionnel)</label>
                  <select value={form.tontine_id} onChange={e => setForm(f => ({ ...f, tontine_id: e.target.value, amount: tontines.find(t => String(t.id) === e.target.value)?.amount || f.amount }))}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none' }}>
                    <option value="">Paiement libre</option>
                    {tontines.map(t => <option key={t.id} value={t.id}>{t.name} — {fmt(t.amount)}</option>)}
                  </select>
                </div>
                <Input label="Montant (FCFA)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="Ex: 50000" type="number" />
                <Btn onClick={() => { if (!form.amount) return showToast('Entrez un montant', 'error'); setStep(2); }}>Suivant →</Btn>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ color: C.text, fontFamily: 'Syne, sans-serif', margin: '0 0 16px' }}>Méthode de paiement</h3>
                {[
                  { id: 'wave', label: 'Wave', color: C.wave, icon: '〰', num: ADMIN.wave },
                  { id: 'orange', label: 'Orange Money', color: C.orange, icon: '◍', num: ADMIN.orange },
                  { id: 'mtn', label: 'MTN MoMo', color: C.mtn, icon: '◈', num: ADMIN.mtn },
                ].map(m => (
                  <div key={m.id} onClick={() => setForm(f => ({ ...f, payment_method: m.id }))} style={{
                    background: form.payment_method === m.id ? m.color + '15' : C.bg,
                    border: `1.5px solid ${form.payment_method === m.id ? m.color : C.border}`,
                    borderRadius: 12, padding: '13px 16px', marginBottom: 8, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: m.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, fontSize: 18 }}>{m.icon}</div>
                      <div>
                        <p style={{ color: C.text, fontWeight: 700, margin: 0, fontSize: 13 }}>{m.label}</p>
                        <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>Admin: {m.num}</p>
                      </div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${form.payment_method === m.id ? m.color : C.border}`, background: form.payment_method === m.id ? m.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {form.payment_method === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.bg }} />}
                    </div>
                  </div>
                ))}
                <Input label="Votre numéro de téléphone" value={form.phone_number} onChange={v => setForm(f => ({ ...f, phone_number: v }))} placeholder="Ex: 0621234567" type="tel" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => setStep(1)} outline style={{ flex: 1 }}>← Retour</Btn>
                  <Btn onClick={() => { if (!form.phone_number) return showToast('Entrez votre numéro', 'error'); setStep(3); }} style={{ flex: 2 }}>Suivant →</Btn>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 style={{ color: C.text, fontFamily: 'Syne, sans-serif', margin: '0 0 16px' }}>Confirmer</h3>
                <Card style={{ padding: 16, marginBottom: 14, background: C.bg }}>
                  {[['Montant', fmt(form.amount)], ['Méthode', form.payment_method?.toUpperCase()], ['Compte admin', ADMIN[form.payment_method]], ['Votre numéro', form.phone_number], ['Frais', '0 FCFA']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: C.sub, fontSize: 13 }}>{l}</span>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.text, fontWeight: 800 }}>Total</span>
                    <span style={{ color: C.gold, fontWeight: 900, fontSize: 16 }}>{fmt(form.amount)}</span>
                  </div>
                </Card>
                <div style={{ background: C.blue + '12', border: `1px solid ${C.blue}30`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <p style={{ color: C.blue, fontSize: 11, margin: 0 }}>ℹ️ Paiement vers le compte {form.payment_method?.toUpperCase()} : <strong>{ADMIN[form.payment_method]}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => setStep(2)} outline style={{ flex: 1 }}>← Retour</Btn>
                  <Btn onClick={handlePay} color={C.green} disabled={loading} style={{ flex: 2 }}>{loading ? 'Traitement…' : '✓ Confirmer le paiement'}</Btn>
                </div>
              </>
            )}
          </Card>

          {/* Info */}
          <div>
            <Card style={{ padding: 20, marginBottom: 14 }}>
              <p style={{ color: C.text, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: '0 0 12px' }}>Comptes administrateur</p>
              {[{ m: 'Wave', n: ADMIN.wave, c: C.wave }, { m: 'Orange', n: ADMIN.orange, c: C.orange }, { m: 'MTN', n: ADMIN.mtn, c: C.mtn }].map(a => (
                <div key={a.m} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: C.sub, fontSize: 12 }}>{a.m}</span>
                  <span style={{ color: a.c, fontWeight: 700, fontSize: 12 }}>{a.n}</span>
                </div>
              ))}
            </Card>
            <Card style={{ padding: 20, background: C.green + '10', border: `1px solid ${C.green}20` }}>
              <p style={{ color: C.green, fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>✓ Paiements sécurisés</p>
              <p style={{ color: C.sub, fontSize: 11, margin: 0, lineHeight: 1.6 }}>Vos paiements sont automatiquement routés vers les comptes administrateur configurés. Frais de service : 0%</p>
            </Card>
          </div>
        </div>
      )}

      {tab === 'historique' && (
        transactions.length === 0 ? (
          <Card style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ color: C.sub, fontSize: 14 }}>Aucune transaction pour le moment</p>
          </Card>
        ) : transactions.map(t => (
          <Card key={t.id} style={{ padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.status === 'completed' ? C.green + '20' : C.red + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.status === 'completed' ? C.green : C.red, fontSize: 18 }}>
                {t.status === 'completed' ? '✓' : '✗'}
              </div>
              <div>
                <p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 13 }}>{t.reference}</p>
                <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>
                  {t.payment_method?.toUpperCase()} → {t.receiver_phone} · {new Date(t.initiated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C.text, fontWeight: 700, margin: 0 }}>{fmt(t.amount)}</p>
              <Badge status={t.status} />
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('stats');

  useEffect(() => {
    Promise.all([API.getAdminStats(), API.getAdminUsers(), API.getAdminTransactions()])
      .then(([s, u, t]) => { setStats(s); setUsers(u); setTransactions(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '32px 32px', maxWidth: 960 }}>
      <h1 style={{ color: C.text, fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: '0 0 24px' }}>Administration</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['stats', 'Vue d\'ensemble'], ['users', 'Utilisateurs'], ['transactions', 'Transactions']].map(([id, label]) => (
          <button key={id} onClick={() => setAdminTab(id)} style={{
            padding: '9px 18px', background: adminTab === id ? C.gold : C.card,
            border: `1.5px solid ${adminTab === id ? C.gold : C.border}`, borderRadius: 10,
            color: adminTab === id ? C.bg : C.sub, fontWeight: 700, cursor: 'pointer', fontSize: 13,
          }}>{label}</button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <>
          {adminTab === 'stats' && stats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Utilisateurs', value: stats.total_users, color: C.blue, icon: '👥' },
                  { label: 'Tontines actives', value: stats.active_tontines, color: C.green, icon: '◎' },
                  { label: 'Transactions', value: stats.total_transactions, color: C.gold, icon: '↕' },
                  { label: 'Volume total', value: fmtShort(stats.total_amount) + ' FCFA', color: C.red, icon: '💰' },
                ].map(s => (
                  <Card key={s.label} style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ color: C.sub, fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                    </div>
                    <p style={{ color: s.color, fontSize: 22, fontWeight: 900, fontFamily: 'Syne, sans-serif', margin: 0 }}>{s.value}</p>
                  </Card>
                ))}
              </div>
              <h3 style={{ color: C.text, fontFamily: 'Syne, sans-serif', margin: '0 0 12px' }}>Comptes administrateur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {Object.entries(stats.admin_accounts || {}).map(([method, num]) => {
                  const colors = { wave: C.wave, orange: C.orange, mtn: C.mtn };
                  return (
                    <Card key={method} style={{ padding: '16px 18px' }}>
                      <p style={{ color: C.sub, fontSize: 10, margin: '0 0 4px', textTransform: 'uppercase' }}>{method}</p>
                      <p style={{ color: colors[method] || C.gold, fontWeight: 900, fontSize: 16, fontFamily: 'Syne, sans-serif', margin: '0 0 4px' }}>{num}</p>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: C.green + '20', color: C.green }}>ACTIF</span>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {adminTab === 'users' && (
            <div>
              <p style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>{users.length} utilisateurs inscrits</p>
              {users.map(u => (
                <Card key={u.id} style={{ padding: '13px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.blue + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontWeight: 700 }}>{u.name?.[0]}</div>
                    <div>
                      <p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 13 }}>{u.name}</p>
                      <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>{u.phone} {u.email ? `· ${u.email}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                    <Badge status={u.is_active ? 'active' : 'paused'} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {adminTab === 'transactions' && (
            <div>
              <p style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>{transactions.length} transactions</p>
              {transactions.map(t => (
                <Card key={t.id} style={{ padding: '13px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: C.sub, fontSize: 10, margin: 0, fontFamily: 'monospace' }}>{t.reference}</p>
                    <Badge status={t.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: C.text, fontWeight: 700, margin: 0, fontSize: 13 }}>{t.user_name}</p>
                      <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>{t.payment_method?.toUpperCase()} → {t.receiver_phone}</p>
                    </div>
                    <p style={{ color: t.status === 'completed' ? C.green : C.red, fontWeight: 900, fontSize: 16, fontFamily: 'Syne, sans-serif', margin: 0 }}>{fmt(t.amount)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── APPLICATION PRINCIPALE ───────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [active, setActive] = useState('dashboard');

  useEffect(() => {
    setTimeout(async () => {
      if (API.isLoggedIn()) {
        try {
          const me = await API.getMe();
          setUser(me);
          setScreen('app');
          return;
        } catch {}
      }
      setScreen('auth');
    }, 1800);
  }, []);

  const handleLogin = (userData) => { setUser(userData); setScreen('app'); };
  const handleLogout = () => { API.removeToken(); setUser(null); setScreen('auth'); };

  if (screen === 'splash') return <Splash />;
  if (screen === 'auth') return <Auth onLogin={handleLogin} />;

  const panels = {
    dashboard: <Dashboard user={user} setActive={setActive} />,
    tontines: <Tontines />,
    paiements: <Paiements user={user} />,
    admin: <Admin />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {panels[active]}
      </main>
    </div>
  );
}
