package services

import (
	"community-reservelink/internal/config"
	"community-reservelink/internal/models"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BorrowService struct {
	db            *gorm.DB
	userService   *UserService
	supplyService *SupplyService
}

func NewBorrowService() *BorrowService {
	return &BorrowService{
		db:            config.GetDB(),
		userService:   NewUserService(),
		supplyService: NewSupplyService(),
	}
}

type CreateBorrowRequest struct {
	SupplyID       uuid.UUID `json:"supply_id" binding:"required"`
	Quantity       int       `json:"quantity" binding:"required,min=1"`
	Purpose        string    `json:"purpose"`
	ExpectedReturn time.Time `json:"expected_return" binding:"required"`
}

type ApproveBorrowRequest struct {
	Status string `json:"status" binding:"required,oneof=approved rejected"`
	Reason string `json:"reason"`
}

type RateBorrowRequest struct {
	Rating int    `json:"rating" binding:"required,min=1,max=5"`
	Review string `json:"review"`
}

func (s *BorrowService) Create(borrowerID uuid.UUID, req *CreateBorrowRequest) (*models.BorrowRequest, error) {
	supply, err := s.supplyService.GetByID(req.SupplyID)
	if err != nil {
		return nil, err
	}

	if supply.OwnerID == borrowerID {
		return nil, errors.New("不能借用自己的物资")
	}

	if supply.Available < req.Quantity {
		return nil, errors.New("物资库存不足")
	}

	if supply.Status != "available" {
		return nil, errors.New("物资不可借用")
	}

	borrow := &models.BorrowRequest{
		SupplyID:       req.SupplyID,
		BorrowerID:     borrowerID,
		OwnerID:        supply.OwnerID,
		Quantity:       req.Quantity,
		Purpose:        req.Purpose,
		Status:         "pending",
		ExpectedReturn: req.ExpectedReturn,
	}

	result := s.db.Create(borrow)
	if result.Error != nil {
		return nil, result.Error
	}

	return borrow, nil
}

func (s *BorrowService) GetByID(borrowID uuid.UUID) (*models.BorrowRequest, error) {
	var borrow models.BorrowRequest
	result := s.db.Preload("Supply").Preload("Borrower").Preload("Owner").First(&borrow, "id = ?", borrowID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("借用请求不存在")
		}
		return nil, result.Error
	}
	return &borrow, nil
}

