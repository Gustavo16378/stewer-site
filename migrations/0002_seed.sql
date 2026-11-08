-- Stewer Gabriel · conteúdo inicial, gerado por scripts/gerar-seed.ts
-- Não editar à mão: rodar o script de novo.

INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (1, '/photos/Stewer1.jpg', 'image/jpeg', 'Stewer Gabriel', 1024, 1024);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (2, '/photos/Stewer2.jpg', 'image/jpeg', 'Stewer Gabriel no estúdio', 1024, 1428);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (3, '/photos/Stewer3.jpeg', 'image/jpeg', 'Stewer Gabriel', 430, 572);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (4, '/instrutorImgs/instrutor2.jpeg', 'image/jpeg', 'Stewer ensinando técnica de corte', 960, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (5, '/instrutorImgs/instrutor3.jpeg', 'image/jpeg', 'Aula prática de corte com aluno', 960, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (6, '/instrutorImgs/instrutor4.jpeg', 'image/jpeg', 'Bastidores de uma aula de visagismo', 1024, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (7, '/portfolioImgs/corte1.jpeg', 'image/jpeg', 'Corte masculino feito por Stewer Gabriel', 720, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (8, '/portfolioImgs/corte2.jpeg', 'image/jpeg', 'Corte masculino feito por Stewer Gabriel', 720, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (9, '/portfolioImgs/corte3.jpeg', 'image/jpeg', 'Corte masculino feito por Stewer Gabriel', 720, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (10, '/portfolioImgs/corte4.jpeg', 'image/jpeg', 'Corte masculino feito por Stewer Gabriel', 970, 1280);
INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (11, '/portfolioImgs/corte5.png', 'image/png', 'Corte masculino feito por Stewer Gabriel', 605, 785);

INSERT INTO slides (foto_id, foto_posicao, ordem) VALUES (1, '50% 0%', 0);
INSERT INTO slides (foto_id, foto_posicao, ordem) VALUES (2, '50% 0%', 1);
INSERT INTO aulas (foto_id, foto_posicao, ordem) VALUES (4, '50% 50%', 0);
INSERT INTO aulas (foto_id, foto_posicao, ordem) VALUES (5, '50% 50%', 1);
INSERT INTO aulas (foto_id, foto_posicao, ordem) VALUES (6, '50% 50%', 2);
INSERT INTO cortes (foto_id, foto_posicao, ordem) VALUES (7, '50% 50%', 0);
INSERT INTO cortes (foto_id, foto_posicao, ordem) VALUES (8, '50% 50%', 1);
INSERT INTO cortes (foto_id, foto_posicao, ordem) VALUES (9, '50% 50%', 2);
INSERT INTO cortes (foto_id, foto_posicao, ordem) VALUES (10, '50% 50%', 3);
INSERT INTO cortes (foto_id, foto_posicao, ordem) VALUES (11, '50% 50%', 4);

INSERT INTO numeros (valor, legenda, ordem) VALUES ('+800', 'Clientes atendidos por ano', 0);
INSERT INTO numeros (valor, legenda, ordem) VALUES ('10+', 'Anos de experiência', 1);
INSERT INTO servicos (titulo, texto, ordem) VALUES ('Corte', 'Cada corte é cuidadosamente personalizado ao formato do rosto, ao estilo de vida e à identidade de quem está na cadeira. Precisão técnica com olhar artístico.', 0);
INSERT INTO servicos (titulo, texto, ordem) VALUES ('Visagismo', 'A ciência e a arte de criar harmonia entre o visual e as características físicas e psicológicas de cada homem. Muito além da estética — é identidade expressa.', 1);
INSERT INTO servicos (titulo, texto, ordem) VALUES ('Consultoria de Imagem', 'Uma análise completa da imagem pessoal: do corte ao guarda-roupa, da postura ao posicionamento. Para homens que querem se comunicar com excelência em qualquer ambiente.', 2);
INSERT INTO etapas (titulo, texto, ordem) VALUES ('Análise de Visagismo', 'Leitura do formato do rosto, expressões e traços marcantes para definir o corte e estilo que harmonizam com a sua identidade.', 0);
INSERT INTO etapas (titulo, texto, ordem) VALUES ('Tipo Físico & Proporções', 'Estudo do biotipo, porte e postura para criar um visual que valorize sua silhueta e transmita a mensagem certa.', 1);
INSERT INTO etapas (titulo, texto, ordem) VALUES ('Estilo & Guarda-roupa', 'Orientação de cores, modelagens e combinações que comunicam autoridade e autenticidade no seu cotidiano.', 2);
INSERT INTO etapas (titulo, texto, ordem) VALUES ('Posicionamento de Imagem', 'Alinhamento entre aparência, presença e objetivos — seja no ambiente profissional, social ou digital.', 3);
INSERT INTO topicos (titulo, texto, ordem) VALUES ('Técnicas de Corte', 'Domínio de tesoura, navalha e máquina com precisão, ritmo e acabamento autoral.', 0);
INSERT INTO topicos (titulo, texto, ordem) VALUES ('Visagismo Aplicado', 'Ler o formato do rosto e os traços, traduzindo em cortes que harmonizam identidade e estética.', 1);
INSERT INTO topicos (titulo, texto, ordem) VALUES ('Fundamentos & Ferramentas', 'Base sólida, postura profissional e uso correto do ferramental para um resultado consistente.', 2);
INSERT INTO topicos (titulo, texto, ordem) VALUES ('Mentoria Individual', 'Acompanhamento próximo e personalizado para acelerar a evolução de quem já atua.', 3);

INSERT INTO configuracoes (chave, valor) VALUES ('whatsapp', '5563985116783');
INSERT INTO configuracoes (chave, valor) VALUES ('instagram', 'stewer.gabriel');
INSERT INTO configuracoes (chave, valor) VALUES ('mensagem', 'Olá Stewer, gostaria de agendar uma consultoria.');
INSERT INTO configuracoes (chave, valor) VALUES ('latitude', '-10.18256053');
INSERT INTO configuracoes (chave, valor) VALUES ('longitude', '-48.32910908');
