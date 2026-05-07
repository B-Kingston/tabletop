export const instancesKeys = {
  all: ['instances'] as const,
  detail: (id: string) => ['instances', id] as const,
}

export const recipesKeys = {
  all: (instanceId: string) => ['recipes', instanceId] as const,
  list: (instanceId: string, tag?: string) =>
    tag ? (['recipes', instanceId, tag] as const) : (['recipes', instanceId] as const),
  detail: (instanceId: string, id: string) => ['recipes', instanceId, id] as const,
}

export const winesKeys = {
  all: (instanceId: string) => ['wines', instanceId] as const,
  list: (instanceId: string, type?: string) =>
    type ? (['wines', instanceId, type] as const) : (['wines', instanceId] as const),
  detail: (instanceId: string, id: string) => ['wines', instanceId, id] as const,
}

export const mediaKeys = {
  all: (instanceId: string) => ['media', instanceId] as const,
  list: (instanceId: string, status?: string, type?: string) => {
    if (status && type) return ['media', instanceId, status, type] as const
    if (status) return ['media', instanceId, status] as const
    if (type) return ['media', instanceId, undefined, type] as const
    return ['media', instanceId] as const
  },
  detail: (instanceId: string, id: string) => ['media', instanceId, id] as const,
}

export const nightsKeys = {
  all: (instanceId: string) => ['nights', instanceId] as const,
  list: (instanceId: string) => ['nights', instanceId] as const,
  detail: (instanceId: string, id: string) => ['nights', instanceId, id] as const,
}

export const chatSessionsKeys = {
  all: (instanceId: string) => ['chat-sessions', instanceId] as const,
  list: (instanceId: string) => ['chat-sessions', instanceId] as const,
  detail: (instanceId: string, id: string) => ['chat-sessions', instanceId, id] as const,
}

export const memberMessagesKeys = {
  all: (instanceId: string) => ['member-messages', instanceId] as const,
  list: (instanceId: string) => ['member-messages', instanceId] as const,
}

export const omdbKeys = {
  search: (instanceId: string, query: string, page: number, type?: string) =>
    type
      ? (['omdb-search', instanceId, query, page, type] as const)
      : (['omdb-search', instanceId, query, page] as const),
  detail: (instanceId: string, omdbId: string) =>
    ['omdb-detail', instanceId, omdbId] as const,
}
