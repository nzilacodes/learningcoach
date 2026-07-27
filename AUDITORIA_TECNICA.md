# Auditoria Técnica — Learning English with Coach

**Data:** 17/07/2026  
**Tipo:** auditoria estática de código, configuração e migrações locais  
**Escopo:** frontend React/TanStack Start, rotas server-side, Supabase/Postgres, integrações, segurança, UX/UI e prontidão operacional.

## Resumo executivo

O projeto possui uma base visual madura e uma modelagem Supabase relativamente ampla, com autenticação, RLS, progresso, gamificação, assinaturas, certificados e recursos de IA. Ainda assim, vários fluxos críticos são demonstrativos ou incompletos. O produto **não deve ser publicado como plataforma paga ou emissora de certificados** até a conclusão dos itens P0.

Estimativa de conclusão atual:

| Área | Conclusão | Leitura |
| --- | ---: | --- |
| Frontend | 65% | Muitas telas existem, mas funcionalidades centrais ainda são demonstrativas. |
| Backend | 45% | Server functions e Supabase existem, mas faltam integrações e proteções essenciais. |
| Banco de dados | 70% | Tabelas, RLS e funções são extensas; faltam operação, seeds e validações de domínio. |
| UI/UX | 60% | Design consistente, porém há lacunas de mobile, acessibilidade e estados de erro. |
| Infraestrutura | 25% | Não há testes, CI/CD, runbook, observabilidade ou processo de backup documentado. |
| **Total estimado** | **55%** | Adequado para protótipo avançado, não para produção. |

## Limites da auditoria

- A revisão foi feita sobre os arquivos presentes neste repositório, sem acessar a instância Supabase, gateways ou ambiente Lovable.
- A execução de `npm run build` e `npm run lint` foi tentada, mas não pôde iniciar porque `node_modules` não está presente; os binários `vite` e `eslint` não foram encontrados.
- Não foi possível validar políticas RLS, migrações aplicadas, segredos configurados ou comportamento de integrações externas em runtime.

## Achados críticos — P0

### SEC-01 — Arquivo de ambiente versionado

- **Criticidade:** Crítico
- **Evidência:** `.env` é rastreado pelo Git; `.gitignore` não contém regra para `.env`.
- **Impacto:** chaves de Supabase, IA ou outros provedores podem estar expostas no histórico e serem usadas indevidamente.
- **Recomendação:** remover o arquivo do versionamento e do histórico de modo coordenado, rotacionar todos os segredos potencialmente expostos, adicionar `.env` ao `.gitignore` e criar `.env.example` sem valores reais.
- **Critério de aceite:** nenhum segredo existe no histórico ativo; ambientes usam secret manager e pipeline de detecção de segredos.

### PAY-01 — Checkout aceita confirmação simulada pelo próprio aluno

- **Criticidade:** Crítico
- **Evidência:** `src/lib/subscriptions.functions.ts` contém `simulatePaymentConfirmation`; `src/routes/checkout.$planId.tsx` apresenta a ação “Simular confirmação”.
- **Impacto:** qualquer usuário pode ativar a própria assinatura sem uma transação real. O sistema não pode vender planos de forma confiável.
- **Recomendação:** remover a operação de simulação da build de produção; integrar um PSP/gateway aprovado; criar endpoint de webhook autenticado com assinatura, timestamp, idempotência, reconciliação e trilha de auditoria.
- **Critério de aceite:** somente um webhook autenticado ou rotina administrativa protegida pode mudar um pagamento para `paid`.

### PAY-02 — Dados de pagamento ainda são placeholders

- **Criticidade:** Crítico
- **Evidência:** entidade Multicaixa, IBAN, números de mobile money e provedores são valores fixos/demonstrativos em `src/routes/checkout.$planId.tsx` e nas migrações de pagamento.
- **Impacto:** aluno pode transferir dinheiro para dados incorretos; risco financeiro e reputacional.
- **Recomendação:** obter credenciais e contratos reais do PSP; armazenar configurações por ambiente no servidor; nunca expor dados de integração não verificados no cliente.
- **Critério de aceite:** cada método exibe dados ou redireciona para sessão criada pelo gateway real.

