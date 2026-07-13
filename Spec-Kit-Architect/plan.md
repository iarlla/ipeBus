# Plano de Implementação: Simulador de Motorista de Ônibus (8 Fases)

Branch da Funcionalidade: [001-motorista-onibus-8-fases]

Criado em: 10-07-2026

Status: Em Revisão

Especificação: spec.md

## Resumo

Este plano descreve o design técnico de um Simulador de Condução de Ônibus modular com 8 fases, focado em regras rígidas de trânsito, gestão de passageiros e ciclo econômico de melhorias na Garagem. O motor lógico do jogo será desenvolvido em JavaScript puro (ES6) de forma 100% desacoplada da interface do usuário. Isso garante conformidade com a nossa constituição: o mesmo núcleo de simulação rodará em ambiente CLI de texto (via Node.js) e em uma aplicação Web em arquivo único interativa (usando HTML5 Canvas e Tailwind CSS).

## Contexto Técnico

Linguagem: JavaScript (ES6+ / Node.js e Navegador)

Interface Principal (Fase Inicial): CLI interativa por terminal usando entrada de texto (stdin) para controle de comandos básicos.

Interface Final (Portabilidade): Página web interativa de arquivo único (index.html) com renderização Canvas 2D de alta performance (60 FPS estáveis) e estilização Tailwind CSS.

Armazenamento: Persistência simples baseada em JSON local (para CLI) ou localStorage (para Web).

Paradigma de Design: Programação Orientada a Objetos com foco em separação de preocupações (Separation of Concerns). O motor do jogo não conhece o Canvas ou a CLI, ele apenas gerencia estados físicos e regras de negócio.

## Estrutura do Projeto

Para garantir a simplicidade e a conformidade com a constituição, o projeto lógico será inicialmente projetado em uma única estrutura de diretórios simples que facilita testes em console e futura cópia para o Canvas Web em arquivo único.

/
├── specs/
│   └── 001-motorista-onibus-8-fases/
│       ├── spec.md        # Especificação de Requisitos
│       ├── plan.md        # Este documento
│       └── tasks.md       # Lista de Tarefas (Checklist)
├── src/
│   ├── engine/
│   │   ├── GameEngine.js  # Loop de simulação, colisões e controle de tempo
│   │   ├── Bus.js         # Entidade do Ônibus (Velocidade, vida, upgrades, passageiros)
│   │   ├── Level.js       # Definições de rota, obstáculos e posições para as 8 fases
│   │   └── Passenger.js   # Estado, tarifas e nível de satisfação dos passageiros
│   └── cli/
│       └── index.js       # Interface de linha de comando inicial do jogo
└── tests/
    ├── Bus.test.js        # Testes de velocidade, vida e colisão
    ├── Level.test.js      # Testes de carregamento de obstáculos por fase
    └── GameEngine.test.js # Testes das condições de Game Over e embarques

## Modelagem de Dados & Entidades Chave

1. Entidade: Bus (Ônibus)
    Gerencia o veículo, velocidade atual, upgrades e integridade.

    x, y: Posição virtual do ônibus na rota.

    speed: Velocidade linear (0 a velocidade máxima).

    maxSpeed: Ajustada por upgrades de motor/pneus.

    integrity: Saúde do ônibus (começa em 3, reduz a cada colisão física).

    pedestrianHits: Contador de atropelamentos (máximo de 3).

    passengers: Lista de objetos Passenger atualmente a bordo.

    upgrades: Objeto contendo nível de upgrades adquiridos (ex: { brakes: 1, tires: 1 }).

2. Entidade: Passenger (Passageiro)
    Controla a felicidade do passageiro e transações econômicas.

    id: Identificador único.

    satisfaction: Escala de 0 a 100 (reduz com freadas bruscas ou excesso de velocidade em curvas).

    farePaid: Valor da tarifa paga no embarque.

    boardingPoint: Posição na rota onde embarca.

    destinationPoint: Posição na rota para desembarque.

3. Entidade: Level (Fase)
    Define as regras físicas de uma das 8 fases.

    number: Número da fase (1 a 8).

    length: Comprimento total da rota virtual (ex: 2000 unidades).

    timeLimit: Tempo máximo para cruzar a linha de chegada (segundos).

    activeMechanics: Lista de mecânicas ativas (ex: ['traffic_lights', 'pedestrians', 'bus_stops', 'bike_lane', 'heavy_traffic', 'tight_curves']).

    entities: Lista de obstáculos dinâmicos posicionados em locais pré-determinados da rota (semáforos, ciclistas, faixas).

## Máquina de Estados do Jogo

O fluxo geral de execução será gerenciado por um controlador central de estados:

[ Menu Principal ] ──(Iniciar Fase)──> [ Gameplay da Rota ] ──(Sucesso)──> [ Garagem ]
       ^                                    │                                  │
       │                               (Derrota)                           (Avançar)
       │                                    ▼                                  │
       └───────────(Reiniciar)─────── [ Tela Game Over ] <─────────────────────┘

### Regras de Condução e Física do Motor

- Curvas Sinuosas: Se a velocidade virtual do ônibus no trecho de curvas ( y > início_curva e y < fim_curva) ultrapassar a velocidade máxima de segurança (V safe ), o sistema registra colisão e deduz integridade física.

- Freada Brusca: Desacelerações acentuadas ( a < −5m / s² ) resultam na redução direta de 10% na satisfação de todos os passageiros a bordo.

- Controle de Semáforos: Semáforos alternam de estado de forma temporizada. Passar por uma coordenada de semáforo ativo em estado Vermelho aciona infração e dano de colisão.

## Portabilidade Web (Apenas Interface Gráfica)

Quando portarmos a lógica para a interface Web em arquivo único:

O arquivo `index.html` conterá um elemento `canvas` com `id="gameCanvas"` ocupando a maior parte da tela.

O loop gráfico (requestAnimationFrame) lerá os dados de posição e velocidade virtual de GameEngine.js e desenhará o ônibus em movimento linear (side-scroller ou top-down horizontal).

A lateral direita ou topo mostrará um painel com os indicadores de vida do ônibus, contador de pedestres e satisfação dos passageiros usando Tailwind CSS de forma rica e responsiva.

Os menus (Menu Principal, Garagem e Game Over) serão modais HTML controlados pelo estado interno do jogo.

## Verificação da Constituição

Desenvolvimento Modular: Sim, o jogo é focado em um motor lógico desacoplado.

CLI de Entrada Primeiro: Sim, o controle e fluxo lógico do jogo serão validados e jogáveis via texto antes do Canvas.

Persistência Local: Sim, o progresso das fases será guardado de forma robusta e modular.
