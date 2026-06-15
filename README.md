# 💙 Finanças

App mobile **offline-first** de finanças pessoais com controle **quinzenal**, em React Native (Expo + TypeScript).

Organiza despesas e receitas em torno dos dois recebimentos mensais — **adiantamento (dia 15)** e **salário (dia 30)** — permitindo distribuir cada despesa entre os dois períodos e acompanhar o saldo previsto e o realizado.

> Desenvolvido em parceria com IA (Claude), partindo de uma planilha pessoal até o app instalado no celular, como exercício prático de **supervisão de IA**: requisitos, arquitetura, revisão de código e direção técnica conduzidos por mim, com a implementação assistida pelo modelo.

---

## ✨ Funcionalidades

- **Controle quinzenal** — cada mês é dividido em adiantamento e salário, com saldos independentes.
- **Distribuição de despesas** — divide cada conta entre os dois períodos; editar um lado recalcula o outro automaticamente.
- **Template + instância** — despesas/receitas recorrentes geram cópias mensais; editar afeta o mês atual em diante, preservando o histórico do passado (read-only).
- **Recorrência flexível** — diária, semanal, mensal ou anual, com intervalo, dias da semana, dia fixo/posição e condição de término (modelo RRULE-like).
- **Saldo previsto × atual** — compare o planejado com o que foi efetivamente recebido.
- **Marcar pagamentos** em poucos toques (pago/pendente por período).
- **Temas claro e escuro** — paleta azul, com verde/vermelho reservados a valores financeiros.
- **Backup em CSV** — exportar (compartilhar via Drive, e-mail, etc.) e importar.
- **100% offline** — todos os dados ficam no dispositivo (SQLite).

---

## 🛠️ Stack

- **React Native** + **Expo** + **TypeScript**
- **expo-sqlite** — persistência local (API assíncrona)
- **react-native-safe-area-context** — layout seguro
- **@react-native-community/datetimepicker** — seleção de datas
- **@hugeicons/react-native** — ícones
- **expo-file-system / sharing / document-picker** — backup CSV

---

## 🏗️ Arquitetura

Organizado em camadas, com a lógica de domínio isolada da UI e da persistência:

```
src/
├── core/        # lógica pura (datas, recorrência, cálculos, CSV) — testável isolada
├── db/          # persistência: schema, conexão SQLite, repositórios, backup
├── theme/       # tokens de cor (light/dark) + contexto de tema
├── state/       # estado global (Context): carrega o banco, orquestra recálculo
├── components/  # peças reutilizáveis (cards, campos, pickers, modais)
└── screens/     # telas: Distribuição, Saldo Previsto, Saldo Atual, Formulário
App.tsx          # shell: providers + header + navegação + telas
```

**Conceitos centrais:**

- **Período quinzenal** — `A` = adiantamento, `S` = salário.
- **Template** = a regra recorrente. **Instância** = override de um mês específico (guarda só o que difere do template).
- **Passado imutável** — meses anteriores ao atual são somente leitura.

---

## 🚀 Rodando localmente

**Pré-requisitos:** Node.js 18+, Android Studio (com SDK e um emulador) ou um aparelho Android com depuração USB.

```bash
# Instalar dependências
npm install

# Rodar no emulador/dispositivo Android
npx expo run:android
```

> Ao alterar ícone, nome ou package em `app.json`, rode `npx expo prebuild --clean` antes.

### Gerar APK para instalar no celular

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Ao final, o EAS fornece um link — abra no navegador do celular para baixar e instalar o APK. *(Requer `"buildType": "apk"` no profile `preview` do `eas.json`.)*

---

## 📋 Roadmap

- [ ] Testes automatizados da camada de domínio (Jest)
- [ ] Swipe horizontal entre meses
- [ ] Exceções e datas extras na recorrência (estrutura já preparada)
- [ ] Categorias e relatórios

---

## 🤖 Sobre o desenvolvimento

Este projeto nasceu de uma planilha de controle financeiro pessoal e foi desenvolvido de ponta a ponta com auxílio de IA — da prototipagem à arquitetura, passando pela migração para React Native e a resolução de problemas de build e persistência. O processo serviu como prática de **direção e supervisão de desenvolvimento assistido por IA**.

---

## 📄 Licença

Projeto pessoal. Sinta-se à vontade para usar como referência.