### CERT-01 — Certificados podem ser emitidos sem elegibilidade

- **Criticidade:** Crítico
- **Evidência:** a UI oferece emissão de A1 a C2 diretamente em `src/routes/certificates.tsx`; a função `issue_certificate` recebe nível e cria o certificado sem validar conclusão de curso, exame ou nota mínima.
- **Impacto:** emissão fraudulenta de certificados e perda de credibilidade acadêmica.
- **Recomendação:** calcular elegibilidade exclusivamente no banco/servidor, relacionar certificado a curso/tentativa de exame, armazenar regra e nota obtida, e impedir emissão manual fora de uma ação administrativa auditada.
- **Critério de aceite:** uma chamada direta à API para nível não concluído retorna erro de autorização/elegibilidade.

### AI-01 — APIs de IA públicas, sem autenticação, rate limit ou limites de payload

- **Criticidade:** Crítico
- **Evidência:** `src/routes/api/tts.ts`, `src/routes/api/stt.ts` e `src/routes/api/diagnostic-evaluate.ts` expõem `POST` sem middleware de autenticação. TTS/STT não limitam texto, arquivo, MIME, duração nem frequência.
- **Impacto:** exaustão de crédito de IA, abuso automatizado, upload malicioso, latência e indisponibilidade.
- **Recomendação:** exigir sessão válida quando aplicável, validar schemas com Zod, impor limites por usuário/IP, tamanho/duração de áudio, allowlist de MIME/vozes, timeout, quota por plano e observabilidade de custo.
- **Critério de aceite:** requisições anônimas ou fora de quota são negadas; payloads inválidos retornam 4xx sem chamar o provedor.

## Achados altos — P1

### AI-02 — AI Coach é uma simulação local

- **Criticidade:** Alto
- **Evidência:** `src/routes/ai-coach.tsx` responde com texto fixo após `setTimeout`.
- **Impacto:** a proposta principal de tutor 24/7 não é entregue; não há histórico, personalização, moderação, limites ou persistência.
- **Recomendação:** criar server function autenticada para chat, persistir `ai_conversations` e `ai_messages`, incluir contexto de nível/objetivo, proteção contra prompt injection, moderação e quotas.

### EDU-01 — Currículo, aulas e progresso não formam um fluxo único

- **Criticidade:** Alto
- **Evidência:** `src/routes/lesson.tsx` é uma aula demo fixa; `src/routes/dashboard.tsx` usa `UNIT_DEFS` local; o banco também contém `courses`, `units`, `lessons`, `exercises`, `progress` e `lesson_progress`.
- **Impacto:** conteúdo publicado, progresso, desbloqueio de níveis, certificados e analytics podem divergir.
- **Recomendação:** definir `courses → units → lessons → exercises → progress` como modelo canônico, eliminar ou migrar estruturas duplicadas e carregar aulas por identificador de rota.

### EDU-02 — Jogos não foram implementados

- **Criticidade:** Alto
- **Evidência:** todos os cards em `src/routes/games.tsx` redirecionam para `/lesson`.
- **Impacto:** gamificação é apenas visual; XP e moedas não refletem atividades reais.
- **Recomendação:** implementar cada modo de jogo com conteúdo parametrizado, sessão, correção server-side, proteção anti-replay e integração com `xp_events`/missões.

### COM-01 — Comunidade promete recursos inexistentes e moderação insuficiente

- **Criticidade:** Alto
- **Evidência:** `src/routes/community.tsx` simula áudio com mensagem textual; moderação no cliente usa lista curta de palavras; não há denúncia, bloqueio, fila de revisão ou armazenamento de mídia.
- **Impacto:** risco elevado especialmente para menores, falsa expectativa de segurança e ausência de governança de conteúdo.
- **Recomendação:** implementar gravação/upload real com Storage, moderação server-side antes da publicação, rate limits, denúncias, bloqueio, retenção, revisão humana e política específica para menores.

### SEC-02 — Proteção de rotas administrativas é inconsistente

