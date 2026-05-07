package models

import "time"

// OMDBCache stores cached OMDb API responses keyed by IMDb ID.
type OMDBCache struct {
	IMDbID    string    `gorm:"column:imdb_id;size:32;primaryKey" json:"imdbId"`
	Title     string    `gorm:"size:500;not null" json:"title"`
	Data      string    `gorm:"type:text;not null" json:"-"`
	IsFull    bool      `gorm:"column:is_full;not null;default:false" json:"isFull"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName specifies the table name
func (OMDBCache) TableName() string {
	return "omdb_cache"
}
