
# Tarefas: Simulador de Motorista de Ônibus (8 Fases)

**Origem**: Documentos de design em specs/001-motorista-onibus-8-fases/

**Pré-requisitos**: plan.md e spec.md carregados e aprovados.

**Organização**: As tarefas estão estruturadas por fases de infraestrutura e prioridades de histórias de usuário para permitir a entrega e testes de incrementos independentes (MVP primeiro).

## Formato: [ID] [P?] [História] Descrição

- [P]: Pode rodar em paralelo (arquivos distintos, sem dependências diretas).

- [História]: Mapeamento para as histórias de usuário (US1, US2, US3).

## Fase 1: Setup (Infraestrutura Compartilhada)

Objetivo: Inicialização e estruturação do esqueleto de diretórios e ferramentas do projeto.

[ ] T001 Criar a estrutura de diretórios do projeto no repositório (src/engine/, src/cli/, tests/).

[ ] T002 Inicializar projeto JavaScript (Node.js) gerando o package.json com dependências básicas de testes (Jest).

[ ] T003 [P] Configurar regras de linting (ESLint) e formatação de código (Prettier) para manter a qualidade da base de código.

## Fase 2: Foundational (Pré-requisitos Lógicos Bloqueantes)

Objetivo: Construir a base matemática, entidades do jogo e a persistência de progresso local antes das regras de trânsito.

⚠️ CRITICAL: Nenhuma história de usuário de gameplay pode ser iniciada antes da conclusão desta fase.

[ ] T004 Criar o módulo de persistência local (src/engine/Persistence.js) para salvar/carregar dados via JSON (CLI) ou localStorage (Navegador).

[ ] T005 [P] Criar a classe e os testes de inicialização das 8 fases do jogo em src/engine/Level.js e tests/Level.test.js.

[ ] T006 Criar a classe básica do Ônibus src/engine/Bus.js com seus atributos iniciais (posição virtual y, velocidade, integridade, upgrades).

[ ] T007 [P] Criar a classe de passageiros src/engine/Passenger.js gerenciando satisfação padrão e valor de tarifa paga.

[ ] T008 Configurar o núcleo de fluxo de estados da simulação (Menu, Gameplay, Garagem, Game Over) no loop lógico central src/engine/GameEngine.js.

Checkpoint: Base lógica está pronta. Podemos iniciar os testes e implementação de gameplay em paralelo.

## Fase 3: User Story 1 - Condução Básica e Semáforos (Fase 1) **MVP**

Objetivo: Controlar o ônibus linearmente, respeitar semáforos, aplicar colisões de sinalização e criar a interface de texto interativa inicial (CLI).

Testes da US1 (Test-First / TDD) ⚠️
[ ] T009 [P] [US1] Escrever testes unitários em tests/Bus.test.js para aceleração, frenagem e desaceleração brusca impactando passageiros.

[ ] T010 [US1] Escrever teste de colisão por furar semáforo vermelho em tests/GameEngine.test.js.

Implementação da US1
[ ] T011 [US1] Adicionar a mecânica de semáforos dinâmicos em src/engine/Level.js e no temporizador do src/engine/GameEngine.js.

[ ] T012 [US1] Implementar regras físicas de controle de velocidade linear e penalidade na vida do ônibus por colisões com semáforos vermelhos em src/engine/Bus.js.

[ ] T013 [US1] Desenvolver a interface interativa CLI funcional (src/cli/index.js) que lê comandos de terminal (stdin) para acelerar e frear o ônibus na Fase 1.

Checkpoint: O jogo agora possui um MVP jogável via terminal de linha de comando. É possível guiar o ônibus até o final da Fase 1 respeitando os semáforos.

## Fase 4: User Story 2 - Pedestres, Ciclistas e Paradas (Fases 2, 3 e 4)

Objetivo: Implementar obstáculos dinâmicos que cruzam a pista (pedestres e ciclistas com limite de atropelamentos) e paradas de embarque obrigatório.

Testes da US2 ⚠️
[ ] T014 [P] [US2] Escrever testes unitários de detecção de colisão do ônibus com pedestres/ciclistas e invasão de ciclovia em tests/Level.test.js.

