import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingCart, Plus, Minus, X, Check, Package, Truck, ShieldCheck,
  Home, ClipboardList, User, LogOut, MapPin, Clock, AlertCircle, Search,
  Edit3, Trash2, Star, ChefHat, KeyRound, Mail, Lock, Crown,
  TrendingUp, TrendingDown, BarChart3, Users, Tag, MessageCircle,
  UserCheck, Percent, ChevronRight, Send, ArrowLeft, Circle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useFirestoreArray } from "./useFirestoreArray";
import { firebaseConfigurado } from "./firebase";

/* ============================================================
   CÓDIGOS DE ACESSO
   ============================================================ */

const CODIGOS = {
  "ENT-1": { papel: "entregador" },
  "ENT-2": { papel: "entregador" },
  "ADM-1": { papel: "admin" },
  "ADM-2": { papel: "admin" },
  DONO2026: { papel: "dono" },
};

/* ============================================================
   DADOS SIMULADOS
   ============================================================ */

// Sem contas pré-cadastradas — todo cliente nasce do cadastro feito no próprio app.
const CONTAS_INICIAIS = [];

const ENTREGADORES_INICIAIS = [
  { id: "ENT-1", nome: "Entregador-1", status: "aprovado", disponivel: true, entregasFeitas: 0, avaliacaoMedia: 0 },
  { id: "ENT-2", nome: "Entregador-2", status: "aprovado", disponivel: true, entregasFeitas: 0, avaliacaoMedia: 0 },
];

const ADMINS_INICIAIS = [
  { id: "ADM-1", nome: "ADM-1" },
  { id: "ADM-2", nome: "ADM-2" },
];

const PRODUTOS_INICIAIS = [
  {
    id: "p1", nome: "Pizza Grande", categoria: "Pizzas", descricao: "33cm, massa fina, até 2 sabores",
    precoBase: 42.0, estoque: 18, ativo: true, vendidos: 0,
    grupos: [
      { id: "g1", nome: "Sabores", tipo: "multiplo", obrigatorio: true, min: 1, max: 2,
        opcoes: [
          { id: "o1", nome: "Calabresa", preco: 0 }, { id: "o2", nome: "Margherita", preco: 0 },
          { id: "o3", nome: "Frango c/ Catupiry", preco: 3 }, { id: "o4", nome: "Quatro Queijos", preco: 4 },
        ]},
      { id: "g2", nome: "Borda", tipo: "unico", obrigatorio: false, min: 0, max: 1,
        opcoes: [
          { id: "o5", nome: "Sem borda", preco: 0 }, { id: "o6", nome: "Catupiry", preco: 5 }, { id: "o7", nome: "Chocolate", preco: 6 },
        ]},
    ],
  },
  {
    id: "p2", nome: "Açaí 500ml", categoria: "Açaí", descricao: "Base tradicional, monte do seu jeito",
    precoBase: 18.0, estoque: 30, ativo: true, vendidos: 0,
    grupos: [
      { id: "g3", nome: "Complementos", tipo: "multiplo", obrigatorio: false, min: 0, max: 4,
        opcoes: [
          { id: "o8", nome: "Granola", preco: 0 }, { id: "o9", nome: "Banana", preco: 0 },
          { id: "o10", nome: "Leite Ninho", preco: 2 }, { id: "o11", nome: "Nutella", preco: 4 }, { id: "o12", nome: "Morango", preco: 3 },
        ]},
    ],
  },
  {
    id: "p3", nome: "Suco Natural", categoria: "Bebidas", descricao: "500ml, escolha a fruta",
    precoBase: 9.0, estoque: 40, ativo: true, vendidos: 0,
    grupos: [
      { id: "g4", nome: "Sabor", tipo: "unico", obrigatorio: true, min: 1, max: 1,
        opcoes: [
          { id: "o13", nome: "Laranja", preco: 0 }, { id: "o14", nome: "Maracujá", preco: 0 }, { id: "o15", nome: "Abacaxi c/ Hortelã", preco: 1 },
        ]},
    ],
  },
  {
    id: "p4", nome: "X-Burger Artesanal", categoria: "Lanches", descricao: "Pão brioche, blend 150g",
    precoBase: 24.0, estoque: 12, ativo: true, vendidos: 0,
    grupos: [
      { id: "g5", nome: "Ponto da carne", tipo: "unico", obrigatorio: true, min: 1, max: 1,
        opcoes: [{ id: "o16", nome: "Ao ponto", preco: 0 }, { id: "o17", nome: "Bem passado", preco: 0 }]},
      { id: "g6", nome: "Adicionais", tipo: "multiplo", obrigatorio: false, min: 0, max: 3,
        opcoes: [
          { id: "o18", nome: "Bacon", preco: 4 }, { id: "o19", nome: "Ovo", preco: 2 }, { id: "o20", nome: "Cheddar extra", preco: 3 },
        ]},
    ],
  },
];

// Sem pedidos, vendas ou mensagens pré-definidas — tudo começa vazio e é populado pelo uso real do app.
const PEDIDOS_INICIAIS = [];
const VENDAS_SEMANA = [];
const MENSAGENS_INICIAIS = [];

const STATUS_FLUXO = ["confirmado", "preparando", "saiu_para_entrega", "entregue"];
const STATUS_LABEL = { confirmado: "Confirmado", preparando: "Preparando", saiu_para_entrega: "Saiu para entrega", entregue: "Entregue" };
const CORES_GRAFICO = ["#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DC2626"];

let pedidoCounter = 1002;
const novoPedidoId = () => `PD-${pedidoCounter++}`;
let msgCounter = 100;
const novaMsgId = () => `m${msgCounter++}`;

function estatisticasEntregador(entregadorId, pedidos) {
  const entregas = pedidos.filter((p) => p.entregadorId === entregadorId && p.status === "entregue");
  const avaliadas = entregas.filter((p) => p.avaliacao);
  const media = avaliadas.length ? (avaliadas.reduce((s, p) => s + p.avaliacao.nota, 0) / avaliadas.length).toFixed(1) : "—";
  return { entregasFeitas: entregas.length, avaliacaoMedia: media };
}

function calcularPrecoItem(produto, selecoes, qtd) {
  let preco = produto.precoBase;
  produto.grupos.forEach((g) => {
    (selecoes[g.id] || []).forEach((optId) => {
      const opt = g.opcoes.find((o) => o.id === optId);
      if (opt) preco += opt.preco;
    });
  });
  return preco * qtd;
}

function detalheSelecoes(produto, selecoes) {
  return produto.grupos
    .map((g) => {
      const sel = selecoes[g.id] || [];
      if (sel.length === 0) return null;
      return sel.map((id) => g.opcoes.find((o) => o.id === id)?.nome).filter(Boolean).join(", ");
    })
    .filter(Boolean).join(" · ");
}

function horaAgora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ============================================================
   UI BASE — clean, corporativo, 100% opaco
   ============================================================ */

