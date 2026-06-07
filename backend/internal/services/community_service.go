package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommunityService struct {
	db *gorm.DB
}

func NewCommunityService() *CommunityService {
	return &CommunityService{
		db: config.GetDB(),
	}
}

type CreateCommunityRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Avatar      string  `json:"avatar"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Address     string  `json:"address"`
}

type UpdateCommunityRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Avatar      string   `json:"avatar"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Address     string   `json:"address"`
	IsActive    *bool    `json:"is_active"`
}

type SearchCommunityRequest struct {
	Keyword   string  `form:"keyword"`
	Latitude  float64 `form:"latitude"`
	Longitude float64 `form:"longitude"`
	Radius    float64 `form:"radius"`
	Page      int     `form:"page,default=1"`
	PageSize  int     `form:"page_size,default=20"`
}

func (s *CommunityService) Create(creatorID uuid.UUID, req *CreateCommunityRequest) (*models.Community, error) {
	community := &models.Community{
		Name:        req.Name,
		Description: req.Description,
		CreatorID:   creatorID,
		Avatar:      req.Avatar,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Address:     req.Address,
		MemberCount: 1,
		IsActive:    true,
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	if err := tx.Create(community).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	member := &models.CommunityMember{
		CommunityID: community.ID,
		UserID:      creatorID,
		Role:        "admin",
		JoinedAt:    time.Now(),
	}

	if err := tx.Create(member).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	tx.Commit()
	return community, nil
}

func (s *CommunityService) GetByID(communityID uuid.UUID) (*models.Community, error) {
	var community models.Community
	result := s.db.Preload("Creator").First(&community, "id = ?", communityID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("社区不存在")
		}
		return nil, result.Error
	}
	return &community, nil
}

func (s *CommunityService) Update(communityID uuid.UUID, userID uuid.UUID, req *UpdateCommunityRequest) (*models.Community, error) {
	community, err := s.GetByID(communityID)
	if err != nil {
		return nil, err
	}

	if community.CreatorID != userID {
		return nil, errors.New("无权限修改该社区")
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
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
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	result := s.db.Model(community).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}

	return community, nil
}

func (s *CommunityService) Delete(communityID uuid.UUID, userID uuid.UUID) error {
	community, err := s.GetByID(communityID)
	if err != nil {
		return err
	}

	if community.CreatorID != userID {
		return errors.New("无权限删除该社区")
	}

	result := s.db.Delete(community)
	return result.Error
}

func (s *CommunityService) Search(req *SearchCommunityRequest) ([]models.Community, int64, error) {
	var communities []models.Community
	var total int64

	query := s.db.Model(&models.Community{}).Where("is_active = ?", true)

	if req.Keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+req.Keyword+"%", "%"+req.Keyword+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (req.Page - 1) * req.PageSize
	err := query.Preload("Creator").Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&communities).Error
	if err != nil {
		return nil, 0, err
	}

	if req.Latitude != 0 && req.Longitude != 0 && req.Radius > 0 {
		filtered := communities[:0]
		for _, c := range communities {
			distance := calculateDistance(req.Latitude, req.Longitude, c.Latitude, c.Longitude)
			if distance <= req.Radius {
				filtered = append(filtered, c)
			}
		}
		communities = filtered
		total = int64(len(filtered))
	}

	return communities, total, nil
}

func (s *CommunityService) Join(communityID uuid.UUID, userID uuid.UUID) error {
	_, err := s.GetByID(communityID)
	if err != nil {
		return err
	}

	var existingMember models.CommunityMember
	result := s.db.Where("community_id = ? AND user_id = ?", communityID, userID).First(&existingMember)
	if result.Error == nil {
		return errors.New("已加入该社区")
	}

	member := &models.CommunityMember{
		CommunityID: communityID,
		UserID:      userID,
		Role:        "member",
		JoinedAt:    time.Now(),
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Create(member).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Community{}).Where("id = ?", communityID).UpdateColumn("member_count", gorm.Expr("member_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}

func (s *CommunityService) Leave(communityID uuid.UUID, userID uuid.UUID) error {
	community, err := s.GetByID(communityID)
	if err != nil {
		return err
	}

	if community.CreatorID == userID {
		return errors.New("社区创建者不能退出社区")
	}

	var member models.CommunityMember
	result := s.db.Where("community_id = ? AND user_id = ?", communityID, userID).First(&member)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("未加入该社区")
		}
		return result.Error
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Delete(&member).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Community{}).Where("id = ?", communityID).UpdateColumn("member_count", gorm.Expr("member_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}

func (s *CommunityService) GetMembers(communityID uuid.UUID, page, pageSize int) ([]models.CommunityMember, int64, error) {
	var members []models.CommunityMember
	var total int64

	query := s.db.Model(&models.CommunityMember{}).Where("community_id = ?", communityID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("User").Order("joined_at DESC").Offset(offset).Limit(pageSize).Find(&members).Error
	if err != nil {
		return nil, 0, err
	}

	return members, total, nil
}

func (s *CommunityService) GetUserCommunities(userID uuid.UUID) ([]models.Community, error) {
	var memberships []models.CommunityMember
	err := s.db.Where("user_id = ?", userID).Preload("Community").Find(&memberships).Error
	if err != nil {
		return nil, err
	}

	communities := make([]models.Community, len(memberships))
	for i, m := range memberships {
		communities[i] = m.Community
	}

	return communities, nil
}

func (s *CommunityService) IsMember(communityID, userID uuid.UUID) (bool, string, error) {
	var member models.CommunityMember
	result := s.db.Where("community_id = ? AND user_id = ?", communityID, userID).First(&member)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return false, "", nil
		}
		return false, "", result.Error
	}
	return true, member.Role, nil
}

func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0

	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}
