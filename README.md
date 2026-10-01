# AmazonPicks — Automação

Este repositório executa a atualização completa às 7h e a atualização prioritária às 13h e 19h, no horário de Brasília, mediante disparo autenticado do Amazon EventBridge.

O código da aplicação permanece em repositório privado. As credenciais são GitHub Actions Secrets, com acesso de leitura ao código. Os workflows não publicam caches ou artefatos e mantêm a saída das tarefas privada no runner temporário.

O fluxo completo calcula médias e aplica a retenção após atualizar os preços. Os dois workflows compartilham uma trava de execução para evitar sobreposição.