[ ] T015 [US2] Escrever testes de integração para checar se pular paradas obrigatórias aciona derrota imediata em tests/GameEngine.test.js.

Implementação da US2
[ ] T016 [US2] Adicionar comportamento dinâmico de pedestres atravessando a faixa e ciclistas nas ciclovias em src/engine/Level.js.

[ ] T017 [US2] Desenvolver o contador de atropelamentos no Bus.js (com teto máximo de 3 que aciona Game Over imediato).

[ ] T018 [US2] Criar zonas de paradas de ônibus ativas para embarque de passageiros que necessitam parada total (v=0).

[ ] T019 [US2] Adicionar regra rígida que causa Game Over se o ônibus ultrapassar o limite físico da parada ativa sem parar.

[ ] T020 [US2] Atualizar a CLI (src/cli/index.js) para desenhar esquematicamente em texto a posição de pedestres e se há passageiros aguardando na parada à frente.

Checkpoint: A Fase 2 (pedestres), Fase 3 (embarques) e Fase 4 (ciclovias com ciclistas) estão totalmente jogáveis e com validações de regras de trânsito estritas ativas.

## Fase 5: User Story 3 - Desembarques, Curvas e Tráfego Pesado (Fases 5 a 8)

Objetivo: Adicionar trechos sinuosos de velocidade reduzida, congestionamentos e gerenciamento econômico (desembarque e Garagem de upgrades).

Testes da US3 ⚠️
[ ] T021 [P] [US3] Escrever testes unitários em tests/Bus.test.js para garantir que ultrapassar a velocidade de segurança de uma curva causa colisão direta por derrapagem.

[ ] T022 [US3] Escrever testes de transações econômicas em tests/GameEngine.test.js (pagamento de tarifas, custo de reparos e compra de upgrades).

Implementação da US3
[ ] T023 [US3] Implementar o sistema de curvas perigosas: limites de velocidade variável por setor da rota em src/engine/Level.js e validação física em src/engine/Bus.js.

[ ] T024 [US3] Desenvolver mecânica de tráfego pesado simulando fluxo constante de carros que reduzem a velocidade da via na Fase 5.

[ ] T025 [US3] Implementar o sistema de solicitação de paradas pelos passageiros em trânsito para desembarques coordenados na Fase 7 e Fase 8.

[ ] T026 [US3] Construir o subsistema de transição e interface da Garagem: fluxo de compra de freios, pneus e motor, deduzindo do saldo financeiro salvo.

[ ] T027 [US3] Integrar a persistência com progresso salvo da Garagem na troca automática de fases em src/engine/Persistence.js.

Checkpoint: O jogo CLI de 8 fases está 100% completo, incluindo toda a lógica econômica, progressão de obstáculos de cada fase e upgrades de garagem.

## Fase 6: Portabilidade Web (Interface Canvas & Tailwind)

Objetivo: Portar o motor do jogo 100% desacoplado para uma interface rica, animada e de arquivo único rodando direto no navegador.

[ ] T028 Criar o documento de arquivo único index.html importando as classes JavaScript do motor unificadas.

[ ] T029 Configurar o loop de renderização gráfica 2D (requestAnimationFrame a 60 FPS estáveis) mapeando os controles para teclado (Setas/WASD).

[ ] T030 Desenhar os estados visuais enriquecidos do ônibus se deslocando linearmente na rota, com semáforos trocando de cor e pedestres animados andando.

[ ] T031 Criar telas em modais dinâmicos usando Tailwind CSS para o Menu Inicial, a Tela de Upgrades da Garagem e o modal de Game Over.

[ ] T032 Homologar e testar o funcionamento offline salvando e carregando de forma transparente com localStorage.

## Dependências & Execução

Setup (Fase 1): Começa imediatamente, sem dependências.

Foundational (Fase 2): Depende do Setup completo; bloqueia todo o gameplay das histórias.

User Story 1 (P1): Libera o MVP de movimento básico e semáforos.

User Story 2 (P2): Depende da US1; libera pedestres e embarques.

User Story 3 (P3): Depende da US2; completa o loop das 8 fases, curvas, desembarques e a Garagem.

Portabilidade Web (Fase 6): Começa após o motor CLI estar robusto e livre de bugs lógicos.
