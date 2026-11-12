/**
 * Todo o conteúdo do site, num lugar só.
 *
 * Estes valores são o conteúdo de reserva: é o que o site mostra quando a
 * API não responde. Quando responde, `lib/conteudo-remoto.ts` troca estes
 * objetos e listas no lugar, antes do primeiro render, com o que o Stewer
 * salvou no painel (/admin).
 *
 * Por isso os objetos são mutáveis e as listas são trocadas com splice: os
 * componentes importam a mesma referência e leem o valor já atualizado.
 */

export type Foto = {
  src: string
  alt: string
  largura: number
  altura: number
  /** object-position, por exemplo "50% 20%" */
  posicao?: string
}

export type Bloco = { titulo: string; texto: string }
export type Numero = { valor: string; legenda: string }

// ------------------------------------------------------------- contatos

/**
 * A agenda online (o app, em outro projeto e com painel proprio). Os botoes de agendar
 * levam para la; quem tem conta de equipe entra pelo mesmo login e cai no painel dele.
 */
export const AGENDA_URL = 'https://agenda.stewergabriel.com'

export const CONTATO = {
  /** só dígitos, com o 55 */
  whatsapp: '5563985116783',
  instagram: 'stewer.gabriel',
  mensagem: 'Olá Stewer, gostaria de agendar uma consultoria.',
}

export const LOCAL = {
  nome: ['Boss House', 'Barbearia'],
  endereco: ['Q. ACNE 1, Rua NE 3, Nº 15', 'Plano Diretor Norte · Palmas — TO'],
  horario: ['Seg — Sáb', '9h às 19h'],
  atendimento: ['Mediante', 'agendamento'],
  latitude: -10.18256053,
  longitude: -48.32910908,
}

// -------------------------------------------------------------- abertura

export const HERO = {
  local: 'Palmas, TO · Visagista & Consultor de Imagem',
  nome: ['Stewer', 'Gabriel'],
  lema: 'Masculinidade com propósito',
  frase: '"Construindo homens confiantes, com personalidade única — transformando aparência em posicionamento."',
  ctaPrimario: 'Agendar horário',
  ctaSecundario: 'Ver portfólio',
}

/** fotos que se revezam na abertura */
export const SLIDES: Foto[] = [
  { src: '/photos/Stewer1.jpg', alt: 'Stewer Gabriel', largura: 1024, altura: 1024, posicao: '50% 0%' },
  { src: '/photos/Stewer2.jpg', alt: 'Stewer Gabriel no estúdio', largura: 1024, altura: 1428, posicao: '50% 0%' },
]

// ---------------------------------------------------------------- quem é

export const SOBRE = {
  rotulo: 'Quem é',
  titulo: ['Por trás do visual,', 'uma visão'],
  paragrafo1:
    'Stewer Gabriel é visagista e consultor de imagem masculina. Com anos de experiência em Palmas-TO transformando a aparência e a autoestima de homens, ele une técnica, estética e psicologia para criar a proposta de imagem que comunicam autoridade, autenticidade e confiança.',
  paragrafo2:
    'Para Stewer, um bom corte vai muito além das tesouras. É a leitura do rosto, do comportamento, do objetivo de vida. Cada cliente é único — e merece um visual que reflita exatamente quem ele é e onde quer chegar.',
  citacao: '"Sua aparência é o primeiro discurso que você faz — antes mesmo de abrir a boca."',
  legenda: ['Palmas, TO', 'Visagista & Consultor de Imagem'],
  foto: { src: '/photos/Stewer3.jpeg', alt: 'Stewer Gabriel', largura: 430, altura: 572, posicao: '50% 0%' } as Foto,
}

export const NUMEROS: Numero[] = [
  { valor: '+800', legenda: 'Clientes atendidos por ano' },
  { valor: '10+', legenda: 'Anos de experiência' },
]

// -------------------------------------------------------------- serviços

export const SERVICOS_SECAO = {
  rotulo: 'O que faz',
  titulo: 'Serviços',
  botao: 'Entre em contato',
  nota: 'Atendimento mediante agendamento — exclusivo e personalizado',
}

export const SERVICOS: Bloco[] = [
  {
    titulo: 'Corte',
    texto:
      'Cada corte é cuidadosamente personalizado ao formato do rosto, ao estilo de vida e à identidade de quem está na cadeira. Precisão técnica com olhar artístico.',
  },
  {
    titulo: 'Visagismo',
    texto:
      'A ciência e a arte de criar harmonia entre o visual e as características físicas e psicológicas de cada homem. Muito além da estética — é identidade expressa.',
  },
  {
    titulo: 'Consultoria de Imagem',
    texto:
      'Uma análise completa da imagem pessoal: do corte ao guarda-roupa, da postura ao posicionamento. Para homens que querem se comunicar com excelência em qualquer ambiente.',
  },
]

// ----------------------------------------------------------- consultoria

export const CONSULTORIA = {
  rotulo: 'Consultoria',
  titulo: ['Uma transformação', 'completa de imagem'],
  intro:
    'A Consultoria de Imagem vai muito além do corte. É um processo profundo de autoconhecimento e reposicionamento visual — construindo uma presença que comunica exatamente quem você é e onde quer chegar.',
  cta: 'Agende sua consultoria',
  nota: 'Atendimento exclusivo e personalizado, mediante agendamento em Palmas, TO.',
}

