/**
 * Contratos da API (RNF10): o formato que o site e o painel esperam de cada
 * resposta. Os testes de API validam as respostas reais contra estes
 * schemas; se alguém mudar a API sem mudar o front, o teste quebra antes da
 * produção.
 */
import { z } from 'zod'

export const Erro = z.object({ erro: z.string().min(1) }).strict()

/** foto estática (arquivo de public/) ou enviada pelo painel (/api/midias/:id) */
export const Foto = z
  .object({
    src: z.string().regex(/^\/((photos|portfolioImgs|instrutorImgs)\/[\w.-]+\.(jpe?g|png|webp)|api\/midias\/\d+)$/),
    alt: z.string(),
    largura: z.number().int().positive(),
    altura: z.number().int().positive(),
    posicao: z.string().regex(/^\d{1,3}% \d{1,3}%$/).optional(),
  })
  .strict()

const Bloco = z.object({ titulo: z.string().min(1), texto: z.string().min(1) }).strict()

export const ConteudoPublico = z
  .object({
    slides: z.array(Foto),
    numeros: z.array(z.object({ valor: z.string().min(1), legenda: z.string().min(1) }).strict()),
    servicos: z.array(Bloco),
    etapas: z.array(Bloco),
    topicos: z.array(Bloco),
    aulas: z.array(Foto),
    cortes: z.array(Foto),
    config: z
      .object({
        whatsapp: z.string().regex(/^\d{12,13}$/),
        instagram: z.string().regex(/^[A-Za-z0-9._]{1,30}$/),
        mensagem: z.string().min(3),
        latitude: z.string().regex(/^-?\d+(\.\d+)?$/),
        longitude: z.string().regex(/^-?\d+(\.\d+)?$/),
      })
      .strict(),
    textos: z.record(z.string(), z.union([z.string(), Foto])),
  })
  .strict()

const base = {
  id: z.number().int().positive(),
  ordem: z.number().int(),
  visivel: z.union([z.literal(0), z.literal(1)]),
  versao: z.number().int().nonnegative(),
  atualizado_em: z.string(),
}

export const BlocoAdmin = z.object({ ...base, titulo: z.string(), texto: z.string() }).strict()
export const NumeroAdmin = z.object({ ...base, valor: z.string(), legenda: z.string() }).strict()
export const FotoAdmin = z
  .object({
    ...base,
    foto_id: z.number().int().positive(),
    foto_posicao: z.string(),
    foto_url: z.string(),
    foto_alt: z.string(),
  })
  .strict()

export const Midia = z.object({
  id: z.number().int().positive(),
  url: z.string(),
  alt: z.string(),
  largura: z.number().int().positive(),
  altura: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
  estatica: z.boolean(),
  usos: z.number().int().nonnegative(),
  criado_em: z.string(),
})

export const Usuario = z
  .object({ id: z.number().int(), nome: z.string(), email: z.string().email(), trocarSenha: z.boolean().optional() })
  .strict()

export const PessoaDoPainel = z.object({
  id: z.number().int(),
  nome: z.string(),
  email: z.string(),
  trocar_senha: z.union([z.literal(0), z.literal(1)]),
  criado_em: z.string(),
  ultimo_acesso: z.string().nullable(),
})

export const RegistroAuditoria = z.object({
  id: z.number().int(),
  usuario_id: z.number().int().nullable(),
  usuario_nome: z.string(),
  acao: z.enum(['criou', 'editou', 'apagou', 'reordenou', 'entrou', 'enviou', 'trocou']),
  area: z.string(),
  alvo: z.string(),
  detalhe: z.string(),
  criado_em: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
})

export const Espaco = z
  .object({
    usado: z.number().nonnegative(),
    limite: z.literal(500_000_000),
    porcentagem: z.number().min(0).max(100),
    bytesFotos: z.number().nonnegative(),
    fotosEnviadas: z.number().int().nonnegative(),
  })
  .strict()
