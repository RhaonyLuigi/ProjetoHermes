/* Triagem local. As respostas orientam a inspeção da oficina. */
const Triagem = {
  categorias: {
    freios: {
      nome: 'Freios', icone: 'shield', exemplo: 'Chiado, vibração ou pedal diferente',
      pergunta: 'O que mudou ao frear?',
      opcoes: ['Chiado ou rangido', 'Pedal vibra', 'Pedal baixo ou esponjoso', 'O carro demora a frear'],
      inspecao: 'Verificar pastilhas, discos, fluido e possíveis vazamentos no sistema de freio.'
    },
    partida: {
      nome: 'Partida e elétrica', icone: 'bolt', exemplo: 'Dificuldade para ligar ou falha elétrica',
      pergunta: 'O que acontece quando você tenta ligar o veículo?',
      opcoes: ['Faz um clique', 'O motor gira sem ligar', 'O painel apaga', 'Liga depois de várias tentativas'],
      inspecao: 'Conferir bateria, terminais e sistema de partida. Se o motor gira sem ligar, investigar alimentação e ignição.'
    },
    temperatura: {
      nome: 'Temperatura', icone: 'temp', exemplo: 'Motor quente, vapor ou perda de líquido',
      pergunta: 'Qual sinal você percebeu?',
      opcoes: ['Ponteiro alto ou luz de temperatura', 'Vapor no motor', 'Líquido no chão', 'Aquecimento no trânsito'],
      inspecao: 'Verificar nível do líquido com o motor frio, vazamentos e funcionamento da ventoinha.'
    },
    ruido: {
      nome: 'Ruído e vibração', icone: 'activity', exemplo: 'Barulho diferente ou volante tremendo',
      pergunta: 'Em que situação você sente a vibração ou ouve o ruído?',
      opcoes: ['Ao passar em buracos', 'Em curvas', 'Em certa velocidade', 'Ao acelerar'],
      inspecao: 'Investigar rodas, pneus, direção e suspensão conforme a condição em que o sintoma aparece.'
    },
    motor: {
      nome: 'Motor e painel', icone: 'gauge', exemplo: 'Luz acesa, falha ou perda de potência',
      pergunta: 'Qual é o sinal mais evidente?',
      opcoes: ['Luz de injeção', 'Perda de potência', 'Marcha lenta irregular', 'Luz de óleo'],
      inspecao: 'Registrar os alertas do painel e verificar o funcionamento do motor e os códigos de falha, se houver.'
    },
    outro: {
      nome: 'Outro sintoma', icone: 'dots', exemplo: 'Algo que não se encaixa nas opções',
      pergunta: 'Quando o sintoma costuma aparecer?',
      opcoes: ['Ao ligar', 'Com o carro em movimento', 'Com o carro parado', 'Ainda não consegui identificar'],
      inspecao: 'Reproduzir o sintoma nas condições relatadas pelo motorista e fazer uma inspeção inicial.'
    }
  },

  perguntas(categoria) {
    const grupo = this.categorias[categoria];
    return [
      { texto: grupo.pergunta, opcoes: grupo.opcoes },
      { texto: 'Há quanto tempo você percebe isso?', opcoes: ['Hoje', 'Há alguns dias', 'Há algumas semanas', 'Há mais de um mês'] },
      { texto: 'Com que frequência isso acontece?', opcoes: ['Aconteceu uma vez', 'Às vezes', 'Sempre', 'Está piorando'] },
      { texto: 'Que outro detalhe pode ajudar a oficina?', dica: 'Por exemplo, um alerta no painel ou uma manutenção recente. Evite incluir dados pessoais.', opcoes: ['Sem outros detalhes'] }
    ];
  },

  resumo(draft) {
    const grupo = this.categorias[draft.categoria];
    const [sintoma, inicio, frequencia, detalhe] = draft.respostas;
    const relato = [sintoma, `Início: ${inicio}. Frequência: ${frequencia}.`, detalhe === 'Sem outros detalhes' ? '' : detalhe].filter(Boolean).join('\n');
    const texto = `${sintoma} ${detalhe}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const alerta = /pedal baixo|esponjoso|demora a frear|sem freio|falha (no|de) freio|ponteiro alto|luz de temperatura|vapor|fumaca|superaquec|luz (do|de) oleo|cheiro de (queimado|combustivel)/.test(texto);
    return { relato, inspecao: grupo.inspecao, alerta };
  }
};

if (typeof module === 'object') module.exports = Triagem;
