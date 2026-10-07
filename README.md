# AmazonPicks — Automação

## Rodadas atuais

- Completa: 06h, horário de Brasília, `atualizacao-global.yml`.
- Vitrine: 12h e 18h, horário de Brasília, `atualizacao-vitrine.yml`.
- Agendamento externo pelo EventBridge em Ohio, sem cron GitHub adicional.
- Ambas usam intervalo de 1.000 ms na Creators e lotes de até 500 para gravar Top Ofertas.

Código e credenciais permanecem privados. O executor público omite os logs detalhados
e não publica arquivos de coleta ou diagnóstico. O diagnóstico com recuperação deve
ser executado no repositório privado. Nomes das etapas, configuração e horários deste
executor continuam públicos; o repositório público não oferece sigilo absoluto.

Os nomes internos legados das regras AWS foram preservados. Seus horários efetivos
são 09h, 15h e 21h UTC, equivalentes a 06h, 12h e 18h de Brasília.
