package repositories

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/models"
)

func seedOMDBCacheTestDB(t *testing.T) OMDBCacheRepository {
	db := setupRepoTestDB(t)
	return NewOMDBCacheRepository(db)
}

func TestOMDBCacheRepository_UpsertAndGet(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	cache := &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins","year":"2005"}`,
		IsFull: true,
	}

	err := repo.Upsert(ctx, cache)
	require.NoError(t, err)

	found, err := repo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Batman Begins", found.Title)
	assert.True(t, found.IsFull)
	assert.Equal(t, `{"title":"Batman Begins","year":"2005"}`, found.Data)
}

func TestOMDBCacheRepository_GetByIMDbID_NotFound(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	found, err := repo.GetByIMDbID(ctx, "tt9999999")
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestOMDBCacheRepository_Upsert_UpdatesExisting(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	err := repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins"}`,
		IsFull: false,
	})
	require.NoError(t, err)

	err = repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins Updated",
		Data:   `{"title":"Batman Begins Updated","year":"2005"}`,
		IsFull: true,
	})
	require.NoError(t, err)

	found, err := repo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Batman Begins Updated", found.Title)
	assert.True(t, found.IsFull)
}

func TestOMDBCacheRepository_SearchByTitle(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	require.NoError(t, repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins"}`,
		IsFull: true,
	}))
	require.NoError(t, repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0468569",
		Title:  "The Dark Knight",
		Data:   `{"title":"The Dark Knight"}`,
		IsFull: true,
	}))
	require.NoError(t, repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt1345836",
		Title:  "The Dark Knight Rises",
		Data:   `{"title":"The Dark Knight Rises"}`,
		IsFull: true,
	}))

	results, err := repo.SearchByTitle(ctx, "knight", 10)
	require.NoError(t, err)
	assert.Len(t, results, 2)

	results, err = repo.SearchByTitle(ctx, "batman", 10)
	require.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "Batman Begins", results[0].Title)
}

func TestOMDBCacheRepository_SearchByTitle_CaseInsensitive(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	require.NoError(t, repo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins"}`,
		IsFull: true,
	}))

	results, err := repo.SearchByTitle(ctx, "BATMAN", 10)
	require.NoError(t, err)
	assert.Len(t, results, 1)
}

func TestOMDBCacheRepository_SearchByTitle_Limit(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		require.NoError(t, repo.Upsert(ctx, &models.OMDBCache{
			IMDbID: "tt000000" + string(rune('1'+i)),
			Title:  "Test Movie",
			Data:   `{"title":"Test Movie"}`,
			IsFull: true,
		}))
	}

	results, err := repo.SearchByTitle(ctx, "Test", 3)
	require.NoError(t, err)
	assert.Len(t, results, 3)
}

func TestOMDBCacheRepository_SearchByTitle_NoMatch(t *testing.T) {
	repo := seedOMDBCacheTestDB(t)
	ctx := context.Background()

	results, err := repo.SearchByTitle(ctx, "zzzz", 10)
	require.NoError(t, err)
	assert.Empty(t, results)
}
