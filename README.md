# 🚌 ipeBus — Simulador de Motorista de Ônibus

O **ipeBus** é um jogo de simulação de condução de ônibus em 2D desenvolvido em JavaScript, estruturado com uma arquitetura modular que permite a execução tanto em uma interface gráfica moderna no navegador (HTML5 Canvas + Tailwind CSS) quanto em modo de texto interativo no terminal (CLI). 

O jogo desafia o jogador a percorrer **8 fases** distintas com progressão de dificuldades, gerenciando passageiros, tarifas, semáforos, tráfego pesado, ciclovias e pedestres, enquanto segue regras rígidas de trânsito.

---

## 🎮 Como Jogar

### Versão Web (Navegador)
Para rodar a versão com interface gráfica no navegador:
1. Compile o arquivo CSS usando o Tailwind CLI (necessário na primeira vez ou após alterações de estilo/HTML):
   ```bash
   npm run build:css
   ```
   *Nota: Durante o desenvolvimento, você pode rodar `npm run watch:css` para que o CSS seja recompilado automaticamente a cada alteração.*
2. Abra o arquivo [index.html](file:///c:/Users/User/Documents/GiHub/ipeBus/index.html) diretamente em seu navegador de preferência ou inicie um servidor web simples na pasta raiz do projeto. Exemplo usando `npx`:
   ```bash
   npx serve .
   ```
3. **Controles**:
   - **W** ou **Seta para Cima**: Acelerar
   - **S** ou **Seta para Baixo**: Frear/Ré


### Versão CLI (Linha de Comando)
Para rodar a versão interativa de terminal utilizando Node.js:
1. Execute o comando:
   ```bash
   node src/cli/index.js
   ```
2. **Comandos no Terminal**:
   - `start`: Inicia a fase atual.
   - `accelerate`: Aumenta a velocidade do ônibus.
   - `brake`: Reduz a velocidade / aplica freio.
   - `status`: Exibe informações detalhadas do painel e do mundo (posições de pedestres, ciclistas, paradas à frente).
   - `garage`: Abre a garagem para upgrades.
   - `buy <item>`: Compra um item da garagem (ex: `buy brakes`, `buy tires`, `buy engine`).
   - `help`: Lista os comandos disponíveis.
   - `quit`: Encerra o jogo.

---

## 🚦 Mecânicas e Regras de Trânsito

* **Semáforos**: O semáforo alterna entre verde e vermelho. Passar pelo semáforo vermelho em movimento gera uma penalidade direta de integridade (dano ao chassi).
* **Paradas Obrigatórias (Bus Stops)**: O motorista deve realizar uma parada completa (velocidade zero) na área sinalizada para embarcar/desembarcar passageiros. Ignorar uma parada ativa resulta em **Game Over imediato**.
* **Atropelamentos**: O ônibus não deve colidir com pedestres que atravessam na faixa ou ciclistas transitando na ciclovia. O limite é de no máximo **3 atropelamentos** antes do Game Over.
* **Curvas Fechadas**: Em fases avançadas (a partir da Fase 6), há zonas de curva sinuosa onde o motorista deve obrigatoriamente desacelerar abaixo da velocidade máxima de segurança. Exceder o limite causa uma colisão por derrapagem imediata.
* **Passageiros e Tarifas**: Parar nos pontos com sucesso adiciona tarifas ao seu saldo, acumulando recursos para serem investidos em melhorias.

---

## 🛠️ Garagem e Upgrades

Ao concluir uma fase com sucesso, o jogador é levado para a **Garagem**, onde pode investir o saldo acumulado das tarifas em upgrades para o ônibus:
* **Freios (brakes)** — Custo: R$ 12 (Segurança)
* **Pneus (tires)** — Custo: R$ 10 (Segurança)
* **Motor (engine)** — Custo: R$ 20 (Performance)

O progresso da garagem, saldo e upgrades adquiridos são **salvos automaticamente** no navegador (`localStorage`) ou em arquivo/memória no CLI.

---

## 📈 Detalhamento das 8 Fases

1. **Fase 1**: Rota curta. Foco em controle de velocidade e respeito a múltiplos semáforos.
2. **Fase 2**: Introdução de faixas de pedestre com pessoas atravessando de forma intermitente.
3. **Fase 3**: Introdução de pontos de ônibus com embarque obrigatório de passageiros.
4. **Fase 4**: Adição de uma ciclovia lateral na pista com trânsito de ciclistas.
5. **Fase 5**: Rota com tráfego pesado de horário de pico, exigindo frenagens rápidas.
6. **Fase 6**: Rota serrana sinuosa com limite seguro de velocidade nas curvas.
7. **Fase 7**: Introdução de paradas onde ocorrem apenas desembarques solicitados pelos passageiros.
8. **Fase 8 (Terminal Final)**: Rota longa de teste final que combina todas as mecânicas anteriores simultaneamente.

---

## 📁 Estrutura do Projeto

* [index.html](file:///c:/Users/User/Documents/GiHub/ipeBus/index.html) - Página web principal do jogo.
* `src/engine/` - Regras e lógica core do jogo (padrão CommonJS para ambiente Node e testes).
  * [Bus.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/engine/Bus.js) - Modelo do ônibus (velocidade, integridade, upgrades, atropelamentos).
  * [Level.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/engine/Level.js) - Parâmetros da fase, semáforos, fluxo de trânsito e obstáculos.
  * [Passenger.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/engine/Passenger.js) - Gerenciamento de passageiros individuais e tarifas.
  * [GameEngine.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/engine/GameEngine.js) - Máquina de estados do jogo, processamento de comandos e tick de atualização.
  * [Persistence.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/engine/Persistence.js) - Estrutura para salvar/carregar progresso.
* `src/browser/` - Código de exibição e interatividade específico para web (módulos ES).
  * [engine.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/browser/engine.js) - Versão do motor estendida para web e `localStorage`.
  * [main.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/browser/main.js) - Renderizador em HTML5 Canvas, escuta de teclado e loop de animação (`requestAnimationFrame`).
* `src/cli/` - Código para o modo interativo em terminal.
  * [index.js](file:///c:/Users/User/Documents/GiHub/ipeBus/src/cli/index.js) - CLI interativo usando a interface readline do Node.js.
* `tests/` - Suíte de testes unitários e de integração utilizando Jest.

---

## 🧪 Desenvolvimento e Testes

O projeto utiliza **Tailwind CSS CLI** para compilar estilos, **Jest** para testes unitários, **ESLint** para análise estática e **Prettier** para formatação do código.

### Instalação das Dependências
```bash
npm install
```

### Compilação do CSS (Tailwind)
```bash
npm run build:css   # Compilação de produção
npm run watch:css   # Monitoramento e compilação contínua (Watch mode)
```

### Executar Testes
```bash
npm test
```

### Verificar e Corrigir Formatação (Prettier)
```bash
npm run format      # Apenas verificar
npm run format:fix  # Corrigir automaticamente
```

### Verificar e Corrigir Erros de Linting (ESLint)
```bash
npm run lint      # Apenas verificar
npm run lint:fix  # Corrigir automaticamente
```