- **Criticidade:** Alto
- **Evidência:** `admin`, `analytics` e `audit` dependem da renderização/queries do cliente; as funções e RLS do banco parecem verificar papel administrativo, mas não há guard server-side uniforme de rota.
- **Impacto:** exposição de telas, chamadas desnecessárias e UX inadequada para usuários sem acesso; risco de regressão se uma nova query ignorar RLS.
- **Recomendação:** criar middleware/guard reutilizável para autenticação, papel admin e assinatura; retornar 401/403 antes de renderizar dados.

### SEC-03 — Funções com service role precisam de fronteira de confiança explícita

- **Criticidade:** Alto
- **Evidência:** `src/integrations/supabase/client.server.ts` expõe um cliente que ignora RLS; ele é usado para cache e escrita em recursos de IA.
- **Impacto:** uma futura chamada sem validação adequada pode acessar ou alterar dados de qualquer usuário.
- **Recomendação:** encapsular operações administrativas em módulos estreitos, validar schema/autorização antes de importar o cliente, registrar operações privilegiadas e adicionar testes de autorização.

### INT-01 — Não existe integração real de suporte/e-mail

- **Criticidade:** Alto
- **Evidência:** formulário em `src/routes/contact.tsx` abre `mailto:`.
- **Impacto:** falha em dispositivos sem cliente de e-mail, não gera ticket, não permite SLA ou proteção antispam.
- **Recomendação:** criar endpoint de contato com captcha/rate limit, persistência de ticket e integração com provedor transacional/helpdesk.

### AI-03 — Conteúdo de vídeo e feedback podem ser inferidos, não baseados na mídia real

- **Criticidade:** Alto
- **Evidência:** `src/lib/videos.functions.ts` declara trecho/transcrição simulada; `src/routes/watch.$videoId.tsx` controla progresso artificialmente.
- **Impacto:** respostas pedagógicas potencialmente incorretas, progresso falso e risco de violar expectativas sobre transcrição.
- **Recomendação:** usar transcrições autorizadas e metadados confiáveis; integrar API oficial quando permitido; distinguir claramente conteúdo gerado de conteúdo transcrito.

## Achados médios — P2

### UX-01 — Navegação móvel ausente

- **Criticidade:** Médio
- **Evidência:** a navegação principal em `src/components/site-header.tsx` usa `hidden ... lg:flex` e não há menu alternativo para telas menores.
- **Impacto:** usuários mobile não descobrem ou não alcançam as funcionalidades principais.
- **Recomendação:** criar menu drawer acessível, com foco controlado, fechamento por Escape, links ativos e teste em viewport móvel.

### UX-02 — Estados assíncronos e erros são inconsistentes

- **Criticidade:** Médio
- **Evidência:** múltiplas queries ignoram `error`; telas administrativas carregam dados em efeitos locais sem padrão compartilhado.
- **Impacto:** falhas podem parecer dados vazios ou deixar o usuário sem ação de recuperação.
- **Recomendação:** padronizar loading/empty/error/retry com React Query, error boundaries por rota e mensagens localizadas.

### AUTH-01 — Recuperação de senha não valida contexto de recuperação na rota

- **Criticidade:** Médio
- **Evidência:** `src/routes/reset-password.tsx` chama `supabase.auth.updateUser` diretamente.
- **Impacto:** a página não informa claramente token expirado/ausente nem orienta o usuário a reiniciar o fluxo.
- **Recomendação:** validar sessão de recovery, tratar links expirados e evitar redirecionar para dashboard quando a atualização não tiver contexto válido.

### DATA-01 — Duplicidade de modelos de progresso

- **Criticidade:** Médio
- **Evidência:** coexistem `progress` e `lesson_progress`; o frontend também possui unidades locais.
- **Impacto:** números de dashboard, relatórios, acesso e certificados podem ser inconsistentes.
- **Recomendação:** decidir entidade única de progresso, documentar semântica e escrever migração de consolidação com backfill.

### DATA-02 — Faltam seeds e processo verificável de migrações

- **Criticidade:** Médio
- **Evidência:** há muitas migrações em `supabase/migrations`, mas não há seeds, testes SQL nem documentação de execução.
- **Impacto:** ambientes podem divergir e conteúdo inicial não é reprodutível.
- **Recomendação:** criar seed idempotente para planos, cursos, unidades, missões e configurações; executar migrações do zero em CI.

