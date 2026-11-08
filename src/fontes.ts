/**
 * As fontes do site, servidas daqui mesmo (antes vinham do Google Fonts).
 *
 * - a primeira pintura não espera mais uma folha de estilo de outro servidor
 *   (era um CSS bloqueante em fonts.googleapis.com);
 * - o IP de quem visita não vai para o Google (LGPD);
 * - a CSP fecha: nenhuma origem de fonte de fora.
 *
 * Só o subconjunto latino, que cobre o português, e só os pesos usados.
 */
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-600.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/playfair-display/latin-500-italic.css'
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