function Botao({ children, onClick, variant = "primary", className = "", disabled, size = "md", type = "button" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const sizes = { md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base", sm: "px-3 py-1.5 text-xs" };
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-700 shadow-sm",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    success: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm",
    subtle: "bg-transparent text-slate-500 hover:text-slate-900",
    dono: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Pill({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-full text-sm font-medium border transition-colors active:scale-95 shrink-0 ${
        active ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-slate-200 text-slate-600"
      }`}
    >
      {children}
      {count > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-white text-blue-700" : "bg-blue-700 text-white"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Badge({ status }) {
  const styles = {
    confirmado: "bg-blue-50 text-blue-800",
    preparando: "bg-amber-50 text-amber-800",
    saiu_para_entrega: "bg-orange-50 text-orange-800",
    entregue: "bg-emerald-50 text-emerald-800",
  };
  return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${styles[status]}`}>{STATUS_LABEL[status]}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${className}`}>{children}</div>;
}

function Cabecalho({ titulo, subtitulo, onLogout, icon, badge }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-5 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3">
        {icon && <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{icon}</div>}
        <div>
          <h1 className="text-lg font-bold text-white leading-tight tracking-tight">{titulo}</h1>
          {subtitulo && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitulo}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-2.5 transition-colors">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

function TabBar({ tabs, ativo, onChange, accent = "#1D4ED8" }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 flex justify-around z-30 overflow-x-auto shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors shrink-0 relative"
          style={{ color: ativo === t.key ? accent : "#94A3B8" }}
        >
          {t.icon}
          <span className="text-[10px] font-medium whitespace-nowrap">{t.label}</span>
          {t.count > 0 && (
            <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Estrelas({ nota, onSelect, tamanho = 18 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onSelect && onSelect(n)} disabled={!onSelect}>
          <Star size={tamanho} className={n <= nota ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   SISTEMA DE CHAT — por contexto (pedido ou canal de equipe)
   ============================================================ */

function listarCanaisCliente(user, pedidos) {
  return pedidos
    .filter((p) => p.clienteId === user.id && p.status !== "entregue")
    .map((p) => ({
      id: `pedido-${p.id}`,
      titulo: p.id,
      subtitulo: p.entregadorId ? "Conversa com o entregador" : "Conversa com a loja",
      pedidoId: p.id,
    }));
}

function listarCanaisEntregador(user, pedidos) {
  return pedidos
    .filter((p) => p.entregadorId === user.id && p.status !== "entregue")
    .map((p) => ({ id: `pedido-${p.id}`, titulo: p.id, subtitulo: `Cliente: ${p.clienteNome}`, pedidoId: p.id }));
}

function listarCanaisAdmin(pedidos) {
  const canaisPedidos = pedidos
    .filter((p) => p.status !== "entregue")
    .map((p) => ({ id: `pedido-${p.id}`, titulo: p.id, subtitulo: `Cliente: ${p.clienteNome}`, pedidoId: p.id }));
  return [{ id: "equipe-geral", titulo: "Equipe (Admins e Dono)", subtitulo: "Canal interno", pedidoId: null }, ...canaisPedidos];
}

function listarCanalRecuperacaoCliente(recuperacaoId) {
  return [{ id: `recuperacao-${recuperacaoId}`, titulo: "Recuperação de conta", subtitulo: "Conversa direta com o DONO", pedidoId: null }];
}

function listarCanaisRecuperacaoDono(solicitacoes) {
  return solicitacoes.map((s) => ({
    id: `recuperacao-${s.id}`,
    titulo: s.resolvida ? `Recuperação · ${s.dadoBusca}` : `🔴 Recuperação · ${s.dadoBusca}`,
    subtitulo: s.resolvida ? "Resolvida" : "Pendente",
    pedidoId: null,
  }));
}

// Canal privado 1-a-1 entre duas pessoas (entregador/admin/dono), com ID simétrico:
// não importa quem chama a função, o ID do canal entre A e B é sempre o mesmo.
function canalPrivadoId(idA, idB) {
  return `privado-${[idA, idB].sort().join("-")}`;
}

function listarCanaisPrivadosEntregador(user) {
  const interlocutores = [
    ...ADMINS_INICIAIS.map((a) => ({ id: a.id, nome: a.nome, tipo: "Admin" })),
    { id: "DONO2026", nome: "DONO", tipo: "Dono" },
  ];
  return interlocutores.map((p) => ({
    id: canalPrivadoId(user.id, p.id),
    titulo: p.nome,
    subtitulo: p.tipo,
    pedidoId: null,
  }));
}

function listarCanaisPrivadosAdmin(user) {
  const interlocutores = [
    ...ENTREGADORES_INICIAIS.map((e) => ({ id: e.id, nome: e.nome, tipo: "Entregador" })),
    { id: "DONO2026", nome: "DONO", tipo: "Dono" },
  ];
  return interlocutores.map((p) => ({
    id: canalPrivadoId(user.id, p.id),
    titulo: p.nome,
    subtitulo: p.tipo,
    pedidoId: null,
  }));
}

function listarCanaisPrivadosDono(donoId) {
  const interlocutores = [
    ...ADMINS_INICIAIS.map((a) => ({ id: a.id, nome: a.nome, tipo: "Admin" })),
    ...ENTREGADORES_INICIAIS.map((e) => ({ id: e.id, nome: e.nome, tipo: "Entregador" })),
  ];
  return interlocutores.map((p) => ({
    id: canalPrivadoId(donoId, p.id),
    titulo: p.nome,
    subtitulo: p.tipo,
    pedidoId: null,
  }));
}

function PainelChatComLista({ user, canais, mensagens, setMensagens, podeApagar }) {
  const [canalSelecionadoId, setCanalSelecionadoId] = useState(null);
  const canalAtivo = canais.find((c) => c.id === canalSelecionadoId) || null;

  const ultimaMsg = (canalId) => {
    const msgs = mensagens.filter((m) => m.canalId === canalId);
    return msgs[msgs.length - 1];
  };

  if (canalAtivo) {
    return (
      <div className="fixed inset-0 bg-white z-40 flex flex-col">
        <ChatJanela user={user} canal={canalAtivo} mensagens={mensagens} setMensagens={setMensagens} onVoltar={() => setCanalSelecionadoId(null)} podeApagar={podeApagar} />
      </div>
    );
  }

  return (
    <div className="px-5 space-y-2.5">
      {canais.length === 0 && (
        <div className="text-center py-16">
          <MessageCircle size={32} className="text-slate-300 mb-3 mx-auto" />
          <p className="text-sm text-slate-500">Nenhuma conversa disponível no momento.</p>
        </div>
      )}
      {canais.map((c) => {
        const ultima = ultimaMsg(c.id);
        return (
          <button key={c.id} onClick={() => setCanalSelecionadoId(c.id)} className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-left hover:border-slate-300 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <MessageCircle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{c.titulo}</p>
              <p className="text-xs text-slate-500 truncate">{ultima ? ultima.texto : c.subtitulo}</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function ChatJanela({ user, canal, mensagens, setMensagens, onVoltar, podeApagar }) {
  const [texto, setTexto] = useState("");
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const fimRef = useRef(null);
  const mensagensCanal = mensagens.filter((m) => m.canalId === canal.id);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagensCanal.length]);

  const enviar = () => {
    if (!texto.trim()) return;
    setMensagens((prev) => [...prev, { id: novaMsgId(), canalId: canal.id, autorId: user.id, autorNome: user.nome, texto: texto.trim(), hora: horaAgora() }]);
    setTexto("");
  };

  const apagarConversa = () => {
    setMensagens((prev) => prev.filter((m) => m.canalId !== canal.id));
    setConfirmandoLimpeza(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-200">
        <button onClick={onVoltar} className="text-slate-500 p-1"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{canal.titulo}</p>
          <p className="text-xs text-slate-500">{canal.subtitulo}</p>
        </div>
        {podeApagar && mensagensCanal.length > 0 && (
          <button onClick={() => setConfirmandoLimpeza(true)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 size={17} /></button>
        )}
      </div>

      {confirmandoLimpeza && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700 font-medium mb-2.5">Apagar toda essa conversa? Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2">
            <Botao onClick={() => setConfirmandoLimpeza(false)} variant="ghost" size="sm" className="flex-1">Cancelar</Botao>
            <Botao onClick={apagarConversa} variant="danger" size="sm" className="flex-1"><Trash2 size={13} /> Apagar conversa</Botao>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {mensagensCanal.length === 0 && <p className="text-center text-slate-400 text-xs py-8">Envie a primeira mensagem por aqui.</p>}
        {mensagensCanal.map((m) => {
          const minha = m.autorId === user.id;
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${minha ? "bg-blue-700 text-white" : "bg-white border border-slate-200 text-slate-900"}`}>
                {!minha && <p className="text-[11px] font-semibold mb-0.5 text-slate-500">{m.autorNome}</p>}
                <p className="text-sm">{m.texto}</p>
                <p className={`text-[10px] mt-1 ${minha ? "text-blue-100" : "text-slate-400"}`}>{m.hora}</p>
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} placeholder="Escreva uma mensagem..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
        <button onClick={enviar} disabled={!texto.trim()} className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 shrink-0">
          <Send size={16} />
        </button>
      </div>
    </>
  );
}

/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */

