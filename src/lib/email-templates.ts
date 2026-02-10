
export const emailStyles = {
  main: `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #000000; /* Pure Black */
    color: #e2e8f0;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  `,
  container: `
    max-width: 600px;
    margin: 40px auto;
    background-color: #0a0a0a; /* Very Dark Gray */
    border-radius: 0px; /* Sharp corners or minimal radius */
    overflow: hidden;
    border: 1px solid #262626; /* Neutral 800 */
  `,
  header: `
    background-color: #0a0a0a;
    padding: 48px 32px 24px 32px;
    text-align: center;
    border-bottom: 1px solid #262626;
  `,
  logo: `
    font-size: 28px;
    font-weight: 800;
    color: white;
    text-decoration: none;
    letter-spacing: -0.5px;
    display: inline-block;
  `,
  title: `
    margin: 0;
    color: white;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.5px;
    margin-top: 16px;
 `,
  content: `
    padding: 40px 32px;
    background-color: #0a0a0a;
    color: #d4d4d4; /* Neutral 300 */
    font-size: 16px;
  `,
  buttonContainer: `
    text-align: center;
    margin: 32px 0;
 `,
  button: `
    display: inline-block;
    background-color: #ffffff; /* White Button */
    color: #000000; /* Black Text */
    padding: 14px 32px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    border: 1px solid #ffffff;
  `,
  footer: `
    padding: 32px;
    text-align: center;
    font-size: 13px;
    color: #737373; /* Neutral 500 */
    border-top: 1px solid #262626;
    background-color: #000000;
  `,
  link: `
    color: #d4d4d4;
    text-decoration: underline;
    text-underline-offset: 4px;
  `,
  subText: `
    font-size: 13px;
    color: #737373;
    margin-top: 24px;
    line-height: 1.5;
 `
}

export const getBaseLayout = (content: string, preheader: string = 'Notification KodaFlow') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${preheader}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body style="${emailStyles.main}">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617;">
    <tr>
      <td align="center" style="padding: 20px;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.content}">
            <!-- Logo Section -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://yhmcvpgffabfqqggddht.supabase.co/storage/v1/object/public/avatars/system/logo.png" alt="KodaFlow" width="48" height="48" style="vertical-align: middle;">
                <span style="font-size: 24px; font-weight: 800; color: white; vertical-align: middle; margin-left: 12px; font-family: 'Inter', sans-serif;">KodaFlow</span>
            </div>

            ${content}
          </div>

          <div style="${emailStyles.footer}">
            <p style="margin: 0 0 16px 0;">© ${new Date().getFullYear()} KodaFlow. Tous droits réservés.</p>
            <p style="margin: 0;">123 Avenue de l'Innovation, 75000 Paris</p>
            
            <div style="margin-top: 24px;">
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">Twitter</a>
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">LinkedIn</a>
              <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">Support</a>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

export const getPasswordResetTemplate = (resetLink: string) => {
  const content = `
    <h1 style="${emailStyles.title} text-align: center;">Réinitialisation de mot de passe 🔒</h1>
    
    <p style="margin-top: 24px;">Bonjour,</p>
    <p>
      Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>KodaFlow</strong>.
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
    </p>
    
    <div style="${emailStyles.buttonContainer}">
      <a href="${resetLink}" style="${emailStyles.button}">Réinitialiser mon mot de passe</a>
    </div>
    
    <p style="${emailStyles.subText}">
      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
      <a href="${resetLink}" style="${emailStyles.link}">${resetLink}</a>
    </p>

    <p style="${emailStyles.subText}">Ce lien expirera dans 24 heures.</p>
  `
  return getBaseLayout(content, 'Réinitialisation de votre mot de passe KodaFlow')
}

export const getWelcomeTemplate = (name: string, onboardingLink: string) => {
  const content = `
    <div style="text-align: center;">
      <h1 style="${emailStyles.title}">Bienvenue sur KodaFlow ! 🚀</h1>
    </div>
    
    <p style="margin-top: 24px;">Bonjour ${name || 'Entrepreneur'},</p>
    <p>
      Nous sommes ravis de vous compter parmi nous. KodaFlow a été conçu pour vous aider à piloter votre activité de freelance comme un pro, sans la complexité.
    </p>

    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
      <p style="margin: 0; font-weight: 600; color: white;">Prochaines étapes :</p>
      <ul style="padding-left: 20px; margin-top: 12px; color: #cbd5e1;">
        <li style="margin-bottom: 8px;">Complétez votre profil</li>
        <li style="margin-bottom: 8px;">Configurez votre facturation</li>
        <li>Créez votre premier client</li>
      </ul>
    </div>
    
    <div style="${emailStyles.buttonContainer}">
      <a href="${onboardingLink}" style="${emailStyles.button}">Commencer l'aventure</a>
    </div>
  `
  return getBaseLayout(content, 'Bienvenue parmi nous !')
}

export const getConfirmationTemplate = (confirmationLink: string) => {
  const content = `
       <h1 style="${emailStyles.title} text-align: center;">Confirmez votre email 📧</h1>
       
       <p style="margin-top: 24px;">Bonjour,</p>
       <p>
         Merci de vous être inscrit sur <strong>KodaFlow</strong>. Pour activer votre compte et commencer à utiliser la plateforme, veuillez confirmer votre adresse email.
       </p>
       
       <div style="${emailStyles.buttonContainer}">
         <a href="${confirmationLink}" style="${emailStyles.button}">Confirmer mon email</a>
       </div>
       
       <p style="${emailStyles.subText}">
         Si le bouton ne fonctionne pas, copiez et collez ce lien :<br/>
         <a href="${confirmationLink}" style="${emailStyles.link}">${confirmationLink}</a>
       </p>
     `
  return getBaseLayout(content, 'Confirmez votre adresse email KodaFlow')
}
