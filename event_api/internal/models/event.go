package models

import (
	"event_service/internal/dto"
	"time"
)

type EventType string

const (
	EventTypeEvent EventType = "EVENT"
	EventTypeMovie EventType = "MOVIE"
)

type Event struct {
	Base

	Name            string    `gorm:"type:text;not null"`
	Description     string    `gorm:"type:text"`
	DurationMinutes int       `gorm:"not null"`
	EventType       EventType `gorm:"type:varchar(20);not null;default:EVENT"`

	Director    *string    `gorm:"type:text"`
	AgeRating   *string    `gorm:"type:varchar(20)"`
	ReleaseDate *time.Time `gorm:"type:timestamptz"`
	Language    *string    `gorm:"type:varchar(50)"`
}

func (e *Event) ToDTO() *dto.EventResponse {
	return &dto.EventResponse{
		ID:              e.ID.String(),
		Name:            e.Name,
		Description:     e.Description,
		DurationMinutes: e.DurationMinutes,
		EventType:       string(e.EventType),
		Director:        e.Director,
		AgeRating:       e.AgeRating,
		ReleaseDate:     e.ReleaseDate,
		Language:        e.Language,
		CreatedAt:       e.CreatedAt,
		UpdatedAt:       e.UpdatedAt,
	}
}
