# Especificacao - Document Management System

## 1. Objetivo

Disponibilizar uma aplicacao web simples para enviar, listar e baixar documentos armazenados no filesystem local, mantendo seus metadados em memoria.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisicao HTTP.
- Validar tamanho e tipo de arquivo antes de aceitar o envio.
- Guardar os bytes do arquivo localmente em `backend/storage`, usando Multer com `diskStorage`.
- Manter em memoria os metadados necessarios para listar e localizar os documentos durante a execucao do servidor.
- Listar os documentos conhecidos pela instancia em execucao.
- Baixar o arquivo pelo identificador do documento.
- Manter `owner` como metadado informativo com valor `local-user` no MVP.

### Fora do escopo

- Autenticacao, autorizacao e isolamento de documentos por usuario.
- Armazenamento em banco de dados, nuvem ou provedor externo.
- Persistencia dos metadados entre reinicializacoes do servidor.
- Versionamento, edicao, exclusao, compartilhamento ou busca avancada de documentos.
- Upload de multiplos arquivos em uma unica requisicao.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo no campo multipart `file` por requisicao de upload. |
| RF-02 | O sistema deve rejeitar uploads sem arquivo, acima do limite configurado ou com tipo nao permitido, retornando um erro HTTP apropriado. |
| RF-03 | O sistema deve gravar o arquivo aceito em `backend/storage` por meio de Multer `diskStorage`, usando um nome interno gerado pelo servidor que nao dependa do nome original. |
| RF-04 | Apos gravar o arquivo, o sistema deve criar e manter em memoria seus metadados: identificador unico, nome original, tamanho em bytes, data/hora de envio e dono. |
| RF-05 | O sistema deve retornar os metadados do documento criado e um identificador utilizavel para listagem e download. |
| RF-06 | O sistema deve listar todos os documentos cujos metadados estao presentes na memoria da instancia atual, em ordem decrescente de `uploadedAt`. |
| RF-07 | O sistema deve baixar o conteudo binario do documento solicitado pelo identificador e indicar ao cliente que a resposta e um anexo com o nome original. |
| RF-08 | O sistema deve retornar `404` quando o identificador nao estiver registrado ou quando o arquivo associado nao puder ser encontrado no disco. |
| RF-09 | Se a gravacao do arquivo falhar, o sistema nao deve registrar metadados para um upload que nao foi concluido. Se o registro dos metadados falhar apos a gravacao, deve remover o arquivo parcial quando possivel. |

## 4. Requisitos nao funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados exclusivamente no filesystem local da aplicacao, em `backend/storage`, usando Multer com `diskStorage`; nao devem ser enviados a servicos externos. |
| RNF-02 | Os metadados devem permanecer em memoria nesta fase. Reiniciar o processo remove os metadados, embora os arquivos possam continuar no disco; a spec nao promete recuperacao ou listagem desses arquivos apos reinicio. |
| RNF-03 | A configuracao deve ser feita por variaveis de ambiente, seguindo o principio 12-Factor. |
| RNF-04 | O limite inicial de upload deve ser 10 MiB (`10485760` bytes), substituivel por `MAX_FILE_SIZE_BYTES`. |
| RNF-05 | Os tipos aceitos devem ser configuraveis por `ALLOWED_MIME_TYPES`. O default inicial deve aceitar PDF, texto simples, DOC, DOCX, PNG e JPEG. A validacao deve ocorrer no servidor; o tipo informado pelo cliente nao deve ser tratado como prova de seguranca do conteudo. |
| RNF-06 | Nomes internos de arquivo devem ser gerados pelo servidor. O nome original e apenas metadado e deve ser tratado com seguranca ao formar o cabecalho de download. |
| RNF-07 | O backend deve usar Node.js, Express e JavaScript CommonJS; os testes backend devem usar `node:test`. O frontend deve seguir React + Vite e usar `fetch`. |
| RNF-08 | O MVP nao oferece controle de acesso: `owner` tem valor `local-user` e e apenas informativo. |

### Configuracao do MVP

| Variavel | Default | Uso |
| --- | --- | --- |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho maximo permitido por arquivo, em bytes. |
| `ALLOWED_MIME_TYPES` | `application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg` | Lista separada por virgulas de tipos MIME aceitos. |

`PORT` deve continuar sendo configuravel conforme a convencao existente do servidor. A inicializacao deve garantir que o diretorio `backend/storage` exista antes de receber uploads.

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador unico gerado pelo servidor. Usado nas rotas de listagem e download. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente, preservado para exibicao e download; nunca usado como nome do arquivo no disco. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora UTC em formato ISO 8601. |
| `owner` | string | Sim | Valor `local-user` no MVP. Informativo; nao representa identidade autenticada nem aplica autorizacao. |

O registro mantido pelo repositorio tambem associa o documento ao caminho local do arquivo. Esse caminho e interno, nao e devolvido pela API e deve apontar para um nome interno gerado pelo servidor dentro de `backend/storage`. A implementacao deve impedir que o caminho de download seja escolhido pelo cliente.

Os metadados existem somente em memoria e podem ser representados como uma colecao indexada por `id`. Nao ha garantia de recuperacao dos registros depois de reiniciar o processo. Arquivos sem metadados correspondentes nao aparecem na listagem e nao podem ser baixados por esta API.

