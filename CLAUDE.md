# App Finanças — Contexto do Projeto

## O que é

App mobile **offline-first de finanças pessoais**, em React Native (Expo + TypeScript), rodando em Android. Baseado numa planilha de controle quinzenal. O usuário tem dois recebimentos por mês — **Adiantamento (dia 15)** e **Salário (dia 30)** — e distribui cada despesa entre esses dois períodos.

## Conceitos centrais do domínio

- **Período quinzenal**: `A` = Adiantamento (dia 15), `S` = Salário (dia 30).
- **Template vs Instância**:
  - *Template* = a regra recorrente de uma despesa/receita (valor, dia, recorrência, distribuição padrão).
  - *Instância* = override de um template num mês específico. Guarda **apenas** o que difere do template (valor real, distribuição ajustada, pago/realizado). O que não tem override é derivado do template em tempo de execução.
- **Distribuição**: cada despesa é dividida entre `distA` (Adiantamento) e `distS` (Salário); a soma sempre = valor total. Editar um lado recalcula o outro.
- **Passado imutável**: meses anteriores ao atual são read-only. Editar um template afeta só o mês atual em diante (`clearFutureInstances`); o passado preserva o histórico do que realmente aconteceu.
- **Recorrência**: modelo RRULE-like (`freq`, `interval`, `byDay`, `byMonthDay`, `bySetPos`, `byDayOfWeek`, `until`, `exceptions`, `additions`). Hoje daily/weekly são aproximados como "aparece todo mês"; monthly/yearly respeitam o intervalo.

## Arquitetura (camadas)

```
src/
├── core/            # lógica pura, sem UI nem banco (testável isolada)
│   ├── types.ts         # Template, InstanceOverride, Recurrence, etc.
│   ├── date.ts          # mKey, addMonths, periodoByDay, MONTH_NAMES…
│   ├── recurrence.ts    # recurrenceLabel, occursInMonth, monthlyRule, DEFAULT_RULE
│   ├── finance.ts       # resolveDespesas/Receitas, calcTotais, redistribuir, formatBRL, parseBRL, Totais
│   └── csv.ts           # templatesToCSV, csvToTemplates
├── db/              # persistência (SQLite via expo-sqlite, API async)
│   ├── schema.ts        # CREATE TABLES + SEED (seed atualmente DESATIVADO)
│   ├── database.ts      # getDb() singleton via _dbPromise; resetDatabase()
│   ├── repositories.ts  # CRUD templates/instances (snake_case ↔ camelCase)
│   └── backup.ts        # exportarCSV (share), importarCSV (document picker)
├── theme/
│   ├── tokens.ts        # paleta light/dark (tema AZUL; verde/vermelho só p/ valores financeiros)
│   └── ThemeContext.tsx # useTheme(); persiste modo no SQLite (settings)
├── state/
│   └── store.tsx        # Context global: carrega banco, mês visível, orquestra repos + recálculo; expõe reload
├── components/
│   ├── Icon.tsx         # wrapper @hugeicons/react-native; MAP nome→ícone; ICON_CHOICES
│   ├── CampoDist.tsx, CampoEdit.tsx
│   ├── CardDespesa.tsx, CardPeriodo.tsx
│   ├── DistPicker.tsx, RecurrencePicker.tsx
│   ├── IconModal.tsx, SideMenu.tsx
└── screens/
    ├── DistribuicaoScreen.tsx   # cards de despesa editáveis + total fixo no rodapé
    ├── PrevistoScreen.tsx       # "Saldo Previsto": cards por período + lista receitas
    ├── RealizadoScreen.tsx      # "Saldo Atual": espelho com receita real editável
    └── EntradaFormScreen.tsx    # form criar/editar (DatePicker, IconModal, DistPicker, RecurrencePicker)
App.tsx              # shell: providers + header (mês/saldos) + topbar + telas + menu
```

## Telas (nomes na UI)

- **Distribuição** — lista de despesas; cada card expande para editar distA/distS e marcar Pago/Pendente. Total de despesas fixo no rodapé.
- **Saldo Previsto** — cards por período (receita prevista − despesas) + lista de receitas.
- **Saldo Atual** — espelho do Previsto, mas com a receita real editável (saldo = receita real − despesas).
- **Entrada** (form) — criar/editar despesa ou receita. Tipo, nome+ícone, valor, data, distribuição (só despesa), recorrência.
- **Menu lateral** (☰, desliza da direita) — toggle tema, Exportar/Importar CSV, "Apagar todos os dados".

## Decisões e convenções importantes

- **Tema é todo azul.** Verde (`incomeC`) e vermelho (`expenseTxt`/`expenseC`) aparecem **só** em valores financeiros (receita/despesa/saldo), nunca como cor de UI geral. Modo claro usa tons pastel; escuro é azul-noturno.
- **Ícones**: nomes curtos (ex: `"home"`, `"cash"`) mapeados em `Icon.tsx` para `@hugeicons/core-free-icons`. Os nomes do Hugeicons **variam entre versões** — se um import falhar, achar o nome real com:
  `node -e "console.log(Object.keys(require('@hugeicons/core-free-icons')).filter(n=>/termo/i.test(n)))"`
- **Seed desativado**: o app começa vazio (o bloco de seed em `database.ts` está comentado). `resetDatabase()` deixa vazio também.
- **SQLite — armadilhas já resolvidas (não regredir):**
  - PRAGMAs em chamadas `execAsync` **separadas** (juntos quebravam).
  - `getDb()` guarda a **promessa** (`_dbPromise`), não a conexão, para evitar abrir o banco em paralelo.
  - Todos os binds de INSERT/UPDATE usam fallback explícito (`?? null`, `?? ""`, `?? 0`) — o driver nativo **rejeita `undefined`** (causa o erro `prepareAsync rejected`).
  - Usar `INSERT OR REPLACE` em vez de `ON CONFLICT DO UPDATE` (este último dava `prepareAsync rejected` em algumas versões).
  - Seed/inserts **sem** `withTransactionAsync` (transação mascarava o erro real com "cannot rollback").
- **expo-file-system**: usar `import * as FileSystem from "expo-file-system/legacy"` (a API nova removeu `cacheDirectory`/`writeAsStringAsync` do módulo raiz).
- **Safe area dentro de Modal**: `Modal` não herda o `SafeAreaProvider`. No topo de Modais usar `Math.max(insets.top, StatusBar.currentHeight, 24) + 16` como padding (no Samsung A25 o inset vinha 0 dentro do Modal).
- **Import de CSV é aditivo** (insere como novos, não substitui) — reimportar duplica.
- **Animações**: expandir/colapsar usa `LayoutAnimation` (não Reanimated). Habilitado no Android via `UIManager.setLayoutAnimationEnabledExperimental(true)` no App.tsx.

## Stack / libs

- Expo (SDK recente) + TypeScript
- expo-sqlite (API async), expo-file-system/legacy, expo-sharing, expo-document-picker
- @react-native-community/datetimepicker
- react-native-safe-area-context
- @hugeicons/react-native + @hugeicons/core-free-icons

## Build / rodar

- Dev: `npx expo run:android` (com emulador ou aparelho via USB)
- Mudou ícone/nome/package no `app.json`: `npx expo prebuild --clean` antes do run
- APK para instalar no celular: `eas build -p android --profile preview` (profile com `"buildType": "apk"` no `eas.json`)

## Estado atual

App funcional de ponta a ponta, instalado no aparelho via EAS. CRUD completo, distribuição, swipe/navegação de meses, temas, backup CSV e reset funcionando. Seed desativado (começa vazio).