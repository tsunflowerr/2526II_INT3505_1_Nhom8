package application

import (
	"booking_api/internal/config"
	"booking_api/internal/infrastructure/database"
	"booking_api/internal/infrastructure/logger"
	"booking_api/internal/server"
	"context"
	"fmt"
	"sync"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type App struct {
	config   config.Config
	server   *server.HTTPServer
	db       *gorm.DB
	logger   *zap.Logger
	stopOnce sync.Once
}

func NewApp(cfg config.Config) (*App, error) {
	logger, err := logger.NewLogger(cfg.Logger)
	if err != nil {
		return nil, fmt.Errorf("failed to init logger: %w", err)
	}

	srv := server.NewHTTPServer(cfg.Server)

	db, err := database.ConnectPostgres(cfg.Postgres)
	if err != nil {
		return nil, fmt.Errorf("failed to init database: %w", err)
	}

	return &App{
		config: cfg,
		logger: logger,
		server: srv,
		db:     db,
	}, nil
}

func (app *App) Start() error {
	app.logger.Info("starting http server...")
	return app.server.Start()
}

func (app *App) Shutdown(ctx context.Context) error {
	app.logger.Info("shutting down application...")

	if err := app.server.Shutdown(ctx); err != nil {
		app.logger.Error("shutdown server failed", zap.Error(err))
		return err
	}

	app.cleanup()
	app.logger.Info("shutdown application successfully")
	_ = app.logger.Sync()

	return nil
}

func (app *App) ForceShutdown() error {
	app.logger.Warn("forcing application shutdown")

	if err := app.server.Close(); err != nil {
		app.logger.Error("force close server failed", zap.Error(err))
		return err
	}

	app.cleanup()
	app.logger.Info("forced shutdown completed")
	_ = app.logger.Sync()

	return nil
}

func (app *App) cleanup() {
	app.stopOnce.Do(func() {
		sqlDB, err := app.db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}
