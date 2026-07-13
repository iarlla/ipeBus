
# Especificação de Funcionalidade: Simulador de Motorista de Ônibus (8 Fases)

**Branch da Funcionalidade**: [001-motorista-onibus-8-fases]

**Criado em**: 10-07-2026

**Status**: Pronto para Planejamento

**Entrada**: Descrição do usuário: "Um jogo de um motorista de ônibus que tem 8 fases, com progressão de obstáculos e regras rígidas de trânsito e condução."

## Cenários de Usuário & Testes

### História de Usuário 1 - Condução Básica e Semáforos (Fase 1) (Prioridade: P1) - *MVP*

**Como** jogador iniciante, eu **quero** dirigir o ônibus ao longo de uma rota simples na Fase 1, respeitando os semáforos e parando nos pontos corretos, **para** aprender os comandos básicos do veículo.

****Por que esta prioridade****: É o núcleo do jogo (MVP). Sem a movimentação do ônibus e a detecção de semáforos, o jogo não pode existir.

**Teste Independente**: Pode ser totalmente testado simulando o ônibus andando em linha reta, parando antes de uma linha de semáforo vermelho e avançando no verde, entregando a sensação básica de controle.

**Cenários de Aceitação**:

**Dado** que o semáforo à frente está vermelho, **Quando** o ônibus ultrapassa a linha limite, **Então** o sistema registra 1 colisão/infração **e** deduz da vida do ônibus.

**Dado** que o semáforo está verde, **Quando** o ônibus passa pela linha, **Então** nenhuma infração é registrada **e** a viagem continua normalmente.

### História de Usuário 2 - Pedestres, Ciclistas e Paradas (Fases 2, 3 e 4) (Prioridade: P2)

**Como** jogador intermediário, eu **quero** desviar de pedestres nas faixas, não invadir a ciclovia **e** parar nos pontos para embarcar passageiros, acumulando tarifas.

**Por que esta prioridade**: Introduz o loop econômico do jogo (pegar passageiros e ganhar dinheiro) e adiciona os primeiros obstáculos móveis e espaciais.

**Teste Independente**: Pode ser testado carregando a Fase 3 ou 4 e verificando se o ônibus para na área marcada da parada, se o contador de passageiros sobe e se a tarifa é adicionada ao saldo do jogador.

**Cenários de Aceitação**:

**Dado** que há uma parada de ônibus na rota, **Quando** o motorista passa direto sem frear totalmente na área de embarque, **Então** o sistema aciona a derrota imediata por ignorar a parada.

**Dado** que um pedestre ou ciclista está cruzando a rota, **Quando** o ônibus colide com eles, **Então** o contador de atropelamentos aumenta em 1 (com limite de 3 antes do Game Over).

### História de Usuário 3 - Desembarques, Curvas e Tráfego Pesado (Fases 5 a 8) (Prioridade: P3)

**Como** jogador experiente, **quero** enfrentar tráfego de horário de pico, fazer curvas sinuosas com cuidado **e** gerenciar tanto o embarque quanto o desembarque de passageiros até o terminal final.

**Por que esta prioridade**: Representa o desafio final e o encerramento do ciclo de jogo (Endgame).

**Teste Independente**: Pode ser testado carregando diretamente a Fase 8 e validando se os passageiros que sobem no início da rota saem nos pontos intermediários corretos, pagando a taxa final.

**Cenários de Aceitação**:

**Dado** que o ônibus está fazendo uma curva sinuosa na Fase 6, **Quando** a velocidade excede o limite seguro da curva, **Então** o ônibus sofre uma colisão por derrapagem.

**Dado** que passageiros querem descer na Fase 7, **Quando** o ônibus para no ponto solicitado, **Então** os passageiros desembarcam e o saldo financeiro do jogador é atualizado.

### Casos de Borda (Edge Cases)

**Sem dinheiro para reparos**: O que acontece se o ônibus terminar a fase com integridade muito baixa e o saldo de tarifas coletadas for insuficiente para consertá-lo na Garagem? O sistema deve permitir iniciar a próxima fase com a vida atual ou dar um empréstimo mínimo de emergência.

