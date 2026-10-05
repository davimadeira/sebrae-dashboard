# Cadastro pelo dashboard

O botão Adicionar registro fica disponível para usuários com a custom claim `bko: true`. Administradores concedem e removem essa permissão na Administração, pelos botões Tornar BKO e Remover BKO. Após a concessão, o usuário deve recarregar o dashboard. Ser administrador, por si só, não permite cadastrar.

O formulário lê os cabeçalhos atuais da aba Preenchimento e mantém a ordem e os nomes, incluindo Mês (coluna V, antes fora do intervalo de leitura do dashboard). Protocolo é obrigatório, pois registros sem a primeira coluna são excluídos pelo processamento existente. Outros campos ficam opcionais, sem inventar regras de obrigatoriedade. Datas devem ser preenchidas como DD/MM/AAAA. Todos os valores são gravados literalmente, sem executar fórmulas.

O servidor valida a sessão, consulta o perfil atual no Firebase e bloqueia usuários desabilitados ou sem BKO, mesmo que o navegador ainda tenha uma permissão antiga. Confere novamente os cabeçalhos antes de salvar. Inclusões usam append na planilha existente. UID, horário e intervalo criado são registrados no log do servidor; não são novas colunas de auditoria na planilha.

## Ambiente publicado

- Manter as variáveis GCP/OIDC já usadas pela administração.
- Habilitar a API Google Sheets no projeto e conceder à conta `GCP_SERVICE_ACCOUNT_EMAIL` acesso de Editor à planilha utilizada pelo dashboard.
- Publicar as alterações da aplicação e das funções de API juntas. O Vite sozinho não executa as funções `/api`.
- Conceder BKO a um usuário de teste e validar uma inclusão autorizada, conferindo a nova linha e os indicadores. Essa validação real não foi executada localmente para não inserir dados de teste na planilha operacional.

Não há repetição automática de gravações. Se ocorrer falha de rede durante o salvamento, conferir a planilha antes de tentar novamente, pois a resposta pode ter sido perdida depois da inclusão.

Validação local: `node --test tests/bko-records.test.js` e build do Vite. Referência da integração: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

## Menu e campos

O menu separa Indicadores e Adicionar chamado (somente BKO). O formulário mantém o preenchimento ao alternar abas e organiza todas as colunas em três seções. Datas usam seletor de calendário. As opções são carregadas das validações de Preenchimento!A2200:V2200 e das referências à aba LISTA; atualizar essa linha de referência se o modelo da planilha mudar. Listas estritas também são validadas no servidor. Status Ticket é exibido automaticamente e não é escrito, preservando a fórmula MAP da planilha.


## Central de chamados e edição

A aba Chamados permite a qualquer perfil BKO buscar, filtrar, cadastrar e editar qualquer ticket, conforme autorização do responsável. A listagem é paginada em 30 registros, com busca por protocolo, origem, assunto e responsáveis. Edições carregam a linha atual e enviam somente as células modificadas em values:batchUpdate com RAW. Protocolo, Status Ticket e células contendo fórmulas ficam bloqueados. Valores antigos fora das listas são preservados quando não alterados.

Uma versão dos valores e fórmulas é comparada antes da gravação; diferenças retornam 409 e exigem reabrir o chamado. Essa conferência não é uma transação: alterações simultâneas diretamente na planilha no intervalo entre a leitura e a escrita ainda podem competir. Não há repetição automática. O log registra UID, linha, índices das colunas e horário, sem o conteúdo alterado.

Validação: 13 testes locais, compilação e fluxo de edição no navegador com dados simulados. Nenhum ticket real foi modificado como teste.
## Painel analítico de Tratativa

A Visão geral apresenta status, tempo em aberto, prioridades, tentativas e taxas por contato, resultados Foco por canal, distribuição e participações dos operadores, N2 e descrições/termos recorrentes. Critérios de classificação ficam visíveis e podem ser ajustados na sessão. Valores não reconhecidos não entram no denominador das taxas de sucesso. Apenas status de abertura reconhecidos entram na fila. Dias são corridos, em São Paulo. Não há cálculo de tempo até resolução sem data de conclusão.

O CSV de interações é lido localmente no navegador (até 20 MB); ID Genesys cruza com ID de conversa por igualdade após normalizar caixa/espaços. Direção Saída ou Entrada/Saída marca callback. Repetições de ID são agrupadas. A importação não altera nem envia a base e não atualiza a aba Callback. Os filtros analíticos não alteram a lista Todos os registros. Regras e CSV não persistem ao sair da aba/recarregar.

Validação: 10 testes de análise e acesso; importador conferido no CSV fornecido (371 IDs, 11 callbacks); renderização estática em base vazia e com exemplo sintético. A prévia visual no navegador ficou indisponível por falha da ferramenta local. Nenhum dado fictício é publicado.
