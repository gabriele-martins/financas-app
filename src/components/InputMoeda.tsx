// ════════════════════════════════════════════════
// src/components/InputMoeda.tsx
// Input de valor estilo "caixa eletrônico": dígitos entram pela
// direita, vírgula decimal fixa, valor sempre exibido formatado.
// Sem edição no meio do texto — só dígitos e backspace.
//
// Usa onChangeText (não onKeyPress) porque muitos teclados Android
// por software (Samsung Keyboard, Gboard em certos modos) não emitem
// eventos onKeyPress por tecla numérica — só onChangeText é confiável.
// Como o `value` exibido é sempre o texto formatado, cada mudança do
// usuário produz um texto com dígitos a mais (nova tecla) ou a menos
// (backspace); extraímos os dígitos e comparamos com os atuais.
// ════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { TextInput, Text, View, ViewStyle, StyleProp } from "react-native";

interface Props {
  valor: number;               // em reais, controlado de fora
  onChange: (v: number) => void; // em reais
  onBlurConfirm?: () => void;  // ex: fechar modo edição ao perder foco / enter
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>; // aplicado no container (borda/fundo); o texto herda cor/tamanho dele
  prefixColor?: string;
}

const centavosParaReais = (c: number) => c / 100;
const reaisParaCentavos = (v: number) => Math.round(v * 100);
const soDigitos = (s: string) => s.replace(/\D/g, "");
const formatNumero = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function InputMoeda({ valor, onChange, onBlurConfirm, autoFocus, style, prefixColor }: Props) {
  const [centavos, setCentavos] = useState(() => reaisParaCentavos(valor));
  const displayRef = useRef(formatNumero(centavosParaReais(reaisParaCentavos(valor))));

  useEffect(() => {
    const c = reaisParaCentavos(valor);
    setCentavos((prev) => (prev === c ? prev : c));
  }, [valor]);

  const aplicar = (novo: number) => {
    const capped = Math.max(0, Math.min(novo, 999999999));
    setCentavos(capped);
    onChange(centavosParaReais(capped));
  };

  const display = formatNumero(centavosParaReais(centavos));
  displayRef.current = display;

  const handleChangeText = (texto: string) => {
    const digitosAtuais = soDigitos(displayRef.current);
    const digitosNovos = soDigitos(texto);

    if (digitosNovos.length > digitosAtuais.length) {
      // Dígito(s) adicionado(s). O cursor sempre fica travado no fim,
      // então o(s) dígito(s) novo(s) sempre está(ão) no final da string.
      const qtdNovos = digitosNovos.length - digitosAtuais.length;
      const acrescentado = digitosNovos.slice(digitosNovos.length - qtdNovos);
      let novo = centavos;
      for (const ch of acrescentado) novo = novo * 10 + Number(ch);
      aplicar(novo);
    } else if (digitosNovos.length < digitosAtuais.length) {
      // Backspace: remove o último dígito.
      aplicar(Math.floor(centavos / 10));
    }
    // Igual quantidade de dígitos (ex: só reformatação) — não faz nada.
  };

  return (
    <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: prefixColor, marginRight: 2 }}>R$</Text>
      <TextInput
        autoFocus={autoFocus}
        keyboardType="number-pad"
        value={display}
        selection={{ start: display.length, end: display.length }}
        caretHidden
        contextMenuHidden
        showSoftInputOnFocus
        onChangeText={handleChangeText}
        onSubmitEditing={onBlurConfirm}
        onBlur={onBlurConfirm}
        style={{ flex: 1, padding: 0, margin: 0, fontSize: 13, fontWeight: "600", color: prefixColor, textAlign: "right" }}
      />
    </View>
  );
}
