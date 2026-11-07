# Recuperação de senha

A recuperação usa o link do Supabase, enviado somente quando a pessoa solicita. A confirmação de e-mail no cadastro pode continuar desligada. Não há redefinição de senha pelo simples conhecimento de um endereço de e-mail.

## Código preparado

- `EMAIL_RECOVERY_ENABLED=true` habilita o formulário de solicitação; o ambiente local está habilitado.
- O formulário usa `resetPasswordForEmail` com retorno para `/recuperar?reset=1` na mesma origem.
- O evento `PASSWORD_RECOVERY` prepara a tela de nova senha; a troca exige uma sessão válida e confirmação da senha.
- Após a troca, a sessão local é encerrada e a pessoa volta ao login.
- O pedido usa resposta genérica, sem afirmar se uma conta existe. Reenvios recebem espera local de 60 segundos, além dos limites do Supabase.
- O site trata erros de envio sem afirmar que um e-mail foi entregue.

## Configuração no Supabase

1. Em Authentication → URL Configuration, use `http://localhost:3000` em Site URL para o teste local.
2. Adicione `http://localhost:3000/recuperar?reset=1` em Redirect URLs. Se usar `127.0.0.1`, adicione a origem correspondente e abra o site sempre pelo mesmo endereço durante o teste.
3. Em Authentication → Emails → Reset password, mantenha o link baseado em `{{ .ConfirmationURL }}`. Exemplo de conteúdo:

```html
<h2>Redefinir sua senha</h2>
<p>Recebemos uma solicitação para alterar a senha da sua conta Português+.</p>
<p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>
<p>Se você não solicitou essa alteração, ignore esta mensagem.</p>
```

4. Mantenha o SMTP configurado com o remetente e a senha de app que foram validados. O teste de autenticação Gmail com resposta 235 não certifica a configuração salva no Supabase nem a entrega.
5. Não é necessário reativar Confirm email para recuperar senhas. O cadastro permanece sem confirmação conforme solicitado.

## Teste real

Abra `/recuperar`, informe o endereço de uma conta cadastrada e solicite o link uma vez. Confira entrada e spam do destinatário. Abra o link mais recente, digite uma senha nova e a confirmação. Confira o retorno ao login e entre usando a nova senha. Um link inválido ou expirado deve oferecer uma nova solicitação.

Se o envio falhar, confira o registro `/recover` em Logs → Auth no horário do teste. O erro SMTP 535 significa que as credenciais salvas no provedor foram recusadas; o código local não corrige essas credenciais. Não compartilhe senhas, links de recuperação ou tokens nos logs enviados para suporte.

Na hospedagem final, configure `EMAIL_RECOVERY_ENABLED=true`, Site URL e Redirect URLs com o domínio HTTPS final. A entrega real pelo provedor e o retorno do link precisam de validação antes da divulgação.

Referências: https://supabase.com/docs/guides/auth/passwords e https://supabase.com/docs/guides/auth/redirect-urls