### OPS-01 — Expiração e operações recorrentes não têm agendamento documentado

- **Criticidade:** Médio
- **Evidência:** existe função `expire_subscriptions`, mas não há worker/cron/configuração operacional no repositório.
- **Impacto:** assinaturas podem permanecer ativas após expirar; relatórios e acessos ficam incorretos.
- **Recomendação:** configurar job agendado no Supabase/infra, alertas de falha e teste idempotente.

### NOT-01 — Notificações não são entregues externamente

- **Criticidade:** Médio
- **Evidência:** há tabela `notifications` e trigger de assinatura, mas não há integração de e-mail, push, preferências ou worker de envio.
- **Impacto:** eventos importantes ficam invisíveis caso o aluno não acesse o painel.
- **Recomendação:** criar preferências, fila/outbox, integração transacional, push web opcional e rastreamento de entrega.

### PERF-01 — Escalabilidade de consultas administrativas e comunidade é limitada

- **Criticidade:** Médio
- **Evidência:** admin carrega listas inteiras e faz junções no cliente; comunidade recarrega até 200 mensagens após cada evento realtime.
- **Impacto:** crescimento de usuários aumenta latência, transferência e custo do banco.
- **Recomendação:** paginação por cursor, views/RPCs administrativos agregados, selects mínimos e atualização realtime incremental.

## Achados baixos — P3

### A11Y-01 — Auditoria formal de acessibilidade ainda não existe

- **Criticidade:** Baixo
- **Impacto:** possíveis problemas de navegação por teclado, foco, contraste, mensagens de erro e leitor de tela.
- **Recomendação:** testar WCAG 2.2 AA, axe/Lighthouse, teclado, zoom 200% e tecnologias assistivas; corrigir componentes customizados.

### DX-01 — Tipagem de domínio é inconsistente

- **Criticidade:** Baixo
- **Evidência:** diversos usos de `any` nas rotas administrativas, dashboard e componentes.
- **Impacto:** regressões de contrato e menor capacidade de manutenção.
- **Recomendação:** derivar tipos das queries/Schemas Zod, criar DTOs por domínio e restringir `any` via lint.

### SEO-01 — Domínio e URLs canônicas estão fixos

- **Criticidade:** Baixo
- **Evidência:** `src/routes/sitemap[.]xml.ts` e diversas rotas usam `coach-speak-bright.lovable.app` diretamente.
- **Impacto:** ambiente de produção com domínio próprio terá canonical/sitemap incorretos.
- **Recomendação:** usar variável de ambiente server-side para URL pública e validar no deploy.

### DOC-01 — Documentação operacional ausente

- **Criticidade:** Baixo
- **Evidência:** `README.md` contém apenas o nome do projeto.
- **Impacto:** onboarding, deploy e resposta a incidentes dependem de conhecimento tácito.
- **Recomendação:** documentar setup, ambientes, variáveis, Supabase, migrações, pagamentos, jobs, rollback e suporte.

## Componentes e telas a desenvolver

- Menu mobile acessível e estado de navegação ativo.
- Catálogo de cursos/aulas alimentado pelo banco e rota dinâmica para aula.
- Motor de exercícios e correção persistida.
- Jogos reais: memória, caça-palavras, drag-and-drop, listening, speed quiz e placar.
- AI Coach funcional: conversa, histórico, contexto, moderação e consumo por plano.
- Centro de notificações, preferências de comunicação e e-mail transacional.
- Central de suporte/tickets.
- Gestão de perfil, consentimento, privacidade e exclusão/exportação de dados.
- Área administrativa para conteúdo, cursos, planos, moderação e reconciliação de pagamentos.
- Fluxo de denúncia/bloqueio e revisão de comunidade.
- Telas 401, 403, 404 e manutenção padronizadas.

## Checklist de produção

### Segurança e conformidade

- [ ] Rotacionar segredos e retirar `.env` do Git/histórico.
- [ ] Implementar secret manager e `.env.example`.
- [ ] Proteger todas as rotas de API com autenticação, validação e rate limiting.
- [ ] Revisar RLS em ambiente limpo com testes por papel.
- [ ] Implementar proteção CSRF/origin para endpoints mutáveis quando aplicável.
- [ ] Adicionar logs estruturados, mascaramento de PII e política de retenção.
- [ ] Formalizar consentimento, privacidade, termos e regras para menores.

