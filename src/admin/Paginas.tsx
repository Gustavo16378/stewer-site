/**
 * Páginas do painel que não são lista: contatos, endereço e mapa, e a
 * conta (espaço do banco e senha).
 */
import { Suspense, lazy, useEffect, useState } from 'react'
import { grausMinutos, telefoneFormatado } from '../content/site'
import { ehLink, noBrasil, pontoDoTexto, textoDoPonto, type Ponto } from '../lib/coordenadas'
import { CAMPOS_TEXTO } from '../lib/textos'
import { api } from './api'
import { EditorTextos, useTextosSalvos } from './Textos'
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

type Contatos = { whatsapp: string; instagram: string; mensagem: string }

const MapaPonto = lazy(() => import('./MapaPonto'))
const CAMPOS_ENDERECO = CAMPOS_TEXTO.filter((c) => c.pagina === 'contatos')

export function PaginaContatos() {
  const [config, setConfig] = useState<Record<string, string> | null>(null)
  const [salvos, setSalvos] = useTextosSalvos()
  const avisar = useAvisar()

  useEffect(() => {
    api<{ config: Record<string, string> }>('/admin/configuracoes')
      .then(({ config: c }) => setConfig(c))
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Contatos e mapa</h2>
          <p className="pagina__descricao">
            O WhatsApp, o Instagram, o endereço e o ponto do mapa que aparecem no site. Cada parte tem o próprio botão
            de salvar.
          </p>
        </div>
        <a className="btn btn--fantasma" href="/#onde-atende" target="_blank" rel="noopener">
          Ver no site ↗
        </a>
      </header>

      {!config || !salvos ? (
        <Carregando />
      ) : (
        <>
          <CartaoContatos config={config} />
          <div className="bloco-titulo">
            <h3 className="cartao__titulo">Endereço</h3>
            <p className="campo__dica">O que aparece no cartão do mapa e no rodapé.</p>
          </div>
          <EditorTextos nome="Endereço" campos={CAMPOS_ENDERECO} salvos={salvos} aoSalvar={setSalvos} />
          <CartaoLocal config={config} aoSalvar={(p) => setConfig((c) => ({ ...c, ...p }))} />
        </>
      )}
    </section>
  )
}

function CartaoContatos({ config }: { config: Record<string, string> }) {
  const inicial = (): Contatos => ({
    whatsapp: telefoneFormatado(config.whatsapp ?? ''),
    instagram: config.instagram ? `@${config.instagram}` : '',
    mensagem: config.mensagem ?? '',
  })
  const [salvo, setSalvo] = useState<Contatos>(inicial)
  const [form, setForm] = useState<Contatos>(inicial)
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
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

  const mudar = (k: keyof Contatos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <form className="cartao cartao--largo" onSubmit={salvar}>
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
      <div className="envio__acoes">
        <button type="submit" className="btn btn--primario" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar contatos'}
        </button>
      </div>
    </form>
  )
}

function CartaoLocal({
  config,
  aoSalvar,
}: {
  config: Record<string, string>
  aoSalvar: (c: { latitude: string; longitude: string }) => void
}) {
  const salvo: Ponto = { latitude: Number(config.latitude), longitude: Number(config.longitude) }
  const [ponto, setPonto] = useState<Ponto>(salvo)
  const [colado, setColado] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  const mudou = ponto.latitude !== salvo.latitude || ponto.longitude !== salvo.longitude

  /** lê o que foi colado: coordenadas e link longo na hora; link curto pela API */
  async function achar(texto: string) {
    setErro('')
    if (!texto.trim()) return
    const direto = pontoDoTexto(texto)
    if (direto) {
      if (!noBrasil(direto)) return setErro('Esse ponto fica fora do Brasil. Confira se copiou o lugar certo.')
      setPonto(direto)
      return
    }
    if (!ehLink(texto)) {
      return setErro('Cole o link do Google Maps (botão Compartilhar) ou as coordenadas, por exemplo: -10.18256, -48.32910.')
    }
    setBuscando(true)
    try {
      setPonto(await api<Ponto>('/admin/link-mapa', { method: 'POST', json: { url: texto.trim() } }))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setBuscando(false)
    }
  }

  async function salvar() {
    setSalvando(true)
    try {
      const r = await api<{ config: { latitude: string; longitude: string } }>('/admin/configuracoes', {
        method: 'PUT',
        json: { coordenadas: textoDoPonto(ponto) },
      })
      aoSalvar(r.config)
      setColado('')
      avisar('Local salvo. O mapa do site já mostra o ponto novo.')
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="cartao cartao--largo">
      <h3 className="cartao__titulo">Local no mapa</h3>
      <label className="campo" htmlFor="link-mapa">
        <span className="campo__rotulo">Link do Google Maps ou coordenadas</span>
        <input
          id="link-mapa"
          value={colado}
          placeholder="https://maps.app.goo.gl/…"
          onChange={(e) => setColado(e.target.value)}
          onPaste={(e) => {
            const texto = e.clipboardData.getData('text')
            // colou: já procura, sem precisar de botão
            setTimeout(() => achar(texto))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              achar(colado)
            }
          }}
        />
        <span className="campo__dica">
          No Google Maps, abra o lugar, toque em <strong>Compartilhar</strong>, copie o link e cole aqui. Depois, se
          precisar, arraste o alfinete no mapa abaixo para acertar.
        </span>
      </label>
      <div className="envio__acoes envio__acoes--inicio">
        <button type="button" className="btn btn--secundario" disabled={!colado.trim() || buscando} onClick={() => achar(colado)}>
          {buscando ? 'Procurando…' : 'Achar no mapa'}
        </button>
      </div>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <Suspense fallback={<div className="mapa-ponto mapa-ponto--carregando" />}>
        <MapaPonto ponto={ponto} aoMudar={setPonto} />
      </Suspense>

      <p className="campo__dica previa-ponto" aria-live="polite">
        {mudou ? 'Ponto novo, ainda não salvo: ' : 'No site agora: '}
        {grausMinutos(ponto.latitude, 'lat')} · {grausMinutos(ponto.longitude, 'lng')}.{' '}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${ponto.latitude},${ponto.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Conferir no Google Maps ↗
        </a>
      </p>

      <div className="envio__acoes">
        {mudou && (
          <button
            type="button"
            className="btn btn--fantasma"
            onClick={() => {
              setPonto(salvo)
              setErro('')
            }}
          >
            Desfazer
          </button>
        )}
        <button type="button" className="btn btn--primario" disabled={!mudou || salvando} onClick={salvar}>
          {salvando ? 'Salvando…' : 'Salvar local'}
        </button>
      </div>
    </div>
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
