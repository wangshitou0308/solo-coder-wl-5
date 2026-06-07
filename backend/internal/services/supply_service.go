package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"context"
	"errors"
	"math"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SupplyService struct {
	db           *gorm.DB
	redisService *RedisService
}

func NewSupplyService() *SupplyService {
	return &SupplyService{
		db:           config.GetDB(),
		redisService: NewRedisService(),
	}
}

type CreateSupplyRequest struct {
	Name        string  `json:"name" binding:"required"`
	Category    string  `json:"category" binding:"required"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	Images      string  `json:"images"`
	Condition   string  `json:"condition"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Address     string  `json:"address"`
}

type UpdateSupplyRequest struct {
	Name        string   `json:"name"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Quantity    *int     `json:"quantity"`
	Images      string   `json:"images"`
	Condition   string   `json:"condition"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Address     string   `json:"address"`
	Status      string   `json:"status"`
}

type SearchSupplyRequest struct {
	Keyword   string  `form:"keyword"`
	Category  string  `form:"category"`
	Latitude  float64 `form:"latitude"`
	Longitude float64 `form:"longitude"`
	Radius    float64 `form:"radius"`
	Status    string  `form:"status"`
	Page      int     `form:"page,default=1"`
	PageSize  int     `form:"page_size,default=20"`
	SortBy    string  `form:"sort_by,default=distance"`
}

type SupplyWithDistance struct {
	models.Supply
	Distance float64 `json:"distance"`
}

func (s *SupplyService) Create(ownerID uuid.UUID, req *CreateSupplyRequest) (*models.Supply, error) {
	supply := &models.Supply{
		OwnerID:     ownerID,
		Name:        req.Name,
		Category:    req.Category,
		Description: req.Description,
		Quantity:    req.Quantity,
		Available:   req.Quantity,
		Images:      req.Images,
		Condition:   req.Condition,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Address:     req.Address,
		Status:      "available",
	}

	result := s.db.Create(supply)
	if result.Error != nil {
		return nil, result.Error
	}

	return supply, nil
}

func (s *SupplyService) GetByID(supplyID uuid.UUID) (*models.Supply, error) {
	var supply models.Supply
	result := s.db.Preload("Owner").First(&supply, "id = ?", supplyID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("物资不存在")
		}
		return nil, result.Error
	}

	go s.incrementViewCount(supplyID)

	return &supply, nil
}

func (s *SupplyService) incrementViewCount(supplyID uuid.UUID) {
	ctx := context.Background()
	s.redisService.IncrViewCount(ctx, supplyID.String())
	s.db.Model(&models.Supply{}).Where("id = ?", supplyID).UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
	s.redisService.ZAddHotSupply(ctx, supplyID.String(), 1)
}

func (s *SupplyService) Update(supplyID uuid.UUID, userID uuid.UUID, req *UpdateSupplyRequest) (*models.Supply, error) {
	supply, err := s.GetByID(supplyID)
	if err != nil {
		return nil, err
	}

	if supply.OwnerID != userID {
		return nil, errors.New("无权限修改该物资")
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Quantity != nil {
		updates["quantity"] = *req.Quantity
		diff := *req.Quantity - supply.Quantity
		if diff != 0 {
			updates["available"] = gorm.Expr("available + ?", diff)
		}
	}
	if req.Images != "" {
		updates["images"] = req.Images
	}
	if req.Condition != "" {
		updates["condition"] = req.Condition
	}
	if req.Latitude != nil {
		updates["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		updates["longitude"] = *req.Longitude
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	result := s.db.Model(supply).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	return supply, nil
}

func (s *SupplyService) Delete(supplyID uuid.UUID, userID uuid.UUID) error {
	supply, err := s.GetByID(supplyID)
	if err != nil {
		return err
	}

	if supply.OwnerID != userID {
		return errors.New("无权限删除该物资")
	}

	result := s.db.Delete(supply)
	return result.Error
}

func (s *SupplyService) Search(req *SearchSupplyRequest) ([]SupplyWithDistance, int64, error) {
	var supplies []models.Supply
	var total int64

	query := s.db.Model(&models.Supply{})

	if req.Keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+req.Keyword+"%", "%"+req.Keyword+"%")
	}
	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	} else {
		query = query.Where("status = ?", "available")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (req.Page - 1) * req.PageSize
	err := query.Preload("Owner").Offset(offset).Limit(req.PageSize).Find(&supplies).Error
	if err != nil {
		return nil, 0, err
	}

	result := make([]SupplyWithDistance, 0, len(supplies))
	for _, supply := range supplies {
		distance := 0.0
		if req.Latitude != 0 && req.Longitude != 0 {
			distance = calculateDistance(req.Latitude, req.Longitude, supply.Latitude, supply.Longitude)
		}
		result = append(result, SupplyWithDistance{
			Supply:   supply,
			Distance: distance,
		})
	}

	if req.Latitude != 0 && req.Longitude != 0 && req.Radius > 0 {
		filtered := result[:0]
		for _, s := range result {
			if s.Distance <= req.Radius {
				filtered = append(filtered, s)
			}
		}
		result = filtered
		total = int64(len(filtered))
	}

	if req.SortBy == "distance" && req.Latitude != 0 && req.Longitude != 0 {
		for i := 0; i < len(result); i++ {
			for j := i + 1; j < len(result); j++ {
				if result[i].Distance > result[j].Distance {
					result[i], result[j] = result[j], result[i]
				}
			}
		}
	}

	return result, total, nil
}

func (s *SupplyService) GetByOwner(ownerID uuid.UUID, page, pageSize int) ([]models.Supply, int64, error) {
	var supplies []models.Supply
	var total int64

	query := s.db.Model(&models.Supply{}).Where("owner_id = ?", ownerID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&supplies).Error
	if err != nil {
		return nil, 0, err
	}

	return supplies, total, nil
}

func (s *SupplyService) UpdateStatus(supplyID uuid.UUID, status string) error {
	result := s.db.Model(&models.Supply{}).Where("id = ?", supplyID).Update("status", status)
	return result.Error
}

func (s *SupplyService) UpdateAvailable(supplyID uuid.UUID, delta int) error {
	result := s.db.Model(&models.Supply{}).Where("id = ?", supplyID).UpdateColumn("available", gorm.Expr("available + ?", delta))
	if result.Error != nil {
		return result.Error
	}
	if delta < 0 {
		s.db.Model(&models.Supply{}).Where("id = ?", supplyID).UpdateColumn("borrow_count", gorm.Expr("borrow_count + ?", -delta))
	}
	return nil
}

func (s *SupplyService) GetHotSupplies(count int) ([]models.Supply, error) {
	ctx := context.Background()
	hotSupplyIDs, err := s.redisService.ZGetHotSupplies(ctx, int64(count))
	if err != nil {
		return nil, err
	}

	if len(hotSupplyIDs) == 0 {
		var supplies []models.Supply
		s.db.Where("status = ?", "available").Order("borrow_count DESC, view_count DESC").Limit(count).Find(&supplies)
		return supplies, nil
	}

	var supplies []models.Supply
	for _, idStr := range hotSupplyIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		supply, err := s.GetByID(id)
		if err == nil {
			supplies = append(supplies, *supply)
		}
	}

	return supplies, nil
}

func (s *SupplyService) GetCategories() ([]string, error) {
	var categories []string
	result := s.db.Model(&models.Supply{}).Distinct("category").Where("status = ?", "available").Pluck("category", &categories)
	if result.Error != nil {
		return nil, result.Error
	}
	return categories, nil
}
