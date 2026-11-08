/**
 * Aba "Textos do site": tudo que é fixo no design (abertura, quem é,
 * títulos das seções, rodapé) e o Stewer pode reescrever. A lista de
 * campos vem de lib/textos.ts, a mesma que o site e a API usam.
 *
 * O editor de uma seção (`EditorTextos`) também aparece em "Contatos e
 * mapa", com os campos de endereço.
 */
import { useEffect, useState } from 'react'
import type { Foto } from '../content/site'
import { CAMPOS_TEXTO, type CampoTexto } from '../lib/textos'
import { api, type Midia } from './api'
import { SeletorFoto } from './Fotos'
import { Carregando, useAvisar } from './ui'

export type Salvos = { valores: Record<string, string>; fotos: Record<string, string> }

/** seções da aba "Textos do site" (os campos de outras páginas ficam de fora) */
const CAMPOS_DA_ABA = CAMPOS_TEXTO.filter((c) => !c.pagina)
const SECOES = [...new Set(CAMPOS_DA_ABA.map((c) => c.secao))]

function original(c: CampoTexto) {
  const v = c.ler()
  return typeof v === 'string' ? v : (v as Foto).src
}

/** o que já está salvo no banco; um pedido só para a página inteira */
export function useTextosSalvos() {
  const [salvos, setSalvos] = useState<Salvos | null>(null)
  const avisar = useAvisar()
  useEffect(() => {
    api<Salvos>('/admin/textos')
      .then(setSalvos)
      .catch((e) => avisar(e.message, 'erro'))
  }, [avisar])
  return [salvos, setSalvos] as const
}

type PropsEditor = {
  /** nome da seção, usado no botão e no aviso ("Salvar endereço") */
  nome: string
  campos: CampoTexto[]
  salvos: Salvos
  aoSalvar: (novos: Salvos) => void
  oculto?: boolean
}

/** os campos de uma seção, com rascunho, "voltar ao original" e salvar */
export function EditorTextos({ nome, campos, salvos, aoSalvar, oculto }: PropsEditor) {
  const [rascunho, setRascunho] = useState<Record<string, string | null>>({})
  const [seletor, setSeletor] = useState<CampoTexto | null>(null)
  const [previas, setPrevias] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const avisar = useAvisar()

  const mudados = Object.keys(rascunho)

  /** o que o campo mostra agora: rascunho, senão o salvo, senão o original */
  function valorAtual(c: CampoTexto): string {
    if (c.chave in rascunho) return rascunho[c.chave] ?? (c.tipo === 'foto' ? '' : original(c))
    return salvos.valores[c.chave] ?? (c.tipo === 'foto' ? '' : original(c))
  }

  function urlDaFoto(c: CampoTexto) {
    if (c.chave in rascunho) return rascunho[c.chave] ? previas[c.chave] : original(c)
    return salvos.fotos[c.chave] ?? original(c)
  }

  const personalizado = (c: CampoTexto) =>
    c.chave in rascunho ? rascunho[c.chave] !== null : !!salvos.valores[c.chave]

  async function salvar() {
    const valores = Object.fromEntries(mudados.map((k) => [k, rascunho[k]]))
    setSalvando(true)
    try {
      await api('/admin/textos', { method: 'PUT', json: { valores } })
      aoSalvar(await api<Salvos>('/admin/textos'))
      setRascunho({})
      avisar(`${nome}: salvo. Recarregue o site para ver.`)
    } catch (e) {
      avisar((e as Error).message, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="cartao cartao--largo" hidden={oculto}>
      {campos.map((c) => {
        const id = `texto-${c.chave}`
        const valor = valorAtual(c)
        const rotulo = (
          <span className="campo__rotulo campo__rotulo--linha">
            <span>{c.rotulo}</span>
            {personalizado(c) && (
              <button type="button" className="link-pequeno" onClick={() => setRascunho((r) => ({ ...r, [c.chave]: null }))}>
                voltar ao original
              </button>
            )}
          </span>
        )

        if (c.tipo === 'foto') {
          return (
            <div key={c.chave} className="campo">
              {rotulo}
              <div className="foto-campo">
                <img src={urlDaFoto(c)} alt="" className="foto-campo__previa" />
                <div className="foto-campo__acoes">
                  <button type="button" className="btn btn--secundario" onClick={() => setSeletor(c)}>
                    Trocar foto
                  </button>
                  {c.dica && <span className="campo__dica">{c.dica}</span>}
                </div>
              </div>
            </div>
          )
        }

        const comum = {
          id,
          value: valor,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setRascunho((r) => ({ ...r, [c.chave]: e.target.value })),
        }

        return (
          <label key={c.chave} className="campo" htmlFor={id}>
            {rotulo}
            {c.tipo === 'texto' ? (
              <input type="text" maxLength={c.max} {...comum} />
            ) : (
              <textarea
                rows={c.tipo === 'linhas' ? (c.linhas ?? 3) : Math.min(8, Math.max(3, Math.ceil(c.max / 120)))}
                maxLength={c.max}
                {...comum}
              />
            )}
            <span className="campo__dica campo__dica--linha">
              <span>{c.dica ?? ''}</span>
              <span className={valor.length > c.max * 0.9 ? 'campo__contador--cheio' : ''}>
                {valor.length}/{c.max}
              </span>
            </span>
          </label>
        )
      })}

      <div className="envio__acoes">
        {mudados.length > 0 && (
          <button type="button" className="btn btn--fantasma" onClick={() => setRascunho({})}>
            Descartar mudanças
          </button>
        )}
        <button type="button" className="btn btn--primario" disabled={!mudados.length || salvando} onClick={salvar}>
          {salvando ? 'Salvando…' : mudados.length ? `Salvar ${nome.toLowerCase()}` : 'Nada para salvar'}
        </button>
      </div>

      {seletor && (
        <SeletorFoto
          atual={Number(valorAtual(seletor)) || null}
          aoFechar={() => setSeletor(null)}
          aoEscolher={(m: Midia) => {
            setRascunho((r) => ({ ...r, [seletor.chave]: String(m.id) }))
            setPrevias((p) => ({ ...p, [seletor.chave]: m.url }))
            setSeletor(null)
          }}
        />
      )}
    </div>
  )
}

export function PaginaTextos() {
  const [salvos, setSalvos] = useTextosSalvos()
  const [secao, setSecao] = useState(SECOES[0])

  return (
    <section className="pagina">
      <header className="pagina__topo">
        <div>
          <h2 className="pagina__titulo">Textos do site</h2>
          <p className="pagina__descricao">
            Os textos e fotos fixos de cada seção. Campo que ninguém mexeu continua com o texto original do site. O
            endereço e o horário ficam em <a href="#contatos">Contatos e mapa</a>.
          </p>
        </div>
        <a className="btn btn--fantasma" href="/" target="_blank" rel="noopener">
          Ver no site ↗
        </a>
      </header>

      <div className="segmentos segmentos--rolagem" role="tablist" aria-label="Seções do site">
        {SECOES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === secao}
            className="segmentos__item"
            onClick={() => setSecao(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {!salvos ? (
        <Carregando />
      ) : (
        // todas as seções ficam montadas: trocar de aba não perde o que foi digitado
        SECOES.map((s) => (
          <EditorTextos
            key={s}
            nome={s}
            campos={CAMPOS_DA_ABA.filter((c) => c.secao === s)}
            salvos={salvos}
            aoSalvar={setSalvos}
            oculto={s !== secao}
          />
        ))
      )}
    </section>
  )
}
