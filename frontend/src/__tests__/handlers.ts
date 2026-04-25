import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080/v1'

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
          tmdbId: 550,
          type: 'movie',
          title: 'Fight Club',
          overview: 'A great movie',
          posterPath: '/poster.jpg',
          releaseDate: '1999-10-15',
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
        tmdbId: 550,
        type: 'movie',
        title: 'Fight Club',
        overview: 'A great movie',
        posterPath: '/poster.jpg',
        releaseDate: '1999-10-15',
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
        tmdbId: body.tmdbId,
        type: body.type,
        title: body.title,
        overview: body.overview,
        posterPath: body.posterPath,
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
        tmdbId: 550,
        type: 'movie',
        title: 'Fight Club',
        status: body.status ?? 'planning',
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
          producer: 'Giacomo',
          type: 'red',
          vintage: 2018,
          cost: 45.50,
          currency: 'AUD',
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
        producer: 'Giacomo',
        type: 'red',
        vintage: 2018,
        cost: 45.50,
        currency: 'AUD',
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
        currency: 'AUD',
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

export const tmdbHandlers = [
  http.get(`${BASE}/instances/:instanceId/tmdb/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    return HttpResponse.json({
      data: {
        page: 1,
        results: [
          { id: 1, title: q ?? 'Test', media_type: 'movie', vote_average: 7.5 },
        ],
        total_results: 1,
        total_pages: 1,
      },
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/tmdb/movie/:tmdbId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: Number(params.tmdbId),
        title: 'Fight Club',
        overview: 'A great movie',
        poster_path: '/poster.jpg',
        release_date: '1999-10-15',
        runtime: 139,
        vote_average: 8.4,
        genres: [{ id: 18, name: 'Drama' }],
      },
      error: null,
    })
  }),
  http.get(`${BASE}/instances/:instanceId/tmdb/tv/:tmdbId`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: Number(params.tmdbId),
        name: 'Breaking Bad',
        overview: 'A great show',
        poster_path: '/poster.jpg',
        first_air_date: '2008-01-20',
        number_of_episodes: 62,
        number_of_seasons: 5,
        vote_average: 9.5,
        genres: [{ id: 18, name: 'Drama' }],
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

export const allHandlers = [
  ...authHandlers,
  ...instanceHandlers,
  ...mediaHandlers,
  ...recipeHandlers,
  ...wineHandlers,
  ...chatHandlers,
  ...tmdbHandlers,
  ...aiHandlers,
]
