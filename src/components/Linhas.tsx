import { Fragment } from 'react'

/**
 * Texto que no design quebra em linhas fixas (títulos, endereço).
 * `quebra` permite trocar o <br> padrão, por exemplo um que só aparece do
 * sm para cima.
 */
export default function Linhas({ linhas, quebraClasse }: { linhas: string[]; quebraClasse?: string }) {
  return (
    <>
      {linhas.map((l, i) => (
        <Fragment key={i}>
          {/* o espaço antes do <br> faz o texto lido (leitor de tela, Google) sair
              "Vamos conversar?" e não "Vamosconversar?"; na tela ele some */}
          {i > 0 && <>{' '}<br className={quebraClasse} /></>}
          {l}
        </Fragment>
      ))}
    </>
  )
}
