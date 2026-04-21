package config

import (
	"github.com/spf13/viper"
)

type DatabaseConfig struct {
	Host            string
	Port            int
	User            string
	DBName          string
	Password        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
	SSLMode         string
}

func NewConfig() DatabaseConfig {
	v := viper.New()

	v.AutomaticEnv()

	return DatabaseConfig{
		Host:     v.GetString("POSTGRES_HOST"),
		Port:     v.GetInt("POSTGRES_PORT"),
		User:     v.GetString("POSTGRES_USER"),
		DBName:   v.GetString("POSTGRES_DB"),
		Password: v.GetString("POSTGRES_PASSWORD"),
		SSLMode:  v.GetString("POSTGRES_SSLMODE"),
	}
}
