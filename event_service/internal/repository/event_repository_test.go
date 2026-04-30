package repository

import (
	"errors"
	"event_service/internal/dto"
	"event_service/internal/models"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupEventRepo(t *testing.T) EventRepository {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Event{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	return NewEventRepository(db, zap.NewNop())
}

func setupEventRepoMockDB(t *testing.T) (EventRepository, sqlmock.Sqlmock) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}

	gdb, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{})
	if err != nil {
		t.Fatalf("gorm open: %v", err)
	}

	return NewEventRepository(gdb, zap.NewNop()), mock
}

func TestEventRepository_CRUD(t *testing.T) {
	repo := setupEventRepo(t)

	createReq := dto.CreateEventRequest{
		Name:            "Cinema Night",
		Description:     "Movie",
		DurationMinutes: 120,
		EventType:       "MOVIE",
	}

	created, err := repo.Create(createReq)
	if err != nil {
		t.Fatalf("Create() error: %v", err)
	}

	got, err := repo.GetByID(created.ID)
	if err != nil {
		t.Fatalf("GetByID() error: %v", err)
	}
	if got.Name != createReq.Name {
		t.Fatalf("GetByID() wrong data")
	}

	events, total, err := repo.List(dto.ListEventsQuery{
		Page:     1,
		PageSize: 10,
		Type:     "MOVIE",
	})
	if err != nil {
		t.Fatalf("List() error: %v", err)
	}
	if len(events) != 1 || total != 1 {
		t.Fatalf("List() unexpected len=%d total=%d", len(events), total)
	}

	updated, err := repo.Update(created.ID, dto.UpdateEventRequest{
		Name:            "Cinema Night Updated",
		Description:     "Movie Updated",
		DurationMinutes: 130,
		EventType:       "EVENT",
	})
	if err != nil {
		t.Fatalf("Update() error: %v", err)
	}
	if updated.Name != "Cinema Night Updated" || string(updated.EventType) != "EVENT" {
		t.Fatalf("Update() not applied")
	}

	if err := repo.Delete(created.ID); err != nil {
		t.Fatalf("Delete() error: %v", err)
	}

	if _, err := repo.GetByID(created.ID); err == nil {
		t.Fatalf("expected not found after delete")
	}
}

func TestEventRepository_NotFoundPaths(t *testing.T) {
	repo := setupEventRepo(t)
	id := uuid.New()

	if _, err := repo.GetByID(id); err == nil {
		t.Fatalf("expected not found")
	}
	if _, err := repo.Update(id, dto.UpdateEventRequest{
		Name:            "x",
		DurationMinutes: 10,
		EventType:       "EVENT",
	}); err == nil {
		t.Fatalf("expected update not found")
	}
	if err := repo.Delete(id); err == nil {
		t.Fatalf("expected delete not found")
	}
}

func TestEventRepository_ErrorPathsWithMock(t *testing.T) {
	repo, mock := setupEventRepoMockDB(t)
	eventID := uuid.New()

	t.Run("create internal error", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectQuery(`INSERT INTO "events"`).
			WillReturnError(errors.New("insert failed"))
		mock.ExpectRollback()

		_, err := repo.Create(dto.CreateEventRequest{
			Name:            "x",
			DurationMinutes: 1,
			EventType:       "EVENT",
		})
		if err == nil {
			t.Fatalf("expected error")
		}
	})

	t.Run("get by id internal error", func(t *testing.T) {
		mock.ExpectQuery(`SELECT .* FROM "events"`).
			WillReturnError(errors.New("db down"))
		_, err := repo.GetByID(eventID)
		if err == nil {
			t.Fatalf("expected error")
		}
	})

	t.Run("list count error via search", func(t *testing.T) {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "events"`).
			WillReturnError(errors.New("bad where"))

		_, _, err := repo.List(dto.ListEventsQuery{
			Page:     1,
			PageSize: 10,
			Search:   "abc",
		})
		if err == nil {
			t.Fatalf("expected error")
		}
	})

	t.Run("delete internal error", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectExec(`UPDATE "events" SET "deleted_at"`).
			WillReturnError(errors.New("delete failed"))
		mock.ExpectRollback()

		err := repo.Delete(eventID)
		if err == nil {
			t.Fatalf("expected error")
		}
	})
}

func TestEventRepository_ShowtimeQueries_WithMock(t *testing.T) {
	repo, mock := setupEventRepoMockDB(t)
	showtimeID := uuid.New()
	eventID := uuid.New()
	now := time.Now().UTC()

	t.Run("get showtime success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "event_id", "venue", "address", "start_time", "end_time", "seat_map_name"}).
			AddRow(showtimeID.String(), eventID.String(), "Venue A", "Address A", now, now.Add(time.Hour), "Map A")
		mock.ExpectQuery(`SELECT`).
			WithArgs(showtimeID).
			WillReturnRows(rows)
		got, err := repo.GetShowtimeByID(showtimeID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil || got.ID != showtimeID.String() {
			t.Fatalf("unexpected showtime payload: %+v", got)
		}
	})

	t.Run("get showtime not found", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "event_id", "venue", "address", "start_time", "end_time", "seat_map_name"})
		mock.ExpectQuery(`SELECT`).
			WithArgs(showtimeID).
			WillReturnRows(rows)
		_, err := repo.GetShowtimeByID(showtimeID)
		if err == nil {
			t.Fatalf("expected not found error")
		}
	})

	t.Run("get showtime internal error", func(t *testing.T) {
		mock.ExpectQuery(`SELECT`).
			WithArgs(showtimeID).
			WillReturnError(errors.New("query failed"))
		_, err := repo.GetShowtimeByID(showtimeID)
		if err == nil {
			t.Fatalf("expected query error")
		}
	})

	t.Run("list showtimes by event success", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"id", "event_id", "venue", "address", "start_time", "end_time", "seat_map_name"}).
			AddRow(uuid.NewString(), eventID.String(), "Venue A", "Address A", now, now.Add(time.Hour), "Map A").
			AddRow(uuid.NewString(), eventID.String(), "Venue B", "Address B", now.Add(2*time.Hour), now.Add(3*time.Hour), "Map B")
		mock.ExpectQuery(`SELECT`).
			WithArgs(eventID).
			WillReturnRows(rows)
		got, err := repo.ListShowtimesByEventID(eventID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("expected 2 showtimes, got %d", len(got))
		}
	})

	t.Run("list showtimes by event error", func(t *testing.T) {
		mock.ExpectQuery(`SELECT`).
			WithArgs(eventID).
			WillReturnError(fmt.Errorf("query failed"))
		_, err := repo.ListShowtimesByEventID(eventID)
		if err == nil {
			t.Fatalf("expected query error")
		}
	})
}
