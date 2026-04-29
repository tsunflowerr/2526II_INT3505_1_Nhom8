package dto

import "time"

type EventResponse struct {
	ID              string     `json:"id"`
	Name            string     `json:"name"`
	Description     string     `json:"description"`
	DurationMinutes int        `json:"duration_minutes"`
	EventType       string     `json:"event_type"`
	Director        *string    `json:"director,omitempty"`
	AgeRating       *string    `json:"age_rating,omitempty"`
	ReleaseDate     *time.Time `json:"release_date,omitempty"`
	Language        *string    `json:"language,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalItems int64       `json:"total_items"`
	TotalPages int         `json:"total_pages"`
}

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
