/* Plataforma Mundo Encantado: acesso aos dados (pedidos e login).
   Com window.ME_CONFIG.firebase preenchido, usa o Firebase (Firestore + login Google).
   Sem ele, funciona em modo de demonstração, com pedidos de exemplo guardados só neste navegador. */

export const MUNDOS_NOMES = {
  letras: 'Brincando com as Letras', numeros: 'O Reino dos Números', bau: 'Baú das Tradições',
  ambiente: 'Guardiões da Natureza', juntos: 'Um Mundo para Todos', cidade: 'Pequenos Exploradores da Cidade',
  emocoes: 'O Jardim das Emoções', saude: 'Turminha do Bem-Estar', ciencias: 'Pequenos Cientistas',
  artes: 'Ateliê da Imaginação', colecao: 'Coleção completa'
};
export const SITUACOES = { aguardando: 'Aguardando pagamento', pago: 'Pago', cancelado: 'Cancelado' };
export const FORMAS = { 'pix-manual': 'Pix (conferido à mão)', mercadopago: 'Mercado Pago' };

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const cfg = () => window.ME_CONFIG || {};

export async function abrirBanco() {
  return cfg().firebase ? bancoFirebase() : bancoDemo();
}

/* ---------- Firebase ---------- */
async function bancoFirebase() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
  ]);
  const app = initializeApp(cfg().firebase);
  const auth = A.getAuth(app), db = F.getFirestore(app);
  const daBase = d => {
    const v = d.data();
    return Object.assign({}, v, {
      codigo: d.id, data: v.criadoEm ? v.criadoEm.toDate() : new Date(),
      pagoEm: v.pagoEm ? v.pagoEm.toDate() : null, itens: v.itens || [], total: Number(v.total) || 0
    });
  };
  return {
    demo: false,
    aoMudarUsuario: cb => A.onAuthStateChanged(auth, u => cb(u && { email: u.email, nome: u.displayName })),
    entrar: () => A.signInWithPopup(auth, new A.GoogleAuthProvider()),
    sair: () => A.signOut(auth),
    async pedidos() {
      const q = F.query(F.collection(db, 'pedidos'), F.orderBy('criadoEm', 'desc'), F.limit(2000));
      return (await F.getDocs(q)).docs.map(daBase);
    },
    async marcar(codigo, situacao) {
      const mud = { situacao, atualizadoEm: F.serverTimestamp() };
      if (situacao === 'pago') mud.pagoEm = F.serverTimestamp();
      await F.updateDoc(F.doc(db, 'pedidos', codigo), mud);
    },
    // pedido do carrinho quando o pagamento é o Pix manual (as regras do Firestore conferem os campos)
    async criarPedidoPix(p) {
      await F.setDoc(F.doc(db, 'pedidos', p.codigo), {
        situacao: 'aguardando', forma: 'pix-manual', criadoEm: F.serverTimestamp(),
        total: Number(p.total), itens: p.itens, nome: p.nome, email: p.email, tel: p.tel,
        cidade: p.cidade, uf: p.uf, perfil: p.perfil
      });
    }
  };
}

/* ---------- Demonstração ---------- */
function bancoDemo() {
  const CHAVE = 'me:demo-pedidos';
  let lista = null;
  try { lista = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) {}
  if (!lista) lista = exemplos();
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (e) {} };
  const ouvintes = [];
  let quem = null;
  return {
    demo: true,
    aoMudarUsuario: cb => { ouvintes.push(cb); cb(quem); },
    entrar: async () => { quem = { email: 'exemplo@mundoencantado', nome: 'Demonstração' }; ouvintes.forEach(f => f(quem)); },
    sair: async () => { quem = null; ouvintes.forEach(f => f(null)); },
    async pedidos() {
      return lista.map(p => Object.assign({}, p, { data: new Date(p.data), pagoEm: p.pagoEm ? new Date(p.pagoEm) : null }))
        .sort((a, b) => b.data - a.data);
    },
    async marcar(codigo, situacao) {
      const p = lista.find(x => x.codigo === codigo); if (!p) return;
      p.situacao = situacao; if (situacao === 'pago') p.pagoEm = new Date().toISOString();
      salvar();
    },
    async criarPedidoPix() {}
  };
}

// Pedidos inventados para a prévia: nomes, cidades e valores são só exemplos.
function exemplos() {
  let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const nomes = ['Ana Paula', 'Bruno Lima', 'Carla Souza', 'Daniela Reis', 'Eduardo Prado', 'Fernanda Alves', 'Gabriela Nunes',
    'Helena Castro', 'Igor Matos', 'Juliana Rocha', 'Karina Dias', 'Luciana Melo', 'Marcos Vieira', 'Natália Costa',
    'Escola Pequeno Saber', 'Patrícia Gomes', 'Renata Freitas', 'Sílvia Borges', 'Tatiane Moura', 'Vanessa Pires'];
  const cidades = [['Tupã', 'SP'], ['Marília', 'SP'], ['Bauru', 'SP'], ['Presidente Prudente', 'SP'], ['Londrina', 'PR'], ['Campinas', 'SP'], ['Uberlândia', 'MG']];
  const ids = ['letras', 'numeros', 'bau', 'ambiente', 'juntos', 'cidade', 'emocoes', 'saude', 'ciencias', 'artes'];
  const hoje = Date.now(), dia = 864e5, out = [];
  nomes.forEach((nome, i) => {
    const colecao = r() < 0.18;
    const itens = colecao ? ['colecao'] : ['letras'].concat(ids.slice(1).filter(() => r() < 0.15)).slice(0, 1 + Math.floor(r() * 3));
    const total = colecao ? 149.9 : +(itens.length * 19.9).toFixed(2);
    const quando = hoje - Math.floor(r() * 30) * dia - Math.floor(r() * 10) * 36e5;
    const sit = i < 3 ? 'aguardando' : (r() < 0.08 ? 'cancelado' : 'pago');
    const [cidade, uf] = cidades[Math.floor(r() * cidades.length)];
    const slug = nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').split(' ').join('.');
    out.push({
      codigo: 'ME' + (100000 + Math.floor(r() * 899999)).toString(36).toUpperCase().padStart(6, 'X'),
      data: new Date(quando).toISOString(), pagoEm: sit === 'pago' ? new Date(quando + 36e5).toISOString() : null,
      situacao: sit, forma: r() < 0.6 ? 'mercadopago' : 'pix-manual', total, itens,
      nome, email: slug + '@exemplo.com', tel: '(14) 9' + String(Math.floor(r() * 1e8)).padStart(8, '0').replace(/(\d{4})(\d{4})/, '$1-$2'),
      cidade, uf, perfil: nome.startsWith('Escola') ? 'Escola' : (r() < 0.25 ? 'Professor(a)' : 'Família')
    });
  });
  return out;
}
