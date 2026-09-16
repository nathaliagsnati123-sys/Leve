// Utilitário central de requisições seguras para prevenir erros de parsing HTML/JSON
export async function safeParseResponse<T = any>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? undefined : 'Não foi possível conectar ao servidor.'
      };
    }

    const trimmed = text.trim();
    // Se a resposta for uma página HTML (404, 502, proxy, "The page cannot be found")
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro.'
      };
    }

    const data = JSON.parse(trimmed) as T;
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: (data as any)?.error
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: 'Não encontramos uma conta com esse e-mail. Para acessar o LEVE, realize sua compra primeiro.'
    };
  }
}
