package config

import (
	"community-reservelink/internal/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(cfg *Config) error {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		return err
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Community{},
		&models.CommunityMember{},
		&models.Supply{},
		&models.BorrowRequest{},
		&models.Alert{},
		&models.AlertSupply{},
		&models.Contribution{},
		&models.Session{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migration completed successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