function TelaAuth({ contas, setContas, onEntrar, solicitacoesRecuperacao, setSolicitacoesRecuperacao, onAbrirRecuperacao }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [dadoRecuperacao, setDadoRecuperacao] = useState("");

  const fazerCadastro = () => {
    if (!nome.trim() || !contato.trim() || !senha.trim()) { setErro("Preencha todos os campos."); return; }
    if (contas.some((c) => c.contato === contato)) { setErro("Já existe uma conta com esse e-mail/telefone."); return; }
    const novaConta = { id: `c${Date.now()}`, nome: nome.trim(), contato: contato.trim(), senha, papel: "cliente" };
    setContas((prev) => [...prev, novaConta]);
    onEntrar(novaConta);
  };

  const fazerLogin = () => {
    const conta = contas.find((c) => c.contato === contato && c.senha === senha);
    if (!conta) { setErro("E-mail/telefone ou senha incorretos."); return; }
    onEntrar(conta);
  };

  const usarCodigo = () => {
    const entrada = codigo.trim().toUpperCase();
    const valido = CODIGOS[entrada];
    if (!valido) { setErro("Código inválido."); return; }
    let nome = "DONO";
    if (valido.papel === "admin") nome = ADMINS_INICIAIS.find((a) => a.id === entrada)?.nome || "Administrador";
    if (valido.papel === "entregador") nome = ENTREGADORES_INICIAIS.find((e) => e.id === entrada)?.nome || "Entregador";
    onEntrar({ id: entrada, nome, papel: valido.papel, codigo: entrada });
  };

  const solicitarRecuperacao = () => {
    if (!dadoRecuperacao.trim()) { setErro("Digite seu nome ou e-mail."); return; }
    const novaSolicitacao = {
      id: `rec${Date.now()}`,
      dadoBusca: dadoRecuperacao.trim(),
      resolvida: false,
      criadoEm: horaAgora(),
    };
    setSolicitacoesRecuperacao((prev) => [...prev, novaSolicitacao]);
    onAbrirRecuperacao(novaSolicitacao);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-4 shadow-sm">
          <ChefHat size={28} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Loja ED</h1>
        <p className="text-sm text-slate-500 mt-1">Seu cardápio, do pedido à entrega</p>
      </div>

      <div className="flex gap-1.5 mb-6 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
        {[{ key: "login", label: "Entrar" }, { key: "cadastro", label: "Criar conta" }, { key: "codigo", label: "Código" }].map((m) => (
          <button key={m.key} onClick={() => { setModo(m.key); setErro(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${modo === m.key ? "bg-blue-700 text-white" : "text-slate-500"}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {modo === "login" && (
          <div className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="E-mail ou telefone"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fazerLogin()} placeholder="Senha"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            {erro && <p className="text-red-600 text-xs flex items-center gap-1.5"><AlertCircle size={13} /> {erro}</p>}
            <Botao onClick={fazerLogin} size="lg" className="w-full mt-1">Entrar</Botao>
            <button onClick={() => { setModo("recuperar"); setErro(""); }} className="w-full text-center text-xs text-blue-700 font-medium pt-1">
              Esqueci minha senha, nome ou e-mail
            </button>
          </div>
        )}

        {modo === "cadastro" && (
          <div className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="E-mail ou telefone"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fazerCadastro()} placeholder="Crie uma senha"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            {erro && <p className="text-red-600 text-xs flex items-center gap-1.5"><AlertCircle size={13} /> {erro}</p>}
            <Botao onClick={fazerCadastro} size="lg" className="w-full mt-1">Criar conta e entrar</Botao>
          </div>
        )}

        {modo === "recuperar" && (
          <div className="space-y-3">
            <button onClick={() => { setModo("login"); setErro(""); }} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <ArrowLeft size={13} /> Voltar para login
            </button>
            <p className="text-sm text-slate-600">
              Digite seu nome ou e-mail cadastrado. Você vai abrir uma conversa direta com o <strong>DONO</strong> da loja, que vai te ajudar a recuperar o acesso.
            </p>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={dadoRecuperacao} onChange={(e) => setDadoRecuperacao(e.target.value)} onKeyDown={(e) => e.key === "Enter" && solicitarRecuperacao()}
                placeholder="Seu nome ou e-mail"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            {erro && <p className="text-red-600 text-xs flex items-center gap-1.5"><AlertCircle size={13} /> {erro}</p>}
            <Botao onClick={solicitarRecuperacao} size="lg" className="w-full mt-1"><MessageCircle size={15} /> Falar com o DONO</Botao>
          </div>
        )}

        {modo === "codigo" && (
          <div className="space-y-3">
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && usarCodigo()} placeholder="Digite seu código de acesso"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white uppercase" />
            </div>
            {erro && <p className="text-red-600 text-xs flex items-center gap-1.5"><AlertCircle size={13} /> {erro}</p>}
            <Botao onClick={usarCodigo} size="lg" className="w-full mt-1">Acessar painel</Botao>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MODAL DE CUSTOMIZAÇÃO DE PRODUTO
   ============================================================ */

function ModalProduto({ produto, onClose, onAdicionar }) {
  const [selecoes, setSelecoes] = useState({});
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");

  const toggleOpcao = (grupo, optId) => {
    setSelecoes((prev) => {
      const atual = prev[grupo.id] || [];
      if (grupo.tipo === "unico") return { ...prev, [grupo.id]: atual[0] === optId ? [] : [optId] };
      if (atual.includes(optId)) return { ...prev, [grupo.id]: atual.filter((id) => id !== optId) };
      if (atual.length >= grupo.max) return prev;
      return { ...prev, [grupo.id]: [...atual, optId] };
    });
  };

  const grupoValido = (g) => { const sel = selecoes[g.id] || []; return !g.obrigatorio || sel.length >= g.min; };
  const tudoValido = produto.grupos.every(grupoValido);
  const precoTotal = calcularPrecoItem(produto, selecoes, qtd);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-start justify-between px-5 pt-5 pb-3 border-b border-slate-200 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{produto.nome}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{produto.descricao}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X size={20} /></button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {produto.grupos.map((g) => {
            const sel = selecoes[g.id] || [];
            return (
              <div key={g.id}>
                <div className="flex items-baseline justify-between mb-2.5">
                  <h3 className="text-slate-900 font-semibold text-sm">{g.nome}{g.obrigatorio && <span className="text-red-500 ml-1">*</span>}</h3>
                  <span className="text-[11px] text-slate-400">{g.tipo === "unico" ? "escolha 1" : `${sel.length}/${g.max} escolhidos`}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.opcoes.map((o) => {
                    const isSel = sel.includes(o.id);
                    const atMax = g.tipo === "multiplo" && sel.length >= g.max && !isSel;
                    return (
                      <button key={o.id} disabled={atMax} onClick={() => toggleOpcao(g, o.id)}
                        className={`px-3.5 py-2 rounded-lg text-sm border-2 flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-30 ${
                          isSel ? "bg-blue-700 border-blue-700 text-white font-semibold" : "border-slate-200 text-slate-700 bg-slate-50"
                        }`}>
                        {isSel && <Check size={13} />}{o.nome}{o.preco > 0 && <span className="opacity-80">+R${o.preco.toFixed(0)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div>
            <h3 className="text-slate-900 font-semibold text-sm mb-2">Observação</h3>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: sem cebola, ponto da carne, etc."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-blue-600 focus:bg-white" rows={2} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5">
            <button onClick={() => setQtd((q) => Math.max(1, q - 1))} className="p-1.5 text-slate-600"><Minus size={16} /></button>
            <span className="text-slate-900 font-semibold w-5 text-center">{qtd}</span>
            <button onClick={() => setQtd((q) => q + 1)} className="p-1.5 text-slate-600"><Plus size={16} /></button>
          </div>
          <Botao variant="primary" size="lg" disabled={!tudoValido} onClick={() => onAdicionar({ selecoes, qtd, obs, precoTotal })} className="flex-1">
            Adicionar · R${precoTotal.toFixed(2)}
          </Botao>
        </div>
      </div>
    </div>
  );
}

function ModalAvaliacao({ pedido, titulo, subtitulo, notaInicial, comentarioInicial, onClose, onEnviar }) {
  const [nota, setNota] = useState(notaInicial || 5);
  const [comentario, setComentario] = useState(comentarioInicial || "");
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{titulo || "Avaliar pedido"}</h2>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{subtitulo || (pedido && `${pedido.id} · ${pedido.itens.map((i) => i.nome).join(", ")}`)}</p>
        <div className="flex justify-center mb-5"><Estrelas nota={nota} onSelect={setNota} tamanho={32} /></div>
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Como foi sua experiência?"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-blue-600 focus:bg-white mb-4" rows={3} />
        <Botao onClick={() => onEnviar({ nota, comentario })} className="w-full" size="lg">Enviar avaliação</Botao>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL DE EDIÇÃO DE PRODUTO
   ============================================================ */

function ModalEditarProduto({ produto, onClose, onSalvar }) {
  const [rascunho, setRascunho] = useState(() => JSON.parse(JSON.stringify(produto)));
  const atualizarCampo = (campo, valor) => setRascunho((prev) => ({ ...prev, [campo]: valor }));

  const adicionarGrupo = () => setRascunho((prev) => ({ ...prev, grupos: [...prev.grupos, { id: `g${Date.now()}`, nome: "Novo grupo", tipo: "unico", obrigatorio: false, min: 0, max: 1, opcoes: [] }] }));
  const removerGrupo = (grupoId) => setRascunho((prev) => ({ ...prev, grupos: prev.grupos.filter((g) => g.id !== grupoId) }));
  const atualizarGrupo = (grupoId, campo, valor) => setRascunho((prev) => ({
    ...prev,
    grupos: prev.grupos.map((g) => {
      if (g.id !== grupoId) return g;
      const atualizado = { ...g, [campo]: valor };
      if (campo === "tipo" && valor === "unico") atualizado.max = 1;
      return atualizado;
    }),
  }));
  const adicionarOpcao = (grupoId) => setRascunho((prev) => ({ ...prev, grupos: prev.grupos.map((g) => (g.id === grupoId ? { ...g, opcoes: [...g.opcoes, { id: `o${Date.now()}`, nome: "Novo sabor", preco: 0 }] } : g)) }));
  const removerOpcao = (grupoId, opcaoId) => setRascunho((prev) => ({ ...prev, grupos: prev.grupos.map((g) => (g.id === grupoId ? { ...g, opcoes: g.opcoes.filter((o) => o.id !== opcaoId) } : g)) }));
  const atualizarOpcao = (grupoId, opcaoId, campo, valor) => setRascunho((prev) => ({
    ...prev,
    grupos: prev.grupos.map((g) => (g.id !== grupoId ? g : { ...g, opcoes: g.opcoes.map((o) => (o.id === opcaoId ? { ...o, [campo]: valor } : o)) })),
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200 z-10">
          <h2 className="text-lg font-bold text-slate-900">Editar produto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X size={20} /></button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Nome do produto</label>
              <input value={rascunho.nome} onChange={(e) => atualizarCampo("nome", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Descrição</label>
              <input value={rascunho.descricao} onChange={(e) => atualizarCampo("descricao", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Preço base (R$)</label>
                <input type="number" step="0.5" value={rascunho.precoBase} onChange={(e) => atualizarCampo("precoBase", Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Categoria</label>
                <input value={rascunho.categoria} onChange={(e) => atualizarCampo("categoria", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-slate-900 font-bold text-sm">Grupos de opções</h3>
              <Botao size="sm" variant="ghost" onClick={adicionarGrupo}><Plus size={13} /> Novo grupo</Botao>
            </div>
            <div className="space-y-3">
              {rascunho.grupos.map((g) => (
                <div key={g.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-3">
                    <input value={g.nome} onChange={(e) => atualizarGrupo(g.id, "nome", e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600" />
                    <button onClick={() => removerGrupo(g.id)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <button onClick={() => atualizarGrupo(g.id, "tipo", "unico")}
                      className={`text-xs px-3 py-1.5 rounded-lg border-2 font-medium ${g.tipo === "unico" ? "bg-blue-700 border-blue-700 text-white" : "border-slate-200 text-slate-500 bg-white"}`}>
                      Sabor único
                    </button>
                    <button onClick={() => atualizarGrupo(g.id, "tipo", "multiplo")}
                      className={`text-xs px-3 py-1.5 rounded-lg border-2 font-medium ${g.tipo === "multiplo" ? "bg-blue-700 border-blue-700 text-white" : "border-slate-200 text-slate-500 bg-white"}`}>
                      Múltiplos sabores
                    </button>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                      <input type="checkbox" checked={g.obrigatorio} onChange={(e) => atualizarGrupo(g.id, "obrigatorio", e.target.checked)} className="accent-blue-700" />
                      Obrigatório
                    </label>
                  </div>
                  {g.tipo === "multiplo" && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                      <span>Mín.</span>
                      <input type="number" min={0} value={g.min} onChange={(e) => atualizarGrupo(g.id, "min", Number(e.target.value))}
                        className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 focus:outline-none focus:border-blue-600" />
                      <span>Máx.</span>
                      <input type="number" min={1} value={g.max} onChange={(e) => atualizarGrupo(g.id, "max", Number(e.target.value))}
                        className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 focus:outline-none focus:border-blue-600" />
                      <span>seleções</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {g.opcoes.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <input value={o.nome} onChange={(e) => atualizarOpcao(g.id, o.id, "nome", e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">+R$</span>
                          <input type="number" step="0.5" value={o.preco} onChange={(e) => atualizarOpcao(g.id, o.id, "preco", Number(e.target.value))}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600" />
                        </div>
                        <button onClick={() => removerOpcao(g.id, o.id)} className="text-slate-400 hover:text-red-600 p-1"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                  <Botao size="sm" variant="ghost" onClick={() => adicionarOpcao(g.id)} className="w-full mt-2.5"><Plus size={13} /> Adicionar sabor/opção</Botao>
                </div>
              ))}
              {rascunho.grupos.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-6 border border-dashed border-slate-300 rounded-xl">
                  Nenhum grupo de opções. Clique em "Novo grupo" para criar sabores, bordas ou complementos.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex gap-3">
          <Botao onClick={onClose} variant="ghost" className="flex-1">Cancelar</Botao>
          <Botao onClick={() => onSalvar(rascunho)} className="flex-1"><Check size={15} /> Salvar alterações</Botao>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAINEL DO CLIENTE
   ============================================================ */

function PainelCliente({ user, produtos, pedidos, setPedidos, mensagens, setMensagens, cupons, avaliacoesLoja, setAvaliacoesLoja, onLogout }) {
  const [tab, setTab] = useState("cardapio");
  const [categoria, setCategoria] = useState("Todos");
  const [carrinho, setCarrinho] = useState([]);
  const [modalProduto, setModalProduto] = useState(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [avaliando, setAvaliando] = useState(null);
  const [avaliandoLoja, setAvaliandoLoja] = useState(false);
  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [erroCupom, setErroCupom] = useState("");

  const categorias = ["Todos", ...new Set(produtos.map((p) => p.categoria))];
  const produtosFiltrados = produtos.filter((p) => p.ativo && (categoria === "Todos" || p.categoria === categoria));
  const subtotalCarrinho = carrinho.reduce((sum, item) => sum + item.precoTotal, 0);
  const valorDesconto = cupomAplicado ? subtotalCarrinho * (cupomAplicado.desconto / 100) : 0;
  const totalCarrinho = Math.max(0, subtotalCarrinho - valorDesconto);
  const itensCarrinho = carrinho.reduce((sum, item) => sum + item.qtd, 0);

  const adicionarAoCarrinho = (produto, escolha) => { setCarrinho((prev) => [...prev, { uid: `${produto.id}-${Date.now()}`, produto, ...escolha }]); setModalProduto(null); };
  const removerDoCarrinho = (uid) => setCarrinho((prev) => prev.filter((i) => i.uid !== uid));

  const aplicarCupom = () => {
    const entrada = cupomInput.trim().toUpperCase();
    const encontrado = cupons.find((c) => c.codigo === entrada && c.ativo);
    if (!encontrado) { setErroCupom("Cupom inválido ou inativo."); setCupomAplicado(null); return; }
    setCupomAplicado(encontrado); setErroCupom("");
  };
  const removerCupom = () => { setCupomAplicado(null); setCupomInput(""); setErroCupom(""); };

  const finalizarPedido = () => {
    const novoPedido = {
      id: novoPedidoId(), clienteId: user.id, clienteNome: user.nome,
      itens: carrinho.map((i) => ({ nome: i.produto.nome, detalhe: detalheSelecoes(i.produto, i.selecoes) || i.obs || "", qtd: i.qtd, preco: i.precoTotal })),
      cupom: cupomAplicado ? cupomAplicado.codigo : null, desconto: valorDesconto,
      total: totalCarrinho, status: "confirmado", entregadorId: null, endereco: "Rua das Acácias, 120", criadoEm: "agora", avaliacao: null,
    };
    setPedidos((prev) => [novoPedido, ...prev]);
    setCarrinho([]); setCarrinhoAberto(false); setCupomAplicado(null); setCupomInput(""); setTab("pedidos");
  };

  const enviarAvaliacao = ({ nota, comentario }) => {
    setPedidos((prev) => prev.map((p) => (p.id === avaliando.id ? { ...p, avaliacao: { nota, comentario } } : p)));
    setAvaliando(null);
  };

  const meusPedidos = pedidos.filter((p) => p.clienteId === user.id);
  const jaComprou = meusPedidos.some((p) => p.status === "entregue");
  const minhaAvaliacaoLoja = avaliacoesLoja.find((a) => a.clienteId === user.id);
  const enviarAvaliacaoLoja = ({ nota, comentario }) => {
    setAvaliacoesLoja((prev) => [
      ...prev.filter((a) => a.clienteId !== user.id),
      { id: `al${Date.now()}`, clienteId: user.id, clienteNome: user.nome, nota, comentario, criadoEm: horaAgora() },
    ]);
    setAvaliandoLoja(false);
  };
  const canaisChat = listarCanaisCliente(user, pedidos);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {tab === "cardapio" && (
        <>
          <Cabecalho titulo="Loja ED" subtitulo={`Olá, ${user.nome.split(" ")[0]}`} onLogout={onLogout} icon={<ChefHat size={20} className="text-blue-400" />} />
          <div className="px-5 flex gap-2 overflow-x-auto py-4 scrollbar-hide bg-white border-b border-slate-200">
            {categorias.map((c) => <Pill key={c} active={categoria === c} onClick={() => setCategoria(c)}>{c}</Pill>)}
          </div>
          <div className="px-5 py-4 space-y-3">
            {produtosFiltrados.map((p) => (
              <button key={p.id} onClick={() => setModalProduto(p)} disabled={p.estoque === 0}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-left disabled:opacity-40 shadow-sm">
                <div className="flex-1">
                  <h3 className="text-slate-900 font-semibold">{p.nome}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.descricao}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-blue-700 text-lg">R${p.precoBase.toFixed(2)}</span>
                    {p.estoque === 0 && <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Esgotado</span>}
                    {p.estoque > 0 && p.estoque <= 5 && <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Últimas {p.estoque}</span>}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 ml-3 shrink-0"><Plus size={18} /></div>
              </button>
            ))}
            {produtosFiltrados.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhum item nesta categoria.</p>}
          </div>
        </>
      )}

      {tab === "pedidos" && (
        <>
          <Cabecalho titulo="Meus pedidos" onLogout={onLogout} />
          <div className="px-5 py-4 space-y-3">
            {jaComprou && (
              <Card className="bg-slate-50 border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Sua avaliação geral da Loja ED</h3>
                  {!minhaAvaliacaoLoja && <Star size={15} className="text-amber-500" />}
                </div>
                {minhaAvaliacaoLoja ? (
                  <div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Estrelas nota={minhaAvaliacaoLoja.nota} tamanho={15} />
                      <button onClick={() => setAvaliandoLoja(true)} className="text-xs text-blue-700 font-medium ml-auto">Editar</button>
                    </div>
                    {minhaAvaliacaoLoja.comentario && <p className="text-xs text-slate-500 italic mt-1.5">"{minhaAvaliacaoLoja.comentario}"</p>}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mb-3">Como foi sua experiência geral com a loja, além dos pedidos individuais?</p>
                    <Botao onClick={() => setAvaliandoLoja(true)} size="sm" className="w-full"><Star size={14} /> Avaliar a loja</Botao>
                  </>
                )}
              </Card>
            )}
            {meusPedidos.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Você ainda não fez nenhum pedido.</p>}
            {meusPedidos.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-900 font-semibold text-sm">{p.id}</span>
                  <Badge status={p.status} />
                </div>
                {p.itens.map((it, idx) => (
                  <p key={idx} className="text-xs text-slate-500">{it.qtd}x {it.nome} {it.detalhe && <span className="text-slate-400">· {it.detalhe}</span>}</p>
                ))}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={11} /> {p.criadoEm}</span>
                  <span className="font-bold text-slate-900">R${p.total.toFixed(2)}</span>
                </div>
                {p.status === "entregue" && !p.avaliacao && (
                  <Botao onClick={() => setAvaliando(p)} variant="ghost" size="sm" className="w-full mt-3"><Star size={14} /> Avaliar pedido</Botao>
                )}
                {p.avaliacao && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Estrelas nota={p.avaliacao.nota} tamanho={13} />
                    {p.avaliacao.comentario && <span className="text-xs text-slate-400 italic">"{p.avaliacao.comentario}"</span>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
          <Cabecalho titulo="Conversas" onLogout={onLogout} />
          <div className="flex-1 overflow-y-auto py-4">
            <PainelChatComLista user={user} canais={canaisChat} mensagens={mensagens} setMensagens={setMensagens} />
          </div>
        </div>
      )}

      {modalProduto && <ModalProduto produto={modalProduto} onClose={() => setModalProduto(null)} onAdicionar={(escolha) => adicionarAoCarrinho(modalProduto, escolha)} />}
      {avaliando && <ModalAvaliacao pedido={avaliando} onClose={() => setAvaliando(null)} onEnviar={enviarAvaliacao} />}
      {avaliandoLoja && (
        <ModalAvaliacao
          titulo="Avaliar a Loja ED" subtitulo="Sua experiência geral com a loja, alem dos pedidos individuais"
          notaInicial={minhaAvaliacaoLoja?.nota} comentarioInicial={minhaAvaliacaoLoja?.comentario}
          onClose={() => setAvaliandoLoja(false)} onEnviar={enviarAvaliacaoLoja}
        />
      )}

      {carrinhoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end" onClick={() => setCarrinhoAberto(false)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Seu carrinho</h2>
              <button onClick={() => setCarrinhoAberto(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <div className="px-5 py-3 space-y-3">
              {carrinho.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Carrinho vazio.</p>}
              {carrinho.map((item) => (
                <div key={item.uid} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-slate-900 text-sm font-medium">{item.qtd}x {item.produto.nome}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{detalheSelecoes(item.produto, item.selecoes)}</p>
                    {item.obs && <p className="text-xs text-slate-400 italic mt-0.5">Obs: {item.obs}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-900 text-sm font-medium">R${item.precoTotal.toFixed(2)}</span>
                    <button onClick={() => removerDoCarrinho(item.uid)} className="text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>

            {carrinho.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100">
                {!cupomAplicado ? (
                  <div className="flex gap-2">
                    <input value={cupomInput} onChange={(e) => setCupomInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && aplicarCupom()}
                      placeholder="Tem um cupom? Digite aqui"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white uppercase" />
                    <Botao onClick={aplicarCupom} variant="ghost" size="md">Aplicar</Botao>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                    <span className="text-sm text-green-700 font-semibold flex items-center gap-1.5"><Tag size={14} /> {cupomAplicado.codigo} aplicado · -{cupomAplicado.desconto}%</span>
                    <button onClick={removerCupom} className="text-green-700 hover:text-red-600"><X size={16} /></button>
                  </div>
                )}
                {erroCupom && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5"><AlertCircle size={12} /> {erroCupom}</p>}
              </div>
            )}

            {carrinho.length > 0 && (
              <div className="px-5 py-4 sticky bottom-0 bg-white border-t border-slate-200">
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700">R${subtotalCarrinho.toFixed(2)}</span>
                  </div>
                  {cupomAplicado && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Desconto ({cupomAplicado.desconto}%)</span>
                      <span className="text-green-600">-R${valorDesconto.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-slate-500 text-sm">Total</span>
                    <span className="font-bold text-2xl text-slate-900">R${totalCarrinho.toFixed(2)}</span>
                  </div>
                </div>
                <Botao onClick={finalizarPedido} size="lg" className="w-full">Confirmar pedido</Botao>
              </div>
            )}
          </div>
        </div>
      )}

      {itensCarrinho > 0 && !carrinhoAberto && tab === "cardapio" && (
        <button onClick={() => setCarrinhoAberto(true)}
          className="fixed bottom-20 left-5 right-5 bg-blue-700 text-white rounded-xl py-3.5 px-5 flex items-center justify-between font-semibold shadow-lg z-20 active:scale-[0.98]">
          <span className="flex items-center gap-2"><ShoppingCart size={18} /> {itensCarrinho} {itensCarrinho === 1 ? "item" : "itens"}</span>
          <span>R${totalCarrinho.toFixed(2)}</span>
        </button>
      )}

      <TabBar ativo={tab} onChange={setTab} tabs={[
        { key: "cardapio", label: "Cardápio", icon: <Home size={20} /> },
        { key: "pedidos", label: "Pedidos", icon: <ClipboardList size={20} /> },
        { key: "chat", label: "Conversas", icon: <MessageCircle size={20} />, count: canaisChat.length },
      ]} />
    </div>
  );
}

/* ============================================================
   PAINEL DO ENTREGADOR
   ============================================================ */

function PainelEntregador({ user, pedidos, setPedidos, mensagens, setMensagens, onLogout }) {
  const [tab, setTab] = useState("disponiveis");
  const [disponivel, setDisponivel] = useState(true);

  const disponiveis = pedidos.filter((p) => p.status === "preparando" && !p.entregadorId);
  const minhasEntregas = pedidos.filter((p) => p.entregadorId === user.id && p.status !== "entregue");
  const historico = pedidos.filter((p) => p.entregadorId === user.id && p.status === "entregue");
  const avaliacoesRecebidas = historico.filter((p) => p.avaliacao);
  const minhaAvaliacaoMedia = avaliacoesRecebidas.length
    ? (avaliacoesRecebidas.reduce((s, p) => s + p.avaliacao.nota, 0) / avaliacoesRecebidas.length).toFixed(1)
    : "—";
  const canaisChat = listarCanaisEntregador(user, pedidos);
  const canaisEquipe = listarCanaisPrivadosEntregador(user);

  const aceitar = (id) => { setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregadorId: user.id, status: "saiu_para_entrega" } : p))); setTab("ativas"); };
  const marcarEntregue = (id) => setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: "entregue" } : p)));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Cabecalho titulo="Entregas" subtitulo={`Loja ED · ${user.nome}`} onLogout={onLogout} icon={<Truck size={20} className="text-blue-400" />} />

      {tab !== "chat" && tab !== "equipe" && (
        <div className="px-5 pt-4 pb-2">
          <button onClick={() => setDisponivel((d) => !d)}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border ${disponivel ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className={`w-2 h-2 rounded-full ${disponivel ? "bg-green-500" : "bg-slate-400"}`} />
              {disponivel ? "Disponível para entregas" : "Indisponível"}
            </span>
            <span className="text-xs text-slate-500">Alternar</span>
          </button>
        </div>
      )}

      {tab === "disponiveis" && (
        <div className="px-5 py-2 space-y-3">
          {!disponivel && <p className="text-center text-slate-400 text-sm py-8">Fique disponível para ver novos pedidos.</p>}
          {disponivel && disponiveis.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhum pedido disponível agora.</p>}
          {disponivel && disponiveis.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-900 font-semibold text-sm">{p.id}</span>
                <span className="font-bold text-blue-700">R${p.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><MapPin size={12} /> {p.endereco}</p>
              <p className="text-xs text-slate-400 mb-3">{p.itens.length} {p.itens.length === 1 ? "item" : "itens"} · {p.clienteNome}</p>
              <Botao onClick={() => aceitar(p.id)} className="w-full">Aceitar entrega</Botao>
            </Card>
          ))}
        </div>
      )}

      {tab === "ativas" && (
        <div className="px-5 py-2 space-y-3">
          {minhasEntregas.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhuma entrega em andamento.</p>}
          {minhasEntregas.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-900 font-semibold text-sm">{p.id}</span>
                <Badge status={p.status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><MapPin size={12} /> {p.endereco}</p>
              <p className="text-xs text-slate-400 mb-3">{p.clienteNome}</p>
              <Botao onClick={() => marcarEntregue(p.id)} variant="success" className="w-full"><Check size={15} /> Marcar como entregue</Botao>
            </Card>
          ))}
        </div>
      )}

      {tab === "historico" && (
        <div className="px-5 py-2 space-y-3">
          <Card className="flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase font-medium">Entregas feitas</p><p className="font-bold text-xl text-slate-900">{historico.length}</p></div>
            <div><p className="text-[11px] text-slate-500 uppercase font-medium">Sua avaliação</p><p className="font-bold text-xl text-amber-500 flex items-center gap-1">{minhaAvaliacaoMedia} {avaliacoesRecebidas.length > 0 && <Star size={14} className="fill-amber-400" />}</p></div>
          </Card>
          {historico.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhuma entrega concluída ainda.</p>}
          {historico.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div><p className="text-slate-900 text-sm font-semibold">{p.id}</p><p className="text-xs text-slate-400">{p.clienteNome}</p></div>
              <span className="font-bold text-green-600">R${p.total.toFixed(2)}</span>
            </Card>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto py-4">
            <PainelChatComLista user={user} canais={canaisChat} mensagens={mensagens} setMensagens={setMensagens} />
          </div>
        </div>
      )}

      {tab === "equipe" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto py-4">
            <PainelChatComLista user={user} canais={canaisEquipe} mensagens={mensagens} setMensagens={setMensagens} />
          </div>
        </div>
      )}

      <TabBar ativo={tab} onChange={setTab} tabs={[
        { key: "disponiveis", label: "Disponíveis", icon: <Package size={19} />, count: disponiveis.length },
        { key: "ativas", label: "Em rota", icon: <Truck size={19} />, count: minhasEntregas.length },
        { key: "historico", label: "Histórico", icon: <ClipboardList size={19} /> },
        { key: "chat", label: "Clientes", icon: <MessageCircle size={19} />, count: canaisChat.length },
        { key: "equipe", label: "Equipe", icon: <Users size={19} /> },
      ]} />
    </div>
  );
}

/* ============================================================
   PAINEL ADMIN
   ============================================================ */

function PainelAdmin({ user, produtos, setProdutos, pedidos, setPedidos, entregadores, setEntregadores, cupons, setCupons, mensagens, setMensagens, avaliacoesLoja, onLogout }) {
  const [tab, setTab] = useState("pedidos");
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [novoCupom, setNovoCupom] = useState({ codigo: "", desconto: "" });

  const totalVendas = pedidos.reduce((s, p) => s + p.total, 0);
  const pedidosAtivos = pedidos.filter((p) => p.status !== "entregue").length;
  const ticketMedio = pedidos.length ? totalVendas / pedidos.length : 0;
  const avaliacoes = pedidos.filter((p) => p.avaliacao);
  const notaMedia = avaliacoes.length ? (avaliacoes.reduce((s, p) => s + p.avaliacao.nota, 0) / avaliacoes.length).toFixed(1) : "—";

  const pedidosFiltrados = pedidos.filter((p) => filtroStatus === "todos" || p.status === filtroStatus);
  const produtosFiltrados = produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const canaisChat = listarCanaisAdmin(pedidos);
  const canaisEquipeDireta = listarCanaisPrivadosAdmin(user);

  const avancarStatus = (id) => setPedidos((prev) => prev.map((p) => {
    if (p.id !== id) return p;
    const idx = STATUS_FLUXO.indexOf(p.status);
    return { ...p, status: STATUS_FLUXO[Math.min(idx + 1, STATUS_FLUXO.length - 1)] };
  }));
  const cancelarPedido = (id) => setPedidos((prev) => prev.filter((p) => p.id !== id));
  const ajustarEstoque = (id, delta) => setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, estoque: Math.max(0, p.estoque + delta) } : p)));
  const toggleAtivo = (id) => setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p)));
  const removerProduto = (id) => setProdutos((prev) => prev.filter((p) => p.id !== id));
  const aprovarEntregador = (id) => setEntregadores((prev) => prev.map((e) => (e.id === id ? { ...e, status: "aprovado" } : e)));
  const removerEntregador = (id) => setEntregadores((prev) => prev.filter((e) => e.id !== id));
  const criarCupom = () => {
    if (!novoCupom.codigo || !novoCupom.desconto) return;
    setCupons((prev) => [...prev, { id: `cp${Date.now()}`, codigo: novoCupom.codigo.toUpperCase(), desconto: Number(novoCupom.desconto), ativo: true }]);
    setNovoCupom({ codigo: "", desconto: "" });
  };
  const toggleCupom = (id) => setCupons((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Cabecalho titulo="Painel admin" subtitulo={`Loja ED · ${user.nome}`} onLogout={onLogout} icon={<ShieldCheck size={20} className="text-blue-400" />} />

      {tab === "pedidos" && (
        <>
          <div className="px-5 pt-4 grid grid-cols-3 gap-2.5 mb-3">
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Vendas</p><p className="font-bold text-lg text-slate-900 mt-1">R${totalVendas.toFixed(0)}</p></Card>
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Ativos</p><p className="font-bold text-lg text-slate-900 mt-1">{pedidosAtivos}</p></Card>
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Ticket méd.</p><p className="font-bold text-lg text-slate-900 mt-1">R${ticketMedio.toFixed(0)}</p></Card>
          </div>
          <div className="px-5 flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {["todos", ...STATUS_FLUXO].map((s) => <Pill key={s} active={filtroStatus === s} onClick={() => setFiltroStatus(s)}>{s === "todos" ? "Todos" : STATUS_LABEL[s]}</Pill>)}
          </div>
          <div className="px-5 space-y-3">
            {pedidosFiltrados.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-900 font-semibold text-sm">{p.id}</span>
                  <Badge status={p.status} />
                </div>
                <p className="text-xs text-slate-500">{p.clienteNome} · {p.itens.length} {p.itens.length === 1 ? "item" : "itens"}</p>
                <p className="text-[11px] text-slate-400 mt-1">{p.entregadorId ? "Entregador atribuído" : "Aguardando entregador"}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">R${p.total.toFixed(2)}</span>
                  <div className="flex gap-2">
                    {p.status !== "entregue" && <Botao size="sm" variant="ghost" onClick={() => avancarStatus(p.id)}>Avançar <ChevronRight size={13} /></Botao>}
                    <Botao size="sm" variant="danger" onClick={() => cancelarPedido(p.id)}><X size={13} /></Botao>
                  </div>
                </div>
              </Card>
            ))}
            {pedidosFiltrados.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhum pedido nesse status.</p>}
          </div>
        </>
      )}

      {tab === "cardapio" && (
        <>
          <div className="px-5 pt-4 mb-4 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600" />
          </div>
          <div className="px-5 space-y-3">
            {produtosFiltrados.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-900 font-semibold text-sm">{p.nome}</h3>
                      {!p.ativo && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">Inativo</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{p.categoria} · R${p.precoBase.toFixed(2)} · {p.vendidos} vendidos</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditando(p)} className="text-slate-400 hover:text-blue-700 p-1"><Edit3 size={16} /></button>
                    <button onClick={() => removerProduto(p.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Estoque:</span>
                    <button onClick={() => ajustarEstoque(p.id, -1)} className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600"><Minus size={12} /></button>
                    <span className="text-slate-900 text-sm font-medium w-6 text-center">{p.estoque}</span>
                    <button onClick={() => ajustarEstoque(p.id, 1)} className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => toggleAtivo(p.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${p.ativo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.ativo ? "Visível" : "Oculto"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === "entregadores" && (
        <div className="px-5 pt-4 space-y-3">
          {entregadores.map((e) => {
            const stats = estatisticasEntregador(e.id, pedidos);
            return (
              <Card key={e.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 font-semibold text-sm">{e.nome}</p>
                    <p className="text-xs text-slate-400">{stats.entregasFeitas} entregas · nota {stats.avaliacaoMedia}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${e.status === "aprovado" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {e.status === "aprovado" ? "Aprovado" : "Pendente"}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  {e.status !== "aprovado" && <Botao size="sm" variant="success" onClick={() => aprovarEntregador(e.id)} className="flex-1"><UserCheck size={13} /> Aprovar</Botao>}
                  <Botao size="sm" variant="danger" onClick={() => removerEntregador(e.id)} className="flex-1"><Trash2 size={13} /> Remover</Botao>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "promocoes" && (
        <div className="px-5 pt-4 space-y-4">
          <Card>
            <h3 className="text-slate-900 font-semibold text-sm mb-3">Criar cupom</h3>
            <div className="flex gap-2">
              <input value={novoCupom.codigo} onChange={(e) => setNovoCupom((p) => ({ ...p, codigo: e.target.value }))} placeholder="CÓDIGO"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 uppercase" />
              <input value={novoCupom.desconto} onChange={(e) => setNovoCupom((p) => ({ ...p, desconto: e.target.value }))} placeholder="% off" type="number"
                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600" />
            </div>
            <Botao onClick={criarCupom} size="sm" className="w-full mt-2.5"><Tag size={13} /> Criar cupom</Botao>
          </Card>
          {cupons.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700"><Percent size={16} /></div>
                <div><p className="text-slate-900 font-semibold text-sm">{c.codigo}</p><p className="text-xs text-slate-400">{c.desconto}% de desconto</p></div>
              </div>
              <button onClick={() => toggleCupom(c.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${c.ativo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {c.ativo ? "Ativo" : "Inativo"}
              </button>
            </Card>
          ))}
          {cupons.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhum cupom criado ainda.</p>}
        </div>
      )}

      {tab === "avaliacoes" && (
        <div className="px-5 pt-4 space-y-5">
          <div>
            <h3 className="text-sm text-slate-500 font-semibold px-1 mb-2">Avaliações por pedido</h3>
            <div className="space-y-3">
              <Card className="flex items-center justify-between">
                <div><p className="text-[11px] text-slate-500 uppercase font-medium">Nota média</p><p className="font-bold text-2xl text-amber-500">{notaMedia}</p></div>
                <Estrelas nota={Math.round(Number(notaMedia) || 0)} tamanho={20} />
              </Card>
              {avaliacoes.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-900 text-sm font-semibold">{p.clienteNome}</span>
                    <Estrelas nota={p.avaliacao.nota} tamanho={14} />
                  </div>
                  {p.avaliacao.comentario && <p className="text-xs text-slate-500 italic">"{p.avaliacao.comentario}"</p>}
                </Card>
              ))}
              {avaliacoes.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhuma avaliação de pedido recebida ainda.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-slate-500 font-semibold px-1 mb-2">Avaliação geral da loja</h3>
            <div className="space-y-3">
              {avaliacoesLoja.length > 0 && (
                <Card className="flex items-center justify-between bg-slate-50 border-slate-200">
                  <div><p className="text-[11px] text-slate-500 uppercase font-medium">Nota média geral</p><p className="font-bold text-2xl text-slate-700">{(avaliacoesLoja.reduce((s, a) => s + a.nota, 0) / avaliacoesLoja.length).toFixed(1)}</p></div>
                  <Estrelas nota={Math.round(avaliacoesLoja.reduce((s, a) => s + a.nota, 0) / avaliacoesLoja.length)} tamanho={20} />
                </Card>
              )}
              {avaliacoesLoja.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-900 text-sm font-semibold">{a.clienteNome}</span>
                    <Estrelas nota={a.nota} tamanho={14} />
                  </div>
                  {a.comentario && <p className="text-xs text-slate-500 italic">"{a.comentario}"</p>}
                </Card>
              ))}
              {avaliacoesLoja.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhuma avaliação geral da loja recebida ainda.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto pt-4">
            <PainelChatComLista user={user} canais={canaisChat} mensagens={mensagens} setMensagens={setMensagens} podeApagar />
          </div>
        </div>
      )}

      {tab === "equipe-direta" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto pt-4">
            <PainelChatComLista user={user} canais={canaisEquipeDireta} mensagens={mensagens} setMensagens={setMensagens} podeApagar />
          </div>
        </div>
      )}

      {editando && (
        <ModalEditarProduto produto={editando} onClose={() => setEditando(null)} onSalvar={(produtoAtualizado) => {
          setProdutos((prev) => prev.map((p) => (p.id === produtoAtualizado.id ? produtoAtualizado : p)));
          setEditando(null);
        }} />
      )}

      <TabBar ativo={tab} onChange={setTab} tabs={[
        { key: "pedidos", label: "Pedidos", icon: <ClipboardList size={18} /> },
        { key: "cardapio", label: "Cardápio", icon: <Package size={18} /> },
        { key: "entregadores", label: "Gestão", icon: <Users size={18} /> },
        { key: "promocoes", label: "Cupons", icon: <Tag size={18} /> },
        { key: "avaliacoes", label: "Notas", icon: <Star size={18} /> },
        { key: "chat", label: "Chat", icon: <MessageCircle size={18} />, count: canaisChat.length },
        { key: "equipe-direta", label: "Direto", icon: <Send size={18} /> },
      ]} />
    </div>
  );
}

/* ============================================================
   PAINEL DO DONO
   ============================================================ */

function PainelDono({ produtos, pedidos, entregadores, mensagens, setMensagens, user, contas, setContas, solicitacoesRecuperacao, setSolicitacoesRecuperacao, avaliacoesLoja, onLogout }) {
  const [tab, setTab] = useState("visao");
  const [editandoConta, setEditandoConta] = useState(null);
  const [buscaConta, setBuscaConta] = useState("");
  const [buscaRecuperacao, setBuscaRecuperacao] = useState("");
  const [recuperacaoSelecionada, setRecuperacaoSelecionada] = useState(null);

  const totalVendas = pedidos.reduce((s, p) => s + p.total, 0);
  const avaliacoes = pedidos.filter((p) => p.avaliacao);
  const notaMedia = avaliacoes.length ? (avaliacoes.reduce((s, p) => s + p.avaliacao.nota, 0) / avaliacoes.length).toFixed(1) : "—";
  const maisVendidos = [...produtos].sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
  const menosVendidos = [...produtos].sort((a, b) => a.vendidos - b.vendidos).slice(0, 3);
  const totalVendido = produtos.reduce((s, p) => s + p.vendidos, 0);
  const dadosPizza = produtos.filter((p) => p.vendidos > 0).map((p, i) => ({ name: p.nome, value: p.vendidos, fill: CORES_GRAFICO[i % CORES_GRAFICO.length] }));
  const canalEquipe = [{ id: "equipe-geral", titulo: "Equipe (Admins)", subtitulo: "Canal interno", pedidoId: null }];
  const canaisEquipeDireta = listarCanaisPrivadosDono(user.id);

  // Vendas reais por dia, a partir dos pedidos que de fato existem (sem dado inventado)
  const vendasPorDia = pedidos.reduce((acc, p) => {
    const dia = p.criadoEm || "Sem data";
    acc[dia] = (acc[dia] || 0) + p.total;
    return acc;
  }, {});
  const dadosVendas = Object.entries(vendasPorDia).map(([dia, vendas]) => ({ dia, vendas }));

  // Todas as contas do "banco de dados": clientes cadastrados + contas fixas de acesso por código
  const todasContas = [
    ...contas.map((c) => ({ ...c, tipo: "Cliente" })),
    ...ADMINS_INICIAIS.map((a) => ({ id: a.id, nome: a.nome, contato: "—", senha: "(código fixo)", tipo: "Admin" })),
    ...entregadores.map((e) => ({ id: e.id, nome: e.nome, contato: "—", senha: "(código fixo)", tipo: "Entregador" })),
  ];
  const contasFiltradas = todasContas.filter((c) =>
    c.nome.toLowerCase().includes(buscaConta.toLowerCase()) || (c.contato || "").toLowerCase().includes(buscaConta.toLowerCase())
  );

  const salvarConta = (contaAtualizada) => {
    setContas((prev) => prev.map((c) => (c.id === contaAtualizada.id ? contaAtualizada : c)));
    setEditandoConta(null);
  };
  const excluirConta = (id) => {
    setContas((prev) => prev.filter((c) => c.id !== id));
    setEditandoConta(null);
  };

  const resultadosBusca = buscaRecuperacao.trim()
    ? contas.filter((c) => c.nome.toLowerCase().includes(buscaRecuperacao.toLowerCase()) || c.contato.toLowerCase().includes(buscaRecuperacao.toLowerCase()))
    : [];

  const marcarResolvida = (id) => setSolicitacoesRecuperacao((prev) => prev.map((s) => (s.id === id ? { ...s, resolvida: true } : s)));
  const excluirSolicitacao = (id) => {
    setMensagens((prev) => prev.filter((m) => m.canalId !== `recuperacao-${id}`));
    setSolicitacoesRecuperacao((prev) => prev.filter((s) => s.id !== id));
    setRecuperacaoSelecionada(null);
  };

  const canaisRecuperacao = listarCanaisRecuperacaoDono(solicitacoesRecuperacao);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Cabecalho titulo="Visão geral" subtitulo="Loja ED · DONO" onLogout={onLogout} icon={<Crown size={20} className="text-amber-400" />} />

      {tab === "visao" && (
        <div className="px-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Faturamento</p><p className="font-bold text-xl text-slate-900 mt-1">R${totalVendas.toFixed(0)}</p></Card>
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Pedidos</p><p className="font-bold text-xl text-slate-900 mt-1">{pedidos.length}</p></Card>
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Avaliação</p><p className="font-bold text-xl text-amber-500 mt-1">{notaMedia}</p></Card>
            <Card><p className="text-[10px] text-slate-500 uppercase font-medium">Equipe</p><p className="font-bold text-xl text-slate-900 mt-1">{entregadores.length}</p></Card>
          </div>
          <Card>
            <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-1.5"><BarChart3 size={15} className="text-amber-500" /> Vendas por dia</h3>
            {dadosVendas.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-10">Ainda não há pedidos registrados. O gráfico aparece conforme os pedidos forem feitos.</p>
            ) : (
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={dadosVendas}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#111827", fontWeight: 700 }} itemStyle={{ color: "#2563EB", fontWeight: 600 }} />
                    <Line type="monotone" dataKey="vendas" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {avaliacoesLoja.length > 0 && (
            <Card>
              <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-1.5"><Star size={15} className="text-amber-500" /> Avaliação geral da loja</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-2xl text-slate-900">{(avaliacoesLoja.reduce((s, a) => s + a.nota, 0) / avaliacoesLoja.length).toFixed(1)}</span>
                <Estrelas nota={Math.round(avaliacoesLoja.reduce((s, a) => s + a.nota, 0) / avaliacoesLoja.length)} tamanho={18} />
              </div>
              <p className="text-xs text-slate-400">{avaliacoesLoja.length} avaliação(ões) recebida(s)</p>
            </Card>
          )}
        </div>
      )}

      {tab === "produtos" && (
        <div className="px-5 pt-4 space-y-4">
          <Card>
            <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={15} className="text-green-600" /> Mais vendidos</h3>
            {totalVendido === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {maisVendidos.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 text-sm w-4">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 font-bold">{p.nome}</p>
                      <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${maisVendidos[0].vendidos > 0 ? (p.vendidos / maisVendidos[0].vendidos) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right font-medium">{p.vendidos} vd.</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-1.5"><TrendingDown size={15} className="text-red-500" /> Menos vendidos</h3>
            {totalVendido === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {menosVendidos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-900 font-bold">{p.nome}</span>
                    <span className="text-xs text-slate-500 font-medium">{p.vendidos} vendidos</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="text-slate-900 font-bold text-sm mb-3">Distribuição de vendas</h3>
            {dadosPizza.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-10">Sem vendas suficientes para gerar o gráfico ainda.</p>
            ) : (
              <>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={dadosPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} · ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#9CA3AF" }}>
                        {dadosPizza.map((d, i) => <Cell key={i} fill={d.fill} stroke="#FFFFFF" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#111827", fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {dadosPizza.map((d, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} /> {d.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === "equipe" && (
        <div className="px-5 pt-4 space-y-3">
          <h3 className="text-sm text-slate-500 font-semibold px-1">Entregadores</h3>
          {entregadores.map((e) => {
            const stats = estatisticasEntregador(e.id, pedidos);
            return (
              <Card key={e.id} className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{e.nome}</p>
                  <p className="text-xs text-slate-400">{stats.entregasFeitas} entregas concluídas</p>
                </div>
                <span className="font-bold text-amber-500 flex items-center gap-1 text-sm">{stats.avaliacaoMedia} {stats.avaliacaoMedia !== "—" && <Star size={13} className="fill-amber-400" />}</span>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "contas" && (
        <div className="px-5 pt-4 space-y-3">
          <div className="relative mb-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input value={buscaConta} onChange={(e) => setBuscaConta(e.target.value)} placeholder="Buscar por nome ou contato..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600" />
          </div>
          <p className="text-xs text-slate-400 px-1">{todasContas.length} conta(s) no total · {contas.length} cliente(s) cadastrado(s)</p>
          {contasFiltradas.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-slate-900 font-semibold text-sm truncate">{c.nome}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${c.tipo === "Cliente" ? "bg-blue-50 text-blue-700" : c.tipo === "Admin" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>{c.tipo}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{c.contato} · senha: {c.senha}</p>
              </div>
              {c.tipo === "Cliente" && (
                <button onClick={() => setEditandoConta(c)} className="text-slate-400 hover:text-blue-700 p-1.5 ml-2 shrink-0"><Edit3 size={16} /></button>
              )}
            </Card>
          ))}
          {contasFiltradas.length === 0 && <p className="text-center text-slate-400 text-sm py-12">Nenhuma conta encontrada.</p>}
        </div>
      )}

      {tab === "recuperacao" && !recuperacaoSelecionada && (
        <div className="px-5 pt-4 space-y-4">
          <Card>
            <h3 className="text-slate-900 font-bold text-sm mb-2">Buscar conta para recuperação</h3>
            <p className="text-xs text-slate-500 mb-3">Digite o nome ou e-mail que a pessoa informou no chat de recuperação.</p>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input value={buscaRecuperacao} onChange={(e) => setBuscaRecuperacao(e.target.value)} placeholder="Nome ou e-mail informado"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white" />
            </div>
            {buscaRecuperacao.trim() && (
              <div className="mt-3 space-y-2">
                {resultadosBusca.length === 0 && <p className="text-xs text-slate-400 py-2">Nenhuma conta encontrada com esse dado.</p>}
                {resultadosBusca.map((c) => (
                  <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.contato} · senha: {c.senha}</p>
                    </div>
                    <Botao size="sm" variant="ghost" onClick={() => setEditandoConta(c)}><Edit3 size={13} /> Editar</Botao>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div>
            <h3 className="text-sm text-slate-500 font-semibold px-1 mb-2">Solicitações de recuperação</h3>
            <div className="space-y-2.5">
              {solicitacoesRecuperacao.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhuma solicitação ainda.</p>}
              {solicitacoesRecuperacao.map((s) => (
                <Card key={s.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.dadoBusca}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${s.resolvida ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {s.resolvida ? "Resolvida" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{s.criadoEm}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Botao size="sm" variant="ghost" onClick={() => setRecuperacaoSelecionada(s)}><MessageCircle size={13} /> Conversar</Botao>
                    {s.resolvida && (
                      <button onClick={() => excluirSolicitacao(s.id)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "recuperacao" && recuperacaoSelecionada && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          <ChatJanela
            user={user}
            canal={{ id: `recuperacao-${recuperacaoSelecionada.id}`, titulo: `Recuperação · ${recuperacaoSelecionada.dadoBusca}`, subtitulo: "Conversa de recuperação" }}
            mensagens={mensagens} setMensagens={setMensagens}
            onVoltar={() => setRecuperacaoSelecionada(null)}
          />
          {!recuperacaoSelecionada.resolvida ? (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
              <Botao onClick={() => { marcarResolvida(recuperacaoSelecionada.id); setRecuperacaoSelecionada((s) => ({ ...s, resolvida: true })); }} variant="success" className="w-full" size="sm">
                <Check size={14} /> Marcar solicitação como resolvida
              </Botao>
            </div>
          ) : (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
              <Botao onClick={() => excluirSolicitacao(recuperacaoSelecionada.id)} variant="danger" className="w-full" size="sm">
                <Trash2 size={14} /> Apagar esta conversa de recuperação
              </Botao>
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto pt-4">
            <PainelChatComLista user={user} canais={canalEquipe} mensagens={mensagens} setMensagens={setMensagens} podeApagar />
          </div>
        </div>
      )}

      {tab === "equipe-direta" && (
        <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
          <div className="flex-1 overflow-y-auto pt-4">
            <PainelChatComLista user={user} canais={canaisEquipeDireta} mensagens={mensagens} setMensagens={setMensagens} podeApagar />
          </div>
        </div>
      )}

      {editandoConta && (
        <ModalEditarConta conta={editandoConta} onClose={() => setEditandoConta(null)} onSalvar={salvarConta} onExcluir={excluirConta} />
      )}

      <TabBar accent="#B45309" ativo={tab} onChange={setTab} tabs={[
        { key: "visao", label: "Visão geral", icon: <BarChart3 size={18} /> },
        { key: "produtos", label: "Produtos", icon: <TrendingUp size={18} /> },
        { key: "equipe", label: "Equipe", icon: <Users size={18} /> },
        { key: "contas", label: "Contas", icon: <KeyRound size={18} /> },
        { key: "recuperacao", label: "Recuperação", icon: <Mail size={18} />, count: solicitacoesRecuperacao.filter((s) => !s.resolvida).length },
        { key: "chat", label: "Chat", icon: <MessageCircle size={18} /> },
        { key: "equipe-direta", label: "Direto", icon: <Send size={18} /> },
      ]} />
    </div>
  );
}

/* ============================================================
   MODAL DE EDIÇÃO DE CONTA (uso do Dono no banco de dados)
   ============================================================ */

function ModalEditarConta({ conta, onClose, onSalvar, onExcluir }) {
  const [nome, setNome] = useState(conta.nome);
  const [contato, setContato] = useState(conta.contato);
  const [senha, setSenha] = useState(conta.senha);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Editar conta</h2>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">E-mail ou telefone</label>
            <input value={contato} onChange={(e) => setContato(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Senha</label>
            <input value={senha} onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 mt-1 focus:outline-none focus:border-blue-600 focus:bg-white" />
          </div>
        </div>

        {!confirmandoExclusao ? (
          <div className="flex gap-3">
            <Botao onClick={() => setConfirmandoExclusao(true)} variant="danger" className="flex-1"><Trash2 size={14} /> Excluir</Botao>
            <Botao onClick={() => onSalvar({ ...conta, nome, contato, senha })} className="flex-1"><Check size={15} /> Salvar</Botao>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5">
            <p className="text-sm text-red-700 font-medium mb-3">Tem certeza? Essa conta será excluída permanentemente.</p>
            <div className="flex gap-2">
              <Botao onClick={() => setConfirmandoExclusao(false)} variant="ghost" size="sm" className="flex-1">Cancelar</Botao>
              <Botao onClick={() => onExcluir(conta.id)} variant="danger" size="sm" className="flex-1">Sim, excluir</Botao>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   APP RAIZ
   ============================================================ */

export default function App() {
  const [user, setUser] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [recuperacaoAtiva, setRecuperacaoAtiva] = useState(null);

  // Estes 8 são compartilhados entre TODAS as pessoas usando o app,
  // sincronizados em tempo real via Firestore — não são mais isolados
  // por navegador/dispositivo.
  const [contas, setContas, contasProntas] = useFirestoreArray("contas", CONTAS_INICIAIS);
  const [produtos, setProdutos, produtosProntos] = useFirestoreArray("produtos", PRODUTOS_INICIAIS);
  const [pedidos, setPedidos, pedidosProntos] = useFirestoreArray("pedidos", PEDIDOS_INICIAIS);
  const [entregadores, setEntregadores, entregadoresProntos] = useFirestoreArray("entregadores", ENTREGADORES_INICIAIS);
  const [cupons, setCupons] = useFirestoreArray("cupons", []);
  const [mensagens, setMensagens] = useFirestoreArray("mensagens", MENSAGENS_INICIAIS);
  const [avaliacoesLoja, setAvaliacoesLoja] = useFirestoreArray("avaliacoesLoja", []);
  const [solicitacoesRecuperacao, setSolicitacoesRecuperacao] = useFirestoreArray("solicitacoesRecuperacao", []);

  const dadosCompartilhadosProntos = contasProntas && produtosProntos && pedidosProntos && entregadoresProntos;

  // Carrega sessão salva ao abrir o app (sobrevive a fechar/reabrir, via localStorage do navegador)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("sessao-loja-ed");
      if (salvo) setUser(JSON.parse(salvo));
    } catch (e) {
      // nenhuma sessão salva ainda
    } finally {
      setCarregandoSessao(false);
    }
  }, []);

  const entrarComSessao = (conta) => {
    setUser(conta);
    try { localStorage.setItem("sessao-loja-ed", JSON.stringify(conta)); } catch (e) {}
  };

  const confirmarSaida = () => {
    setUser(null);
    setConfirmandoSaida(false);
    try { localStorage.removeItem("sessao-loja-ed"); } catch (e) {}
  };

  if (!firebaseConfigurado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
            <AlertCircle size={22} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Firebase ainda não configurado</h2>
          <p className="text-sm text-slate-600 mb-3">
            Para clientes, entregadores, admins e o dono verem os mesmos dados, este app precisa de um banco de dados compartilhado.
          </p>
          <p className="text-sm text-slate-600">
            Abra o arquivo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">src/firebase.js</code> e cole as chaves do seu projeto Firebase. O passo a passo está em <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">CONFIGURAR_FIREBASE.md</code>.
          </p>
        </div>
      </div>
    );
  }

  if (carregandoSessao || !dadosCompartilhadosProntos) {
    return (<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-300 border-t-blue-700 rounded-full animate-spin" /></div>);
  }

  // Pessoa ainda não-logada está numa conversa de recuperação de conta com o DONO
  if (!user && recuperacaoAtiva) {
    const canal = listarCanalRecuperacaoCliente(recuperacaoAtiva.id)[0];
    return (
      <div className="fixed inset-0 bg-white flex flex-col">
        <ChatJanela
          user={{ id: `solicitante-${recuperacaoAtiva.id}`, nome: recuperacaoAtiva.dadoBusca }}
          canal={canal}
          mensagens={mensagens}
          setMensagens={setMensagens}
          onVoltar={() => setRecuperacaoAtiva(null)}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <TelaAuth
        contas={contas} setContas={setContas} onEntrar={entrarComSessao}
        solicitacoesRecuperacao={solicitacoesRecuperacao} setSolicitacoesRecuperacao={setSolicitacoesRecuperacao}
        onAbrirRecuperacao={(solicitacao) => setRecuperacaoAtiva(solicitacao)}
      />
    );
  }

  return (
    <>
      {user.papel === "cliente" && <PainelCliente user={user} produtos={produtos} pedidos={pedidos} setPedidos={setPedidos} mensagens={mensagens} setMensagens={setMensagens} cupons={cupons} avaliacoesLoja={avaliacoesLoja} setAvaliacoesLoja={setAvaliacoesLoja} onLogout={() => setConfirmandoSaida(true)} />}
      {user.papel === "entregador" && <PainelEntregador user={user} pedidos={pedidos} setPedidos={setPedidos} mensagens={mensagens} setMensagens={setMensagens} onLogout={() => setConfirmandoSaida(true)} />}
      {user.papel === "admin" && (
        <PainelAdmin user={user} produtos={produtos} setProdutos={setProdutos} pedidos={pedidos} setPedidos={setPedidos}
          entregadores={entregadores} setEntregadores={setEntregadores} cupons={cupons} setCupons={setCupons}
          mensagens={mensagens} setMensagens={setMensagens} avaliacoesLoja={avaliacoesLoja} onLogout={() => setConfirmandoSaida(true)} />
      )}
      {user.papel === "dono" && (
        <PainelDono user={user} produtos={produtos} pedidos={pedidos} entregadores={entregadores} mensagens={mensagens} setMensagens={setMensagens}
          contas={contas} setContas={setContas} solicitacoesRecuperacao={solicitacoesRecuperacao} setSolicitacoesRecuperacao={setSolicitacoesRecuperacao}
          avaliacoesLoja={avaliacoesLoja} onLogout={() => setConfirmandoSaida(true)} />
      )}

      {confirmandoSaida && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center px-6" onClick={() => setConfirmandoSaida(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
              <LogOut size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Tem certeza que quer sair?</h2>
            <p className="text-sm text-slate-500 mb-5">Você vai sair da sua conta. Para entrar de novo, será preciso fazer login.</p>
            <div className="flex gap-3">
              <Botao onClick={() => setConfirmandoSaida(false)} variant="ghost" className="flex-1">Cancelar</Botao>
              <Botao onClick={confirmarSaida} variant="danger" className="flex-1">Sair</Botao>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
