package dto

import "time"

type CreateEventRequest struct {
	Name            string     `json:"name" binding:"required"`
	Description     string     `json:"description"`
	DurationMinutes int        `json:"duration_minutes" binding:"required,min=1"`
	EventType       string     `json:"event_type" binding:"required,oneof=EVENT MOVIE"`
	Director        *string    `json:"director"`
	AgeRating       *string    `json:"age_rating"`
	ReleaseDate     *time.Time `json:"release_date"`
	Language        *string    `json:"language"`
}

type UpdateEventRequest struct {
	Name            string     `json:"name" binding:"required"`
	Description     string     `json:"description"`
	DurationMinutes int        `json:"duration_minutes" binding:"required,min=1"`
	EventType       string     `json:"event_type" binding:"required,oneof=EVENT MOVIE"`
	Director        *string    `json:"director"`
	AgeRating       *string    `json:"age_rating"`
	ReleaseDate     *time.Time `json:"release_date"`
	Language        *string    `json:"language"`
}

type ListEventsQuery struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	PageSize int    `form:"page_size,default=20" binding:"min=1,max=100"`
	Type     string `form:"type" binding:"omitempty,oneof=EVENT MOVIE"`
	Search   string `form:"search"`
}
