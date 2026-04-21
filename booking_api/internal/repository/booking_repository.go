package repository

import (
	"booking_api/internal/dto"
	"booking_api/internal/infrastructure/logger"
	"booking_api/internal/models"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BookingRepository interface {
	HoldSeats(holdSeats dto.HoldSeatsRequest) (*models.Booking, error)
	GetSeatsStatus(showtimeID uuid.UUID) ([]models.ShowTimeSeat, error)
}

type bookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB, logger logger.Logger) BookingRepository {
	return &bookingRepository{
		db: db,
	}
}

func (r *bookingRepository) GetSeatsStatus(showtimeID uuid.UUID) ([]models.ShowTimeSeat, error) {
	var seats []models.ShowTimeSeat

	now := time.Now()

	err := r.db.
		Preload("Seat").
		Where("show_time_id = ?", showtimeID).
		Find(&seats).Error

	if err != nil {
		return nil, err
	}

	for i := range seats {
		if seats[i].Status == models.ShowTimeSeatStatusHolding &&
			seats[i].ExpiresAt != nil &&
			seats[i].ExpiresAt.Before(now) {

			seats[i].Status = models.ShowTimeSeatStatusAvailable
			seats[i].BookingID = nil
			seats[i].ExpiresAt = nil
		}
	}

	return seats, nil
}

func (r *bookingRepository) HoldSeats(req dto.HoldSeatsRequest) (*models.Booking, error) {
	var booking *models.Booking

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var seats []models.ShowTimeSeat

		now := time.Now()
		expiresAt := now.Add(10 * time.Minute)

		if err := tx.
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where(`
				show_time_id = ? 
				AND seat_id IN ?
				AND (
					status = ? 
					OR (status = ? AND expires_at < ?)
				)
			`,
				req.ShowtimeID,
				req.SeatIDs,
				models.ShowTimeSeatStatusAvailable,
				models.ShowTimeSeatStatusHolding,
				now,
			).
			Order("seat_id").
			Find(&seats).Error; err != nil {
			return err
		}

		if len(seats) != len(req.SeatIDs) {
			return fmt.Errorf("some seats are not available")
		}

		booking = &models.Booking{
			UserID:     req.UserID,
			ShowTimeID: req.ShowtimeID,
			Status:     models.BookingStatusHolding,
			ExpiresAt:  &expiresAt,
		}

		if err := tx.Create(booking).Error; err != nil {
			return fmt.Errorf("failed to create booking: %v", err)
		}

		var seatIDs []uuid.UUID
		for _, s := range seats {
			seatIDs = append(seatIDs, s.ID)
		}

		if err := tx.Model(&models.ShowTimeSeat{}).
			Where("id IN ?", seatIDs).
			Updates(map[string]interface{}{
				"status":     models.ShowTimeSeatStatusHolding,
				"booking_id": booking.ID,
				"expires_at": expiresAt,
			}).Error; err != nil {
			return fmt.Errorf("failed to update seats: %v", err)
		}

		var pricings []models.SeatPricing
		if err := tx.
			Where("show_time_id = ? AND seat_id IN ?", req.ShowtimeID, req.SeatIDs).
			Find(&pricings).Error; err != nil {
			return err
		}

		priceMap := make(map[uuid.UUID]decimal.Decimal)
		for _, p := range pricings {
			priceMap[p.SeatID] = p.Price
		}

		var items []models.BookingItem
		for _, s := range seats {
			price, ok := priceMap[s.SeatID]
			if !ok {
				return fmt.Errorf("price not found for seat %s", s.SeatID)
			}

			items = append(items, models.BookingItem{
				BookingID:      booking.ID,
				ShowTimeSeatID: s.ID,
				Price:          price,
			})
		}

		if err := tx.Create(&items).Error; err != nil {
			return fmt.Errorf("failed top create booking items: %v", err)
		}

		if err := tx.
			Preload("Items.ShowTimeSeat.Seat").
			First(booking, "id = ?", booking.ID).Error; err != nil {
			return err
		}

		return nil
	})

	return booking, err
}
