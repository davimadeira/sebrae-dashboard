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

