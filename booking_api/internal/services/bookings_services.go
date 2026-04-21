package services

import (
	"booking_api/internal/dto"
	"booking_api/internal/models"
	"booking_api/internal/repository"
	"errors"
	"fmt"
	"sort"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"go.uber.org/zap"
)

type BookingService interface {
}

type bookingService struct {
	logger     *zap.Logger
	repository repository.BookingRepository
}

func NewBookingService(
	logger *zap.Logger,
	repository repository.BookingRepository,
) (BookingService, error) {
	return &bookingService{
		logger:     logger,
		repository: repository,
	}, nil
}

func isDeadlock(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "40P01"
	}
	return false
}

func (b *bookingService) HoldSeats(req dto.HoldSeatsRequest) (*dto.BookingResponse, error) {
	b.logger.Info("start hold seats", zap.Any("request", req))
	// sort seats
	sortedSeats := append([]uuid.UUID(nil), req.SeatIDs...)
	sort.Slice(sortedSeats, func(i, j int) bool {
		return sortedSeats[i].String() < sortedSeats[j].String()
	})
	req.SeatIDs = sortedSeats

	b.logger.Debug("sorted seats", zap.Any("sorted seats", sortedSeats))

	var booking *models.Booking
	var err error

	for i := 0; i < 3; i++ {
		booking, err = b.repository.HoldSeats(req)
		if err == nil {
			break
		}

		if isDeadlock(err) {
			b.logger.Warn("deadlock detected, retrying", zap.Int("attemp", i+1))
			continue
		}

		b.logger.Error("failed to hold seats", zap.Error(err))
		return nil, fmt.Errorf("failed to hold seats: %w", err)
	}

	if err != nil {
		return nil, fmt.Errorf("failed after retries: %w", err)
	}

	b.logger.Info("hold seats successfully")

	return booking.ToDTO(), nil
}
