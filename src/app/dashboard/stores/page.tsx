export default function StoresPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Minhas Lojas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie suas lojas, domínios e integrações.
          </p>
        </div>
        <button className="btn-primary">
          + Nova Loja
        </button>
      </div>
      
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Você ainda não possui nenhuma loja configurada.</p>
        <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', boxShadow: 'none' }}>
          Criar minha primeira loja
        </button>
      </div>
    </div>
  );
}
