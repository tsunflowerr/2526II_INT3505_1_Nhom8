package dto

import (
	"time"
)

type BookingResponse struct {
	ID         string     `json:"id"`
	Status     string     `json:"status"`
	ShowTimeID string     `json:"showtime_id"`
	ExpiresAt  *time.Time `json:"expires_at"`

	Items       []BookingItemDTO `json:"items"`
	TotalAmount string           `json:"total_amount"`
}

type BookingItemDTO struct {
	SeatID string `json:"seat_id"`
	Row    string `json:"row"`
	Number int    `json:"number"`
	Price  string `json:"price"`
}
