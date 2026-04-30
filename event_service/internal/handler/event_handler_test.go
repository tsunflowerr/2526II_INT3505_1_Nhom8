package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"event_service/internal/apperror"
	"event_service/internal/dto"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type eventServiceMock struct {
	createFn func(req dto.CreateEventRequest) (*dto.EventResponse, error)
	getFn    func(eventID uuid.UUID) (*dto.EventResponse, error)
	getShowtimeFn func(showtimeID uuid.UUID) (*dto.ShowtimeResponse, error)
	listShowtimesFn func(eventID uuid.UUID) ([]dto.ShowtimeResponse, error)
	listFn   func(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error)
	updateFn func(eventID uuid.UUID, req dto.UpdateEventRequest) (*dto.EventResponse, error)
	deleteFn func(eventID uuid.UUID) error
}

func (m *eventServiceMock) CreateEvent(req dto.CreateEventRequest) (*dto.EventResponse, error) {
	return m.createFn(req)
}
func (m *eventServiceMock) GetEvent(eventID uuid.UUID) (*dto.EventResponse, error) {
	return m.getFn(eventID)
}
func (m *eventServiceMock) ListEvents(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error) {
	return m.listFn(query)
}
func (m *eventServiceMock) GetShowtime(showtimeID uuid.UUID) (*dto.ShowtimeResponse, error) {
	if m.getShowtimeFn == nil {
		return nil, nil
	}
	return m.getShowtimeFn(showtimeID)
}
func (m *eventServiceMock) ListShowtimesByEvent(eventID uuid.UUID) ([]dto.ShowtimeResponse, error) {
	if m.listShowtimesFn == nil {
		return []dto.ShowtimeResponse{}, nil
	}
	return m.listShowtimesFn(eventID)
}
func (m *eventServiceMock) UpdateEvent(eventID uuid.UUID, req dto.UpdateEventRequest) (*dto.EventResponse, error) {
	return m.updateFn(eventID, req)
}
func (m *eventServiceMock) DeleteEvent(eventID uuid.UUID) error { return m.deleteFn(eventID) }

func TestEventHandlerRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	id := uuid.New()
	now := time.Now().UTC()
	res := &dto.EventResponse{ID: id.String(), Name: "Movie", EventType: "MOVIE", CreatedAt: now, UpdatedAt: now}

	mock := &eventServiceMock{
		createFn: func(req dto.CreateEventRequest) (*dto.EventResponse, error) { return res, nil },
		getFn:    func(eventID uuid.UUID) (*dto.EventResponse, error) { return res, nil },
		listFn: func(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error) {
			return []dto.EventResponse{*res}, 1, 1, nil
		},
		updateFn: func(eventID uuid.UUID, req dto.UpdateEventRequest) (*dto.EventResponse, error) { return res, nil },
		deleteFn: func(eventID uuid.UUID) error { return nil },
	}

	h := NewEventHandler(mock, zap.NewNop())
	r := gin.New()
	v1 := r.Group("/api/v1")
	h.RegisterRoutes(v1)

	tests := []struct {
		name       string
		method     string
		path       string
		body       any
		wantStatus int
	}{
		{"create", http.MethodPost, "/api/v1/events", dto.CreateEventRequest{Name: "M", DurationMinutes: 100, EventType: "MOVIE"}, http.StatusCreated},
		{"list", http.MethodGet, "/api/v1/events?page=1&page_size=10", nil, http.StatusOK},
		{"get", http.MethodGet, "/api/v1/events/" + id.String(), nil, http.StatusOK},
		{"update", http.MethodPut, "/api/v1/events/" + id.String(), dto.UpdateEventRequest{Name: "U", DurationMinutes: 90, EventType: "EVENT"}, http.StatusOK},
		{"delete", http.MethodDelete, "/api/v1/events/" + id.String(), nil, http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			if tt.body != nil {
				body, _ = json.Marshal(tt.body)
			}

			req := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != tt.wantStatus {
				t.Fatalf("status=%d want=%d body=%s", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}

func TestEventHandlerErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		method     string
		path       string
		body       any
		mock       *eventServiceMock
		wantStatus int
	}{
		{
			name:   "create invalid body",
			method: http.MethodPost, path: "/api/v1/events",
			body:       map[string]any{"name": "x"},
			mock:       &eventServiceMock{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "get invalid id",
			method: http.MethodGet, path: "/api/v1/events/invalid-uuid",
			mock: &eventServiceMock{
				getFn: func(eventID uuid.UUID) (*dto.EventResponse, error) { return nil, nil },
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "service app error",
			method: http.MethodGet, path: "/api/v1/events/" + uuid.New().String(),
			mock: &eventServiceMock{
				getFn: func(eventID uuid.UUID) (*dto.EventResponse, error) {
					return nil, apperror.NewNotFound("event not found")
				},
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name:   "service internal error",
			method: http.MethodDelete, path: "/api/v1/events/" + uuid.New().String(),
			mock: &eventServiceMock{
				deleteFn: func(eventID uuid.UUID) error { return errors.New("boom") },
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name:   "list invalid query",
			method: http.MethodGet, path: "/api/v1/events?page=0",
			mock: &eventServiceMock{
				listFn: func(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error) {
					return nil, 0, 0, nil
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "list service app error",
			method: http.MethodGet, path: "/api/v1/events?page=1&page_size=10",
			mock: &eventServiceMock{
				listFn: func(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error) {
					return nil, 0, 0, apperror.NewBadRequest("bad query")
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "update invalid id",
			method: http.MethodPut, path: "/api/v1/events/bad-id",
			body:       dto.UpdateEventRequest{Name: "x", DurationMinutes: 10, EventType: "EVENT"},
			mock:       &eventServiceMock{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "update invalid body",
			method: http.MethodPut, path: "/api/v1/events/" + uuid.New().String(),
			body:       map[string]any{"name": "x"},
			mock:       &eventServiceMock{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "update app error",
			method: http.MethodPut, path: "/api/v1/events/" + uuid.New().String(),
			body: dto.UpdateEventRequest{Name: "x", DurationMinutes: 10, EventType: "EVENT"},
			mock: &eventServiceMock{
				updateFn: func(eventID uuid.UUID, req dto.UpdateEventRequest) (*dto.EventResponse, error) {
					return nil, apperror.NewNotFound("not found")
				},
			},
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.mock.createFn == nil {
				tt.mock.createFn = func(req dto.CreateEventRequest) (*dto.EventResponse, error) { return nil, nil }
			}
			if tt.mock.getFn == nil {
				tt.mock.getFn = func(eventID uuid.UUID) (*dto.EventResponse, error) { return nil, nil }
			}
			if tt.mock.listFn == nil {
				tt.mock.listFn = func(query dto.ListEventsQuery) ([]dto.EventResponse, int64, int, error) { return nil, 0, 0, nil }
			}
			if tt.mock.updateFn == nil {
				tt.mock.updateFn = func(eventID uuid.UUID, req dto.UpdateEventRequest) (*dto.EventResponse, error) { return nil, nil }
			}
			if tt.mock.deleteFn == nil {
				tt.mock.deleteFn = func(eventID uuid.UUID) error { return nil }
			}

			h := NewEventHandler(tt.mock, zap.NewNop())
			r := gin.New()
			v1 := r.Group("/api/v1")
			h.RegisterRoutes(v1)

			var body []byte
			if tt.body != nil {
				body, _ = json.Marshal(tt.body)
			}
			req := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != tt.wantStatus {
				t.Fatalf("status=%d want=%d body=%s", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}
