# Execução gerenciada

Este repositório contém apenas o ponto de entrada público. A configuração e o
diagnóstico detalhado são privados. A saída pública informa somente o resultado.

## Alterações seguras

A verificação `Public runner security` confere uma política aprovada fora do Git,
inclusive antes da etapa que recebe credenciais. A checagem de PR lê os arquivos
candidatos como dados: não executa código do PR e não recebe secrets.

Mudanças nos workflows, bootstrap ou verificador exigem revisão de segurança,
testes de sucesso/falha e aprovação explícita do novo manifesto pela configuração
`RUNNER_SECURITY_POLICY_SHA256`. Não atualize hashes apenas para deixar a CI verde.
Arquivos novos e mudanças neste README são bloqueados até revisão.
Nunca habilite debug ampliado nem adicione upload de artefatos/cache de código.

A proteção de main exige que a política passe antes de integrar mudanças.

Metadados da plataforma e versões anteriores não são ocultados por este desenho.
