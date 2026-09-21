// Utilitários de tradução e tratamento de erros de autenticação - LEVE

/**
 * Verifica se a mensagem de erro é estritamente sobre e-mail pendente de confirmação.
 * NUNCA deve retornar true para erros de senha, credenciais ou digitação ("verifique seus dados").
 */
export function isEmailConfirmationIssue(errorMsg?: string | null): boolean {
  if (!errorMsg) return false;
  const lower = errorMsg.toLowerCase().trim();

  // Exclusão estrita: se mencionar senha, credenciais, digitação de dados, compras, tokens ou JSON, NUNCA é erro de confirmação
  if (
    lower.includes('senha') ||
    lower.includes('password') ||
    lower.includes('credencia') ||
    lower.includes('invalid credentials') ||
    lower.includes('incorret') ||
    lower.includes('verifique seus dados') ||
    lower.includes('não encontramos') ||
    lower.includes('realize sua compra') ||
    lower.includes('compra primeiro') ||
    lower.includes('token') ||
    lower.includes('json') ||
    lower.includes('the page') ||
    lower.includes('syntaxerror')
  ) {
    return false;
  }

  return (
    lower.includes('email not confirmed') ||
    lower.includes('e-mail ainda não foi confirmado') ||
    lower.includes('não confirmado') ||
    lower.includes('pendente de confirmação') ||
    lower.includes('confirmar seu e-mail') ||
    lower.includes('confirmação de e-mail') ||
    lower.includes('link de confirmação')
  );
}

/**
 * Traduz mensagens de erro comuns de autenticação (Supabase Auth, rede, validações)
 * para português claro, amigável e acolhedor.
 */
export function translateAuthError(errorMsg?: string | null): string {
  if (!errorMsg) return 'Ocorreu um erro. Por favor, tente novamente.';

  const lower = errorMsg.toLowerCase().trim();

  // 1. Mensagens explícitas de código de acesso, ativação ou compras: preservar clareza e precisão
  if (
    lower.includes('código de acesso não confere') ||
    lower.includes('código de acesso inválido') ||
    lower.includes('código não encontrado') ||
    lower.includes('código não confere') ||
    lower.includes('código já foi utilizado') ||
    lower.includes('já foi utilizado') ||
    lower.includes('foi revogado') ||
    lower.includes('código de acesso') ||
    lower.includes('código informado')
  ) {
    return errorMsg;
  }

  // 2. Credenciais / login incorretos
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

  // Usuário não encontrado / sem conta
  if (
    lower.includes('não encontramos uma conta') ||
    lower.includes('user not found') ||
    lower.includes('user_not_found')
  ) {
    return 'Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro.';
  }

  // Erros técnicos inesperados de rede ou resposta
  if (
    lower.includes('não é um json') ||
    lower.includes('is not valid json') ||
    lower.includes('unexpected token') ||
    lower.includes('syntaxerror') ||
    lower.includes('<!doctype') ||
    lower.includes('json.parse')
  ) {
    return 'Houve uma instabilidade temporária na resposta do servidor. Por favor, tente novamente em alguns instantes.';
  }

  if (
    lower.includes('page cannot be found') ||
    lower.includes('page could not be found') ||
    lower.includes('status 404')
  ) {
    return 'Serviço temporariamente indisponível. Por favor, tente novamente.';
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

  // Configuração ou credenciais
  if (lower.includes('chave pública anônima') || lower.includes('chave não detectada') || lower.includes('supabase ainda não foi configurada') || lower.includes('invalid api key') || lower.includes('double check your api key')) {
    return 'E-mail ou senha incorretos. Caso seja seu primeiro acesso, clique em Criar Conta.';
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
