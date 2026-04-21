package dto

import "github.com/google/uuid"

type HoldSeatsRequest struct {
	UserID     uuid.UUID
	ShowtimeID uuid.UUID
	SeatIDs    []uuid.UUID
}