## 6. Contratos de API

### Convencoes

- Os caminhos abaixo sao os caminhos expostos pelo backend Express: `/upload` e `/documents...`.
- O frontend chama esses caminhos com o prefixo `/api` (por exemplo, `/api/upload`). O proxy do Vite remove `/api` antes de encaminhar a requisicao ao backend.
- As respostas de erro usam `Content-Type: application/json` e o formato `{ "error": { "code": "...", "message": "..." } }`.
- A API nao recebe `owner` do cliente; o backend atribui `local-user` no MVP.

### `POST /upload`

Envia um unico arquivo como `multipart/form-data`.

| Item | Contrato |
| --- | --- |
| Campo multipart | `file` (obrigatorio, um arquivo) |
| Sucesso | `201 Created`, `Content-Type: application/json` |
| Corpo de sucesso | `{ "document": { "id": "...", "originalName": "relatorio.pdf", "size": 1234, "uploadedAt": "2026-11-26T12:00:00.000Z", "owner": "local-user" } }` |
| Arquivo ausente ou campo invalido | `400 Bad Request`, codigo `FILE_REQUIRED` ou `INVALID_UPLOAD` |
| Tamanho acima do limite | `413 Payload Too Large`, codigo `FILE_TOO_LARGE` |
| Tipo nao permitido | `415 Unsupported Media Type`, codigo `UNSUPPORTED_MEDIA_TYPE` |
| Falha ao gravar arquivo | `500 Internal Server Error`, codigo `STORAGE_ERROR` |

### `GET /documents`

Lista os metadados de todos os documentos registrados na memoria da instancia atual.

| Item | Contrato |
| --- | --- |
| Sucesso | `200 OK`, `Content-Type: application/json` |
| Corpo de sucesso | `{ "documents": [ { "id": "...", "originalName": "relatorio.pdf", "size": 1234, "uploadedAt": "2026-11-26T12:00:00.000Z", "owner": "local-user" } ] }` |
| Lista vazia | `{ "documents": [] }` |
| Falha inesperada | `500 Internal Server Error`, codigo `INTERNAL_ERROR` |

### `GET /documents/:id/download`

Transfere os bytes do arquivo associado ao identificador.

| Item | Contrato |
| --- | --- |
| Sucesso | `200 OK`, corpo binario, `Content-Type` correspondente ao arquivo e `Content-Disposition: attachment` com o nome original devidamente escapado. |
| Identificador desconhecido ou arquivo ausente | `404 Not Found`, codigo `DOCUMENT_NOT_FOUND` |
| Falha de leitura durante a transferencia | `500 Internal Server Error`, codigo `STORAGE_ERROR`, se ainda for possivel enviar uma resposta HTTP. |

## 7. Decisoes arquiteturais

- Backend em Clean Architecture simples, com dependencias fluindo `routes -> controllers -> services -> repositories`.
- `routes/` declara caminhos e encaminha requisicoes; middleware de upload configura Multer e `diskStorage`.
- `controllers/` adapta entrada HTTP, validacoes de borda, status e formato das respostas.
- `services/` aplica regras de negocio de upload, listagem e download sem depender de Express.
- `repositories/` mantem os metadados em memoria e resolve a associacao interna com os arquivos no filesystem.
- O armazenamento dos bytes e local em `backend/storage`. O caminho fisico e detalhe interno do repositorio, nao parte do contrato HTTP.
- Frontend React com componentes funcionais; chamadas ao backend via `fetch` usando `/api` e o proxy configurado no Vite.
- Mensagens ao usuario em portugues; nomes de simbolos de codigo em ingles.
- Erros de entrada devem ser tratados na borda HTTP. Erros de persistencia local devem ser convertidos em respostas controladas, sem expor caminhos internos ou detalhes sensiveis.
- A primeira versao nao inclui autenticacao, banco de dados, armazenamento externo ou abstracoes alem das necessarias para separar as camadas definidas.

## 8. Plano de execucao

As etapas abaixo descrevem uma implementacao futura. Esta tarefa entrega somente esta especificacao; nao executa as etapas nem altera arquivos de backend ou frontend.

1. Preparar configuracao do backend, validacao das variaveis de ambiente e inicializacao do diretorio local de armazenamento.
2. Implementar o repositorio de metadados em memoria e a associacao segura entre IDs e arquivos gerenciados no filesystem local.
3. Implementar regras de upload, listagem e download nos services, incluindo validacoes, ordenacao, erros esperados e tratamento de falhas de disco.
4. Expor os contratos HTTP pelos controllers e routes, integrando Multer `diskStorage` e os status/formato de resposta definidos nesta spec.
5. Construir a interface React para envio, exibicao da lista, estados vazios/erro e download usando os endpoints atraves do proxy `/api`.
6. Adicionar testes backend com `node:test` para sucesso e falhas dos tres endpoints, verificando metadados, arquivos locais, validacoes e respostas HTTP.
7. Validar o fluxo integrado no ambiente local e atualizar a documentacao operacional das variaveis de ambiente e limitacoes do armazenamento em memoria.