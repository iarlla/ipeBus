
# Constituição do Simulador de Motorista de Ônibus (8 Fases)

## Princípios Fundamentais

### I. Desenvolvimento Orientado a Especificações (NÃO NEGOCIÁVEL)

Todo desenvolvimento de novas funcionalidades deve começar obrigatoriamente com uma especificação completa (spec.md), um plano de implementação técnica (plan.md) e uma lista de tarefas detalhada (tasks.md) antes que qualquer linha de código de produção seja escrita.

### II. Foco em Bibliotecas e Design Modular

Cada funcionalidade principal deve iniciar como uma biblioteca ou módulo independente. Os módulos devem ser auto-contidos, testáveis de forma isolada e possuir um propósito claro e documentado. Evite bases de código massivas e fortemente acopladas.

### III. Ciclo de Testes Primeiro (TDD)

Os testes devem ser definidos juntamente com ou antes da implementação. O ciclo Red-Green-Refactor é estritamente obrigatório: escreva testes que falham, faça-os passar com o mínimo de código necessário e, em seguida, refatore o código para garantir a qualidade.

### IV. Interfaces CLI e Baseadas em Texto Primeiro

Sempre que aplicável, os sistemas devem expor suas funcionalidades principais por meio de interfaces de linha de comando limpas ou APIs baseadas em texto (stdin/stdout) bem definidas antes de criar interfaces gráficas de usuário.

### V. Simplicidade Extrema (YAGNI)

Não faça engenharia excessiva. Desenvolva apenas o que foi explicitamente especificado nas histórias de usuário ativas. Recuse abstrações desnecessárias até que a repetição concreta de código exija isso.

## Diretrizes do Projeto de Ônibus

### Arquitetura de Motor Desacoplada

O motor físico e lógico do jogo (GameEngine.js, Bus.js, etc.) não deve depender de elementos visuais do DOM do navegador ou de bibliotecas específicas de CLI. Ele deve expor eventos ou retornos de chamada (callbacks) de estado simples para que qualquer cliente visual ou de texto possa renderizar o jogo com base em instantâneos (snapshots) do estado atual.

### Modelo Físico e Limites Seguros

Toda movimentação do ônibus e detecção de colisões espaciais de estrada devem ser feitas usando física de movimento retilíneo uniforme e posições virtuais de 1D ou 2D simplificadas. A integridade estrutural do ônibus, satisfação de passageiros e colisões com pedestres/ciclistas devem ser calculadas a cada iteração (tick) lógica.

## Governança

Esta Constituição prevalece sobre as práticas padrão de desenvolvimento. Qualquer desvio ou modificação destes princípios fundamentais deve ser documentado no plano de implementação ativo sob a seção de "Rastreamento de Complexidade", com uma forte justificativa.

**Versão**: 1.0.0 | **Ratified**: 10-07-2026 | **Last Amended**: 10-07-2026
