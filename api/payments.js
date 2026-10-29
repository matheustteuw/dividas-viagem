// Lista de parcelas (fonte única). Para mudar valores/pessoas, edite aqui.
const PESSOAS = ['2t bigode', 'Laryssa', 'Gabriela', 'Victor', 'Isabelly'];
const PLANOS = [
  { to: '2t bigode', amount: 112, motivo: 'Passagens (cartão do 2t bigode)', parcelas: ['05/11', '05/12'] },
  { to: 'Isabelly', amount: 145, motivo: 'Hospedagem (cartão da Isa)', parcelas: ['08/11', '08/12'] },
];

const ITEMS = PLANOS.flatMap((p) =>
  PESSOAS.filter((from) => from !== p.to).flatMap((from) =>
    p.parcelas.map((parcela) => ({
      id: `${from}>${p.to}>${parcela}`,
      from, to: p.to, amount: p.amount, parcela, motivo: p.motivo,
    }))
  )
);

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'pagamentos';
const mem = {}; // só para rodar local sem Redis

async function redis(...cmd) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

async function readPaid() {
  if (!URL) {
    if (process.env.VERCEL) throw new Error('Redis não configurado');
    return { ...mem };
  }
  const flat = (await redis('HGETALL', KEY)) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
  return out;
}

async function writePaid(id, date) {
  if (!URL) {
    if (process.env.VERCEL) throw new Error('Redis não configurado');
    if (date) mem[id] = date; else delete mem[id];
    return;
  }
  await (date ? redis('HSET', KEY, id, date) : redis('HDEL', KEY, id));
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const { id, date } = req.body || {};
      if (!ITEMS.some((i) => i.id === id)) return res.status(400).json({ error: 'id inválido' });
      if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'data inválida' });
      await writePaid(id, date);
    }
    const paid = await readPaid();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ items: ITEMS.map((i) => ({ ...i, paidAt: paid[i.id] || null })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
