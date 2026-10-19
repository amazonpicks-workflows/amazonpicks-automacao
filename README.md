# AmazonPicks — Automação

## Rodadas atuais

- Completa: 06h, horário de Brasília, `atualizacao-global.yml`.
- Vitrine: 12h e 18h, horário de Brasília, `atualizacao-vitrine.yml`.
- Agendamento externo pelo EventBridge em Ohio, sem cron GitHub adicional.
- Ambas usam intervalo de 1.000 ms na Creators e lotes de até 500 para gravar Top Ofertas.

Código e credenciais permanecem privados. O executor público omite os logs detalhados
e não publica arquivos de coleta ou diagnóstico. O diagnóstico com recuperação deve
ser armazenado privadamente pelo executor público. Nomes das etapas, configuração e horários
deste executor continuam públicos; o repositório público não oferece sigilo absoluto.

## Alterações seguras

A verificação `Public runner security` confere uma política aprovada fora do Git,
inclusive antes da etapa que recebe credenciais. A checagem de PR lê os arquivos
candidatos como dados: não executa código do PR e não recebe secrets.

Mudanças nos workflows, bootstrap ou verificador exigem revisão de segurança,
testes de sucesso/falha e aprovação explícita do novo manifesto pela configuração
`RUNNER_SECURITY_POLICY_SHA256`. Não atualize hashes apenas para deixar a CI verde.
Arquivos novos são bloqueados até revisão; documentação neste README pode mudar.
Nunca habilite debug ampliado nem adicione upload de artefatos/cache de código.

A proteção de main exige que a política passe antes de integrar mudanças.

Os nomes internos legados das regras AWS foram preservados. Seus horários efetivos
são 09h, 15h e 21h UTC, equivalentes a 06h, 12h e 18h de Brasília.
