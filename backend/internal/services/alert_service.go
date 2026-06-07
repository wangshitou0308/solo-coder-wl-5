package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AlertService struct {
	db            *gorm.DB
	supplyService *SupplyService
}

func NewAlertService() *AlertService {
	return &AlertService{
		db:            config.GetDB(),
		supplyService: NewSupplyService(),
	}
}

type CreateAlertRequest struct {
	CommunityID uuid.UUID `json:"community_id" binding:"required"`
	Title       string    `json:"title" binding:"required"`
	Content     string    `json:"content"`
	AlertType   string    `json:"alert_type" binding:"required"`
	Severity    string    `json:"severity"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Location    string    `json:"location"`
	IsOfficial  bool      `json:"is_official"`
	Supplies    []AlertSupplyItem `json:"supplies"`
}

type AlertSupplyItem struct {
	SupplyName     string `json:"supply_name" binding:"required"`
	Category       string `json:"category" binding:"required"`
	QuantityNeeded int    `json:"quantity_needed" binding:"required,min=1"`
	Unit           string `json:"unit"`
	Priority       int    `json:"priority"`
}

type UpdateAlertRequest struct {
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	AlertType  string  `json:"alert_type"`
	Severity   string  `json:"severity"`
	Latitude   *float64 `json:"latitude"`
	Longitude  *float64 `json:"longitude"`
	Location   string  `json:"location"`
	Status     string  `json:"status"`
	IsOfficial *bool   `json:"is_official"`
}

type AddAlertSupplyRequest struct {
	Supplies []AlertSupplyItem `json:"supplies" binding:"required"`
}

type MatchResult struct {
	AlertSupplyID uuid.UUID `json:"alert_supply_id"`
	SupplyName    string    `json:"supply_name"`
	QuantityNeeded int     `json:"quantity_needed"`
	QuantityFound int       `json:"quantity_found"`
	MatchedSupplies []models.Supply `json:"matched_supplies"`
}

func (s *AlertService) Create(creatorID uuid.UUID, req *CreateAlertRequest) (*models.Alert, error) {
	alert := &models.Alert{
		CommunityID: req.CommunityID,
		CreatorID:   creatorID,
		Title:       req.Title,
		Content:     req.Content,
		AlertType:   req.AlertType,
		Severity:    req.Severity,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Location:    req.Location,
		IsOfficial:  req.IsOfficial,
		Status:      "active",
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	if err := tx.Create(alert).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	for _, item := range req.Supplies {
		alertSupply := &models.AlertSupply{
			AlertID:       alert.ID,
			SupplyName:    item.SupplyName,
			Category:      item.Category,
			QuantityNeeded: item.QuantityNeeded,
			Unit:          item.Unit,
			Priority:      item.Priority,
			Status:        "pending",
		}
		if err := tx.Create(alertSupply).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()
	return alert, nil
}

func (s *AlertService) GetByID(alertID uuid.UUID) (*models.Alert, error) {
	var alert models.Alert
	result := s.db.Preload("Community").Preload("Creator").First(&alert, "id = ?", alertID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("预警不存在")
		}
		return nil, result.Error
	}
	return &alert, nil
}

func (s *AlertService) Update(alertID uuid.UUID, userID uuid.UUID, req *UpdateAlertRequest) (*models.Alert, error) {
	alert, err := s.GetByID(alertID)
	if err != nil {
		return nil, err
	}

	if alert.CreatorID != userID {
		return nil, errors.New("无权限修改该预警")
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.AlertType != "" {
		updates["alert_type"] = req.AlertType
	}
	if req.Severity != "" {
		updates["severity"] = req.Severity
	}
	if req.Latitude != nil {
		updates["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		updates["longitude"] = *req.Longitude
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.IsOfficial != nil {
		updates["is_official"] = *req.IsOfficial
	}

	result := s.db.Model(alert).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	return alert, nil
}

func (s *AlertService) Delete(alertID uuid.UUID, userID uuid.UUID) error {
	alert, err := s.GetByID(alertID)
	if err != nil {
		return err
	}

	if alert.CreatorID != userID {
		return errors.New("无权限删除该预警")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Where("alert_id = ?", alertID).Delete(&models.AlertSupply{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Delete(alert).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}

func (s *AlertService) List(communityID uuid.UUID, status string, page, pageSize int) ([]models.Alert, int64, error) {
	var alerts []models.Alert
	var total int64

	query := s.db.Model(&models.Alert{})
	if communityID != uuid.Nil {
		query = query.Where("community_id = ?", communityID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("Community").Preload("Creator").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&alerts).Error
	if err != nil {
		return nil, 0, err
	}

	return alerts, total, nil
}

func (s *AlertService) GetSupplies(alertID uuid.UUID) ([]models.AlertSupply, error) {
	var supplies []models.AlertSupply
	result := s.db.Where("alert_id = ?", alertID).Order("priority DESC, created_at ASC").Find(&supplies)
	if result.Error != nil {
		return nil, result.Error
	}
	return supplies, nil
}

func (s *AlertService) AddSupplies(alertID uuid.UUID, userID uuid.UUID, req *AddAlertSupplyRequest) error {
	alert, err := s.GetByID(alertID)
	if err != nil {
		return err
	}

	if alert.CreatorID != userID {
		return errors.New("无权限添加物资清单")
	}

	for _, item := range req.Supplies {
		alertSupply := &models.AlertSupply{
			AlertID:        alertID,
			SupplyName:     item.SupplyName,
			Category:       item.Category,
			QuantityNeeded: item.QuantityNeeded,
			Unit:           item.Unit,
			Priority:       item.Priority,
			Status:         "pending",
		}
		if err := s.db.Create(alertSupply).Error; err != nil {
			return err
		}
	}

	return nil
}

func (s *AlertService) UpdateSupplyStatus(alertSupplyID uuid.UUID, status string) error {
	result := s.db.Model(&models.AlertSupply{}).Where("id = ?", alertSupplyID).Update("status", status)
	return result.Error
}

func (s *AlertService) MatchGap(alertID uuid.UUID, radius float64) ([]MatchResult, error) {
	alert, err := s.GetByID(alertID)
	if err != nil {
		return nil, err
	}

	alertSupplies, err := s.GetSupplies(alertID)
	if err != nil {
		return nil, err
	}

	var results []MatchResult

	for _, alertSupply := range alertSupplies {
		searchReq := &SearchSupplyRequest{
			Category:  alertSupply.Category,
			Keyword:   alertSupply.SupplyName,
			Latitude:  alert.Latitude,
			Longitude: alert.Longitude,
			Radius:    radius,
			Status:    "available",
			Page:      1,
			PageSize:  50,
		}

		matchedSupplies, _, err := s.supplyService.Search(searchReq)
		if err != nil {
			continue
		}

		totalFound := 0
		var supplies []models.Supply
		for _, ms := range matchedSupplies {
			totalFound += ms.Available
			supplies = append(supplies, ms.Supply)
		}

		s.db.Model(&alertSupply).Update("quantity_found", totalFound)

		status := "pending"
		if totalFound >= alertSupply.QuantityNeeded {
			status = "matched"
		} else if totalFound > 0 {
			status = "partial"
		}
		s.db.Model(&alertSupply).Update("status", status)

		results = append(results, MatchResult{
			AlertSupplyID:   alertSupply.ID,
			SupplyName:      alertSupply.SupplyName,
			QuantityNeeded:  alertSupply.QuantityNeeded,
			QuantityFound:   totalFound,
			MatchedSupplies: supplies,
		})
	}

	return results, nil
}
