import { http, HttpResponse } from 'msw'

const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1`

export const authHandlers = [
  http.post(`${BASE}/auth/clerk-sync`, async () => {
    return HttpResponse.json({
      data: {
        id: 'user-1',
        clerkId: 'clerk-1',
        email: 'test@test.com',
        name: 'Test User',
        avatarUrl: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      data: {
        id: 'user-1',
        clerkId: 'clerk-1',
        email: 'test@test.com',
        name: 'Test User',
        avatarUrl: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
]

export const instanceHandlers = [
  http.get(`${BASE}/instances`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'inst-1',
          name: 'Test Instance',
          ownerId: 'user-1',
          isPublic: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.instanceId,
        name: 'Test Instance',
        ownerId: 'user-1',
        isPublic: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          { id: 'user-1', name: 'Test User', email: 'test@test.com', avatarUrl: '' },
        ],
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances`, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      data: {
        id: 'inst-new',
        name: body.name,
        ownerId: 'user-1',
        isPublic: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.post(`${BASE}/instances/:instanceId/join`, () => {
    return HttpResponse.json({ message: 'joined successfully' })
  }),
  http.post(`${BASE}/instances/:instanceId/leave`, () => {
    return HttpResponse.json({ message: 'left instance' })
  }),
]

export const mediaHandlers = [
  http.get(`${BASE}/instances/:instanceId/media`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'media-1',
          instanceId: 'inst-1',
          omdbId: 'tt0137523',
          type: 'movie',
          title: 'Fight Club',
          overview: 'A great movie',
          releaseYear: '1999',
          planToWatchDate: null,
          status: 'planning',
          rating: null,
          review: '',
          createdById: 'user-1',
          updatedById: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/media/:mediaId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.mediaId,
        instanceId: 'inst-1',
        omdbId: 'tt0137523',
        type: 'movie',
        title: 'Fight Club',
        overview: 'A great movie',
        releaseYear: '1999',
        planToWatchDate: null,
        status: 'planning',
        rating: null,
        review: '',
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/media`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'media-new',
        instanceId: 'inst-1',
        omdbId: body.omdbId,
        type: body.type,
        title: body.title,
        overview: body.overview,
        releaseYear: body.releaseYear,
        planToWatchDate: null,
        status: 'planning',
        rating: null,
        review: '',
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.patch(`${BASE}/instances/:instanceId/media/:mediaId`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'media-1',
        instanceId: 'inst-1',
        omdbId: 'tt0137523',
        type: 'movie',
        title: 'Fight Club',
        overview: 'A great movie',
        releaseYear: '1999',
        status: body.status ?? 'planning',
        planToWatchDate: body.planToWatchDate ?? null,
        rating: body.rating ?? null,
        review: body.review ?? '',
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.delete(`${BASE}/instances/:instanceId/media/:mediaId`, () => {
    return HttpResponse.json({ data: null, error: null })
  }),
]

export const recipeHandlers = [
  http.get(`${BASE}/instances/:instanceId/recipes`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'recipe-1',
          instanceId: 'inst-1',
          title: 'Test Recipe',
          description: 'A test',
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          imageUrl: '',
          rating: null,
          review: '',
          createdById: 'user-1',
          updatedById: 'user-1',
          tags: [{ id: 'tag-1', name: 'dinner' }],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/recipes/:recipeId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.recipeId,
        instanceId: 'inst-1',
        title: 'Test Recipe',
        description: 'A test recipe',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        imageUrl: '',
        rating: null,
        review: '',
        createdById: 'user-1',
        updatedById: 'user-1',
        ingredients: [
          { id: 'ing-1', recipeId: params.recipeId, name: 'Flour', quantity: '2', unit: 'cups', optional: false },
        ],
        steps: [
          { id: 'step-1', recipeId: params.recipeId, orderIndex: 1, title: '', content: 'Mix ingredients', durationMin: null },
        ],
        tags: [{ id: 'tag-1', name: 'dinner' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/recipes/generate`, async ({ request }) => {
    const body = await request.json() as { prompt?: string }
    return HttpResponse.json({
      data: {
        title: 'Lemon Pasta',
        description: body.prompt ? 'A bright weeknight pasta.' : '',
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        ingredients: [
          { name: 'spaghetti', quantity: '200', unit: 'g', optional: false },
          { name: 'lemon', quantity: '1', unit: '', optional: false },
        ],
        steps: [
          { content: 'Boil pasta until al dente.', durationMin: 10 },
          { content: 'Toss with lemon and olive oil.', durationMin: 5 },
        ],
        tags: ['pasta', 'quick'],
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/recipes`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'recipe-new',
        instanceId: 'inst-1',
        title: body.title,
        description: body.description ?? '',
        prepTime: body.prepTime ?? 0,
        cookTime: body.cookTime ?? 0,
        servings: body.servings ?? 0,
        imageUrl: '',
        rating: null,
        review: '',
        createdById: 'user-1',
        updatedById: 'user-1',
        ingredients: [],
        steps: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.delete(`${BASE}/instances/:instanceId/recipes/:recipeId`, () => {
    return HttpResponse.json({ data: null, error: null })
  }),
]

export const wineHandlers = [
  http.get(`${BASE}/instances/:instanceId/wines`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'wine-1',
          instanceId: 'inst-1',
          name: 'Barolo',
          type: 'red',
          cost: 45.50,
          rating: 4.5,
          notes: 'Great wine',
          consumedAt: null,
          createdById: 'user-1',
          updatedById: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/wines/:wineId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.wineId,
        instanceId: 'inst-1',
        name: 'Barolo',
        type: 'red',
        cost: 45.50,
        rating: 4.5,
        notes: 'Great wine',
        consumedAt: null,
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/wines`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'wine-new',
        instanceId: 'inst-1',
        name: body.name,
        type: body.type,
        rating: null,
        notes: '',
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.delete(`${BASE}/instances/:instanceId/wines/:wineId`, () => {
    return HttpResponse.json({ message: 'wine deleted' })
  }),
]

export const chatHandlers = [
  http.get(`${BASE}/instances/:instanceId/chat/sessions`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'session-1',
          instanceId: 'inst-1',
          userId: 'user-1',
          title: 'Test Chat',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/chat/sessions`, async ({ request }) => {
    const body = await request.json() as { title?: string }
    return HttpResponse.json({
      data: {
        id: 'session-new',
        instanceId: 'inst-1',
        userId: 'user-1',
        title: body.title ?? 'New Chat',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.post(`${BASE}/instances/:instanceId/chat/sessions/:sessionId/messages`, () => {
    return HttpResponse.json({
      data: {
        id: 'msg-new',
        sessionId: 'session-1',
        role: 'assistant',
        content: 'Here is a recipe suggestion',
        createdAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.post(`${BASE}/instances/:instanceId/chat/generate-recipe`, () => {
    return HttpResponse.json({
      data: {
        id: 'gen-1',
        choices: [{ message: { role: 'assistant', content: '{"title":"Pasta"}' } }],
      },
      error: null,
    })
  }),
  http.delete(`${BASE}/instances/:instanceId/chat/sessions/:sessionId`, () => {
    return HttpResponse.json({ data: null, error: null })
  }),
]

export const memberMessageHandlers = [
  http.get(`${BASE}/instances/:instanceId/messages`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'member-msg-1',
          instanceId: 'inst-1',
          userId: 'user-1',
          content: 'Dinner is at 7',
          createdAt: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            clerkId: 'clerk-1',
            email: 'test@test.com',
            name: 'Test User',
            avatarUrl: '',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      ],
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/messages`, async ({ request }) => {
    const body = await request.json() as { content: string }
    return HttpResponse.json({
      data: {
        id: 'member-msg-new',
        instanceId: 'inst-1',
        userId: 'user-1',
        content: body.content,
        createdAt: '2024-01-01T00:01:00Z',
        user: {
          id: 'user-1',
          clerkId: 'clerk-1',
          email: 'test@test.com',
          name: 'Test User',
          avatarUrl: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
      error: null,
    }, { status: 201 })
  }),
]

export const omdbHandlers = [
  http.get(`${BASE}/instances/:instanceId/omdb/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    return HttpResponse.json({
      data: {
        page: 1,
        results: [
          { omdbId: 'tt0137523', title: q ?? 'Test', type: 'movie', releaseYear: '1999' },
        ],
        totalResults: 1,
      },
      error: null,
    })
  }),
]

export const aiHandlers = [
  http.post(`${BASE}/instances/:instanceId/ai/chat`, () => {
    return HttpResponse.json({
      data: {
        id: 'chatcmpl-test',
        choices: [{ message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }],
      },
      error: null,
    })
  }),
]

export const nightHandlers = [
  http.get(`${BASE}/instances/:instanceId/nights`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'night-1',
          instanceId: 'inst-1',
          name: 'Barolo & Bolognese Night',
          wineId: 'wine-1',
          recipeId: 'recipe-1',
          mediaId: null,
          createdById: 'user-1',
          updatedById: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          wine: { id: 'wine-1', name: 'Barolo', type: 'red' },
          recipe: { id: 'recipe-1', title: 'Bolognese' },
        },
      ],
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/nights/:nightId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.nightId,
        instanceId: 'inst-1',
        name: 'Barolo & Bolognese Night',
        wineId: 'wine-1',
        recipeId: 'recipe-1',
        mediaId: null,
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        wine: { id: 'wine-1', name: 'Barolo', type: 'red' },
        recipe: { id: 'recipe-1', title: 'Bolognese' },
      },
      error: null,
    })
  }),
  http.post(`${BASE}/instances/:instanceId/nights`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'night-new',
        instanceId: 'inst-1',
        name: body.name ?? 'New Night',
        wineId: (body.wineId as string) ?? null,
        recipeId: (body.recipeId as string) ?? null,
        mediaId: (body.mediaId as string) ?? null,
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    }, { status: 201 })
  }),
  http.patch(`${BASE}/instances/:instanceId/nights/:nightId`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: {
        id: 'night-1',
        instanceId: 'inst-1',
        name: (body.name as string) ?? 'Barolo & Bolognese Night',
        wineId: body.clearWine ? null : ((body.wineId as string) ?? 'wine-1'),
        recipeId: body.clearRecipe ? null : ((body.recipeId as string) ?? 'recipe-1'),
        mediaId: body.clearMedia ? null : ((body.mediaId as string) ?? null),
        createdById: 'user-1',
        updatedById: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })
  }),
  http.delete(`${BASE}/instances/:instanceId/nights/:nightId`, () => {
    return HttpResponse.json({ data: null, error: null })
  }),
]

export const allHandlers = [
  ...authHandlers,
  ...instanceHandlers,
  ...mediaHandlers,
  ...recipeHandlers,
  ...wineHandlers,
  ...nightHandlers,
  ...memberMessageHandlers,
  ...chatHandlers,
  ...omdbHandlers,
  ...aiHandlers,
]