export const ETAPAS: Bloco[] = [
  {
    titulo: 'Análise de Visagismo',
    texto:
      'Leitura do formato do rosto, expressões e traços marcantes para definir o corte e estilo que harmonizam com a sua identidade.',
  },
  {
    titulo: 'Tipo Físico & Proporções',
    texto: 'Estudo do biotipo, porte e postura para criar um visual que valorize sua silhueta e transmita a mensagem certa.',
  },
  {
    titulo: 'Estilo & Guarda-roupa',
    texto: 'Orientação de cores, modelagens e combinações que comunicam autoridade e autenticidade no seu cotidiano.',
  },
  {
    titulo: 'Posicionamento de Imagem',
    texto: 'Alinhamento entre aparência, presença e objetivos — seja no ambiente profissional, social ou digital.',
  },
]

// ---------------------------------------------------------------- ensino

export const ENSINO = {
  rotulo: 'Ensino',
  titulo: ['Ensino a arte do', 'corte e do visagismo'],
  intro:
    'Mais do que atender, Stewer forma. Compartilha em aulas e mentorias o mesmo método que aplica na cadeira — unindo técnica apurada e visagismo para que outros profissionais desenvolvam mão, olhar e identidade próprios.',
  galeria: 'Bastidores das aulas',
  cta: 'Quero aprender',
  nota: 'Aulas e mentorias individuais mediante agendamento em Palmas, TO.',
}

export const TOPICOS: Bloco[] = [
  { titulo: 'Técnicas de Corte', texto: 'Domínio de tesoura, navalha e máquina com precisão, ritmo e acabamento autoral.' },
  {
    titulo: 'Visagismo Aplicado',
    texto: 'Ler o formato do rosto e os traços, traduzindo em cortes que harmonizam identidade e estética.',
  },
  {
    titulo: 'Fundamentos & Ferramentas',
    texto: 'Base sólida, postura profissional e uso correto do ferramental para um resultado consistente.',
  },
  { titulo: 'Mentoria Individual', texto: 'Acompanhamento próximo e personalizado para acelerar a evolução de quem já atua.' },
]

export const AULAS: Foto[] = [
  { src: '/instrutorImgs/instrutor2.jpeg', alt: 'Stewer ensinando técnica de corte', largura: 960, altura: 1280 },
  { src: '/instrutorImgs/instrutor3.jpeg', alt: 'Aula prática de corte com aluno', largura: 960, altura: 1280 },
  { src: '/instrutorImgs/instrutor4.jpeg', alt: 'Bastidores de uma aula de visagismo', largura: 1024, altura: 1280 },
]

/** vídeos das aulas ficam no código (public/instrutorVideos) */
export const VIDEOS_AULAS: string[] = []

// ------------------------------------------------------------- portfólio

export const PORTFOLIO = {
  rotulo: 'Trabalhos',
  titulo: 'Portfólio',
  link: 'Ver no Instagram →',
  vazio: 'Em breve — novos trabalhos chegando.',
  cta: 'Ver galeria completa',
}

export const CORTES: Foto[] = [
  { src: '/portfolioImgs/corte1.jpeg', alt: 'Corte masculino feito por Stewer Gabriel', largura: 720, altura: 1280 },
  { src: '/portfolioImgs/corte2.jpeg', alt: 'Corte masculino feito por Stewer Gabriel', largura: 720, altura: 1280 },
  { src: '/portfolioImgs/corte3.jpeg', alt: 'Corte masculino feito por Stewer Gabriel', largura: 720, altura: 1280 },
  { src: '/portfolioImgs/corte4.jpeg', alt: 'Corte masculino feito por Stewer Gabriel', largura: 970, altura: 1280 },
  { src: '/portfolioImgs/corte5.jpeg', alt: 'Corte masculino feito por Stewer Gabriel', largura: 605, altura: 785 },
]

/** vídeos do portfólio ficam no código (public/videosImgs) */
export const VIDEOS_PORTFOLIO: string[] = ['/videosImgs/videoCorte.mp4']

// ---------------------------------------------------- localização e contato

export const ONDE = {
  rotulo: 'Onde atende · Como chegar',
  rota: 'Traçar rota',
  mapa: 'Ver no Google Maps',
}

export const CONTATO_SECAO = {
  rotulo: 'Contato',
  titulo: ['Vamos', 'conversar?'],
  frase: 'Pronto para transformar sua imagem? Dê o primeiro passo — o resto é comigo.',
}

export const RODAPE = {
  frase: 'Visagista & consultor de imagem masculina. Técnica, identidade e presença — em Palmas, Tocantins.',
}

// ---------------------------------------------------- derivados dos contatos

export const linkWhatsapp = (texto = CONTATO.mensagem) =>
  `https://wa.me/${CONTATO.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`

export const linkInstagram = () => `https://www.instagram.com/${CONTATO.instagram}`

/** 5563985116783 → (63) 98511-6783 */
export function telefoneFormatado(numero = CONTATO.whatsapp) {
  const local = numero.startsWith('55') && numero.length > 11 ? numero.slice(2) : numero
  return local.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')
}

export const linkTelefone = () => `tel:+${CONTATO.whatsapp}`

/** -10.18256 → 10°10'57"S */
export function grausMinutos(valor: number, eixo: 'lat' | 'lng') {
  // conta em segundos inteiros, para 59,6" não virar 60"
  const total = Math.round(Math.abs(valor) * 3600)
  const graus = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = total % 60
  const lado = eixo === 'lat' ? (valor < 0 ? 'S' : 'N') : valor < 0 ? 'W' : 'E'
  return `${graus}°${minutos}'${segundos}"${lado}`
}

export const linkRota = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${LOCAL.latitude},${LOCAL.longitude}`

export const linkMapa = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOCAL.nome.join(' ')}, Palmas - TO`)}`
