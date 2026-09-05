/**
 * Traduz mensagens de erro comuns de autenticação (Supabase Auth, rede, validações)
 * para português claro, amigável e acolhedor.
 */
export function translateAuthError(errorMsg?: string | null): string {
  if (!errorMsg) return 'Ocorreu um erro. Por favor, tente novamente.';

  const lower = errorMsg.toLowerCase().trim();

  // Credenciais / login
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente.';
  }

  // Usuário já cadastrado
  if (
    lower.includes('user already registered') || 
    lower.includes('user already exists') ||
    lower.includes('already been registered') ||
    lower.includes('email already registered') ||
    lower.includes('already registered')
  ) {
    return 'Já existe uma conta cadastrada com este e-mail. Você pode entrar ou usar a opção "Esqueci a senha".';
  }

  // Cadastro desativado ou não permitido
  if (lower.includes('signup is disabled') || lower.includes('signups not allowed') || lower.includes('signups are disabled')) {
    return 'Novos cadastros estão temporariamente indisponíveis. Tente novamente mais tarde.';
  }

  // Confirmação de e-mail
  if (lower.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (ou spam) para ativar a conta.';
  }

  // Senha fraca / curta
  if (
    lower.includes('password should be at least') || 
    lower.includes('password is too short') ||
    lower.includes('at least 6 characters')
  ) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }

  if (lower.includes('signup requires a valid password') || lower.includes('requires a valid password')) {
    return 'Por favor, crie uma senha válida com pelo menos 6 caracteres.';
  }

  // E-mail inválido
  if (
    lower.includes('unable to validate email address') || 
    lower.includes('invalid format') ||
    lower.includes('email address is invalid') ||
    lower.includes('valid email')
  ) {
    return 'Por favor, informe um endereço de e-mail válido.';
  }

  // Limite de taxa / segurança
  if (
    lower.includes('rate limit exceeded') || 
    lower.includes('over email send rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.';
  }

  if (lower.includes('once every 60 seconds') || lower.includes('60 seconds')) {
    return 'Por segurança, você só pode solicitar isso uma vez a cada 60 segundos. Aguarde um instante.';
  }

  // Usuário não encontrado
  if (lower.includes('user not found')) {
    return 'Nenhuma conta encontrada com este e-mail. Que tal criar uma nova conta?';
  }

  // Erro de rede / servidor
  if (
    lower.includes('failed to fetch') || 
    lower.includes('networkerror') || 
    lower.includes('network request failed') ||
    lower.includes('fetch failed')
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  }

  // Tokens / Sessão
  if (lower.includes('token has expired') || lower.includes('token is invalid') || lower.includes('jwt expired')) {
    return 'O link ou código expirou. Por favor, solicite um novo link.';
  }

  if (lower.includes('session missing') || lower.includes('auth session missing')) {
    return 'Sua sessão expirou. Por favor, entre novamente com seu e-mail e senha.';
  }

  // Chave pública
  if (lower.includes('chave pública anônima do supabase') || lower.includes('supabase ainda não foi configurada')) {
    return 'A chave de acesso da nuvem ainda não foi configurada.';
  }

  // Fallback se a mensagem já estiver em português
  if (
    lower.includes('por favor') || 
    lower.includes('senha') || 
    lower.includes('conta') || 
    lower.includes('não foi possível') || 
    lower.includes('erro ao')
  ) {
    return errorMsg;
  }

  return errorMsg;
}
