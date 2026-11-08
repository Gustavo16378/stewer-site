/**
 * Páginas do painel que não são lista: contatos e mapa, e a conta
 * (espaço do banco e senha).
 */
import { useEffect, useState } from 'react'
import { grausMinutos, telefoneFormatado } from '../content/site'
import { api } from './api'
import { Carregando, useAvisar } from './ui'

type Espaco = {
  usado: number
  limite: number
  porcentagem: number
  bytesFotos: number
  fotosEnviadas: number
}

const mb = (b: number) => `${(b / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`

function useEspaco() {
  const [espaco, setEspaco] = useState<Espaco | null>(null)
  useEffect(() => {
    api<Espaco>('/admin/espaco')
      .then(setEspaco)
      .catch(() => {})
  }, [])
  return espaco
}

/** faixa no topo do painel quando o banco passa de 70% */
export function AvisoEspaco() {
  const espaco = useEspaco()
  if (!espaco || espaco.porcentagem < 70) return null
  const critico = espaco.porcentagem >= 90
  return (
    <p className={`faixa ${critico ? 'faixa--critica' : ''}`} role="status">
      {critico ? 'O banco está quase cheio' : 'O banco passou de 70%'}: {mb(espaco.usado)} de {mb(espaco.limite)}. Apague
      fotos que não estão em uso em <a href="#fotos">Fotos</a>.
    </p>
  )
}

export function CartaoEspaco() {
  const espaco = useEspaco()
  if (!espaco) return null
  const nivel = espaco.porcentagem >= 90 ? 'critico' : espaco.porcentagem >= 70 ? 'atencao' : 'ok'
  return (
    <div className="cartao">
      <h3 className="cartao__titulo">Espaço do banco</h3>
      <div className={`medidor medidor--${nivel}`} aria-hidden="true">
        <span style={{ width: `${Math.max(1, Math.min(100, espaco.porcentagem))}%` }} />
      </div>
      <p className="campo__dica">
        {mb(espaco.usado)} de {mb(espaco.limite)} ({espaco.porcentagem.toLocaleString('pt-BR')}%) no plano gratuito.
        {' '}
        {espaco.fotosEnviadas} foto{espaco.fotosEnviadas === 1 ? '' : 's'} enviada{espaco.fotosEnviadas === 1 ? '' : 's'} pelo
        painel ({mb(espaco.bytesFotos)}).
      </p>
      <p className="campo__dica">
        Quase todo o peso são as fotos (cerca de 0,3 MB cada, o que dá espaço para mais de mil). Texto quase não ocupa. O
        painel avisa no topo quando passar de 70%.
      </p>
    </div>
  )
}

type Contatos = { whatsapp: string; instagram: string; mensagem: string; coordenadas: string }

