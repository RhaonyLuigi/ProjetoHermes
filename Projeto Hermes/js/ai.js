/* ============================================================
   PROJETO HERMES — AI Integration (Gemini via fetch)
   ============================================================ */

const AI = {
  SYSTEM_PROMPT: `Você é o Assistente Hermes, especialista em diagnóstico automotivo. 
Faça de 3 a 6 perguntas objetivas e simpáticas ao motorista para entender o problema do veículo. 
Ao final, gere um pré diagnóstico técnico resumido, diga ao motorista o que pode ser, sem dizer realmente com certeza o que é, 
e dê uma estimativa de preço do conserto, mas enfatize que é só uma estimativa. 
Seja amigável, use linguagem simples. Responda sempre em português brasileiro.
Quando finalizar o diagnóstico, termine sua mensagem com a tag exata: [DIAGNOSTICO_CONCLUIDO]`,

  history: [],

  reset() { this.history = []; },

  async chat(userMessage, veiculos = []) {
    this.history.push({ role: 'user', content: userMessage });

    const veiculosCtx = veiculos.length
      ? `\nVeículos cadastrados do motorista: ${veiculos.map(v => `${v.marca} ${v.modelo} ${v.ano} (${v.placa})`).join(', ')}.`
      : '';

    const messages = [
      { role: 'system', content: this.SYSTEM_PROMPT + veiculosCtx },
      ...this.history.map(h => ({ role: h.role, content: h.content }))
    ];

    try {
      // Use the Antigravity built-in AI proxy
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: 'gemini-2.0-flash' })
      });

      let aiText = '';

      if (response.ok) {
        const data = await response.json();
        aiText = data.content || data.message || data.text || '';
      } else {
        // Fallback: simulate AI responses for demo
        aiText = this._simulateResponse(userMessage, this.history.length);
      }

      this.history.push({ role: 'assistant', content: aiText });
      return aiText;
    } catch (e) {
      // Offline fallback
      const aiText = this._simulateResponse(userMessage, this.history.length);
      this.history.push({ role: 'assistant', content: aiText });
      return aiText;
    }
  },

  _simulateResponse(userMsg, step) {
    const responses = [
      "Olá! Sou o Assistente Hermes 🔧 Vou te fazer algumas perguntas para entender o problema do seu veículo. Vamos começar?\n\n**Qual veículo está apresentando o problema?**",
      "Entendido! **Há quanto tempo você está percebendo esse problema?** (Exemplo: desde ontem, há uma semana, há um mês...)",
      "Compreendi. **O problema ocorre sempre ou apenas em certas situações?** Por exemplo: só ao ligar o carro, ao acelerar, ao frear, em alta velocidade?",
      "Obrigado pela informação! **Você ouve algum barulho estranho?** Se sim, como você descreveria ele? (Rangido, batida, chiado, ronco...)",
      "**Há alguma luz de alerta acesa no painel?** Se sim, qual ícone aparece? (Motor, bateria, óleo, temperatura...)",
      this._gerarDiagnostico(userMsg)
    ];
    const idx = Math.min(Math.floor((step - 1) / 2), responses.length - 1);
    return responses[idx];
  },

  _gerarDiagnostico(ctx) {
    return `Com base nas informações que você me passou, posso dizer que os sintomas descritos são consistentes com alguns problemas comuns:

🔍 **Possíveis causas:**
• Desgaste nas pastilhas de freio ou disco
• Problema no sistema de arrefecimento
• Falha em sensor ou componente elétrico

⚠️ *Lembrando que isso é apenas um pré-diagnóstico — somente um mecânico especializado pode confirmar o problema real após uma inspeção presencial.*

💰 **Estimativa de preço:** entre R$ 200 e R$ 800, dependendo do problema específico e das peças necessárias. *Esta é apenas uma estimativa — o valor real pode variar.*

Estou enviando este diagnóstico para as oficinas parceiras agora! 🚗✅ [DIAGNOSTICO_CONCLUIDO]`;
  }
};
