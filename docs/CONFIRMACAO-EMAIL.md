# Confirmação de e-mail por código

Restaurada em 12/11/2026, substituindo o fluxo de SMS, que foi removido. A configuração remota e a entrega real ainda não foram verificadas.

O cadastro usa `signUp` com senha e aceite. Sem sessão, encaminha para a página independente `/confirmar-email`. `verifyOtp` com `type: "email"` precisa devolver uma sessão antes de abrir `/nova`. O reenvio usa `resend` com `type: "signup"`, com espera local de 60 segundos além dos limites do provedor. Apenas o e-mail e o prazo de reenvio ficam em sessionStorage para permitir atualizar a tela; senha e código não são persistidos. Se o armazenamento estiver bloqueado, o usuário pode informar o e-mail manualmente. O login também oferece acesso à página de confirmação.

## Configuração no painel

1. No projeto `lzapufofepqbvqgzsqwg`, em Authentication → Sign In / Providers → Email, habilite **Confirm email**. Mantenha o provedor Email e os cadastros habilitados.
2. Em Authentication → Email → Templates → Confirm signup, use o assunto `Confirme seu e-mail no Português+` e o conteúdo abaixo. A variável `{{ .Token }}` fornece o código; não coloque um código fixo.

```html
<h2>Confirme seu e-mail</h2>
<p>Digite este código na página de cadastro do Português+:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Se você não solicitou este cadastro, ignore esta mensagem.</p>
```

3. Confira o SMTP e remetente. A tentativa anterior registrou SMTP 535: credenciais recusadas. O código do site não resolve a configuração do remetente no painel.
4. Cadastre um endereço de teste que você controla. Confira a entrega, a confirmação pelo código e o login com a senha. Teste código incorreto, expirado e reenvio. Nunca compartilhe senhas de app nem códigos de confirmação no chat.

As contas já confirmadas não precisam de nova confirmação. A recuperação de senha continua com seu próprio template e link; não substitua o template de recuperação pelo de cadastro.

Referências: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/reference/javascript/auth-verifyotp

## Continuação pela dupla

- Rode `npm ci`, `npm test` e `npm run build`. Configure seu `.env` local conforme `.env.example`; credenciais não são enviadas ao Git.
- Confira **Confirm email** habilitado e o template **Confirm signup** com `{{ .Token }}`. O site interrompe novos cadastros se a confirmação remota estiver desabilitada.
- O envio é feito pelo Supabase usando o SMTP configurado no painel. O projeto não envia diretamente pelo Gmail. Confira a conta remetente e a senha de app do Gmail usadas no SMTP; não use a senha normal da conta nem coloque credenciais em arquivos versionados.
- O erro observado anteriormente foi SMTP 535 (credenciais recusadas). Consulte os logs de Auth após uma única tentativa de cadastro/reenvio e confira o erro atual antes de alterar a configuração.
- Teste `/cadastro` → `/confirmar-email`, recebimento do código, confirmação e login. Confira também código expirado, reenvio e atualização da página. Não é necessário contratar Twilio ou configurar telefone.
- A recuperação de senha permanece em `/recuperar`, separada do código de cadastro. Não substitua o template de recuperação pelo template de confirmação.