**Parada dupla no mesmo ponto**: O jogador para, embarca passageiros e arranca, mas tenta parar de novo no mesmo ponto. O sistema deve ignorar o segundo acionamento para evitar ganho duplo de tarifas.

**Satisfação no limite**: O que acontece se a satisfação do passageiro chegar exatamente a 0 no mesmo instante em que o ônibus cruza a linha de chegada? Prevalece a derrota, pois a viagem não foi concluída com segurança.

## Requisitos

Diferenciação das Fases (1 a 8)
Fase 1: Rota curta. Foco em controle de velocidade e respeito a múltiplos semáforos.

Fase 2: Introdução de faixas de pedestre com pessoas atravessando de forma intermitente.

Fase 3: Introdução de pontos de ônibus com embarque obrigatório de passageiros.

Fase 4: Adição de uma ciclovia lateral na pista. O motorista não pode invadi-la se houver ciclistas.

Fase 5: Rota com tráfego pesado (horário de pico), exigindo constantes mudanças de faixa e frenagens rápidas.

Fase 6: Rota serrana ou sinuosa, contendo curvas fechadas perigosas onde o excesso de velocidade causa colisões.

Fase 7: Introdução de paradas onde ocorrem apenas desembarques solicitados pelos passageiros.

Fase 8 (Final): Rota longa de teste final que combina todas as mecânicas anteriores (embarques e desembarques simultâneos, semáforos, pedestres, ciclistas e curvas fechadas).

### Requisitos Funcionais

RF-001: O sistema DEVE controlar o movimento do ônibus (acelerar, frear, virar esquerda/direita se houver mudança de faixa).

RF-002: O sistema DEVE monitorar a integridade do ônibus (máximo de 3 colisões antes de Game Over).

RF-003: O sistema DEVE monitorar a vida de pedestres/ciclistas (máximo de 3 atropelamentos antes de Game Over).

RF-004: O sistema DEVE rastrear e reduzir a satisfação dos passageiros caso o motorista faça curvas rápidas ou freadas bruscas.

RF-005: O sistema DEVE forçar a parada completa do veículo nos pontos de embarque e desembarque ativos. Se o jogador passar direto, o sistema DEVE disparar Game Over imediato.

RF-006: O sistema DEVE computar tarifas ganhas de passageiros que concluíram suas viagens com sucesso.

RF-007: O sistema DEVE fornecer uma tela de "Garagem" entre as fases para compra de melhorias (pneus, freios) e reparos com o dinheiro acumulado.

RF-008: O sistema DEVE persistir o progresso do jogador (fase máxima liberada, dinheiro e upgrades) localmente via JSON (CLI) ou localStorage (Web).

### Entidades Chave

**Onibus**: Controla velocidade, integridade (vida), upgrades (pneus, freios) e capacidade de passageiros.

**Passageiro**: Armazena estado de satisfação individual, tarifa paga e pontos de embarque/desembarque de destino.

**Fase**: Define o comprimento da rota, tempo limite, tipo de obstáculo dominante (semáforos, pedestres, ciclistas, curvas) e as posições de paradas obrigatórias.

**Obstaculo** (Pedestre/Ciclista/Carro/Semáforo): Entidades que cruzam ou bloqueiam a pista de forma dinâmica.

### Critérios de Sucesso

**Resultados Mensuráveis**
SC-001: O motor de física e regras deve validar colisões em tempo de execução com atraso menor que 16ms (garantindo 60 FPS na renderização futura).

SC-002: O progresso do jogador e estado financeiro devem ser salvos e recuperados em menos de 100ms sem perdas de integridade de dados.

SC-003: Um jogador iniciante deve conseguir completar a Fase 1 na primeira ou segunda tentativa, entendendo a mecânica do semáforo.

SC-004: O código do motor do jogo deve ser modular o suficiente para ser executado via CLI com comandos de texto simples antes de acoplá-lo a uma interface gráfica Canvas.

**Premissas**
O jogo será estruturado inicialmente **como** um motor puramente lógico e modular (TDD / biblioteca independente).

A entrada padrão para comandos do ônibus na versão texto pode ser mapeada por digitação de comandos ou inputs contínuos simples.

Na portabilidade web, o canvas 2D desenhará o ônibus de uma perspectiva de cima para baixo (top-down) ou visão lateral simplificada (side-scroller).