func (s *BorrowService) Approve(borrowID uuid.UUID, ownerID uuid.UUID, req *ApproveBorrowRequest) (*models.BorrowRequest, error) {
	borrow, err := s.GetByID(borrowID)
	if err != nil {
		return nil, err
	}

	if borrow.OwnerID != ownerID {
		return nil, errors.New("无权限审批该请求")
	}

	if borrow.Status != "pending" {
		return nil, errors.New("该请求已处理")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	if req.Status == "approved" {
		pickupCode, err := generatePickupCode()
		if err != nil {
			tx.Rollback()
			return nil, err
		}

		borrow.Status = "approved"
		borrow.PickupCode = pickupCode

		if err := tx.Save(borrow).Error; err != nil {
			tx.Rollback()
			return nil, err
		}

		if err := s.supplyService.UpdateAvailable(borrow.SupplyID, -borrow.Quantity); err != nil {
			tx.Rollback()
			return nil, err
		}
	} else {
		borrow.Status = "rejected"
		borrow.RejectReason = req.Reason
		if err := tx.Save(borrow).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()
	return borrow, nil
}

func (s *BorrowService) Pickup(borrowID uuid.UUID, borrowerID uuid.UUID, pickupCode string) (*models.BorrowRequest, error) {
	borrow, err := s.GetByID(borrowID)
	if err != nil {
		return nil, err
	}

	if borrow.BorrowerID != borrowerID {
		return nil, errors.New("无权限取货")
	}

	if borrow.Status != "approved" {
		return nil, errors.New("该请求未通过审批")
	}

	if borrow.PickupCode != pickupCode {
		return nil, errors.New("取货码错误")
	}

	now := time.Now()
	borrow.Status = "picked_up"
	borrow.PickedUpAt = &now

	result := s.db.Save(borrow)
	if result.Error != nil {
		return nil, result.Error
	}

	return borrow, nil
}

func (s *BorrowService) Return(borrowID uuid.UUID, ownerID uuid.UUID) (*models.BorrowRequest, error) {
	borrow, err := s.GetByID(borrowID)
	if err != nil {
		return nil, err
	}

	if borrow.OwnerID != ownerID {
		return nil, errors.New("无权限验收归还")
	}

	if borrow.Status != "picked_up" {
		return nil, errors.New("该物资尚未取货")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	now := time.Now()
	borrow.Status = "returned"
	borrow.ReturnedAt = &now

	if err := tx.Save(borrow).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := s.supplyService.UpdateAvailable(borrow.SupplyID, borrow.Quantity); err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := s.userService.UpdateCreditScore(borrow.BorrowerID, 2); err != nil {
		tx.Rollback()
		return nil, err
	}

	tx.Commit()
	return borrow, nil
}

func (s *BorrowService) Rate(borrowID uuid.UUID, borrowerID uuid.UUID, req *RateBorrowRequest) (*models.BorrowRequest, error) {
	borrow, err := s.GetByID(borrowID)
	if err != nil {
		return nil, err
	}

	if borrow.BorrowerID != borrowerID {
		return nil, errors.New("无权限评价")
	}

	if borrow.Status != "returned" {
		return nil, errors.New("该请求尚未完成归还")
	}

	if borrow.Rating != 0 {
		return nil, errors.New("已评价过该请求")
	}

	borrow.Rating = req.Rating
	borrow.Review = req.Review

	result := s.db.Save(borrow)
	if result.Error != nil {
		return nil, result.Error
	}

	creditDelta := 0
	if req.Rating >= 4 {
		creditDelta = 1
	} else if req.Rating <= 2 {
		creditDelta = -1
	}

	if creditDelta != 0 {
		s.userService.UpdateCreditScore(borrow.OwnerID, creditDelta)
	}

	return borrow, nil
}

func (s *BorrowService) GetByBorrower(borrowerID uuid.UUID, status string, page, pageSize int) ([]models.BorrowRequest, int64, error) {
	var borrows []models.BorrowRequest
	var total int64

	query := s.db.Model(&models.BorrowRequest{}).Where("borrower_id = ?", borrowerID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("Supply").Preload("Owner").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&borrows).Error
	if err != nil {
		return nil, 0, err
	}

	return borrows, total, nil
}

func (s *BorrowService) GetByOwner(ownerID uuid.UUID, status string, page, pageSize int) ([]models.BorrowRequest, int64, error) {
	var borrows []models.BorrowRequest
	var total int64

	query := s.db.Model(&models.BorrowRequest{}).Where("owner_id = ?", ownerID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Preload("Supply").Preload("Borrower").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&borrows).Error
	if err != nil {
		return nil, 0, err
	}

	return borrows, total, nil
}

func (s *BorrowService) CheckOverdue() error {
	var overdueBorrows []models.BorrowRequest
	now := time.Now()

	err := s.db.Where("status = ? AND expected_return < ?", "picked_up", now).Find(&overdueBorrows).Error
	if err != nil {
		return err
	}

	for _, borrow := range overdueBorrows {
		borrow.Status = "overdue"
		s.db.Save(&borrow)
		s.userService.UpdateCreditScore(borrow.BorrowerID, -5)
	}

	return nil
}

func generatePickupCode() (string, error) {
	const charset = "0123456789"
	code := make([]byte, 6)
	for i := range code {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("生成取货码失败: %w", err)
		}
		code[i] = charset[num.Int64()]
	}
	return string(code), nil
}
