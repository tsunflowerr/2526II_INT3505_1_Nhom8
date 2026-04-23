package repository

import (
	"event_service/internal/apperror"
	"event_service/internal/dto"
	"event_service/internal/models"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type EventRepository interface {
	Create(req dto.CreateEventRequest) (*models.Event, error)
	GetByID(eventID uuid.UUID) (*models.Event, error)
	List(query dto.ListEventsQuery) ([]models.Event, int64, error)
	Update(eventID uuid.UUID, req dto.UpdateEventRequest) (*models.Event, error)
	Delete(eventID uuid.UUID) error
}

type eventRepository struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewEventRepository(db *gorm.DB, logger *zap.Logger) EventRepository {
	return &eventRepository{
		db:     db,
		logger: logger,
	}
}

func (r *eventRepository) Create(req dto.CreateEventRequest) (*models.Event, error) {
	event := &models.Event{
		Name:            req.Name,
		Description:     req.Description,
		DurationMinutes: req.DurationMinutes,
		EventType:       models.EventType(req.EventType),
		Director:        req.Director,
		AgeRating:       req.AgeRating,
		ReleaseDate:     req.ReleaseDate,
		Language:        req.Language,
	}

	if err := r.db.Create(event).Error; err != nil {
		return nil, apperror.NewInternal("failed to create event", err)
	}

	return event, nil
}

func (r *eventRepository) GetByID(eventID uuid.UUID) (*models.Event, error) {
	var event models.Event
	if err := r.db.First(&event, "id = ? AND deleted_at IS NULL", eventID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperror.NewNotFound("event not found")
		}

		return nil, apperror.NewInternal("failed to get event", err)
	}

	return &event, nil
}

func (r *eventRepository) List(query dto.ListEventsQuery) ([]models.Event, int64, error) {
	var events []models.Event
	var total int64

	q := r.db.Model(&models.Event{}).Where("deleted_at IS NULL")
	if query.Type != "" {
		q = q.Where("event_type = ?", query.Type)
	}

	if query.Search != "" {
		q = q.Where("name ILIKE ?", "%"+query.Search+"%")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, apperror.NewInternal("failed to count events", err)
	}

	offset := (query.Page - 1) * query.PageSize
	if err := q.
		Order("created_at DESC").
		Offset(offset).
		Limit(query.PageSize).
		Find(&events).Error; err != nil {
		return nil, 0, apperror.NewInternal("failed to list events", err)
	}

	return events, total, nil
}

func (r *eventRepository) Update(eventID uuid.UUID, req dto.UpdateEventRequest) (*models.Event, error) {
	event, err := r.GetByID(eventID)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"name":             req.Name,
		"description":      req.Description,
		"duration_minutes": req.DurationMinutes,
		"event_type":       req.EventType,
		"director":         req.Director,
		"age_rating":       req.AgeRating,
		"release_date":     req.ReleaseDate,
		"language":         req.Language,
	}

	if err := r.db.Model(event).Updates(updates).Error; err != nil {
		return nil, apperror.NewInternal("failed to update event", err)
	}

	if err := r.db.First(event, "id = ? AND deleted_at IS NULL", eventID).Error; err != nil {
		return nil, apperror.NewInternal("failed to get updated event", err)
	}

	return event, nil
}

func (r *eventRepository) Delete(eventID uuid.UUID) error {
	result := r.db.Where("id = ? AND deleted_at IS NULL", eventID).Delete(&models.Event{})
	if result.Error != nil {
		return apperror.NewInternal("failed to delete event", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("event not found")
	}

	return nil
}
