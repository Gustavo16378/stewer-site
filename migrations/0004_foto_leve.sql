-- A foto corte5 era um PNG de 871 KB para 605×785 pixels (uma foto, sem
-- transparência). Virou JPEG de 96 KB, sem diferença visível. O arquivo
-- mudou de nome, então o registro da biblioteca de fotos acompanha.
UPDATE midias
   SET caminho = '/portfolioImgs/corte5.jpeg', tipo = 'image/jpeg'
 WHERE caminho = '/portfolioImgs/corte5.png';
