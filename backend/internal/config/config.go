package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	RedisHost  string
	RedisPort  string
	JWTSecret  string
	JWTExpire  int
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	expire, _ := strconv.Atoi(getEnv("JWT_EXPIRE", "86400"))

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "reservelink"),
		DBPassword: getEnv("DB_PASSWORD", "reservelink123"),
		DBName:     getEnv("DB_NAME", "reservelink"),
		RedisHost:  getEnv("REDIS_HOST", "localhost"),
		RedisPort:  getEnv("REDIS_PORT", "6379"),
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpire:  expire,
	}, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