/** lê "-10.18, -48.32" do jeito que a API aceita, só para a prévia */
function previaCoordenadas(s: string) {
  const m = /^(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/.exec(s.trim())
  if (!m) return null
  const lat = Number(m[1].replace(',', '.'))
  const lng = Number(m[2].replace(',', '.'))
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

export function PaginaContatos() {
  const [salvo, setSalvo] = useState<Contatos | null>(null)
  const [form, setForm] = useState<Contatos | null>(null)
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  useEffect(() => {
    api<{ config: Record<string, string> }>('/admin/configuracoes')
      .then(({ config: c }) => {
        const v = {
          whatsapp: telefoneFormatado(c.whatsapp ?? ''),
          instagram: c.instagram ? `@${c.instagram}` : '',
          mensagem: c.mensagem ?? '',
          coordenadas: c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '',
        }
        setSalvo(v)
        setForm(v)
      })
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !salvo) return
    // manda só o que mudou: o que ninguém mexeu não passa pela validação de novo
    const mudou = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== salvo[k as keyof Contatos]))
    if (!Object.keys(mudou).length) return avisar('Nada mudou.')
    setSalvando(true)
    try {
      await api('/admin/configuracoes', { method: 'PUT', json: mudou })
      setSalvo(form)
      avisar('Contatos salvos. O site já usa os novos.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const ponto = form ? previaCoordenadas(form.coordenadas) : null
  const mudar = (k: keyof Contatos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f))

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Contatos e mapa</h2>
          <p className="pagina__descricao">
            O WhatsApp, o Instagram e o ponto do mapa que aparecem no site. O nome do lugar, o endereço e o horário ficam
            em <a href="#textos">Textos do site</a>, na parte "Onde atende".
          </p>
        </div>
        <a className="btn btn--fantasma" href="/#contato" target="_blank" rel="noopener">
          Ver no site ↗
        </a>
      </header>

      {!form ? (
        <Carregando />
      ) : (
        <form className="cartao" onSubmit={salvar}>
          <h3 className="cartao__titulo">Contatos</h3>
          <label className="campo">
            <span className="campo__rotulo">WhatsApp</span>
            <input inputMode="tel" value={form.whatsapp} onChange={mudar('whatsapp')} placeholder="(63) 99999-9999" />
            <span className="campo__dica">Usado nos botões de WhatsApp e no telefone do site.</span>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Mensagem que já vem escrita no WhatsApp</span>
            <textarea rows={2} maxLength={200} value={form.mensagem} onChange={mudar('mensagem')} />
            <span className="campo__dica">O cliente toca no botão e o WhatsApp abre com esta mensagem pronta.</span>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Instagram</span>
            <input value={form.instagram} onChange={mudar('instagram')} placeholder="@stewer.gabriel" />
            <span className="campo__dica">Só o nome de usuário. Também dá para colar o link do perfil.</span>
          </label>

          <h3 className="cartao__titulo cartao__titulo--separado">Local no mapa</h3>
          <label className="campo">
            <span className="campo__rotulo">Coordenadas</span>
            <input value={form.coordenadas} onChange={mudar('coordenadas')} placeholder="-10.18256, -48.32910" />
            <span className="campo__dica">
              No Google Maps, segure o dedo (ou clique com o botão direito) em cima do lugar: os números aparecem no topo.
              Toque neles para copiar e cole aqui.
            </span>
          </label>
          {ponto && (
            <p className="campo__dica">
              Vai aparecer no site como {grausMinutos(ponto.lat, 'lat')} · {grausMinutos(ponto.lng, 'lng')}.{' '}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${ponto.lat},${ponto.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Conferir no Google Maps ↗
              </a>
            </p>
          )}

          <div className="envio__acoes">
            <button type="submit" className="btn btn--primario" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar contatos e mapa'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export function PaginaConta() {
  const [senha, setSenha] = useState({ atual: '', nova: '', repetir: '' })
  const avisar = useAvisar()

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha.nova !== senha.repetir) return avisar('As duas senhas novas não são iguais.', 'erro')
    try {
      await api('/admin/senha', { method: 'PUT', json: { atual: senha.atual, nova: senha.nova } })
      setSenha({ atual: '', nova: '', repetir: '' })
      avisar('Senha trocada.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    }
  }

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Minha conta</h2>
          <p className="pagina__descricao">A sua senha do painel e quanto espaço o site já usa.</p>
        </div>
      </header>

      <form className="cartao" onSubmit={trocarSenha}>
        <h3 className="cartao__titulo">Trocar senha</h3>
        <label className="campo">
          <span className="campo__rotulo">Senha atual</span>
          <input type="password" autoComplete="current-password" value={senha.atual} onChange={(e) => setSenha({ ...senha, atual: e.target.value })} />
        </label>
        <div className="grupo--lado grupo__campos">
          <label className="campo">
            <span className="campo__rotulo">Nova senha</span>
            <input type="password" autoComplete="new-password" minLength={10} value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} />
            <span className="campo__dica">Pelo menos 10 caracteres.</span>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Repita a nova senha</span>
            <input type="password" autoComplete="new-password" value={senha.repetir} onChange={(e) => setSenha({ ...senha, repetir: e.target.value })} />
          </label>
        </div>
        <div className="envio__acoes">
          <button type="submit" className="btn btn--secundario" disabled={!senha.atual || senha.nova.length < 10}>
            Trocar senha
          </button>
        </div>
      </form>

      <CartaoEspaco />
    </section>
  )
}