### Pagamentos e certificados

- [ ] Selecionar e contratar gateway de pagamentos.
- [ ] Criar sessão/ordem real no gateway.
- [ ] Implementar webhook assinado, idempotente e auditado.
- [ ] Remover confirmação simulada e dados placeholder de produção.
- [ ] Implementar reconciliação, reembolso, cancelamento e falhas de pagamento.
- [ ] Vincular certificados a critérios de conclusão validados no servidor.

### Ensino e IA

- [ ] Migrar conteúdo fixo para o modelo canônico de cursos e aulas.
- [ ] Implementar exercícios, tentativas, correções e progresso confiável.
- [ ] Consolidar `progress`/`lesson_progress`.
- [ ] Implementar jogos reais e premiação validada.
- [ ] Implementar AI Coach e limites por plano.
- [ ] Tornar transcrição/vídeo e feedback pedagógico baseados em fontes confiáveis.
- [ ] Implementar quotas, custo por usuário e observabilidade de IA.

### Comunidade e comunicação

- [ ] Implementar moderação server-side, denúncia e bloqueio.
- [ ] Implementar áudio real ou remover a promessa da interface.
- [ ] Criar fluxo de suporte persistente, e-mail e antispam.
- [ ] Implementar notificações in-app, e-mail e push conforme preferência.

### UX, qualidade e operações

- [ ] Criar navegação mobile e revisar responsividade em todos os breakpoints.
- [ ] Padronizar loading, empty, error e retry.
- [ ] Auditar WCAG 2.2 AA e corrigir acessibilidade.
- [ ] Adicionar testes unitários, integração, E2E e regressão visual.
- [ ] Criar pipeline CI para lint, tipos, build, testes e migrações.
- [ ] Criar seeds idempotentes e teste de banco vazio.
- [ ] Configurar backups, restore testado, cron de expiração e alertas.
- [ ] Configurar monitoramento, rastreamento de erros e métricas de produto.
- [ ] Escrever README, runbook e procedimento de deploy/rollback.

## Plano de implementação recomendado

### Fase 0 — Bloqueio de lançamento

1. Rotacionar segredos e sanar o versionamento de `.env`.
2. Desabilitar checkout/ativação simulada e emissão livre de certificados.
3. Fechar endpoints de IA com autenticação, schemas, limites e logs.
4. Adicionar guards server-side de admin, aluno autenticado e assinatura.

### Fase 1 — Fluxo comercial e de acesso

1. Integrar gateway de pagamento e webhook seguro.
2. Implementar estados de pedido, pagamento, ativação, falha, cancelamento e reembolso.
3. Programar expiração de assinaturas e notificações transacionais.
4. Concluir onboarding com máquina de estados persistida e regras de acesso.

### Fase 2 — Produto educacional funcional

1. Definir modelo canônico de currículo e progresso.
2. Implementar páginas de curso, unidade e aula dinâmicas.
3. Implementar exercícios, exames, avaliações e desbloqueio.
4. Reimplementar certificados com critérios verificáveis.
5. Construir jogos reais e conectar recompensa ao progresso.

### Fase 3 — IA, comunidade e suporte

1. Implementar AI Coach persistente e moderado.
2. Tornar TTS/STT e feedback robustos, medidos e com quota.
3. Implementar comunidade segura, denúncias e moderação humana.
4. Implementar tickets, e-mails e notificações.

### Fase 4 — Qualidade e escala

1. Corrigir navegação mobile, acessibilidade e estados de erro.
2. Adicionar testes e CI/CD.
3. Otimizar consultas, paginação e cache.
4. Configurar observabilidade, backups, incident response e documentação.

## Critério de prontidão para produção

O produto poderá ser considerado pronto para produção somente quando todos os itens P0 estiverem concluídos, os fluxos de pagamento e certificado estiverem testados ponta a ponta, a suíte mínima de testes passar no CI, migrações/seeds forem reproduzíveis e houver monitoramento, backup e responsável operacional definidos.
